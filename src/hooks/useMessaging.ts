"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import {
  getConversations as getConversationsService,
  getConversation as getConversationService,
  createConversation as createConversationService,
  sendMessage as sendMessageService,
  editMessage as editMessageService,
  deleteMessage as deleteMessageService,
  markConversationRead as markConversationReadService,
  getAssignedMessagingContacts,
} from "@/services/messages.service";
import type {
  Conversation as ApiConversation,
  ConversationDetail as ApiConversationDetail,
  Message as ApiMessage,
  MessagingContact,
  MessagingRole,
  Participant as ApiPerson,
} from "@/types/message";

export type { MessagingRole, MessagingContact };

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
  participantId?: number;
  isPlaceholder?: boolean;
};

const avatarColors = [
  "bg-amber-100 text-amber-900",
  "bg-sky-100 text-sky-900",
  "bg-rose-100 text-rose-900",
  "bg-emerald-100 text-emerald-900",
  "bg-violet-100 text-violet-900",
  "bg-lime-100 text-lime-900",
];

function displayTime(value?: string | null): string {
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

function personName(person?: ApiPerson | null): string {
  if (!person) return "Clinician";
  return (
    person.fullName ||
    (person as any).full_name ||
    (person as any).name ||
    "Clinician"
  );
}

function normalizeUserId(id?: number | string | null): string | undefined {
  if (id == null) return undefined;
  const normalizedId = String(id).trim();
  return normalizedId || undefined;
}

function mapMessage(message: ApiMessage, currentUserId?: string): ChatMessage {
  const senderId = normalizeUserId(
    message.senderId ?? (message as any).sender_id ?? message.sender?.id
  );
  return {
    id: message.id,
    text: message.content ?? (message as any).text ?? "",
    time: displayTime(message.sentAt ?? (message as any).sent_at),
    sentByMe: currentUserId != null && senderId === currentUserId,
  };
}

function mapConversation(
  item: ApiConversation | ApiConversationDetail,
  role: MessagingRole,
  currentUserId?: string
): Conversation {
  const participants = item.participants ?? [];
  const otherPerson =
    (currentUserId == null
      ? undefined
      : participants.find(
          (person) => normalizeUserId(person.id) !== currentUserId
        )) ??
    participants.find((person) => person.role !== role) ??
    participants[0];

  const name = personName(otherPerson);
  const lastMsg = item.lastMessage;
  const lastMessageText =
    typeof lastMsg === "string" ? lastMsg : lastMsg?.content ?? "";
  const lastMessageTime =
    item.lastMessageAt ?? (typeof lastMsg === "object" ? lastMsg?.sentAt : undefined);

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
      .join("") || "C",
    avatarColor: avatarColors[Math.abs(item.id) % avatarColors.length],
    unread: (item.unreadCount ?? 0) > 0,
    participantId: otherPerson?.id ? Number(otherPerson.id) : undefined,
    messages: ((item as ApiConversationDetail).messages ?? []).map((message) =>
      mapMessage(message, currentUserId)
    ),
  };
}

