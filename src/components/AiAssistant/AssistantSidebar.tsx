import Link from "next/link";
import { BookOpen, Brain, FlaskConical, History, Library } from "lucide-react";

const TAGS = [
    { label: "Guidelines", style: "bg-[#E3EBDD] text-[#3D5A37]" },
    { label: "Diagnostics", style: "bg-[#E8E4C8] text-[#6B5E1F]" },
    { label: "Literature", style: "bg-[#F1E1EA] text-[#8B2F5C]" },
];

// TODO: point these at real library collections once they exist
const LIBRARY = [
    { label: "WHO Guidelines", icon: BookOpen, href: "/resources" },
    { label: "Cochrane Reviews", icon: FlaskConical, href: "/resources" },
];

interface Props {
    recentQueries: string[];
    onPick: (query: string) => void;
    disabled: boolean;
}

export function AssistantSidebar({ recentQueries, onPick, disabled }: Props) {
    return (
        <aside className="hidden min-h-0 flex-col gap-5 rounded-2xl border border-gray-200 bg-[#EEF0E6] p-4 lg:flex">
            <div className="rounded-xl bg-white p-5 text-center shadow-xs">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#2F5D2A] text-white">
                    <Brain className="h-6 w-6" />
                </span>
                <h2 className="mt-3 text-lg font-semibold text-[#194611]">Clinical Assistant</h2>
                <p className="text-xs text-gray-600">Evidence-based clinical support</p>
                <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {TAGS.map((tag) => (
                        <li
                            key={tag.label}
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tag.style}`}
                        >
                            {tag.label}
                        </li>
                    ))}
                </ul>
            </div>

            <section className="min-h-0 flex-1 overflow-y-auto">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <History className="h-4 w-4" />
                    Recent Queries
                </h3>
                {recentQueries.length === 0 ? (
                    <p className="text-xs text-gray-500">No recent queries yet.</p>
                ) : (
                    <ul className="space-y-0.5">
                        {recentQueries.map((query) => (
                            <li key={query}>
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => onPick(query)}
                                    className="w-full rounded-md px-2 py-2 text-left text-sm text-gray-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {query}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Library className="h-4 w-4" />
                    Clinical Resource Library
                </h3>
                <ul className="space-y-2">
                    {LIBRARY.map((item) => {
                        const Icon = item.icon;
                        return (
                            <li key={item.label}>
                                <Link
                                    href={item.href}
                                    className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-green-50"
                                >
                                    <Icon className="h-4 w-4 text-[#194611]" />
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </section>
        </aside>
    );
}