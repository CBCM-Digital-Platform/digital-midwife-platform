"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FacilityOption {
    name: string;
    count: number;
}

interface Props {
    value: string; // "ALL" or a facility name
    total: number;
    options: FacilityOption[];
    onChange: (value: string) => void;
}

export function FacilityDropdown({ value, total, options, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const items = [
        { key: "ALL", label: "All Facilities", count: total },
        ...options.map((o) => ({ key: o.name, label: o.name, count: o.count })),
    ];
    const currentLabel = value === "ALL" ? "All Facilities" : value;

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg border border-[#194611] bg-white px-3 py-2 text-sm font-medium text-[#194611] hover:bg-green-50"
            >
                <MapPin className="h-4 w-4" />
                {currentLabel}
                <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
            </button>

            {open && (
                <div
                    role="listbox"
                    aria-label="Clinical sites"
                    className="absolute left-0 z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white py-2 shadow-lg"
                >
                    <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        Clinical Sites
                    </p>
                    {items.map((item) => {
                        const selected = item.key === value;
                        return (
                            <button
                                key={item.key}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                onClick={() => {
                                    onChange(item.key);
                                    setOpen(false);
                                }}
                                className={cn(
                                    "flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50",
                                    selected ? "bg-green-50 font-semibold text-[#194611]" : "text-gray-700"
                                )}
                            >
                                <span className="flex h-4 w-4 items-center justify-center">
                                    {selected && <Check className="h-4 w-4" />}
                                </span>
                                <span className="flex-1">{item.label}</span>
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                    {item.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}