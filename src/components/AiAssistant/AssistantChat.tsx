"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { AssistantData, ChatMessage } from "@/types/assistant";
import { askClinicalAssistant } from "@/services/clinical-assistant.service";
import { AssistantSidebar } from "./AssistantSidebar";
import { EmptyState } from "./EmptyState";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";

export function AssistantChat({ data }: { data: AssistantData }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [recent, setRecent] = useState(data.recentQueries);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const lastId = useRef(0);

    const nextId = () => String(++lastId.current);

    const ask = async (text: string, attachments: string[] = []) => {
        const question = text.trim();
        if (!question || pending) return;

        setError(null);
        setMessages((prev) => [
            ...prev,
            { id: nextId(), role: "user", content: question, attachments },
        ]);
        // TODO: the backend should store the user's recent queries
        setRecent((prev) => [question, ...prev.filter((q) => q !== question)].slice(0, 6));
        setPending(true);

        try {
            const reply = await askClinicalAssistant(question, attachments);
            setMessages((prev) => [
                ...prev,
                { id: nextId(), role: "assistant", content: reply.content, sources: reply.sources },
            ]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "The assistant couldn't answer. Please try again.");
        } finally {
            setPending(false);
        }
    };

    const newChat = () => {
        if (pending) return;
        setMessages([]);
        setError(null);
    };

    return (
        <div className="mx-auto grid h-[calc(100vh-9rem)] min-h-[560px] max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
            <AssistantSidebar recentQueries={recent} onPick={(q) => ask(q)} disabled={pending} />

            <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
                {messages.length > 0 && (
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                        <p className="text-sm font-semibold text-gray-900">Conversation</p>
                        <button
                            type="button"
                            onClick={newChat}
                            disabled={pending}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-[#194611] hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            New chat
                        </button>
                    </div>
                )}

                {messages.length === 0 ? (
                    <EmptyState suggestions={data.suggestions} onPick={(q) => ask(q)} disabled={pending} />
                ) : (
                    <MessageList messages={messages} pending={pending} error={error} />
                )}

                <Composer disabled={pending} onSend={ask} />
            </section>
        </div>
    );
}