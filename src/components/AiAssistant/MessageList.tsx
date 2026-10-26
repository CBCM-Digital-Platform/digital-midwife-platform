"use client";

import { useEffect, useRef } from "react";
import { Brain, Paperclip } from "lucide-react";
import type { ChatMessage } from "@/types/assistant";

interface Props {
    messages: ChatMessage[];
    pending: boolean;
    error: string | null;
}

export function MessageList({ messages, pending, error }: Props) {
    const bottom = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, pending, error]);

    return (
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6" aria-live="polite">
            {messages.map((m) =>
                m.role === "user" ? (
                    <div key={m.id} className="flex flex-col items-end gap-1.5">
                        <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#194611] px-4 py-3 text-sm text-white">
                            {m.content}
                        </p>
                        {m.attachments && m.attachments.length > 0 && (
                            <ul className="flex max-w-[80%] flex-wrap justify-end gap-1.5">
                                {m.attachments.map((name) => (
                                    <li
                                        key={name}
                                        className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-700"
                                    >
                                        <Paperclip className="h-3 w-3" />
                                        {name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ) : (
                    <div key={m.id} className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DDE3DA] text-[#194611]">
                            <Brain className="h-4 w-4" />
                        </span>
                        <div className="max-w-[80%] rounded-2xl rounded-tl-md border border-gray-200 bg-[#F6F8F0] px-4 py-3 text-sm text-gray-800">
                            <p className="whitespace-pre-wrap">{m.content}</p>
                            {m.sources && m.sources.length > 0 && (
                                <ul className="mt-3 space-y-1 border-t border-gray-200 pt-2 text-xs">
                                    {m.sources.map((s) => (
                                        <li key={s.url}>
                                            <a
                                                href={s.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-[#194611] hover:underline"
                                            >
                                                {s.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )
            )}

            {pending && (
                <div className="flex items-start gap-3" role="status" aria-label="The assistant is typing">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DDE3DA] text-[#194611]">
                        <Brain className="h-4 w-4" />
                    </span>
                    <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-gray-200 bg-[#F6F8F0] px-4 py-3.5">
                        {[0, 150, 300].map((delay) => (
                            <span
                                key={delay}
                                className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                                style={{ animationDelay: `${delay}ms` }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <div ref={bottom} />
        </div>
    );
}