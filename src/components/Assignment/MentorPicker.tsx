"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, PlusCircle, Search } from "lucide-react";
import type { MentorOption } from "@/types/assignment-form";
import Avatar from "./Avatar";

interface MentorPickerProps {
    mentors: MentorOption[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    invalid?: boolean;
}

export default function MentorPicker({
    mentors,
    selectedIds,
    onToggle,
    invalid = false,
}: MentorPickerProps) {
    const [query, setQuery] = useState("");

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return mentors;
        return mentors.filter(
            (m) => m.name.toLowerCase().includes(q) || m.specialty.toLowerCase().includes(q),
        );
    }, [mentors, query]);

    return (
        <div>
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search mentors by name or specialty..."
                    className={`h-10 w-full rounded-lg border bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDD028] ${invalid ? "border-red-400" : "border-gray-200"
                        }`}
                />
            </div>

            <ul className="mt-2 max-h-64 divide-y divide-gray-100 overflow-auto rounded-lg border border-gray-200">
                {visible.length === 0 && (
                    <li className="px-4 py-6 text-center text-sm text-gray-500">
                        No mentors match your search.
                    </li>
                )}
                {visible.map((mentor) => {
                    const selected = selectedIds.includes(mentor.id);
                    const atCapacity = mentor.currentLoad >= mentor.maxLoad;
                    return (
                        <li key={mentor.id}>
                            <button
                                type="button"
                                aria-pressed={selected}
                                onClick={() => onToggle(mentor.id)}
                                className={`flex w-full items-center gap-3 px-4 py-3 text-left ${selected ? "bg-green-50" : "hover:bg-gray-50"
                                    }`}
                            >
                                <Avatar person={mentor} />
                                <span className="flex-1">
                                    <span className="block text-sm font-medium text-gray-900">{mentor.name}</span>
                                    <span className="block text-xs text-gray-500">{mentor.specialty}</span>
                                </span>
                                {atCapacity ? (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                                        <AlertTriangle className="size-3" />
                                        At Capacity ({mentor.currentLoad}/{mentor.maxLoad})
                                    </span>
                                ) : (
                                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                        Load: {mentor.currentLoad}/{mentor.maxLoad}
                                    </span>
                                )}
                                {selected ? (
                                    <Check className="size-5 text-green-700" aria-label="Selected" />
                                ) : (
                                    <PlusCircle
                                        className={`size-5 ${atCapacity ? "text-red-500" : "text-gray-400"}`}
                                        aria-label="Select mentor"
                                    />
                                )}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}