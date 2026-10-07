"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import type { MenteeOption } from "@/types/assignment-form";
import Avatar from "./Avatar";

interface MenteePickerProps {
    mentees: MenteeOption[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    /** Maximum number of mentees that can be selected */
    max: number;
    invalid?: boolean;
}

export default function MenteePicker({
    mentees,
    selectedIds,
    onToggle,
    max,
    invalid = false,
}: MenteePickerProps) {
    const [query, setQuery] = useState("");
    const limitReached = selectedIds.length >= max;

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return mentees;
        return mentees.filter(
            (m) => m.name.toLowerCase().includes(q) || m.facility.toLowerCase().includes(q),
        );
    }, [mentees, query]);

    return (
        <div>
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, facility..."
                    className={`h-10 w-full rounded-lg border bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDD028] ${invalid ? "border-red-400" : "border-gray-200"
                        }`}
                />
            </div>

            <p className="mt-2 text-xs text-gray-500">
                {selectedIds.length} of {max} mentees selected
                {limitReached && " (limit reached, deselect one to pick another)"}
            </p>

            <ul className="mt-2 max-h-56 divide-y divide-gray-100 overflow-auto rounded-lg border border-gray-200">
                {visible.length === 0 && (
                    <li className="px-4 py-6 text-center text-sm text-gray-500">
                        No mentees match your search.
                    </li>
                )}
                {visible.map((mentee) => {
                    const selected = selectedIds.includes(mentee.id);
                    const disabled = !selected && limitReached;
                    return (
                        <li key={mentee.id}>
                            <button
                                type="button"
                                aria-pressed={selected}
                                disabled={disabled}
                                onClick={() => onToggle(mentee.id)}
                                className={`flex w-full items-center gap-3 px-4 py-3 text-left ${selected ? "bg-green-50" : "hover:bg-gray-50"
                                    } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                            >
                                <Avatar person={mentee} />
                                <span className="flex-1">
                                    <span className="block text-sm font-medium text-gray-900">{mentee.name}</span>
                                    <span className="block text-xs text-gray-500">
                                        {mentee.specialty} • {mentee.facility}
                                    </span>
                                </span>
                                {selected && <Check className="size-5 text-green-700" aria-label="Selected" />}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}