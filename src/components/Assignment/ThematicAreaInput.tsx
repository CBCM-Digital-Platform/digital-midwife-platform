"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { X, ChevronDown, Check, Layers } from "lucide-react";
import type { ThematicAreaOptionItem } from "@/types/assignment-form";

interface ThematicAreaInputProps {
    value: string[];
    onChange: (next: string[]) => void;
    suggestions: string[];
    thematicAreaItems?: ThematicAreaOptionItem[];
    invalid?: boolean;
    placeholder?: string;
    cycleThematicAreaNames?: string[];
    disabled?: boolean;
}

export default function ThematicAreaInput({
    value,
    onChange,
    suggestions,
    thematicAreaItems = [],
    invalid = false,
    placeholder = "Select or search accredited thematic areas...",
    cycleThematicAreaNames,
    disabled = false,
}: ThematicAreaInputProps) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Merge suggestions with thematicAreaItems to build a unified options array
    const allOptions = useMemo(() => {
        const list: { id: string; name: string; code?: string }[] = [];
        const seenNames = new Set<string>();

        if (thematicAreaItems && thematicAreaItems.length > 0) {
            for (const item of thematicAreaItems) {
                if (!seenNames.has(item.name.toLowerCase())) {
                    seenNames.add(item.name.toLowerCase());
                    list.push(item);
                }
            }
        }

        for (const s of suggestions) {
            if (!seenNames.has(s.toLowerCase())) {
                seenNames.add(s.toLowerCase());
                list.push({ id: s, name: s });
            }
        }

        // Option 1: When cycleThematicAreaNames is provided, strictly filter to ONLY accredited areas for this cycle
        if (cycleThematicAreaNames !== undefined) {
            const cycleSet = new Set(cycleThematicAreaNames.map((n) => n.toLowerCase().trim()));
            return list.filter(
                (opt) => cycleSet.has(opt.name.toLowerCase().trim()) || cycleSet.has(opt.id.toLowerCase().trim())
            );
        }

        return list;
    }, [suggestions, thematicAreaItems, cycleThematicAreaNames]);

    // Filter available options based on query
    const filteredOptions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return allOptions;

        return allOptions.filter(
            (opt) =>
                opt.name.toLowerCase().includes(q) ||
                (opt.code && opt.code.toLowerCase().includes(q))
        );
    }, [allOptions, query]);

    // Handle outside clicks to close the dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function toggleOption(name: string) {
        if (disabled) return;
        if (value.includes(name)) {
            onChange(value.filter((a) => a !== name));
        } else {
            onChange([...value, name]);
            setQuery("");
        }
    }

    function remove(name: string) {
        if (disabled) return;
        onChange(value.filter((a) => a !== name));
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <div
                onClick={() => {
                    if (disabled) return;
                    setIsOpen(true);
                    inputRef.current?.focus();
                }}
                className={`flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border px-3 py-1.5 transition shadow-2xs ${
                    disabled
                        ? "cursor-not-allowed border-gray-200 bg-gray-50/80 opacity-70"
                        : invalid
                        ? "cursor-text border-red-400 bg-white focus-within:ring-2 focus-within:ring-[#194611]"
                        : "cursor-text border-gray-200 bg-white hover:border-gray-300 focus-within:ring-2 focus-within:ring-[#194611]"
                }`}
            >
                {/* Selected Pills */}
                {value.map((area) => (
                    <span
                        key={area}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-[#194611] border border-emerald-200/80 animate-in fade-in-50"
                    >
                        <Layers className="size-3 text-[#194611]" />
                        {area}
                        {!disabled && (
                            <button
                                type="button"
                                aria-label={`Remove ${area}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    remove(area);
                                }}
                                className="ml-1 text-emerald-600 hover:text-emerald-900 cursor-pointer"
                            >
                                <X className="size-3" />
                            </button>
                        )}
                    </span>
                ))}

                {/* Search / Text input */}
                <input
                    ref={inputRef}
                    disabled={disabled}
                    value={query}
                    onChange={(e) => {
                        if (disabled) return;
                        setQuery(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (!disabled) setIsOpen(true);
                    }}
                    onKeyDown={(e) => {
                        if (disabled) return;
                        if (e.key === "Enter") {
                            e.preventDefault();
                            if (filteredOptions.length > 0) {
                                toggleOption(filteredOptions[0].name);
                            }
                        }
                        if (e.key === "Backspace" && !query && value.length > 0) {
                            remove(value[value.length - 1]);
                        }
                        if (e.key === "Escape") {
                            setIsOpen(false);
                        }
                    }}
                    placeholder={value.length === 0 ? placeholder : disabled ? "" : "Add more areas..."}
                    className="min-w-44 flex-1 bg-transparent py-1 text-xs text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
                />

                {/* Dropdown Toggle Chevron */}
                {!disabled && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen((prev) => !prev);
                        }}
                        className="ml-auto text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                        aria-label="Toggle options menu"
                    >
                        <ChevronDown className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                )}
            </div>

            {/* Dropdown Menu */}
            {isOpen && !disabled && (
                <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg">
                    {filteredOptions.length === 0 ? (
                        <div className="p-3 text-center text-xs text-gray-500">
                            {cycleThematicAreaNames && cycleThematicAreaNames.length === 0
                                ? "No thematic areas are accredited for this cycle yet."
                                : "No matching accredited thematic areas found."}
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {filteredOptions.map((opt) => {
                                const isSelected = value.includes(opt.name);

                                return (
                                    <li key={opt.id || opt.name}>
                                        <button
                                            type="button"
                                            onClick={() => toggleOption(opt.name)}
                                            className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-xs transition cursor-pointer ${
                                                isSelected
                                                    ? "bg-emerald-50/70 font-semibold text-[#194611]"
                                                    : "text-gray-800 hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className="flex-1 pr-2">
                                                <div className="flex items-center gap-2">
                                                    <span>{opt.name}</span>
                                                    {opt.code && (
                                                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-gray-600">
                                                            {opt.code}
                                                        </span>
                                                    )}
                                                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-[#194611]">
                                                        Accredited
                                                    </span>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <Check className="size-4 text-[#194611] shrink-0" />
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
