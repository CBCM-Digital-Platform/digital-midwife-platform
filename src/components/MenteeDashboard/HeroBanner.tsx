import Link from "next/link";
import type { ResumeTarget } from "@/types/mentee-dashboard";

export function HeroBanner({
    displayName,
    resume,
}: {
    displayName: string;
    resume: ResumeTarget | null;
}) {
    const firstName = displayName.trim().split(/\s+/)[0] || displayName;

    return (
        <section className="rounded-2xl bg-gradient-to-br from-[#194611] to-[#2F5D2A] p-6 text-white shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="min-w-0 max-w-2xl">
                    {resume && (
                        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FDD028]" />
                            Active Clinical Pathway • Chapter {resume.chapterNumber} of {resume.chaptersTotal}
                        </p>
                    )}

                    <h1 className="mt-3 text-3xl font-bold tracking-tight">Welcome back, {firstName}!</h1>

                    <p className="mt-2 text-sm text-white/80">
                        {resume
                            ? `You are currently completing Chapter ${resume.chapterNumber}: ${resume.chapterTitle}.${resume.verificationPending ? " Your next competency verification is pending." : ""
                            }`
                            : "You have no lesson in progress right now. Open your chapters to pick the next one."}
                    </p>

                    {resume && (
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-black/20 px-4 py-3">
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#FDD028]">
                                    Next up in Module {resume.moduleNumber}
                                </p>
                                <p className="text-sm font-semibold">
                                    Lesson {resume.lessonNumber}: {resume.lessonTitle} ({resume.progressPct}% Complete)
                                </p>
                            </div>
                            <span className="shrink-0 rounded bg-white/10 px-2.5 py-1 text-xs">
                                Est. ~{resume.minutesLeft} min left
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-52">
                    {/* TODO: deep-link to the lesson once the lesson player exists */}
                    {resume && (
                        <Link
                            href="/learning"
                            className="rounded-lg bg-[#FDD028] px-5 py-3 text-center text-sm font-bold text-gray-900 hover:bg-[#f0c41f]"
                        >
                            Resume Lesson
                        </Link>
                    )}
                    <Link
                        href="/learning"
                        className="rounded-lg bg-white/10 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-white/20"
                    >
                        View All Chapters
                    </Link>
                </div>
            </div>
        </section>
    );
}