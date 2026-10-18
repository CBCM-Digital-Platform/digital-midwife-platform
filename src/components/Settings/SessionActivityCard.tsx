import { Calendar, History, MapPin, MonitorSmartphone } from "lucide-react";
import type { SessionInfo } from "@/types/settings";

function formatLastLogin(iso: string) {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    });
    const time = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
    });
    return `${date} - ${time}`;
}

export default function SessionActivityCard({
    lastLogin,
    sessions,
}: {
    lastLogin: string;
    sessions: SessionInfo[];
}) {
    return (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <History className="h-5 w-5 text-[#0B5D3B]" />
                Session Activity
            </h2>

            <div className="rounded-lg bg-gray-100 px-4 py-3">
                <p className="text-[10px] font-semibold tracking-wide text-gray-500">LAST LOGIN</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-900">
                    <Calendar className="h-4 w-4 text-[#0B5D3B]" />
                    {formatLastLogin(lastLogin)}
                </p>
            </div>

            <p className="mb-2 mt-5 text-[10px] font-semibold tracking-wide text-gray-500">
                ACTIVE SESSIONS
            </p>
            <ul className="space-y-2">
                {sessions.map((s) => (
                    <li
                        key={s.id}
                        className={`flex gap-3 rounded-lg border border-gray-200 p-3 ${s.current ? "border-l-4 border-l-green-300" : ""
                            }`}
                    >
                        <MonitorSmartphone className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                        <div>
                            <p className="text-sm font-semibold text-gray-900">{s.label}</p>
                            <p className="text-xs text-gray-600">
                                {s.os} • {s.browser}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="h-3 w-3" />
                                {s.location}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}