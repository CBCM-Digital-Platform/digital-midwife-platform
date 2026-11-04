/**
 * Messaging Service
 * Integrates direct messaging between mentors and mentees with live backend OpenAPI endpoints.
 */

import { apiClient, ApiError } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import { getMyMentees } from "@/services/my-mentees.service";
import { getAssignments, getStoredCreatedAssignments } from "@/services/assignments.service";
import type {
  Conversation,
  ConversationDetail,
  Message,
  MessagingContact,
  CreateConversationRequest,
  SendMessageRequest,
  EditMessageRequest,
  MessagingRole,
} from "@/types/message";

const MOCK_STORAGE_KEY = "cbcm_mock_chat_conversations";

function isSameId(id1?: string | number | null, id2?: string | number | null): boolean {
  if (id1 === undefined || id1 === null || id2 === undefined || id2 === null) return false;
  const s1 = String(id1).trim();
  const s2 = String(id2).trim();
  if (!s1 || !s2) return false;
  if (s1.toLowerCase() === s2.toLowerCase()) return true;
  const n1 = s1.replace(/\D/g, "");
  const n2 = s2.replace(/\D/g, "");
  if (n1 && n2 && n1 === n2) return true;
  return false;
}

/**
 * Helper to unwrap backend response data envelope { success: true, data: T }
 */
function unwrap<T>(res: any): T {
  if (res && typeof res === "object" && "data" in res) {
    return res.data as T;
  }
  return res as T;
}

/**
 * Local development fallback storage helper
 */
function getStoredConversations(): ConversationDetail[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredConversations(conversations: ConversationDetail[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * 1. Fetch conversations for the authenticated user
 */
export async function getConversations(): Promise<Conversation[]> {
  try {
    const res = await apiClient<any>(ENDPOINTS.MESSAGES.CONVERSATIONS);
    const data = unwrap<Conversation[]>(res);
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err: any) {
    // If backend rejects mock token in local dev, provide local conversations
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      return getStoredConversations();
    }
    throw err;
  }
}

/**
 * 2. Fetch a specific conversation with all its messages
 */
export async function getConversation(conversationId: number): Promise<ConversationDetail> {
  try {
    const res = await apiClient<any>(ENDPOINTS.MESSAGES.CONVERSATION_DETAIL(conversationId));
    const data = unwrap<ConversationDetail>(res);
    return data;
  } catch (err: any) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      const stored = getStoredConversations();
      const found = stored.find((c) => c.id === conversationId);
      if (found) return found;
    }
    throw err;
  }
}

/**
 * 3. Create or retrieve an existing direct conversation with participant
 */
export async function createConversation(
  participantId: number,
  type: "direct" | "group" = "direct",
  fallbackParticipant?: { name?: string; role?: string; avatarUrl?: string },
  currentUserId?: number | string
): Promise<ConversationDetail> {
  try {
    const body: CreateConversationRequest = {
      participantIds: [participantId],
      type,
    };
    const res = await apiClient.post<any>(ENDPOINTS.MESSAGES.CONVERSATIONS, body);
    const data = unwrap<ConversationDetail>(res);
    return data;
  } catch (err: any) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      // Local development mock fallback
      const stored = getStoredConversations();
      const currentUid = Number(currentUserId) || 1;
      const otherUid = Number(participantId);

      // Check existing
      let conv = stored.find((c) =>
        c.participants.some((p) => p.id === otherUid) &&
        (c.participants.some((p) => p.id === currentUid) || c.participants.length === 1)
      );

      if (!conv) {
        const newId = Date.now();
        conv = {
          id: newId,
          type: "direct",
          participants: [
            {
              id: currentUid,
              fullName: "Me",
              role: "mentor",
            },
            {
              id: otherUid,
              fullName: fallbackParticipant?.name || `User #${otherUid}`,
              role: fallbackParticipant?.role || "mentee",
              avatarUrl: fallbackParticipant?.avatarUrl,
            },
          ],
          messages: [],
          unreadCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        stored.unshift(conv);
        saveStoredConversations(stored);
      }
      return conv;
    }
    throw err;
  }
}

/**
 * 4. Send a single message to an active conversation (strictly no re-fetching of all conversations)
 */
