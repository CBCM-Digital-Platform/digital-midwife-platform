import Link from "next/link";
import { FileText, GraduationCap } from "lucide-react";
import type { AssignedMentor, Handbook } from "@/types/mentee-dashboard";

function initials(name: string) {
    return name
        .replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

const cardClass = "rounded-xl border border-gray-200 bg-white p-5 shadow-xs";
const labelClass = "text-[10px] font-semibold uppercase tracking-wide text-gray-500";

export function SidePanel({ mentor, handbook }: { mentor: AssignedMentor; handbook: Handbook }) {
    return (
        <aside className="space-y-4">
            <section className={cardClass}>
                <div className="flex items-center justify-between">
                    <p className={labelClass}>Assigned Clinical Mentor</p>
                    {mentor.active && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                            Active
                        </span>
                    )}
                </div>

                <div className="mt-4 flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#194611] text-sm font-bold text-white">
                        {initials(mentor.name)}
                    </span>
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-900">
                            {mentor.name}, {mentor.credentials}
                        </p>
                        <p className="text-xs text-gray-600">
                            {mentor.role} • {mentor.credentials}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-green-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                            {mentor.openSlots} slots open this week
                        </p>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                        href="/messaging"
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-sm font-semibold text-gray-800 hover:bg-gray-50"
                    >
                        Message
                    </Link>
                    {/* TODO: open a scheduling flow once mentee sessions exist */}
                    <button
                        type="button"
                        className="rounded-lg bg-[#194611] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0f2f0b]"
                    >
                        Schedule 1-on-1
                    </button>
                </div>
            </section>

            <section className={cardClass}>
                <p className={labelClass}>Official Clinical Handbook</p>

                <div className="mt-4 flex items-start gap-3">
                    <span className="flex h-14 w-11 shrink-0 items-center justify-center rounded-md bg-[#2F5D2A] text-white">
                        <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold leading-snug text-gray-900">{handbook.title}</p>
                        <p className="mt-1 text-xs text-gray-600">{handbook.details}</p>
                        {handbook.offlineCached && (
                            <span className="mt-2 inline-block rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-800">
                                Offline Cached
                            </span>
                        )}
                    </div>
                </div>

                {/* TODO: open the clinical reader once it exists; the library is the closest page for now */}
                <Link
                    href="/resources"
                    className="mt-4 inline-block text-sm font-semibold text-[#194611] hover:underline"
                >
                    Open Clinical Reader →
                </Link>
            </section>

            <section className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
                <span className="rounded-lg bg-[#FDD028] p-2 text-gray-900">
                    <GraduationCap className="h-5 w-5" />
                </span>
                <div>
                    <p className="text-sm font-semibold text-gray-900">Need to certify a clinical skill?</p>
                    <p className="mt-1 text-xs text-gray-700">
                        Finish the module quiz, then ask your mentor to verify your skill.
                    </p>
                    <Link
                        href="/clinical-skills"
                        className="mt-2 inline-block text-xs font-semibold text-[#194611] hover:underline"
                    >
                        Go to Clinical Skills ›
                    </Link>
                </div>
            </section>
        </aside>
    );
}