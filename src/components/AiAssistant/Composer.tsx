"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Mic, Paperclip, Send, X } from "lucide-react";

const ALLOWED = ["pdf", "docx", "jpg", "jpeg", "png"];
const MAX_MB = 10;
const MAX_FILES = 3;

function extension(name: string) {
    return name.split(".").pop()?.toLowerCase() ?? "";
}

interface Props {
    disabled: boolean;
    onSend: (text: string, attachmentNames: string[]) => void;
}

export function Composer({ disabled, onSend }: Props) {
    const [text, setText] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [fileError, setFileError] = useState<string | null>(null);
    const area = useRef<HTMLTextAreaElement>(null);
    const picker = useRef<HTMLInputElement>(null);

    // Grow the box with the text, up to about 4 lines
    useEffect(() => {
        const el = area.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
    }, [text]);

    const canSend = text.trim().length > 0 && !disabled;

    const send = () => {
        if (!canSend) return;
        // TODO: upload the attached files to the backend with the question
        onSend(text.trim(), files.map((f) => f.name));
        setText("");
        setFiles([]);
        setFileError(null);
        area.current?.focus();
    };

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
        }
    };

    const onPick = (e: ChangeEvent<HTMLInputElement>) => {
        const picked = Array.from(e.target.files ?? []);
        e.target.value = ""; // allow picking the same file again
        if (picked.length === 0) return;

        const unsupported = picked.find((f) => !ALLOWED.includes(extension(f.name)));
        if (unsupported) {
            setFileError(`"${unsupported.name}" isn't supported. Use PDF, DOCX, JPG or PNG.`);
            return;
        }
        const tooBig = picked.find((f) => f.size > MAX_MB * 1024 * 1024);
        if (tooBig) {
            setFileError(`"${tooBig.name}" is larger than ${MAX_MB} MB.`);
            return;
        }

        const merged = [
            ...files,
            ...picked.filter((p) => !files.some((f) => f.name === p.name && f.size === p.size)),
        ];
        if (merged.length > MAX_FILES) {
            setFileError(`You can attach up to ${MAX_FILES} files.`);
            return;
        }
        setFiles(merged);
        setFileError(null);
    };

    return (
        <div className="border-t border-gray-100 px-5 pb-4 pt-3">
            {files.length > 0 && (
                <ul className="mb-2 flex flex-wrap gap-2">
                    {files.map((f, i) => (
                        <li
                            key={`${f.name}-${f.size}`}
                            className="flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-3 pr-1.5 text-xs text-gray-700"
                        >
                            <Paperclip className="h-3 w-3" />
                            <span className="max-w-[160px] truncate">{f.name}</span>
                            <button
                                type="button"
                                aria-label={`Remove ${f.name}`}
                                onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                                className="rounded-full p-0.5 text-gray-500 hover:bg-gray-200 hover:text-gray-900"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {fileError && <p className="mb-2 text-xs text-red-600">{fileError}</p>}

            <div className="flex items-end gap-2 rounded-2xl border border-gray-300 bg-white px-3 py-2 focus-within:border-[#194611] focus-within:ring-1 focus-within:ring-[#194611]">
                <button
                    type="button"
                    aria-label="Attach files"
                    onClick={() => picker.current?.click()}
                    className="mb-1 rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                >
                    <Paperclip className="h-5 w-5" />
                </button>
                <input
                    ref={picker}
                    type="file"
                    multiple
                    accept={ALLOWED.map((e) => `.${e}`).join(",")}
                    onChange={onPick}
                    className="hidden"
                />

                <label htmlFor="assistant-message" className="sr-only">
                    Message Clinical Assistant
                </label>
                <textarea
                    id="assistant-message"
                    ref={area}
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Message Clinical Assistant..."
                    className="max-h-32 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
                />

                {/* TODO: voice input */}
                <button
                    type="button"
                    disabled
                    title="Voice input is coming soon"
                    aria-label="Voice input (coming soon)"
                    className="mb-1 cursor-not-allowed rounded p-1.5 text-gray-300"
                >
                    <Mic className="h-5 w-5" />
                </button>

                <button
                    type="button"
                    onClick={send}
                    disabled={!canSend}
                    aria-label="Send message"
                    className="mb-0.5 rounded-xl bg-[#194611] p-2.5 text-white hover:bg-[#0f2f0b] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Send className="h-5 w-5" />
                </button>
            </div>

            <p className="mt-2 text-center text-[11px] text-gray-500">
                AI-generated responses should not replace clinical judgment. Verify critical information.
            </p>
        </div>
    );
}