"use client";

import { useMemo, useState } from "react";
import {
    Building2,
    Calendar,
    CalendarClock,
    FileSpreadsheet,
    FileText,
    Layers,
    RotateCcw,
} from "lucide-react";
import type { ReportPeriod, ReportsData } from "@/types/report";
import ReportKpiCards from "./ReportKpiCards";
import MonthlyTrends from "./MonthlyTrends";
import CohortTable from "./CohortTable";

const PERIODS: { value: ReportPeriod; label: string }[] = [
    { value: "DAILY", label: "Daily" },
    { value: "WEEKLY", label: "Weekly" },
    { value: "MONTHLY", label: "Monthly" },
    { value: "QUARTERLY", label: "Quarterly" },
];

export default function ReportsView({ data }: { data: ReportsData }) {
    const [period, setPeriod] = useState<ReportPeriod>("MONTHLY");
    const [windowStart, setWindowStart] = useState(data.windowStart);
    const [windowEnd, setWindowEnd] = useState(data.windowEnd);
    const [facility, setFacility] = useState("ALL");
    const [domain, setDomain] = useState("ALL");

    const facilities = useMemo(
        () => Array.from(new Set(data.cohorts.map((c) => c.facility))).sort(),
        [data.cohorts]
    );

    const records = useMemo(
        () =>
            data.cohorts.filter(
                (c) =>
                    (facility === "ALL" || c.facility === facility) &&
                    (domain === "ALL" || c.domain === domain)
            ),
        [data.cohorts, facility, domain]
    );

    const reset = () => {
        setPeriod("MONTHLY");
        setWindowStart(data.windowStart);
        setWindowEnd(data.windowEnd);
        setFacility("ALL");
        setDomain("ALL");
    };

    const pill =
        "flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm";
    const selectClass =
        "appearance-none bg-transparent pr-1 text-sm font-medium text-gray-800 outline-none";

    return (
        <div className="space-y-6 p-6">
            {/* Title row */}
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="mb-2 inline-flex items-center gap-2 rounded bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-gray-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                        AUDIT & COMPLIANCE TIER
                        <span className="font-medium text-gray-500">RPT-CYCLE-2024</span>
                    </p>
                    <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                    <p className="mt-1 max-w-xl text-sm text-gray-500">
                        Generate, audit, and export longitudinal mentorship performance and clinical cohort
                        records.
                    </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <p className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500">
                        Data Refreshed:{" "}
                        <span className="font-semibold text-gray-900">{data.refreshedAt}</span>
                    </p>
                    <button
                        type="button"
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                    // TODO: open schedule automated delivery dialog
                    >
                        <CalendarClock className="h-4 w-4 text-[#0B5D3B]" />
                        Schedule Automated Delivery
                    </button>
                </div>
            </header>

            {/* Filters + export */}
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className={pill}>
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <div>
                                    <p className="text-[10px] font-semibold tracking-wide text-gray-500">
                                        Reporting Window
                                    </p>
                                    <div className="flex items-center gap-1 text-xs font-medium text-gray-800">
                                        <input
                                            type="date"
                                            value={windowStart}
                                            max={windowEnd}
                                            onChange={(e) => setWindowStart(e.target.value)}
                                            className="bg-transparent outline-none"
                                        />
                                        <span className="text-gray-400">-</span>
                                        <input
                                            type="date"
                                            value={windowEnd}
                                            min={windowStart}
                                            onChange={(e) => setWindowEnd(e.target.value)}
                                            className="bg-transparent outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
                                {PERIODS.map((p) => (
                                    <button
                                        key={p.value}
                                        type="button"
                                        aria-pressed={period === p.value}
                                        onClick={() => setPeriod(p.value)}
                                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${period === p.value
                                                ? "bg-[#0B5D3B] text-white"
                                                : "text-gray-600 hover:bg-gray-100"
                                            }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <label className={pill}>
                                <Building2 className="h-4 w-4 text-gray-500" />
                                <select
                                    value={facility}
                                    onChange={(e) => setFacility(e.target.value)}
                                    className={selectClass}
                                >
                                    <option value="ALL">All Facilities ({facilities.length} Nodes)</option>
                                    {facilities.map((f) => (
                                        <option key={f} value={f}>
                                            {f}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className={pill}>
                                <Layers className="h-4 w-4 text-gray-500" />
                                <select
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    className={selectClass}
                                >
                                    <option value="ALL">
                                        All Thematic Areas ({data.thematicAreas.length} Domains)
                                    </option>
                                    {data.thematicAreas.map((a) => (
                                        <option key={a} value={a}>
                                            {a}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <button
                                type="button"
                                aria-label="Reset filters"
                                onClick={reset}
                                className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            className="flex items-center gap-2 rounded-lg bg-[#0B5D3B] px-4 py-2 text-sm font-medium text-white hover:bg-[#094d31]"
                        // TODO: export PDF
                        >
                            <FileText className="h-4 w-4" />
                            Export PDF
                        </button>
                        <button
                            type="button"
                            className="flex items-center gap-2 rounded-lg bg-[#E0B52B] px-4 py-2 text-sm font-medium text-gray-900 hover:bg-[#caa226]"
                        // TODO: export Excel
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Export Excel
                        </button>
                    </div>
                </div>
            </section>

            <ReportKpiCards kpis={data.kpis} />
            <MonthlyTrends monthly={data.monthly} domains={data.domains} />
            <CohortTable records={records} />
        </div>
    );
}