import type { CycleStatus } from "@/types/cycle";

const STYLES: Record<CycleStatus, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    PLANNING: "bg-amber-100 text-amber-700",
    COMPLETED: "bg-gray-100 text-gray-600",
};

export default function CycleStatusBadge({ status }: { status: CycleStatus }) {
    return (
        <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${STYLES[status]}`}
        >
            {status}
        </span>
    );
}