"use client";

import { useMemo, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Download,
    Eye,
    Printer,
    Search,
} from "lucide-react";
import type { CohortRecord, CohortStatus } from "@/types/report";

const STATUS_LABEL: Record<CohortStatus, string> = {
    COMPLETED: "Completed",
    IN_PROGRESS: "In Progress",
    SCHEDULED: "Scheduled",
};

const STATUS_STYLE: Record<CohortStatus, string> = {
    COMPLETED: "bg-green-100 text-green-800",
    IN_PROGRESS: "bg-yellow-100 text-amber-800",
    SCHEDULED: "bg-gray-100 text-gray-600",
};

const DOMAIN_STYLE: Record<string, string> = {
    "Maternal & Neonatal": "bg-green-100 text-green-800",
    "Pediatric Emergency ICU": "bg-yellow-100 text-amber-800",
    "Infection Prevention": "bg-emerald-50 text-emerald-800",
    "Oncology & Palliative": "bg-gray-100 text-gray-700",
};

function getDelta(r: CohortRecord): number | null {
    if (r.preScore === null || r.postScore === null) return null;
    return Math.round((r.postScore - r.preScore) * 10) / 10;
}

const pct = (v: number | null) => (v === null ? "-" : `${v.toFixed(1)}%`);

function downloadCsv(rows: CohortRecord[]) {
    const header = [
        "Record ID",
        "Facility",
        "Thematic Domain",
        "Lead Mentor",
        "Mentees",
        "Sessions",
        "Pre-Score",
        "Post-Score",
        "Delta",
        "Status",
    ];
    const lines = rows.map((r) =>
        [
            r.id,
            r.facility,
            r.domain,
            r.leadMentor,
            r.mentees,
            r.sessions,
            r.preScore ?? "",
            r.postScore ?? "",
            getDelta(r) ?? "",
            STATUS_LABEL[r.status],
        ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
        type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cohort-records.csv";
    a.click();
    URL.revokeObjectURL(url);
}

export default function CohortTable({ records }: { records: CohortRecord[] }) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return records;
        return records.filter((r) =>
            [r.id, r.facility, r.leadMentor, r.domain].some((v) => v.toLowerCase().includes(q))
        );
    }, [records, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const visible = filtered.slice(startIndex, startIndex + pageSize);

    const pageBtn =
        "rounded p-1 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40";

    return (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        Detailed Facility & Cohort Performance Records
                    </h2>
                    <p className="text-sm text-gray-500">
                        Cross-sectional logs for audit trails, mentor verification, and programmatic
                        evaluation.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5">
                        <Search className="h-4 w-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search mentor, cohort ID, facility..."
                            className="w-56 bg-transparent text-sm outline-none placeholder:text-gray-400"
                        />
                    </label>
                    <button
                        type="button"
                        onClick={() => downloadCsv(filtered)}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <Download className="h-4 w-4" />
                        Download CSV
                    </button>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <Printer className="h-4 w-4" />
                        Print
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-sm">
                    <thead className="bg-green-50 text-[11px] font-semibold tracking-wide text-gray-600">
                        <tr>
                            <th className="px-4 py-3">COHORT / RECORD ID</th>
                            <th className="px-4 py-3">FACILITY NAME</th>
                            <th className="px-4 py-3">THEMATIC DOMAIN</th>
                            <th className="px-4 py-3">LEAD MENTOR</th>
                            <th className="px-4 py-3">MENTEES</th>
                            <th className="px-4 py-3">SESSIONS</th>
                            <th className="px-4 py-3">PRE-SCORE</th>
                            <th className="px-4 py-3">POST-SCORE</th>
                            <th className="px-4 py-3">DELTA</th>
                            <th className="px-4 py-3">STATUS</th>
                            <th className="px-4 py-3 text-right">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {visible.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="px-4 py-10 text-center text-gray-500">
                                    No cohort records match these filters.
                                </td>
                            </tr>
                        ) : (
                            visible.map((r) => {
                                const delta = getDelta(r);
                                return (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-semibold text-[#0B5D3B]">{r.id}</td>
                                        <td className="px-4 py-3 text-gray-900">{r.facility}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded px-2 py-1 text-xs font-medium ${DOMAIN_STYLE[r.domain] ?? "bg-gray-100 text-gray-700"
                                                    }`}
                                            >
                                                {r.domain}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{r.leadMentor}</td>
                                        <td className="px-4 py-3 text-gray-900">{r.mentees}</td>
                                        <td className="px-4 py-3 text-gray-900">{r.sessions}</td>
                                        <td className="px-4 py-3 text-gray-700">{pct(r.preScore)}</td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">{pct(r.postScore)}</td>
                                        <td
                                            className={`px-4 py-3 font-semibold ${delta === null ? "text-gray-400" : "text-green-700"
                                                }`}
                                        >
                                            {delta === null ? "-" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[r.status]}`}
                                            >
                                                {STATUS_LABEL[r.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2 text-gray-600">
                                                <button
                                                    type="button"
                                                    aria-label={`View ${r.id}`}
                                                    className="rounded p-1 hover:bg-gray-100"
                                                // TODO: open cohort details
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={`Download ${r.id}`}
                                                    disabled={r.status === "SCHEDULED"}
                                                    className="rounded p-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                // TODO: download this cohort report
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-green-50/40 px-5 py-3 text-xs text-gray-600">
                <div className="flex items-center gap-3">
                    <span>
                        Showing {filtered.length === 0 ? 0 : startIndex + 1}-
                        {Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} cohort
                        records
                    </span>
                    <label className="flex items-center gap-2">
                        Rows per page:
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPage(1);
                            }}
                            className="rounded border border-gray-300 bg-white px-2 py-1"
                        >
                            {[5, 10, 25].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="flex items-center gap-1">
                    <button type="button" aria-label="First page" disabled={safePage === 1} onClick={() => setPage(1)} className={pageBtn}>
                        <ChevronsLeft className="h-4 w-4" />
                    </button>
                    <button type="button" aria-label="Previous page" disabled={safePage === 1} onClick={() => setPage(safePage - 1)} className={pageBtn}>
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-2 font-medium text-gray-800">
                        Page {safePage} of {totalPages}
                    </span>
                    <button type="button" aria-label="Next page" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)} className={pageBtn}>
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <button type="button" aria-label="Last page" disabled={safePage === totalPages} onClick={() => setPage(totalPages)} className={pageBtn}>
                        <ChevronsRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </section>
    );
}