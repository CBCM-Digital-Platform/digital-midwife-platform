import { FileText, MapPin, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MyMentee } from "@/types/my-mentee";
import { MenteeAvatar } from "@/components/MyMentees/MenteeParts";

export function relativeDay(iso: string, asOfIso: string) {
    const days = Math.floor((new Date(asOfIso).getTime() - new Date(iso).getTime()) / 86_400_000);
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 14) return `${days} days ago`;
    if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
}

function ProgressChip({ mentee }: { mentee: MyMentee }) {
    const { label, style } = !mentee.active
        ? { label: "Inactive", style: "bg-gray-100 text-gray-500" }
        : mentee.overdue
            ? { label: "Needs Attention", style: "bg-amber-50 text-amber-800" }
            : { label: "On Track", style: "bg-[#E3EBDD] text-[#3D5A37]" };

    return (
        <span
            className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-tight",
                style
            )}
        >
            {label}
        </span>
    );
}

export function RosterCards({ mentees, asOf }: { mentees: MyMentee[]; asOf: string }) {
    if (mentees.length === 0) {
        return (
            <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                No mentees match these filters.
            </p>
        );
    }

    return (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mentees.map((m) => (
                <li key={m.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <MenteeAvatar name={m.name} avatarUrl={m.avatarUrl} className="h-12 w-12" />
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-900">{m.name}</p>
                                <p className="text-xs text-gray-500">{m.title}</p>
                            </div>
                        </div>
                        <ProgressChip mentee={m} />
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs text-gray-600">
                        <p className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-gray-500" />
                            {m.facility}
                        </p>
                        <p className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-gray-500" />
                            Last Session: {relativeDay(m.lastSession, asOf)}
                        </p>
                    </div>

                    <div className="mt-5 flex items-center gap-2">
                        {/* TODO: link to the mentee profile page once it exists */}
                        <button
                            type="button"
                            className="flex-1 rounded-lg bg-[#4F7A47] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#436a3c]"
                        >
                            View Profile
                        </button>
                        {/* TODO: actions menu (assess, message, remove from roster) */}
                        <button
                            type="button"
                            aria-label={`More actions for ${m.name}`}
                            className="rounded-lg border border-gray-200 p-2.5 text-gray-600 hover:bg-gray-50"
                        >
                            <MoreVertical className="h-4 w-4" />
                        </button>
                    </div>
                </li>
            ))}
        </ul>
    );
}