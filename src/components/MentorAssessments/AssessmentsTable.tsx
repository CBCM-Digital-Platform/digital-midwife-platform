import { ArrowUpDown, ChevronDown, Clock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MentorAssessment } from "@/types/mentor-assessment";
import { MenteeAvatar, formatSessionDate } from "@/components/MyMentees/MenteeParts";

export type SortKey = "name" | "date" | "type";
export type SortState = { key: SortKey; dir: "asc" | "desc" } | null;

function StatusBadge({ a }: { a: MentorAssessment }) {
    if (a.status === "PENDING") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-[11px] font-semibold uppercase text-amber-800">
                <Clock className="h-3 w-3" />
                Pending
            </span>
        );
    }

    const needsReview = a.status === "NEEDS_REVIEW";
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase",
                needsReview ? "bg-red-100 text-red-700" : "bg-[#DDE3DA] text-[#2F4A2B]"
            )}
        >
            <span
                className={cn("h-1.5 w-1.5 rounded-full", needsReview ? "bg-red-600" : "bg-[#194611]")}
            />
            {needsReview ? "Needs Review" : "Pass"}
            {a.scorePct !== null && ` (${a.scorePct}%)`}
        </span>
    );
}

function SortHeader({
    label,
    sortKey,
    sort,
    onSort,
    icon: Icon = ArrowUpDown,
}: {
    label: string;
    sortKey: SortKey;
    sort: SortState;
    onSort: (key: SortKey) => void;
    icon?: LucideIcon;
}) {
    const active = sort?.key === sortKey;
    return (
        <th
            className="px-4 py-3.5"
            aria-sort={active ? (sort?.dir === "asc" ? "ascending" : "descending") : "none"}
        >
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                className={cn(
                    "inline-flex items-center gap-1 uppercase tracking-wide hover:text-gray-900",
                    active && "text-gray-900"
                )}
            >
                {label}
                <Icon className="h-3 w-3" />
            </button>
        </th>
    );
}

export function AssessmentsTable({
    rows,
    sort,
    onSort,
    onSelectAssessment,
}: {
    rows: MentorAssessment[];
    sort: SortState;
    onSort: (key: SortKey) => void;
    onSelectAssessment?: (assessment: MentorAssessment) => void;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#EEF0E6] text-[11px] font-semibold text-gray-500">
                    <tr>
                        <SortHeader label="Mentee Name" sortKey="name" sort={sort} onSort={onSort} icon={ChevronDown} />
                        <SortHeader label="Date" sortKey="date" sort={sort} onSort={onSort} />
                        <SortHeader label="Assessment Type" sortKey="type" sort={sort} onSort={onSort} />
                        <th className="px-4 py-3.5 uppercase tracking-wide">Status/Result</th>
                        <th className="px-6 py-3.5 text-right uppercase tracking-wide">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                No assessments match these filters.
                            </td>
                        </tr>
                    ) : (
                        rows.map((a) => (
                            <tr
                                key={a.id}
                                className={cn("hover:bg-gray-50/80 transition-colors", a.status === "PENDING" && "bg-yellow-50/60")}
                            >
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <MenteeAvatar name={a.menteeName} />
                                        <div>
                                            <p className="font-semibold text-gray-900">{a.menteeName}</p>
                                            <p className="text-xs text-gray-500">{a.menteeTitle}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-gray-800">{formatSessionDate(a.date)}</td>
                                <td className="px-4 py-4 text-gray-800">
                                    <button
                                        type="button"
                                        onClick={() => onSelectAssessment && onSelectAssessment(a)}
                                        className="text-left font-medium hover:text-[#194611] hover:underline"
                                    >
                                        {a.type}
                                    </button>
                                </td>
                                <td className="px-4 py-4">
                                    <StatusBadge a={a} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        type="button"
                                        onClick={() => onSelectAssessment && onSelectAssessment(a)}
                                        className="text-xs font-semibold text-[#194611] hover:underline cursor-pointer"
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}