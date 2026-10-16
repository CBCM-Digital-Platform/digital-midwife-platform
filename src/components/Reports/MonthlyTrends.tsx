"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import type { DomainBreakdown, MonthlyTrend } from "@/types/report";

type Tab = "MONTHLY" | "DOMAIN";

function Sparkline({ values }: { values: number[] }) {
    if (values.length < 2) return null;
    const w = 240;
    const h = 44;
    const pad = 5;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const points = values.map((v, i) => {
        const x = pad + (i * (w - pad * 2)) / (values.length - 1);
        const y = h - pad - ((v - min) / range) * (h - pad * 2);
        return { x, y };
    });
    const last = points[points.length - 1];

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="h-11 w-60" aria-hidden="true">
            <polyline
                points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="#0B5D3B"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx={last.x} cy={last.y} r="4" fill="#FFC72C" stroke="#0B5D3B" strokeWidth="1.5" />
        </svg>
    );
}

function ScoreBar({ value }: { value: number }) {
    return (
        <div>
            <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Avg Score</span>
                <span className="font-bold text-[#0B5D3B]">{value}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-[#0B5D3B]" style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

export default function MonthlyTrends({
    monthly,
    domains,
}: {
    monthly: MonthlyTrend[];
    domains: DomainBreakdown[];
}) {
    const [tab, setTab] = useState<Tab>("MONTHLY");

    const scores = monthly.map((m) => m.avgScore);
    const improvement =
        scores.length > 1 ? Math.round((scores[scores.length - 1] - scores[0]) * 10) / 10 : 0;

    const tabClass = (active: boolean) =>
        `rounded-md px-3 py-1.5 text-xs font-medium transition ${active ? "bg-[#0B5D3B] text-white" : "text-gray-600 hover:bg-gray-100"
        }`;

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        Periodic Mentorship Performance Trends (2024)
                    </h2>
                    <p className="text-sm text-gray-500">
                        Bi-annual progression of clinical participants, pairing velocity, and competency
                        scores.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
                        <button type="button" onClick={() => setTab("MONTHLY")} className={tabClass(tab === "MONTHLY")}>
                            Monthly Overview
                        </button>
                        <button type="button" onClick={() => setTab("DOMAIN")} className={tabClass(tab === "DOMAIN")}>
                            Breakdown by Thematic Area
                        </button>
                    </div>
                    <span className="rounded-md bg-green-50 px-2.5 py-1.5 text-xs font-medium text-gray-700">
                        Q1-Q2 (H1 2024)
                    </span>
                </div>
            </div>

            {tab === "MONTHLY" ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {monthly.map((m) => (
                        <div
                            key={m.code}
                            className={`relative rounded-lg border p-3 ${m.peak ? "border-yellow-400 bg-green-50" : "border-gray-200 bg-green-50/40"
                                }`}
                        >
                            {m.peak && (
                                <span className="absolute -top-2 right-2 rounded bg-yellow-400 px-1.5 py-0.5 text-[9px] font-bold text-gray-900">
                                    PEAK
                                </span>
                            )}
                            <div className="flex items-baseline justify-between">
                                <p className="text-sm font-bold text-gray-900">{m.month}</p>
                                <p className="text-[10px] text-gray-400">{m.code}</p>
                            </div>
                            <dl className="mt-2 space-y-1 text-xs">
                                {[
                                    ["Mentors", m.mentors],
                                    ["Mentees", m.mentees],
                                    ["Assignments", m.assignments],
                                    ["Assessments", m.assessments],
                                ].map(([label, value]) => (
                                    <div key={label} className="flex justify-between">
                                        <dt className="text-gray-500">{label}</dt>
                                        <dd className="font-semibold text-gray-900">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="mt-3">
                                <ScoreBar value={m.avgScore} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {domains.map((d) => (
                        <div key={d.domain} className="rounded-lg border border-gray-200 bg-green-50/40 p-4">
                            <p className="text-sm font-bold text-gray-900">{d.domain}</p>
                            <dl className="mt-2 space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Mentees</dt>
                                    <dd className="font-semibold text-gray-900">{d.mentees}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Sessions</dt>
                                    <dd className="font-semibold text-gray-900">{d.sessions}</dd>
                                </div>
                            </dl>
                            <div className="mt-3">
                                <ScoreBar value={d.avgScore} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-green-50 px-4 py-3">
                <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-white p-2 text-[#0B5D3B]">
                        <TrendingUp className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-gray-900">
                            {monthly.length}-Month Competency Trajectory
                        </p>
                        <p className="text-xs text-gray-500">
                            Continuous net score improvement ({improvement >= 0 ? "+" : ""}
                            {improvement}%) across all active clinical facilities.
                        </p>
                    </div>
                </div>
                <Sparkline values={scores} />
            </div>
        </section>
    );
}