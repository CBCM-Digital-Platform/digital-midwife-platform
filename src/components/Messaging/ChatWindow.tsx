"use client";

import { useState, type FormEvent } from "react";
import {
  Check,
  ChevronLeft,
  Info,
  MessageSquarePlus,
  MoreHorizontal,
  Pencil,
  Phone,
  Search,
  Send,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { useMessaging } from "@/hooks/useMessaging";
import type { MessagingRole } from "@/hooks/useMessaging";

export default function ChatWindow({ role }: { role: MessagingRole }) {
  const {
    selectedId,
    conversations,
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
    loading,
    loadingMessages,
    sending,
    creating,
    error,
  } = useMessaging(role);

  return (
    <section className="flex min-h-155 h-[calc(100vh-12rem)] overflow-hidden rounded-xl border border-[#dce2d5] bg-white text-[#263226] shadow-sm">
      <aside
        className={`w-full shrink-0 flex-col border-r border-[#e2e6df] md:flex md:w-82.5 ${
          showChat ? "hidden" : "flex"
        }`}
      >
        <div className="border-b border-[#e2e6df] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">{title}</h1>
            <button
              type="button"
              aria-label="Start a new conversation"
              className="rounded-md p-2 text-[#315f2a] transition hover:bg-[#f1f5ed]"
              onClick={() => {
                setIsComposing((current) => !current);
                setNewContact("");
              }}
            >
              <MessageSquarePlus size={18} />
            </button>
          </div>
          <label className="relative block">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#879184]"
              size={17}
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-full border border-[#e0e5dc] bg-[#f7f8f4] py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#47793d]"
            />
          </label>
          {isComposing && (
            <form onSubmit={createConversation} className="mt-3 flex gap-2">
              <input
                autoFocus
                type="number"
                min="1"
                step="1"
                value={newContact}
                onChange={(event) => setNewContact(event.target.value)}
                aria-label={`${contactRole} user ID`}
                placeholder={`${contactRole} user ID`}
                className="min-w-0 flex-1 rounded-md border border-[#dce2d5] px-3 py-2 text-sm outline-none focus:border-[#47793d]"
              />
              <button
                type="submit"
                disabled={!newContact.trim() || creating}
                className="rounded-md bg-[#315f2a] px-3 text-sm text-white disabled:opacity-50"
              >
                {creating ? "Starting..." : "Start"}
              </button>
            </form>
          )}
          {error && (
            <div
              role="alert"
              className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700"
            >
              {error}
            </div>
          )}
          <div className="mt-3 flex gap-2" aria-label="Filter conversations">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  filter === item
                    ? "border-[#315f2a] bg-[#315f2a] text-white"
                    : "border-[#d8ded4] bg-white text-[#53604f] hover:bg-[#f4f6f1]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-6 text-center text-sm text-[#758071]">
              Loading conversations...
            </p>
          ) : visibleConversations.length ? (
            visibleConversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => {
                  selectConversation(conversation.id);
                  setShowChat(true);
                }}
                className={`flex w-full gap-3 border-b border-[#edf0eb] p-4 text-left transition hover:bg-[#f7f8f4] ${
                  selectedId === conversation.id
                    ? "bg-[#eef3e9] shadow-[inset_3px_0_#315f2a]"
                    : ""
                }`}
              >
                <Avatar
                  initials={conversation.initials}
                  color={conversation.avatarColor}
                  online={conversation.online}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {conversation.name}
                    </span>
                    <span className="shrink-0 text-[11px] text-[#758071]">
                      {conversation.lastMessageTime}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-xs text-[#697466]">
                    {conversation.lastMessage}
                  </span>
                  {conversation.unread && (
                    <span className="mt-2 inline-block rounded-full bg-[#315f2a] px-2 py-0.5 text-[10px] text-white">
                      New
                    </span>
                  )}
                </span>
              </button>
            ))
          ) : (
            <p className="p-6 text-center text-sm text-[#758071]">
              {conversations.length
                ? "No conversations match your search."
                : "No conversations yet. Start one to send a message."}
            </p>
          )}
        </div>
      </aside>

      <div
        className={`min-w-0 flex-1 flex-col ${
          showChat ? "flex" : "hidden md:flex"
        }`}
      >
        {selectedConversation ? (
          <>
        {error && (
          <div
            role="alert"
            className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 md:hidden"
          >
            {error}
          </div>
        )}
        <header className="flex items-center justify-between border-b border-[#e2e6df] px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Back to conversations"
              onClick={() => setShowChat(false)}
              className="rounded-full p-1 text-[#315f2a] hover:bg-[#f1f5ed] md:hidden"
            >
              <ChevronLeft size={19} />
            </button>
            <Avatar
              initials={selectedConversation.initials}
              color={selectedConversation.avatarColor}
              online={selectedConversation.online}
            />
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">
                {selectedConversation.name}
              </h2>
              <p className="text-xs text-[#71806e]">
                {selectedConversation.online
                  ? "Active now"
                  : selectedConversation.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[#315f2a]">
            {[
              { Icon: Video, label: "Video call" },
              { Icon: Phone, label: "Voice call" },
              { Icon: Info, label: "Conversation details" },
              { Icon: MoreHorizontal, label: "More options" },
            ].map(({ Icon, label }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                className="rounded-full p-2 transition hover:bg-[#f1f5ed]"
              >
                <Icon size={17} />
              </button>
            ))}
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto bg-[#fbfcf8] px-5 py-6 sm:px-8">
          <div className="self-center rounded-full bg-[#edf1e8] px-3 py-1 text-[11px] text-[#697466]">
            Today
          </div>
          {loadingMessages && !selectedConversation.messages.length ? (
            <p className="self-center text-sm text-[#758071]">
              Loading messages...
            </p>
          ) : selectedConversation.messages.length ? (
            selectedConversation.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                busy={messageActionId === message.id}
                onEdit={(text) =>
                  editMessage(selectedConversation.id, message.id, text)
                }
                onDelete={() =>
                  deleteMessage(selectedConversation.id, message.id)
                }
              />
            ))
          ) : (
            <p className="self-center rounded-full bg-[#edf1e8] px-3 py-1 text-xs text-[#697466]">
              This is the start of your conversation.
            </p>
          )}
        </div>

        <form
          onSubmit={sendMessage}
          className="flex items-center gap-3 border-t border-[#e2e6df] bg-white p-3 sm:px-5"
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label="Type a message"
            placeholder="Type a message..."
            disabled={sending}
            className="min-w-0 flex-1 rounded-full border border-[#dce2d5] px-4 py-3 text-sm outline-none transition focus:border-[#47793d]"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            aria-label="Send message"
            className="rounded-full bg-[#194611] p-3 text-white transition hover:bg-[#315f2a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? <span className="text-xs">...</span> : <Send size={17} />}
          </button>
        </form>
        <p className="border-t border-[#f0f2ed] px-4 py-1.5 text-center text-[10px] text-[#899286]">
          Messages are sent securely through CBCM.
        </p>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-[#758071]">
            {loading
              ? "Loading your conversations..."
              : "Choose a conversation or start a new one."}
          </div>
        )}
      </div>
    </section>
  );
}

