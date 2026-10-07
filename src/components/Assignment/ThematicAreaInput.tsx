"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

interface ThematicAreaInputProps {
    value: string[];
    onChange: (next: string[]) => void;
    suggestions: string[];
    invalid?: boolean;
}

export default function ThematicAreaInput({
    value,
    onChange,
    suggestions,
    invalid = false,
}: ThematicAreaInputProps) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);

    const matches = useMemo(() => {
        const q = query.trim().toLowerCase();
        return suggestions.filter((s) => !value.includes(s) && s.toLowerCase().includes(q));
    }, [suggestions, value, query]);

    function add(area: string) {
        onChange([...value, area]);
        setQuery("");
    }

    function remove(area: string) {
        onChange(value.filter((a) => a !== area));
    }

    return (
        <div className="relative">
            <div
                className={`flex min-h-10 flex-wrap items-center gap-2 rounded-lg border bg-white px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#FDD028] ${invalid ? "border-red-400" : "border-gray-200"
                    }`}
            >
                {value.map((area) => (
                    <span
                        key={area}
                        className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs"
                    >
                        {area}
                        <button type="button" aria-label={`Remove ${area}`} onClick={() => remove(area)}>
                            <X className="size-3" />
                        </button>
                    </span>
                ))}
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setOpen(false)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            if (matches[0]) add(matches[0]);
                        }
                        if (e.key === "Backspace" && !query && value.length > 0) {
                            remove(value[value.length - 1]);
                        }
                    }}
                    placeholder="Add thematic area..."
                    className="min-w-32 flex-1 bg-transparent px-1 text-sm outline-none"
                />
            </div>

            {open && matches.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-md">
                    {matches.map((area) => (
                        <li key={area}>
                            <button
                                type="button"
                                // onMouseDown keeps the input focused so the click isn't lost to blur
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    add(area);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                            >
                                {area}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}