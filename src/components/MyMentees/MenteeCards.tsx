import Link from "next/link";
import { Building2 } from "lucide-react";
import type { MyMentee } from "@/types/my-mentee";
import { CompetencyBadge, LastSession, MenteeAvatar } from "./MenteeParts";

export function MenteeCards({ mentees }: { mentees: MyMentee[] }) {
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
                    <div className="flex items-center gap-3">
                        <MenteeAvatar name={m.name} avatarUrl={m.avatarUrl} className="h-12 w-12" />
                        <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">{m.name}</p>
                            <p className="text-xs text-gray-500">ID: {m.code}</p>
                        </div>
                    </div>

                    <p className="mt-4 flex items-center gap-1.5 text-sm text-gray-800">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        {m.facility}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                        <CompetencyBadge level={m.level} />
                        <LastSession iso={m.lastSession} overdue={m.overdue} />
                    </div>

                    <Link
                        href={`/assessments/new?menteeId=${m.id}`}
                        className="mt-4 inline-block text-xs font-semibold text-[#194611] hover:underline"
                    >
                        Assess
                    </Link>
                </li>
            ))}
        </ul>
    );
}