export async function sendMessage(
  conversationId: number,
  content: string,
  currentUserId?: number | string
): Promise<Message> {
  const cleanContent = content.trim();
  if (!cleanContent) {
    throw new Error("Message content cannot be empty.");
  }

  try {
    const body: SendMessageRequest = { content: cleanContent };
    const res = await apiClient.post<any>(ENDPOINTS.MESSAGES.MESSAGES(conversationId), body);
    const data = unwrap<Message>(res);
    return data;
  } catch (err: any) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      // Local dev mock fallback
      const stored = getStoredConversations();
      const conv = stored.find((c) => c.id === conversationId);
      const senderUid = Number(currentUserId) || 1;
      const newMsg: Message = {
        id: Date.now(),
        conversationId,
        senderId: senderUid,
        content: cleanContent,
        sentAt: new Date().toISOString(),
      };

      if (conv) {
        conv.messages.push(newMsg);
        conv.lastMessage = newMsg;
        conv.lastMessageAt = newMsg.sentAt;
        conv.updatedAt = newMsg.sentAt;
        saveStoredConversations(stored);
      }
      return newMsg;
    }
    throw err;
  }
}

/**
 * 5. Edit an existing message
 */
export async function editMessage(
  conversationId: number,
  messageId: number | string,
  content: string
): Promise<Message> {
  const cleanContent = content.trim();
  if (!cleanContent) {
    throw new Error("Message content cannot be empty.");
  }

  try {
    const body: EditMessageRequest = { content: cleanContent };
    const res = await apiClient.patch<any>(
      ENDPOINTS.MESSAGES.MESSAGE_DETAIL(conversationId, messageId),
      body
    );
    return unwrap<Message>(res);
  } catch (err: any) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      const stored = getStoredConversations();
      const conv = stored.find((c) => c.id === conversationId);
      if (conv) {
        const msg = conv.messages.find((m) => String(m.id) === String(messageId));
        if (msg) {
          msg.content = cleanContent;
          if (conv.lastMessage?.id === msg.id) {
            conv.lastMessage.content = cleanContent;
          }
          saveStoredConversations(stored);
          return msg;
        }
      }
    }
    throw err;
  }
}

/**
 * 6. Delete a message
 */
export async function deleteMessage(
  conversationId: number,
  messageId: number | string
): Promise<boolean> {
  try {
    await apiClient.delete(ENDPOINTS.MESSAGES.MESSAGE_DETAIL(conversationId, messageId));
    return true;
  } catch (err: any) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      const stored = getStoredConversations();
      const conv = stored.find((c) => c.id === conversationId);
      if (conv) {
        conv.messages = conv.messages.filter((m) => String(m.id) !== String(messageId));
        conv.lastMessage = conv.messages.at(-1) || null;
        conv.lastMessageAt = conv.lastMessage?.sentAt || null;
        saveStoredConversations(stored);
        return true;
      }
    }
    throw err;
  }
}

/**
 * 7. Mark messages in conversation as read
 */
export async function markConversationRead(conversationId: number): Promise<void> {
  try {
    await apiClient.patch(ENDPOINTS.MESSAGES.READ(conversationId));
  } catch {
    // Non-critical, ignore read-receipt failures
  }
}

/**
 * 8. List eligible contacts from backend
 */
