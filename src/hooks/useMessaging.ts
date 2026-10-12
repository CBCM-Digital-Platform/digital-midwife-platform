"use client";

import { useMemo, useState } from "react";
import type { SubmitEvent } from "react";

export type MessagingRole = "mentor" | "mentee";

export type ChatMessage = {
  id: number;
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
  unread?: boolean;
  online?: boolean;
  messages: ChatMessage[];
};

const mentorConversations: Conversation[] = [
  {
    id: 1,
    name: "Sarah Jenkins",
    subtitle: "Mentee · Clinical placement",
    lastMessage: "I reviewed the postpartum care notes.",
    lastMessageTime: "10:42 AM",
    initials: "SJ",
    avatarColor: "bg-amber-100 text-amber-900",
    unread: true,
    online: true,
    messages: [
      {
        id: 1,
        text: "Good morning. I am reviewing the postpartum care protocol before my simulation this afternoon.",
        time: "10:15 AM",
        sentByMe: false,
      },
      {
        id: 2,
        text: "Good morning, Sarah. Great preparation. Is there a particular step you would like to review?",
        time: "10:20 AM",
        sentByMe: true,
      },
      {
        id: 3,
        text: "I reviewed the postpartum care notes. Could we go over the follow-up checks together?",
        time: "10:42 AM",
        sentByMe: false,
      },
    ],
  },
  {
    id: 2,
    name: "David Chen",
    subtitle: "Mentee · Learning cohort",
    lastMessage: "Thank you for the guidance on the breech delivery simulation.",
    lastMessageTime: "Yesterday",
    initials: "DC",
    avatarColor: "bg-sky-100 text-sky-900",
    messages: [
      {
        id: 1,
        text: "Thank you for the guidance on the breech delivery simulation.",
        time: "Yesterday",
        sentByMe: false,
      },
    ],
  },
  {
    id: 3,
    name: "Maria Jackson",
    subtitle: "Mentee · Clinical placement",
    lastMessage: "Can we reschedule tomorrow's session to 2 PM?",
    lastMessageTime: "Monday",
    initials: "MJ",
    avatarColor: "bg-rose-100 text-rose-900",
    messages: [
      {
        id: 1,
        text: "Can we reschedule tomorrow's session to 2 PM?",
        time: "Monday",
        sentByMe: false,
      },
    ],
  },
];

const menteeConversations: Conversation[] = [
  {
    id: 1,
    name: "Dr. Sarah Jenkins",
    subtitle: "Clinical Mentor",
    lastMessage: "I've reviewed your latest clinical notes. Well done.",
    lastMessageTime: "10:42 AM",
    initials: "SJ",
    avatarColor: "bg-emerald-100 text-emerald-900",
    unread: true,
    online: true,
    messages: [
      {
        id: 1,
        text: "Hi, I am preparing for the clinical case review tomorrow. Could I ask you about the latest guidelines?",
        time: "10:15 AM",
        sentByMe: true,
      },
      {
        id: 2,
        text: "Of course. Send me the points you would like to discuss and we can review them together.",
        time: "10:26 AM",
        sentByMe: false,
      },
      {
        id: 3,
        text: "I've reviewed your latest clinical notes. Well done. We can go over your questions tomorrow.",
        time: "10:42 AM",
        sentByMe: false,
      },
    ],
  },
  {
    id: 2,
    name: "Dr. Emily Chen",
    subtitle: "Clinical Mentor",
    lastMessage: "Are we still on for the skills review tomorrow at 2 PM?",
    lastMessageTime: "Yesterday",
    initials: "EC",
    avatarColor: "bg-violet-100 text-violet-900",
    messages: [
      {
        id: 1,
        text: "Are we still on for the skills review tomorrow at 2 PM?",
        time: "Yesterday",
        sentByMe: false,
      },
    ],
  },
  {
    id: 3,
    name: "Marcus Thorne",
    subtitle: "Clinical Mentor",
    lastMessage: "Could you clarify the neonatal resuscitation protocol?",
    lastMessageTime: "Tuesday",
    initials: "MT",
    avatarColor: "bg-sky-100 text-sky-900",
    messages: [
      {
        id: 1,
        text: "Could you clarify the neonatal resuscitation protocol?",
        time: "Tuesday",
        sentByMe: true,
      },
    ],
  },
];

export function useMessaging(role: MessagingRole) {
  const [conversations, setConversations] = useState(
    role === "mentor" ? mentorConversations : menteeConversations,
  );
  const [selectedId, setSelectedId] = useState(conversations[0].id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [draft, setDraft] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [newContact, setNewContact] = useState("");

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedId) ??
    conversations[0];
  const otherRole = role === "mentor" ? "mentee" : "mentor";
  const filters = ["All", role === "mentor" ? "Mentees" : "Mentors"];
  const title = role === "mentor" ? "Direct Messages" : "Messages";
  const contactRole = role === "mentor" ? "Mentee" : "Clinical Mentor";

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

  function sendMessage(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    const time = new Intl.DateTimeFormat([], {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date());

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedId
          ? {
              ...conversation,
              lastMessage: text,
              lastMessageTime: time,
              messages: [
                ...conversation.messages,
                { id: Date.now(), text, time, sentByMe: true },
              ],
            }
          : conversation,
      ),
    );
    setDraft("");
  }

  function createConversation(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newContact.trim();
    if (!name) return;

    const conversation: Conversation = {
      id: Date.now(),
      name,
      subtitle: contactRole,
      lastMessage: "Start a conversation",
      lastMessageTime: "Now",
      initials: name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join(""),
      avatarColor: "bg-lime-100 text-lime-900",
      online: false,
      messages: [],
    };

    setConversations((current) => [conversation, ...current]);
    setSelectedId(conversation.id);
    setNewContact("");
    setIsComposing(false);
    setShowChat(true);
  }

  return {
    conversations,
    selectedId,
    setSelectedId,
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
    createConversation,
  };
}