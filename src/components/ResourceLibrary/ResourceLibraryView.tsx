"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Star, AlertCircle, PackageOpen, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Resource, ResourceCategory } from "@/types/resource";
import { ResourceCard } from "./ResourceCard";
import { saveStarredResourceId, getStarredResourceIds } from "@/services/resource-library.service";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";

type CategoryFilter = "ALL" | ResourceCategory;

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
    { id: "ALL", label: "All Resources" },
    { id: "CLINICAL_GUIDELINES", label: "Clinical Guidelines" },
    { id: "MENTOR_TIPS", label: "Mentor Tips" },
    { id: "ADOLESCENT_HEALTH", label: "Adolescent Health" },
    { id: "TRAINING_VIDEOS", label: "Training Videos" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function deriveKindAndCategory(
    type?: string,
    title: string = ""
): { kind: Resource["kind"]; category: ResourceCategory } {
    const t = (type || "").toLowerCase();
    const lowerTitle = title.toLowerCase();

    let kind: Resource["kind"] = "MANUAL";
    if (t === "video") {
        kind = "VIDEO";
    } else if (
        lowerTitle.includes("guide") ||
        lowerTitle.includes("protocol") ||
        lowerTitle.includes("checklist")
    ) {
        kind = "GUIDELINE";
    } else if (
        lowerTitle.includes("tip") ||
        lowerTitle.includes("feedback") ||
        lowerTitle.includes("effective")
    ) {
        kind = "TIP";
    }

    let category: ResourceCategory = "CLINICAL_GUIDELINES";
    if (kind === "VIDEO" || t === "video") {
        category = "TRAINING_VIDEOS";
    } else if (
        lowerTitle.includes("adolescent") ||
        lowerTitle.includes("teen") ||
        lowerTitle.includes("contraceptive")
    ) {
        category = "ADOLESCENT_HEALTH";
    } else if (
        kind === "TIP" ||
        lowerTitle.includes("mentor") ||
        lowerTitle.includes("mentee") ||
        lowerTitle.includes("preceptor")
    ) {
        category = "MENTOR_TIPS";
    }

    return { kind, category };
}

function normalizeResource(raw: any, starredIds: Set<string>): Resource {
    const id = String(raw.id ?? raw._id ?? "");
    const title = raw.title || raw.name || "Clinical Resource";
    const { kind, category } = deriveKindAndCategory(raw.type ?? raw.file_type, title);

    const fileId = raw.file_id ?? raw.fileId ?? raw.file?.id;
    let url = raw.url || "";
    if (!url) {
        const baseUrl = (
            process.env.NEXT_PUBLIC_API_URL || "https://cbcm-backend-tntq.onrender.com/api/v1"
        ).replace(/\/+$/, "");
        const base = baseUrl.endsWith("/api/v1") ? baseUrl : `${baseUrl}/api/v1`;
        if (id) {
            url = `${base}/hierarchical-resources/${id}/content`;
        } else if (fileId) {
            url = `${base}/uploads/${fileId}/content`;
        } else {
            url = "#";
        }
    }

    const sizeBytes = raw.file?.sizeBytes ?? raw.file?.size_bytes ?? raw.size_bytes;
    const sizeMb = sizeBytes ? Number((sizeBytes / (1024 * 1024)).toFixed(1)) : undefined;

    const description =
        raw.description ||
        (raw.thematicArea?.name
            ? `Resource module for ${raw.thematicArea.name} clinical training.`
            : "Authorized clinical guideline and practice manual.");

    const updatedAt = raw.updated_at
        ? new Date(raw.updated_at).toISOString().slice(0, 10)
        : raw.created_at
        ? new Date(raw.created_at).toISOString().slice(0, 10)
        : "2024-01-01";

    return {
        id,
        title,
        description,
        kind,
        category,
        updatedAt,
        sizeMb,
        durationLabel: kind === "VIDEO" ? (raw.duration_label ?? "—") : undefined,
        tag: kind === "VIDEO" ? "Training" : undefined,
        starred: starredIds.has(id),
        url,
    };
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
    return (
        <div className="animate-pulse rounded-xl border border-gray-100 bg-white p-5 space-y-3">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-5 w-3/4 rounded bg-gray-200" />
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-3 w-2/3 rounded bg-gray-100" />
            <div className="h-3 w-16 rounded bg-gray-100 mt-4" />
        </div>
    );
}

// ─── main view ────────────────────────────────────────────────────────────────

export function ResourceLibraryView() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<CategoryFilter>("ALL");

    const fetchResources = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get<any>(`${ENDPOINTS.RESOURCES.BASE}?limit=100`);

            // Unwrap: { data: [...] } | { resources: [...] } | plain array
            const rawList: any[] = Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res?.resources)
                ? res.resources
                : Array.isArray(res)
                ? res
                : [];

            const starredIds = getStarredResourceIds();
            setResources(rawList.map((r) => normalizeResource(r, starredIds)));
        } catch (err: any) {
            console.error("Failed to load resources:", err);
            setError(err?.message || "Failed to load resources from the server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

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
            {/* Header */}
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

            {/* Category filters */}
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

            {/* Loading skeleton */}
            {loading && (
                <div className={grid}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            )}

            {/* Error state */}
            {!loading && error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center space-y-3">
                    <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
                    <p className="text-sm font-medium text-red-700">{error}</p>
                    <button
                        onClick={fetchResources}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-200 transition"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Try again
                    </button>
                </div>
            )}

            {/* Empty state — backend returned nothing */}
            {!loading && !error && resources.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center space-y-3">
                    <PackageOpen className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="text-sm font-medium text-gray-600">No resources available yet.</p>
                    <p className="text-xs text-gray-400">
                        Resources uploaded by the Super Admin will appear here.
                    </p>
                </div>
            )}

            {/* No search/filter match */}
            {!loading && !error && resources.length > 0 && matching.length === 0 && (
                <p className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
                    No resources match your search.
                </p>
            )}

            {/* Resource grid */}
            {!loading && !error && matching.length > 0 && (
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
