"use client";

import { useMemo } from "react";
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Assignment, AssignmentStatus } from "@/types/assignment";
import Avatar from "./Avatar";

interface AssignmentTableProps {
    data: Assignment[];
    compact?: boolean;
    onRowClick?: (assignment: Assignment) => void;
}

const STATUS_STYLES: Record<AssignmentStatus, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-green-100 text-green-800" },
    pending: { label: "Pending", className: "bg-amber-100 text-amber-800" },
};

function formatAssignedDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        timeZone: "UTC",
    });
}

export default function AssignmentTable({ data, compact = false, onRowClick }: AssignmentTableProps) {
    const columns = useMemo<ColumnDef<Assignment>[]>(
        () => [
            {
                id: "mentor",
                header: "Mentor",
                cell: ({ row }) => {
                    const { mentor } = row.original;
                    return (
                        <div className="flex items-center gap-3">
                            <Avatar person={mentor} />
                            <div>
                                <p className="font-medium text-gray-900">{mentor.name}</p>
                                {!compact && (
                                    <p className="text-xs text-gray-500">
                                        {mentor.subtitle} • ID:{" "}
                                        <span className="font-medium text-[#194611]">{mentor.code}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                },
            },
            {
                id: "mentee",
                header: "Mentee",
                cell: ({ row }) => {
                    const { mentee } = row.original;
                    return (
                        <div className="flex items-center gap-3">
                            <Avatar person={mentee} />
                            <div>
                                <p className="font-medium text-gray-900">{mentee.name}</p>
                                {!compact && <p className="text-xs text-gray-500">{mentee.subtitle}</p>}
                            </div>
                        </div>
                    );
                },
            },
            { accessorKey: "facility", header: "Assigned Facility" },
            {
                accessorKey: "thematicDomain",
                header: "Thematic Domain",
                cell: ({ getValue }) => (
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs">{getValue<string>()}</span>
                ),
            },
            {
                accessorKey: "assignedDate",
                header: "Assigned Date",
                cell: ({ row }) => (
                    <div>
                        <p>{formatAssignedDate(row.original.assignedDate)}</p>
                        {!compact && <p className="text-xs text-gray-500">{row.original.dateNote}</p>}
                    </div>
                ),
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ getValue }) => {
                    const style = STATUS_STYLES[getValue<AssignmentStatus>()];
                    return (
                        <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}
                        >
                            {style.label}
                        </span>
                    );
                },
            },
        ],
        [compact],
    );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } },
    });

    const { pageIndex, pageSize } = table.getState().pagination;
    const total = data.length;
    const from = total === 0 ? 0 : pageIndex * pageSize + 1;
    const to = Math.min((pageIndex + 1) * pageSize, total);

    return (
        <div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        {table.getHeaderGroups().map((group) => (
                            <tr key={group.id} className="border-b border-gray-200 text-xs text-gray-500">
                                {group.headers.map((header) => (
                                    <th key={header.id} className="px-4 py-3 font-medium">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                                    No assignments match these filters. Try resetting them.
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    onClick={() => onRowClick?.(row.original)}
                                    className={`border-b border-gray-100 ${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""
                                        }`}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className={`px-4 ${compact ? "py-2" : "py-4"}`}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-gray-600">
                <p>
                    Showing {from}–{to} of {total} assignments
                </p>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                        Rows per page:
                        <select
                            value={pageSize}
                            onChange={(e) => table.setPageSize(Number(e.target.value))}
                            className="h-8 rounded border border-gray-200 bg-white px-2"
                        >
                            {[10, 20, 50].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            aria-label="Previous page"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-40"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <span className="px-2">
                            Page {table.getPageCount() === 0 ? 0 : pageIndex + 1} of {table.getPageCount()}
                        </span>
                        <button
                            type="button"
                            aria-label="Next page"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-40"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}