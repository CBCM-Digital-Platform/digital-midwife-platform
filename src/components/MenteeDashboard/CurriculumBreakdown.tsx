import type { Chapter, CurriculumSummary } from "@/types/mentee-dashboard";
import { ChapterCard } from "./ChapterCard";

export function CurriculumBreakdown({
    chapters,
    summary,
}: {
    chapters: Chapter[];
    summary: CurriculumSummary;
}) {
    return (
        <section>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Curriculum Breakdown by Chapters & Modules</h2>
                    <p className="mt-1 max-w-xl text-sm text-gray-600">
                        Each chapter houses dedicated clinical modules marked through verification competence.
                    </p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {summary.chaptersTotal} Chapters • {summary.modulesTotal} Clinical Modules
                </span>
            </div>

            <div className="space-y-4">
                {chapters.map((chapter) => (
                    <ChapterCard key={chapter.id} chapter={chapter} />
                ))}
            </div>
        </section>
    );
}