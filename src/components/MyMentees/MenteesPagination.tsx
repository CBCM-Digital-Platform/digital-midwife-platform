import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
}

function pageList(current: number, total: number): (number | "…")[] {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const wanted = new Set([1, total, current - 1, current, current + 1]);
    const sorted = Array.from(wanted)
        .filter((p) => p >= 1 && p <= total)
        .sort((a, b) => a - b);
    const out: (number | "…")[] = [];
    sorted.forEach((p, i) => {
        if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
        out.push(p);
    });
    return out;
}

export function MenteesPagination({ page, totalPages, total, pageSize, onChange }: Props) {
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    const arrow =
        "rounded p-1 text-gray-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40";

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-6 py-3 text-xs text-gray-600">
            <p>
                Showing {from} to {to} of {total} mentees
            </p>

            <nav aria-label="Pagination" className="flex items-center gap-1">
                <button
                    type="button"
                    aria-label="Previous page"
                    disabled={page === 1}
                    onClick={() => onChange(page - 1)}
                    className={arrow}
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {pageList(page, totalPages).map((p, i) =>
                    p === "…" ? (
                        <span key={`gap-${i}`} className="px-2 text-gray-400">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            aria-current={p === page ? "page" : undefined}
                            onClick={() => onChange(p)}
                            className={cn(
                                "h-7 min-w-7 rounded-md px-2 text-xs font-semibold",
                                p === page ? "bg-[#194611] text-white" : "text-gray-700 hover:bg-gray-200"
                            )}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    type="button"
                    aria-label="Next page"
                    disabled={page === totalPages}
                    onClick={() => onChange(page + 1)}
                    className={arrow}
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </nav>
        </div>
    );
}