function MessageBubble({
  message,
  busy,
  onEdit,
  onDelete,
}: {
  message: {
    id: number | string;
    text: string;
    time: string;
    sentByMe: boolean;
  };
  busy: boolean;
  onEdit: (text: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [draft, setDraft] = useState(message.text);

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    if (await onEdit(content)) {
      setIsEditing(false);
      setShowActions(false);
    }
  }

  async function confirmDelete() {
    if (window.confirm("Delete this message? This cannot be undone.")) {
      await onDelete();
    }
  }

  return (
    <div
      className={`flex w-fit max-w-[85%] flex-col gap-1 sm:max-w-[75%] ${
        message.sentByMe ? "self-end" : "self-start"
      }`}
    >
      <div className="relative w-fit max-w-full">
        {isEditing ? (
          <form
            onSubmit={saveEdit}
            className="min-w-56 rounded-2xl border border-[#dce2d5] bg-white p-3"
          >
            <textarea
              autoFocus
              aria-label="Edit message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={busy}
              rows={Math.min(Math.max(draft.split("\n").length, 2), 6)}
              className="w-full resize-y rounded-md border border-[#e0e5dc] p-2 text-sm text-[#30392e] outline-none focus:border-[#47793d]"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                aria-label="Cancel editing"
                disabled={busy}
                onClick={() => {
                  setDraft(message.text);
                  setIsEditing(false);
                }}
                className="rounded-md p-1.5 text-[#697466] hover:bg-[#f1f5ed] disabled:opacity-50"
              >
                <X size={16} />
              </button>
              <button
                type="submit"
                aria-label="Save edited message"
                disabled={
                  !draft.trim() || draft.trim() === message.text || busy
                }
                className="rounded-md p-1.5 text-[#315f2a] hover:bg-[#f1f5ed] disabled:opacity-50"
              >
                {busy ? (
                  <span className="px-1 text-xs">...</span>
                ) : (
                  <Check size={16} />
                )}
              </button>
            </div>
          </form>
        ) : message.sentByMe ? (
          <button
            type="button"
            aria-label="Your message. Click to show edit and delete actions."
            aria-expanded={showActions}
            onClick={() => setShowActions((current) => !current)}
            className="block w-fit max-w-full break-words whitespace-pre-wrap rounded-2xl rounded-br-sm bg-[#315f2a] px-4 py-3 text-left text-sm leading-relaxed text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315f2a]"
          >
            {message.text}
          </button>
        ) : (
          <p className="block w-fit max-w-full break-words whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-[#e0e5dc] bg-white px-4 py-3 text-sm leading-relaxed text-[#30392e]">
            {message.text}
          </p>
        )}
        {message.sentByMe && showActions && !isEditing && (
          <div
            role="toolbar"
            aria-label="Message actions"
            className="absolute bottom-full right-0 z-20 mb-2 flex items-center gap-1 rounded-lg border border-[#d7ddd2] bg-white p-1 shadow-lg"
          >
            <button
              type="button"
              aria-label="Edit message"
              title="Edit message"
              disabled={busy}
              onClick={() => {
                setDraft(message.text);
                setIsEditing(true);
                setShowActions(false);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-md text-[#315f2a] transition hover:bg-[#edf1e8] focus-visible:outline-2 focus-visible:outline-[#315f2a] disabled:opacity-50"
            >
              <Pencil size={18} strokeWidth={2.25} />
            </button>
            <button
              type="button"
              aria-label="Delete message"
              title="Delete message"
              disabled={busy}
              onClick={() => void confirmDelete()}
              className="flex h-9 w-9 items-center justify-center rounded-md text-[#a83228] transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-[#a83228] disabled:opacity-50"
            >
              {busy ? (
                <span className="text-xs">...</span>
              ) : (
                <Trash2 size={18} strokeWidth={2.25} />
              )}
            </button>
          </div>
        )}
      </div>
      <time
        className={`text-[10px] text-[#7b8577] ${
          message.sentByMe ? "text-right" : ""
        }`}
      >
        {message.time}
      </time>
    </div>
  );
}

function Avatar({
  initials,
  color,
  online,
}: {
  initials: string;
  color: string;
  online?: boolean;
}) {
  return (
    <span className="relative mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
      <span
        aria-hidden="true"
        className={`flex h-full w-full items-center justify-center rounded-full ${color}`}
      >
        {initials}
      </span>
      {online && (
        <span
          aria-label="Online"
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#63a849]"
        />
      )}
    </span>
  );
}
