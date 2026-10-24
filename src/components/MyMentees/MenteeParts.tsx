import { cn } from "@/lib/utils";
import type { CompetencyLevel } from "@/types/my-mentee";

const AVATAR_COLORS = [
    "bg-[#8B2F5C]",
    "bg-[#194611]",
    "bg-[#1D4E89]",
    "bg-[#B7791F]",
    "bg-[#5B3E96]",
];

function initials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

function colorFor(name: string) {
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export function MenteeAvatar({
    name,
    avatarUrl,
    className,
}: {
    name: string;
    avatarUrl?: string | null;
    className?: string;
}) {
    if (avatarUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={avatarUrl}
                alt={name}
                className={cn("h-10 w-10 shrink-0 rounded-full object-cover", className)}
            />
        );
    }

    return (
        <span
            aria-hidden="true"
            className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
                colorFor(name),
                className
            )}
        >
            {initials(name)}
        </span>
    );
}

export const LEVEL_LABEL: Record<CompetencyLevel, string> = {
    NOVICE: "Novice",
    QUALIFIED: "Qualified",
    ADVANCED: "Advanced",
};

const LEVEL_STYLE: Record<CompetencyLevel, string> = {
    NOVICE: "border-gray-300 bg-gray-100 text-gray-600",
    QUALIFIED: "border-green-200 bg-green-50 text-green-700",
    ADVANCED: "border-amber-200 bg-amber-50 text-amber-800",
};

export function CompetencyBadge({ level }: { level: CompetencyLevel }) {
    return (
        <span
            className={cn(
                "inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium",
                LEVEL_STYLE[level]
            )}
        >
            {LEVEL_LABEL[level]}
        </span>
    );
}

export function formatSessionDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        timeZone: "UTC",
    });
}

export function LastSession({ iso, overdue }: { iso: string; overdue: boolean }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-gray-800">
            {overdue && <span className="h-1.5 w-1.5 rounded-full bg-red-600" />}
            {formatSessionDate(iso)}
            {overdue && <span className="text-xs text-red-600">(Overdue)</span>}
        </span>
    );
}