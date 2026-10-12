"use client";

import {
  ChevronLeft,
  Info,
  MessageSquarePlus,
  MoreHorizontal,
  Phone,
  Search,
  Send,
  Video,
} from "lucide-react";
import { useMessaging } from "@/hooks/useMessaging";
import type { MessagingRole } from "@/hooks/useMessaging";

export default function ChatWindow({ role }: { role: MessagingRole }) {
  const {
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
                value={newContact}
                onChange={(event) => setNewContact(event.target.value)}
                aria-label={`Name of ${contactRole.toLowerCase()}`}
                placeholder={`${contactRole} name`}
                className="min-w-0 flex-1 rounded-md border border-[#dce2d5] px-3 py-2 text-sm outline-none focus:border-[#47793d]"
              />
              <button
                type="submit"
                disabled={!newContact.trim()}
                className="rounded-md bg-[#315f2a] px-3 text-sm text-white disabled:opacity-50"
              >
                Start
              </button>
            </form>
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
          {visibleConversations.length ? (
            visibleConversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => {
                  setSelectedId(conversation.id);
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
              No conversations match your search.
            </p>
          )}
        </div>
      </aside>

      <div
        className={`min-w-0 flex-1 flex-col ${
          showChat ? "flex" : "hidden md:flex"
        }`}
      >
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
          {selectedConversation.messages.length ? (
            selectedConversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex max-w-[85%] flex-col gap-1 sm:max-w-[75%] ${
                  message.sentByMe ? "self-end" : "self-start"
                }`}
              >
                <p
                  className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.sentByMe
                      ? "rounded-br-sm bg-[#315f2a] text-white"
                      : "rounded-bl-sm border border-[#e0e5dc] bg-white text-[#30392e]"
                  }`}
                >
                  {message.text}
                </p>
                <time
                  className={`text-[10px] text-[#7b8577] ${
                    message.sentByMe ? "text-right" : ""
                  }`}
                >
                  {message.time}
                </time>
              </div>
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
            className="min-w-0 flex-1 rounded-full border border-[#dce2d5] px-4 py-3 text-sm outline-none transition focus:border-[#47793d]"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send message"
            className="rounded-full bg-[#194611] p-3 text-white transition hover:bg-[#315f2a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={17} />
          </button>
        </form>
        <p className="border-t border-[#f0f2ed] px-4 py-1.5 text-center text-[10px] text-[#899286]">
          Frontend preview: messages are not sent to a server.
        </p>
      </div>
    </section>
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
