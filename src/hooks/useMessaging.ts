"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { SubmitEvent } from "react";

export type MessagingRole = "mentor" | "mentee";

export type ChatMessage = {
  id: number | string;
  text: string;
  time: string;
  sentByMe: boolean;
};

export type Conversation = {
  id: number;
  name: string;
  subtitle: string;
  lastMessage: string;
  lastMessageTime: string;
  initials: string;
  avatarColor: string;
  unread: boolean;
  online?: boolean;
  messages: ChatMessage[];
};

type ApiPerson = {
  id?: number | string;
  fullName?: string;
  full_name?: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  name?: string;
  role?: string;
};

type ApiMessage = {
  id: number | string;
  senderId?: number | string;
  sender_id?: number | string;
  userId?: number | string;
  user_id?: number | string;
  sender?: ApiPerson;
  content?: string;
  text?: string;
  sentAt?: string;
  sent_at?: string;
  createdAt?: string;
  created_at?: string;
};

type ApiConversation = {
  id: number;
  participants?: ApiPerson[];
  lastMessage?: ApiMessage | string | null;
  last_message?: ApiMessage | string | null;
  lastMessageAt?: string | null;
  last_message_at?: string | null;
  unreadCount?: number;
  unread_count?: number;
  messages?: ApiMessage[];
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string | { message?: string };
};

const avatarColors = [
  "bg-amber-100 text-amber-900",
  "bg-sky-100 text-sky-900",
  "bg-rose-100 text-rose-900",
  "bg-emerald-100 text-emerald-900",
  "bg-violet-100 text-violet-900",
  "bg-lime-100 text-lime-900",
];

function displayTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  if (date.toDateString() === new Date().toDateString()) {
    return new Intl.DateTimeFormat([], {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat([], {
    month: "short",
    day: "numeric",
  }).format(date);
}

function personName(person?: ApiPerson) {
  const firstName = person?.firstName ?? person?.first_name;
  const lastName = person?.lastName ?? person?.last_name;
  return (
    person?.fullName ||
    person?.full_name ||
    person?.name ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    "CBCM user"
  );
}

function normalizeUserId(id?: number | string | null) {
  if (id == null) return undefined;
  const normalizedId = String(id).trim();
  return normalizedId || undefined;
}

function mapMessage(message: ApiMessage, currentUserId?: string): ChatMessage {
  const senderId = normalizeUserId(
    message.senderId ??
      message.sender_id ??
      message.userId ??
      message.user_id ??
      message.sender?.id,
  );
  return {
    id: message.id,
    text: message.content ?? message.text ?? "",
    time: displayTime(
      message.sentAt ?? message.sent_at ?? message.createdAt ?? message.created_at,
    ),
    sentByMe: currentUserId != null && senderId === currentUserId,
  };
}

function mapConversation(
  item: ApiConversation,
  role: MessagingRole,
  currentUserId?: string,
): Conversation {
  const participants = item.participants ?? [];
  const otherPerson =
    (currentUserId == null
      ? undefined
      : participants.find(
          (person) => normalizeUserId(person.id) !== currentUserId,
        )) ??
    participants.find((person) => person.role !== role) ??
    participants[0];
  const name = personName(otherPerson);
  const lastMessage = item.lastMessage ?? item.last_message;
  const lastMessageText =
    typeof lastMessage === "string"
      ? lastMessage
      : lastMessage?.content ?? lastMessage?.text ?? "";
  const lastMessageTime =
    item.lastMessageAt ??
    item.last_message_at ??
    (typeof lastMessage === "object" && lastMessage
      ? lastMessage.sentAt ?? lastMessage.sent_at
      : undefined);

  return {
    id: item.id,
    name,
    subtitle: otherPerson?.role
      ? otherPerson.role.charAt(0).toUpperCase() + otherPerson.role.slice(1)
      : role === "mentor"
        ? "Mentee"
        : "Clinical Mentor",
    lastMessage: lastMessageText,
    lastMessageTime: displayTime(lastMessageTime),
    initials: name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join(""),
    avatarColor: avatarColors[Math.abs(item.id) % avatarColors.length],
    unread: (item.unreadCount ?? item.unread_count ?? 0) > 0,
    messages: (item.messages ?? []).map((message) =>
      mapMessage(message, currentUserId),
    ),
  };
}

function errorMessage(result: ApiEnvelope<unknown> | null, status: number) {
  if (typeof result?.message === "string") return result.message;
  if (typeof result?.error === "string") return result.error;
  if (result?.error?.message) return result.error.message;
  return `Request failed (${status}).`;
}

export function useMessaging(role: MessagingRole) {
  const { data: session, status: sessionStatus } = useSession();
  const accessToken = session?.accessToken;
  const currentUserId = normalizeUserId(session?.user?.id);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [draft, setDraft] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [newContact, setNewContact] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageActionId, setMessageActionId] = useState<number | string | null>(
    null,
  );
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otherRole = role === "mentor" ? "mentee" : "mentor";
  const filters = ["All", role === "mentor" ? "Mentees" : "Mentors"];
  const title = role === "mentor" ? "Direct Messages" : "Messages";
  const contactRole = role === "mentor" ? "Mentee" : "Clinical Mentor";

  const apiRequest = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured.");
      }
      if (!accessToken) {
        throw new Error("Your access token is missing. Please sign in again.");
      }

      const response = await fetch(`${apiUrl}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          Authorization: `Bearer ${accessToken}`,
          ...init.headers,
        },
      });

      const responseText = await response.text();
      let result: ApiEnvelope<T> | null = null;
      if (responseText) {
        try {
          result = JSON.parse(responseText) as ApiEnvelope<T>;
        } catch {
          if (response.ok) {
            throw new Error("The backend returned an invalid JSON response.");
          }
        }
      }

      if (!response.ok || result?.success === false) {
        throw new Error(errorMessage(result, response.status));
      }

      return (result && "data" in result ? result.data : result) as T;
    },
    [accessToken, apiUrl],
  );

  const loadConversations = useCallback(async () => {
    try {
      const items = await apiRequest<ApiConversation[]>(
        "/messages/conversations",
      );
      const mapped = items.map((item) =>
        mapConversation(item, role, currentUserId),
      );
      setConversations(mapped);
      setLoadingMessages(mapped.length > 0);
      setSelectedId((previous) =>
        previous != null && mapped.some((item) => item.id === previous)
          ? previous
          : (mapped[0]?.id ?? null),
      );
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load conversations.",
      );
    } finally {
      setLoading(false);
    }
  }, [apiRequest, currentUserId, role]);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;

    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) await loadConversations();
    };
    void load();

    return () => {
      active = false;
    };
  }, [loadConversations, sessionStatus]);

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedId) ?? null;

  const loadConversation = useCallback(
    async (conversationId: number) => {
      try {
        const item = await apiRequest<ApiConversation>(
          `/messages/conversations/${conversationId}`,
        );
        const conversation = mapConversation(item, role, currentUserId);
        setConversations((current) =>
          current.map((existing) =>
            existing.id === conversationId ? conversation : existing,
          ),
        );

        try {
          await apiRequest(
            `/messages/conversations/${conversationId}/read`,
            { method: "PATCH" },
          );
          setConversations((current) =>
            current.map((existing) =>
              existing.id === conversationId
                ? { ...existing, unread: false }
                : existing,
            ),
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not mark messages as read.",
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load this conversation.",
        );
      } finally {
        setLoadingMessages(false);
      }
    },
    [apiRequest, currentUserId, role],
  );

  useEffect(() => {
    if (selectedId == null || sessionStatus !== "authenticated") return;

    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) await loadConversation(selectedId);
    };
    void load();

    return () => {
      active = false;
    };
  }, [loadConversation, selectedId, sessionStatus]);

  function selectConversation(conversationId: number) {
    if (conversationId !== selectedId) {
      setLoadingMessages(true);
      setError(null);
    }
    setSelectedId(conversationId);
  }

  const visibleConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const matchesSearch =
        !query ||
        conversation.name.toLowerCase().includes(query) ||
        conversation.lastMessage.toLowerCase().includes(query);
      const matchesFilter = filter === "All" || filter === `${otherRole}s`;
      return matchesSearch && matchesFilter;
    });
  }, [conversations, filter, otherRole, search]);

  async function sendMessage(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || selectedId == null || sending) return;

    setSending(true);
    setError(null);
    try {
      const message = await apiRequest<ApiMessage>(
        `/messages/conversations/${selectedId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ content: text }),
        },
      );
      const mapped = { ...mapMessage(message, currentUserId), sentByMe: true };
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === selectedId
            ? {
                ...conversation,
                lastMessage: mapped.text,
                lastMessageTime: mapped.time,
                messages: [...conversation.messages, mapped],
              }
            : conversation,
        ),
      );
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  async function editMessage(
    conversationId: number,
    messageId: number | string,
    text: string,
  ) {
    const content = text.trim();
    if (!content || messageActionId != null) return false;

    setMessageActionId(messageId);
    setError(null);
    try {
      await apiRequest(
        `/messages/conversations/${conversationId}/messages/${messageId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ content }),
        },
      );
      setConversations((current) =>
        current.map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          const messages = conversation.messages.map((message) =>
            message.id === messageId ? { ...message, text: content } : message,
          );
          const wasLastMessage =
            conversation.messages.at(-1)?.id === messageId;
          return {
            ...conversation,
            messages,
            ...(wasLastMessage ? { lastMessage: content } : {}),
          };
        }),
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not edit message.");
      return false;
    } finally {
      setMessageActionId(null);
    }
  }

  async function deleteMessage(
    conversationId: number,
    messageId: number | string,
  ) {
    if (messageActionId != null) return false;

    setMessageActionId(messageId);
    setError(null);
    try {
      await apiRequest(
        `/messages/conversations/${conversationId}/messages/${messageId}`,
        { method: "DELETE" },
      );
      setConversations((current) =>
        current.map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          const wasLastMessage =
            conversation.messages.at(-1)?.id === messageId;
          const messages = conversation.messages.filter(
            (message) => message.id !== messageId,
          );
          const latestMessage = messages.at(-1);
          return {
            ...conversation,
            messages,
            ...(wasLastMessage
              ? {
                  lastMessage: latestMessage?.text ?? "",
                  lastMessageTime: latestMessage?.time ?? "",
                }
              : {}),
          };
        }),
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete message.");
      return false;
    } finally {
      setMessageActionId(null);
    }
  }

  async function createConversation(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const participantId = Number(newContact.trim());
    if (!Number.isSafeInteger(participantId) || participantId <= 0) {
      setError("Enter a valid numeric user ID to start a conversation.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const item = await apiRequest<ApiConversation>(
        "/messages/conversations",
        {
          method: "POST",
          body: JSON.stringify({
            participantIds: [participantId],
            type: "direct",
          }),
        },
      );
      const conversation = mapConversation(item, role, currentUserId);
      setConversations((current) => [
        conversation,
        ...current.filter((existing) => existing.id !== conversation.id),
      ]);
      setLoadingMessages(true);
      if (selectedId === conversation.id) {
        void loadConversation(conversation.id);
      }
      setSelectedId(conversation.id);
      setNewContact("");
      setIsComposing(false);
      setShowChat(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create conversation.",
      );
    } finally {
      setCreating(false);
    }
  }

  return {
    conversations,
    selectedId,
    selectConversation,
    search,
    setSearch,
    filter,
    setFilter,
    draft,
    setDraft,
    showChat,
    setShowChat,
    isComposing,
    setIsComposing,
    newContact,
    setNewContact,
    selectedConversation,
    filters,
    title,
    contactRole,
    visibleConversations,
    sendMessage,
    editMessage,
    deleteMessage,
    messageActionId,
    createConversation,
    loadConversations,
    loading,
    loadingMessages,
    sending,
    creating,
    error,
  };
}