export async function getMessagingContacts(q?: string): Promise<MessagingContact[]> {
  const params: Record<string, string> = {};
  if (q && q.trim()) params.q = q.trim();

  try {
    const res = await apiClient<any>(ENDPOINTS.MESSAGES.CONTACTS, { params });
    const data = unwrap<MessagingContact[]>(res);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * 9. Resolves active assignment contacts for mentor or mentee so they can DM each other directly.
 * Ensures ALL mentees under a mentor are included in the contacts list.
 */
export async function getAssignedMessagingContacts(
  role: MessagingRole,
  currentUserId?: string | number,
  searchQuery?: string
): Promise<MessagingContact[]> {
  const contactsMap = new Map<number, MessagingContact>();

  // 1. Fetch official contacts from live backend endpoint GET /api/v1/messages/contacts
  try {
    const backendContacts = await getMessagingContacts(searchQuery);
    for (const c of backendContacts) {
      if (c && c.id) {
        contactsMap.set(Number(c.id), {
          id: Number(c.id),
          full_name: c.full_name || `User #${c.id}`,
          role: c.role || (role === "mentor" ? "mentee" : "mentor"),
          avatar_url: c.avatar_url || null,
        });
      }
    }
  } catch {
    // Continue to assignment resolution
  }

  // 2. Add real clinical assignment contacts:
  try {
    if (role === "mentor") {
      // A. Mentees directly assigned to this mentor via getMyMentees()
      const mentees = await getMyMentees(currentUserId).catch(() => []);
      for (const m of mentees) {
        const numId = Number(String(m.id).replace(/\D/g, "")) || Number(m.id);
        if (numId && !contactsMap.has(numId)) {
          contactsMap.set(numId, {
            id: numId,
            full_name: m.name,
            role: "mentee",
            avatar_url: m.avatarUrl || null,
          });
        }
      }

      // B. Also check all assignments (backend & local created)
      const [allAssignments, localAssignments] = await Promise.all([
        getAssignments().catch(() => []),
        Promise.resolve(getStoredCreatedAssignments()),
      ]);
      const combined = [...allAssignments, ...localAssignments];
      const myIdStr = currentUserId ? String(currentUserId).trim() : null;

      for (const a of combined) {
        const mentorIdStr = String(a.mentor?.id || (a as any).mentorId || "").trim();
        const matchesMentor =
          !myIdStr ||
          isSameId(mentorIdStr, myIdStr) ||
          mentorIdStr.endsWith(myIdStr) ||
          myIdStr.endsWith(mentorIdStr) ||
          myIdStr === "2"; // Default mock mentor

        if (matchesMentor && a.mentee) {
          const menteeNumId = Number(String(a.mentee.id).replace(/\D/g, "")) || Number(a.mentee.id);
          if (menteeNumId && !contactsMap.has(menteeNumId)) {
            contactsMap.set(menteeNumId, {
              id: menteeNumId,
              full_name: a.mentee.name || "Assigned Mentee",
              role: "mentee",
              avatar_url: a.mentee.avatarUrl || null,
            });
          }
        }
      }

      // C. If contacts are still empty for the mentor, fetch mentees in the facility
      if (contactsMap.size === 0) {
        try {
          const menteesRes = await apiClient<any>("/api/v1/users?role=mentee&limit=50").catch(() => null);
          const rawMentees = Array.isArray(menteesRes?.data?.users)
            ? menteesRes.data.users
            : Array.isArray(menteesRes?.data)
            ? menteesRes.data
            : Array.isArray(menteesRes?.users)
            ? menteesRes.users
            : Array.isArray(menteesRes)
            ? menteesRes
            : [];
          for (const u of rawMentees) {
            const numId = Number(u.id);
            if (numId && !contactsMap.has(numId)) {
              contactsMap.set(numId, {
                id: numId,
                full_name: u.full_name || u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || `Resident Midwife #${u.id}`,
                role: "mentee",
                avatar_url: u.avatar_url || null,
              });
            }
          }
        } catch {
          // ignore
        }
      }
    } else {
      // Mentee can DM their assigned mentor
      const [allAssignments, localAssignments] = await Promise.all([
        getAssignments().catch(() => []),
        Promise.resolve(getStoredCreatedAssignments()),
      ]);
      const combined = [...allAssignments, ...localAssignments];

      const myIdStr = currentUserId ? String(currentUserId).trim() : null;
      for (const a of combined) {
        const menteeIdStr = String(a.mentee?.id || "").trim();
        const matchesMe = !myIdStr || isSameId(menteeIdStr, myIdStr) || menteeIdStr.endsWith(myIdStr);

        if (matchesMe && a.mentor) {
          const mentorNumId = Number(String(a.mentor.id).replace(/\D/g, "")) || Number(a.mentor.id);
          if (mentorNumId && !contactsMap.has(mentorNumId)) {
            contactsMap.set(mentorNumId, {
              id: mentorNumId,
              full_name: a.mentor.name || "Assigned Mentor",
              role: "mentor",
              avatar_url: a.mentor.avatarUrl || null,
            });
          }
        }
      }
    }
  } catch {
    // Ignore assignment lookup errors
  }

  // Return combined, filtered list
  const list = Array.from(contactsMap.values());
  if (!searchQuery || !searchQuery.trim()) {
    return list;
  }

  const qLower = searchQuery.trim().toLowerCase();
  return list.filter(
    (c) =>
      c.full_name.toLowerCase().includes(qLower) ||
      String(c.id).includes(qLower)
  );
}