export function useMessaging(role: MessagingRole) {
  const { data: session, status: sessionStatus } = useSession();
  const currentUserId = normalizeUserId(session?.user?.id);
  const searchParams = useSearchParams();

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
  const [messageActionId, setMessageActionId] = useState<number | string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<MessagingContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const selectedIdRef = useRef<number | null>(null);
  selectedIdRef.current = selectedId;

  const handledTargetRef = useRef<string | null>(null);

  const otherRole = role === "mentor" ? "mentee" : "mentor";
  const filters = ["All", role === "mentor" ? "Mentees" : "Mentors"];
  const title = role === "mentor" ? "Direct Messages" : "Messages";
  const contactRole = role === "mentor" ? "Mentee" : "Clinical Mentor";

  /**
   * Load all assigned contacts and backend messaging contacts
   */
  const loadContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const items = await getAssignedMessagingContacts(role, currentUserId);
      setContacts(items);
    } catch {
      // Non-critical, ignore
    } finally {
      setLoadingContacts(false);
    }
  }, [currentUserId, role]);

  /**
   * Load conversations list (never called on send message)
   */
  const loadConversations = useCallback(
    async (keepSelected = true) => {
      try {
        const rawConversations = await getConversationsService();
        const mapped = rawConversations.map((item) =>
          mapConversation(item, role, currentUserId)
        );
        setConversations(mapped);

        if (!keepSelected || selectedIdRef.current == null) {
          setSelectedId((prev) =>
            prev != null && mapped.some((item) => item.id === prev)
              ? prev
              : mapped[0]?.id ?? null
          );
        }
        setError(null);
      } catch (err: any) {
        setError(err instanceof Error ? err.message : "Could not load conversations.");
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, role]
  );

  /**
   * Load full message history for a specific conversation
   */
  const loadConversation = useCallback(
    async (conversationId: number) => {
      if (conversationId <= 0) return;
      try {
        const detail = await getConversationService(conversationId);
        const mapped = mapConversation(detail, role, currentUserId);

        setConversations((current) =>
          current.map((existing) =>
            existing.id === conversationId ? mapped : existing
          )
        );

        // Mark as read in background
        void markConversationReadService(conversationId).catch(() => {});
      } catch (err: any) {
        setConversations((current) => {
          const exists = current.find((c) => c.id === conversationId);
          if (!exists || exists.messages.length === 0) {
            setError(err instanceof Error ? err.message : "Could not load messages.");
          }
          return current;
        });
      } finally {
        setLoadingMessages(false);
      }
    },
    [currentUserId, role]
  );

  /**
   * Start or open a direct conversation with a contact
   */
  const startConversationWithContact = useCallback(
    async (participantId: number, fallbackName?: string) => {
      if (!Number.isSafeInteger(participantId) || participantId <= 0) return;
      setCreating(true);
      setError(null);
      try {
        // 1. Check if conversation already exists in memory
        const existing = conversations.find(
          (c) =>
            c.id > 0 &&
            (c.participantId === participantId ||
              (fallbackName && c.name.toLowerCase() === fallbackName.toLowerCase()))
        );

        if (existing) {
          setSelectedId(existing.id);
          setShowChat(true);
          setIsComposing(false);
          void loadConversation(existing.id);
          return;
        }

        // 2. Request backend conversation creation/retrieval
        const detail = await createConversationService(
          participantId,
          "direct",
          fallbackName ? { name: fallbackName, role: otherRole } : undefined,
          currentUserId
        );

        const mapped = mapConversation(detail, role, currentUserId);
        setConversations((current) => [
          mapped,
          ...current.filter((c) => c.id !== mapped.id && c.id !== -participantId),
        ]);
        setSelectedId(mapped.id);
        setIsComposing(false);
        setShowChat(true);
        if (detail.messages && detail.messages.length > 0) {
          setLoadingMessages(false);
        } else {
          void loadConversation(mapped.id);
        }
      } catch (err: any) {
        setError(err instanceof Error ? err.message : "Could not start conversation.");
      } finally {
        setCreating(false);
      }
    },
    [conversations, currentUserId, loadConversation, otherRole, role]
  );

  /**
   * Initial mount: fetch contacts and conversations once
   */
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;

    let active = true;
    const init = async () => {
      if (active) {
        await Promise.all([loadConversations(false), loadContacts()]);
      }
    };
    void init();

    return () => {
      active = false;
    };
  }, [loadContacts, loadConversations, sessionStatus]);

  /**
   * Handle navigation query parameters (e.g. /messaging?conversationId=23 or /messaging?userId=42&name=Alex)
   */
  useEffect(() => {
    if (loading || sessionStatus !== "authenticated") return;

    const targetConvIdParam = searchParams?.get("conversationId");
    const targetUserIdParam =
      searchParams?.get("userId") || searchParams?.get("contactId");
    const targetNameParam = searchParams?.get("name");

    // Case 1: Direct conversation ID (e.g. from notification)
    if (targetConvIdParam) {
      const convIdNum = Number(targetConvIdParam);
      if (convIdNum && !isNaN(convIdNum)) {
        const key = `conv_${convIdNum}`;
        if (handledTargetRef.current === key) return;
        handledTargetRef.current = key;

        setSelectedId(convIdNum);
        setShowChat(true);
        void loadConversation(convIdNum);
        return;
      }
    }

    // Case 2: Direct user/contact ID
    if (targetUserIdParam) {
      const targetIdNum = Number(targetUserIdParam);
      if (!targetIdNum || isNaN(targetIdNum)) return;

      const key = `${targetIdNum}_${targetNameParam || ""}`;
      if (handledTargetRef.current === key) return;
      handledTargetRef.current = key;

      void startConversationWithContact(
        targetIdNum,
        targetNameParam ? decodeURIComponent(targetNameParam) : undefined
      );
    }
  }, [loadConversation, loading, searchParams, sessionStatus, startConversationWithContact]);

  /**
   * When selected conversation changes, load its message history
   */
  useEffect(() => {
    if (selectedId == null || selectedId <= 0 || sessionStatus !== "authenticated") return;

    setLoadingMessages(true);
    void loadConversation(selectedId);
  }, [loadConversation, selectedId, sessionStatus]);

  /**
   * Auto-refresh polling: polls active conversation messages every 8 seconds only if tab is visible
   */
  useEffect(() => {
    if (selectedId == null || selectedId <= 0 || sessionStatus !== "authenticated") return;

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void loadConversation(selectedId);
    }, 8000);

    return () => clearInterval(interval);
  }, [loadConversation, selectedId, sessionStatus]);

  /**
   * Background conversation list polling every 45 seconds (independent from sending messages)
   */
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void loadConversations(true);
    }, 45000);

    return () => clearInterval(interval);
  }, [loadConversations, sessionStatus]);

  /**
   * Merges active conversations with any assigned mentees/mentors so all assigned users are seen in the list
   */
  const allConversations = useMemo(() => {
    const list: Conversation[] = [...conversations];
    const existingParticipantIds = new Set<number>();

    for (const c of conversations) {
      if (c.participantId) {
        existingParticipantIds.add(c.participantId);
      }
    }

    for (const contact of contacts) {
      const contactId = Number(contact.id);
      if (!contactId || existingParticipantIds.has(contactId)) continue;

      const nameMatch = conversations.some(
        (c) => c.name.toLowerCase() === contact.full_name.toLowerCase()
      );
      if (nameMatch) continue;

      // Add as placeholder item in the sidebar list so mentor sees all assigned mentees
      list.push({
        id: -contactId,
        participantId: contactId,
        name: contact.full_name,
        subtitle: contact.role === "mentor" ? "Assigned Mentor" : "Assigned Mentee",
        lastMessage: "No messages yet • Click to chat",
        lastMessageTime: "",
        initials: contact.full_name
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? "")
          .join("") || "C",
        avatarColor: avatarColors[Math.abs(contactId) % avatarColors.length],
        unread: false,
        messages: [],
        isPlaceholder: true,
      });
    }

    return list;
  }, [contacts, conversations]);

  function selectConversation(conversationId: number) {
    if (conversationId < 0) {
      const placeholder = allConversations.find((c) => c.id === conversationId);
      if (placeholder?.participantId) {
        void startConversationWithContact(placeholder.participantId, placeholder.name);
      }
      return;
    }

    if (conversationId !== selectedId) {
      setLoadingMessages(true);
      setError(null);
    }
    setSelectedId(conversationId);
  }

  const selectedConversation = useMemo(() => {
    if (selectedId == null) return null;
    return allConversations.find((c) => c.id === selectedId) ?? null;
  }, [allConversations, selectedId]);

  const visibleConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allConversations.filter((conversation) => {
      const matchesSearch =
        !query ||
        conversation.name.toLowerCase().includes(query) ||
        conversation.lastMessage.toLowerCase().includes(query);
      const matchesFilter = filter === "All" || filter === `${otherRole}s`;
      return matchesSearch && matchesFilter;
    });
  }, [allConversations, filter, otherRole, search]);

  // If no conversation is selected yet, select the first available conversation or contact
  useEffect(() => {
    if (selectedId == null && visibleConversations.length > 0 && !loading) {
      const first = visibleConversations[0];
      if (first.id > 0) {
        setSelectedId(first.id);
      }
    }
  }, [loading, selectedId, visibleConversations]);

  /**
   * Send a new message (only sends the single message POST; strictly DOES NOT fetch all conversations)
   */
  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || selectedId == null || sending) return;

    // If active thread is still a placeholder, create it first
    let activeConversationId = selectedId;
    if (activeConversationId < 0) {
      const placeholder = allConversations.find((c) => c.id === activeConversationId);
      if (placeholder?.participantId) {
        try {
          const detail = await createConversationService(
            placeholder.participantId,
            "direct",
            { name: placeholder.name, role: otherRole },
            currentUserId
          );
          activeConversationId = detail.id;
          setSelectedId(detail.id);
        } catch (err: any) {
          setError(err instanceof Error ? err.message : "Could not create conversation.");
          return;
        }
      }
    }

    setSending(true);
    setError(null);
    try {
      // 1. Single POST call to send the message
      const newMsg = await sendMessageService(activeConversationId, text, currentUserId);
      const mapped = { ...mapMessage(newMsg, currentUserId), sentByMe: true };

      // 2. Locally update the active conversation without re-fetching all conversations
      setConversations((current) => {
        const found = current.some((c) => c.id === activeConversationId);
        if (found) {
          return current.map((c) =>
            c.id === activeConversationId
              ? {
                  ...c,
                  lastMessage: mapped.text,
                  lastMessageTime: mapped.time,
                  messages: [...c.messages, mapped],
                }
              : c
          );
        } else {
          // If was placeholder, add as real conversation
          const placeholder = allConversations.find((c) => c.id === selectedId);
          const newConv: Conversation = {
            id: activeConversationId,
            name: placeholder?.name || "Mentee",
            subtitle: placeholder?.subtitle || "Assigned Mentee",
            lastMessage: mapped.text,
            lastMessageTime: mapped.time,
            initials: placeholder?.initials || "M",
            avatarColor: placeholder?.avatarColor || avatarColors[0],
            unread: false,
            participantId: placeholder?.participantId,
            messages: [mapped],
          };
          return [newConv, ...current];
        }
      });
      setDraft("");
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  /**
   * Edit an existing message
   */
  async function editMessage(
    conversationId: number,
    messageId: number | string,
    text: string
  ): Promise<boolean> {
    const content = text.trim();
    if (!content || messageActionId != null) return false;

    setMessageActionId(messageId);
    setError(null);
    try {
      await editMessageService(conversationId, messageId, content);
      setConversations((current) =>
        current.map((c) => {
          if (c.id !== conversationId) return c;
          const messages = c.messages.map((m) =>
            m.id === messageId ? { ...m, text: content } : m
          );
          const wasLastMessage = c.messages.at(-1)?.id === messageId;
          return {
            ...c,
            messages,
            ...(wasLastMessage ? { lastMessage: content } : {}),
          };
        })
      );
      return true;
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Could not edit message.");
      return false;
    } finally {
      setMessageActionId(null);
    }
  }

  /**
   * Delete a message
   */
  async function deleteMessage(
    conversationId: number,
    messageId: number | string
  ): Promise<boolean> {
    if (messageActionId != null) return false;

    setMessageActionId(messageId);
    setError(null);
    try {
      await deleteMessageService(conversationId, messageId);
      setConversations((current) =>
        current.map((c) => {
          if (c.id !== conversationId) return c;
          const wasLastMessage = c.messages.at(-1)?.id === messageId;
          const messages = c.messages.filter((m) => m.id !== messageId);
          const latestMessage = messages.at(-1);
          return {
            ...c,
            messages,
            ...(wasLastMessage
              ? {
                  lastMessage: latestMessage?.text ?? "",
                  lastMessageTime: latestMessage?.time ?? "",
                }
              : {}),
          };
        })
      );
      return true;
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Could not delete message.");
      return false;
    } finally {
      setMessageActionId(null);
    }
  }

  /**
   * Handle starting a conversation manually by ID from composer form
   */
  async function createConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const participantId = Number(newContact.trim());
    if (!Number.isSafeInteger(participantId) || participantId <= 0) {
      setError("Enter a valid numeric user ID to start a conversation.");
      return;
    }
    await startConversationWithContact(participantId);
    setNewContact("");
  }

  return {
    conversations: allConversations,
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
    startConversationWithContact,
    contacts,
    loadingContacts,
    loadContacts,
    loadConversations,
    loading,
    loadingMessages,
    sending,
    creating,
    error,
  };
}
