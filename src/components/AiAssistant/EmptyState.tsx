import { Activity, Brain, FileText, Smile, SquarePlus, type LucideIcon } from "lucide-react";
import type { Suggestion, SuggestionIcon } from "@/types/assistant";

const ICONS: Record<SuggestionIcon, { icon: LucideIcon; color: string }> = {
    ctg: { icon: Activity, color: "text-[#194611]" },
    neonatal: { icon: Smile, color: "text-amber-600" },
    medication: { icon: SquarePlus, color: "text-[#2F5D2A]" },
    literature: { icon: FileText, color: "text-[#8B2F5C]" },
};

interface Props {
    suggestions: Suggestion[];
    onPick: (question: string) => void;
    disabled: boolean;
}

export function EmptyState({ suggestions, onPick, disabled }: Props) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#DDE3DA] text-[#194611]">
                <Brain className="h-8 w-8" />
            </span>
            <h1 className="mt-5 text-2xl font-bold text-gray-900">How can I assist your practice today?</h1>
            <p className="mt-2 max-w-md text-sm text-gray-600">
                Access peer-reviewed evidence, clinical guidelines, and case consultation support.
            </p>

            <ul className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                {suggestions.map((s) => {
                    const { icon: Icon, color } = ICONS[s.icon];
                    return (
                        <li key={s.id}>
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={() => onPick(s.title)}
                                className="flex h-full w-full flex-col items-start gap-1.5 rounded-xl border border-gray-200 bg-[#F3F5EC] p-4 text-left transition hover:border-[#194611]/40 hover:bg-[#ECEFE3] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Icon className={`h-4 w-4 ${color}`} />
                                <span className="text-sm font-semibold text-gray-900">{s.title}</span>
                                <span className="text-xs text-gray-600">{s.subtitle}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}