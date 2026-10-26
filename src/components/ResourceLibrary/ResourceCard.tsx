import {
    BookOpen,
    Calendar,
    Clock,
    FileText,
    Lightbulb,
    PlayCircle,
    Star,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Resource, ResourceKind } from "@/types/resource";

const KIND: Record<
    ResourceKind,
    { label: string; icon: LucideIcon; iconBox: string; badge: string }
> = {
    GUIDELINE: {
        label: "Guideline",
        icon: FileText,
        iconBox: "bg-[#2F5D2A] text-white",
        badge: "bg-green-50 text-green-800",
    },
    MANUAL: {
        label: "Manual",
        icon: BookOpen,
        iconBox: "bg-[#B7791F] text-white",
        badge: "bg-amber-50 text-amber-800",
    },
    TIP: {
        label: "Tip",
        icon: Lightbulb,
        iconBox: "bg-[#5B3E96] text-white",
        badge: "bg-purple-50 text-purple-800",
    },
    VIDEO: {
        label: "Video",
        icon: PlayCircle,
        iconBox: "bg-[#8B2F5C] text-white",
        badge: "bg-pink-50 text-[#8B2F5C]",
    },
};

function formatMonthYear(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });
}

export function ResourceCard({
    resource: r,
    onToggleStar,
}: {
    resource: Resource;
    onToggleStar: (id: string) => void;
}) {
    const kind = KIND[r.kind];
    const Icon = kind.icon;
    const isVideo = r.kind === "VIDEO";
    const external = r.url !== "#";

    return (
        <article className="relative flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-[#194611]/40 hover:shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span
                        className={cn("flex h-9 w-9 items-center justify-center rounded-lg", kind.iconBox)}
                    >
                        <Icon className="h-5 w-5" />
                    </span>
                    <span className={cn("rounded px-2 py-0.5 text-[11px] font-semibold", kind.badge)}>
                        {kind.label}
                    </span>
                </div>

                <button
                    type="button"
                    aria-pressed={r.starred}
                    aria-label={r.starred ? `Remove ${r.title} from starred` : `Star ${r.title}`}
                    onClick={() => onToggleStar(r.id)}
                    className="relative z-10 rounded p-1 hover:bg-gray-100"
                >
                    <Star
                        className={cn("h-5 w-5", r.starred ? "fill-yellow-400 text-yellow-400" : "text-gray-400")}
                    />
                </button>
            </div>

            <h3 className="mt-4 text-lg font-semibold leading-snug text-gray-900">
                <a
                    href={r.url}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="after:absolute after:inset-0 hover:underline focus-visible:outline-2 focus-visible:outline-[#194611]"
                >
                    {r.title}
                </a>
            </h3>
            <p className="mb-4 mt-1 line-clamp-2 text-sm text-gray-600">{r.description}</p>

            <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                    {isVideo ? <Clock className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                    {isVideo ? r.durationLabel : formatMonthYear(r.updatedAt)}
                </span>
                <span>
                    {isVideo ? r.tag : r.sizeMb !== undefined ? `${r.sizeMb.toFixed(1)} MB` : ""}
                </span>
            </div>
        </article>
    );
}