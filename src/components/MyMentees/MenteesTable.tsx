import Link from "next/link";
import { Building2 } from "lucide-react";
import type { MyMentee } from "@/types/my-mentee";
import { CompetencyBadge, LastSession, MenteeAvatar } from "./MenteeParts";

export function MenteesTable({ mentees }: { mentees: MyMentee[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-gray-100/70 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                        <th className="px-6 py-3.5">Mentee</th>
                        <th className="px-4 py-3.5">Facility</th>
                        <th className="px-4 py-3.5">Competency Level</th>
                        <th className="px-4 py-3.5">Last Session</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {mentees.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                No mentees match these filters.
                            </td>
                        </tr>
                    ) : (
                        mentees.map((m) => (
                            <tr key={m.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <MenteeAvatar name={m.name} avatarUrl={m.avatarUrl} />
                                        <div>
                                            <p className="font-semibold text-gray-900">{m.name}</p>
                                            <p className="text-xs text-gray-500">ID: {m.code}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-gray-800">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Building2 className="h-4 w-4 text-gray-500" />
                                        {m.facility}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <CompetencyBadge level={m.level} />
                                </td>
                                <td className="px-4 py-4">
                                    <LastSession iso={m.lastSession} overdue={m.overdue} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link
                                        href={`/assessments/new?menteeId=${m.id}`}
                                        className="text-xs font-semibold text-[#194611] hover:underline"
                                    >
                                        Assess
                                    </Link>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}