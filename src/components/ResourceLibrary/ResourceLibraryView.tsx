"use client";

import { useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Resource, ResourceCategory } from "@/types/resource";
import { ResourceCard } from "./ResourceCard";
import { saveStarredResourceId } from "@/services/resource-library.service";

type CategoryFilter = "ALL" | ResourceCategory;

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
    { id: "ALL", label: "All Resources" },
    { id: "CLINICAL_GUIDELINES", label: "Clinical Guidelines" },
    { id: "MENTOR_TIPS", label: "Mentor Tips" },
    { id: "ADOLESCENT_HEALTH", label: "Adolescent Health" },
    { id: "TRAINING_VIDEOS", label: "Training Videos" },
];

export function ResourceLibraryView({ resources: initial }: { resources: Resource[] }) {
    const [resources, setResources] = useState(initial);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<CategoryFilter>("ALL");

    const matching = useMemo(() => {
        const q = search.trim().toLowerCase();
        return resources.filter(
            (r) =>
                (category === "ALL" || r.category === category) &&
                (!q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q))
        );
    }, [resources, category, search]);

    const starred = matching.filter((r) => r.starred);
    const others = matching.filter((r) => !r.starred);

    // Persist each user's starred resources
    const toggleStar = (id: string) =>
        setResources((prev) =>
            prev.map((r) => {
                if (r.id === id) {
                    const nextStarred = !r.starred;
                    saveStarredResourceId(id, nextStarred);
                    return { ...r, starred: nextStarred };
                }
                return r;
            })
        );

    const grid = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#194611]">Resource Library</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Clinical guidelines, training materials, and PDF manuals.
                    </p>
                </div>

                <label className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-[#EEF0E6] px-3 py-2.5 sm:w-72">
                    <Search className="h-4 w-4 text-gray-500" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search resources..."
                        aria-label="Search resources"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-gray-500"
                    />
                </label>
            </div>

            <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                    <button
                        key={c.id}
                        type="button"
                        aria-pressed={category === c.id}
                        onClick={() => setCategory(c.id)}
                        className={cn(
                            "rounded-full border px-4 py-1.5 text-xs font-semibold transition",
                            category === c.id
                                ? "border-[#194611] bg-[#194611] text-white"
                                : "border-gray-200 bg-[#EEF0E6] text-gray-800 hover:bg-gray-200"
                        )}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {matching.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
                    No resources match your search.
                </p>
            ) : (
                <>
                    {starred.length > 0 && (
                        <section>
                            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
                                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                Starred Resources
                            </h2>
                            <div className={grid}>
                                {starred.map((r) => (
                                    <ResourceCard key={r.id} resource={r} onToggleStar={toggleStar} />
                                ))}
                            </div>
                        </section>
                    )}

                    {others.length > 0 && (
                        <section>
                            <h2 className="mb-4 text-xl font-semibold text-gray-900">
                                {starred.length > 0 ? "More Resources" : "All Resources"}
                            </h2>
                            <div className={grid}>
                                {others.map((r) => (
                                    <ResourceCard key={r.id} resource={r} onToggleStar={toggleStar} />
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}