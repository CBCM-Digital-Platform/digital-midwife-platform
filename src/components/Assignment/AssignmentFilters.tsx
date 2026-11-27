"use client";

import { Search } from "lucide-react";
import type { AssignmentFiltersState } from "@/types/assignment";

export const DEFAULT_FILTERS: AssignmentFiltersState = {
    search: "",
    mentorId: "all",
    facility: "all",
    domain: "all",
    status: "all",
};

interface Option {
    value: string;
    label: string;
}

interface AssignmentFiltersProps {
    filters: AssignmentFiltersState;
    onChange: (next: AssignmentFiltersState) => void;
    mentorOptions: Option[];
    domainOptions: Option[];
}

const selectClass =
    "h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FDD028]";

export default function AssignmentFilters({
    filters,
    onChange,
    mentorOptions,
    domainOptions,
}: AssignmentFiltersProps) {
    const set = <K extends keyof AssignmentFiltersState>(key: K, value: AssignmentFiltersState[K]) =>
        onChange({ ...filters, [key]: value });

    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[260px] flex-1 sm:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input
                    type="search"
                    value={filters.search}
                    onChange={(e) => set("search", e.target.value)}
                    placeholder="Search by mentor, mentee, thematic area, or ID..."
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDD028]"
                />
            </div>

            <select
                aria-label="Thematic area"
                className={selectClass}
                value={filters.domain}
                onChange={(e) => set("domain", e.target.value)}
            >
                <option value="all">Thematic Area: All Areas</option>
                {domainOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>

            <select
                aria-label="Mentor"
                className={selectClass}
                value={filters.mentorId}
                onChange={(e) => set("mentorId", e.target.value)}
            >
                <option value="all">Mentor: All Mentors</option>
                {mentorOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
