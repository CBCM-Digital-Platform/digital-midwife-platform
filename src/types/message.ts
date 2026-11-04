/**
 * Messaging Domain Types
 * Conforms to CBCM Backend OpenAPI 3.0 specification for /api/v1/messages/*
 */

export type MessagingRole = "mentor" | "mentee";

export interface MessagingContact {
  id: number;
  full_name: string;
  role: "mentor" | "mentee" | string;
  avatar_url?: string | null;
}

export interface Participant {
  id: number;
  fullName?: string | null;
  role?: string | null;
  avatarUrl?: string | null;
}

export interface MessageAttachment {
  id: number;
  storageKey: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
}

export interface MessageRead {
  userId: number;
  readAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  sentAt: string;
  sender?: Participant | null;
  attachment?: MessageAttachment | null;
  reads?: MessageRead[];
}

export interface Conversation {
  id: number;
  type: "direct" | "group";
  participants: Participant[];
  lastMessage?: Message | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface CreateConversationRequest {
  participantIds: number[];
  type?: "direct" | "group";
}

export interface SendMessageRequest {
  content: string;
  attachmentFileIds?: number[];
}

export interface EditMessageRequest {
  content: string;
}
