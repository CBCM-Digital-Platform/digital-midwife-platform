"use client";

import React, { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  MoreVertical,
  Search,
} from "lucide-react";
import { ClinicalUser, MentorUser, MenteeUser } from "@/types/user";

interface UsersTableProps {
  role: "mentor" | "mentee";
  data: ClinicalUser[];
  onEditUser?: (user: ClinicalUser) => void;
}

// Color map for thematic area tags matching the Figma design tokens
const thematicBadgeStyles: Record<string, string> = {
  "Pediatrics & Neo": "bg-blue-50 text-blue-700 border-blue-200",
  "Emergency Care": "bg-amber-50 text-amber-800 border-amber-200",
  "Maternal & Child": "bg-rose-50 text-rose-700 border-rose-200",
  "Surgery & Critical": "bg-purple-50 text-purple-700 border-purple-200",
  "Internal Medicine": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Infectious Diseases": "bg-teal-50 text-teal-700 border-teal-200",
  Oncology: "bg-pink-50 text-pink-700 border-pink-200",
  Cardiovascular: "bg-blue-50 text-blue-800 border-blue-200",
  "Critical Care": "bg-purple-50 text-purple-800 border-purple-200",
};

export function UsersTable({ role, data, onEditUser }: UsersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedThematicArea, setSelectedThematicArea] = useState<string>("all");
  const [selectedFacility, setSelectedFacility] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // 1. DYNAMIC COLUMNS ENGINE (Based on role)
  const columns = useMemo<ColumnDef<ClinicalUser>[]>(() => {
    // A. SHARED: User Identity Column
    const identityCol: ColumnDef<ClinicalUser> = {
      id: "identity",
      header: role === "mentor" ? "MENTOR IDENTITY" : "MENTEE NAME & ID",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 ${
                user.avatarBgColor || "bg-gray-100 text-gray-700"
              }`}
            >
              {user.avatarInitials}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-gray-900">{user.name}</span>
              <span className="text-xs text-gray-500 font-mono tracking-wider">{user.systemId}</span>
            </div>
          </div>
        );
      },
    };

    // B. SHARED: Profession & Department Column
    const professionCol: ColumnDef<ClinicalUser> = {
      id: "profession",
      header: "PROFESSION / SPECIALIZATION",
      cell: ({ row }) => {
        const user = row.original;
        if (user.role === "mentor") {
          const mentor = user as MentorUser;
          return (
            <div className="flex flex-col max-w-[220px]">
              <span className="text-sm font-medium text-gray-900 leading-tight">{mentor.profession}</span>
              <span className="text-xs text-gray-500 truncate mt-0.5">{mentor.department}</span>
            </div>
          );
        } else {
          const mentee = user as MenteeUser;
          return (
            <div className="flex flex-col max-w-[220px]">
              <span className="text-sm font-medium text-gray-900 leading-tight">{mentee.profession}</span>
              <span className="text-xs text-gray-500 truncate mt-0.5">{mentee.cadreLevel}</span>
            </div>
          );
        }
      },
    };

    // C. SHARED: Affiliated Facility
    const facilityCol: ColumnDef<ClinicalUser> = {
      accessorKey: "facility",
      header: "AFFILIATED FACILITY",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm text-gray-800">
          <Building2 className="h-4 w-4 text-[#194611] shrink-0" />
          <span className="font-medium">{row.original.facility}</span>
        </div>
      ),
    };

    // D. SHARED: Thematic Area
    const thematicAreaCol: ColumnDef<ClinicalUser> = {
      accessorKey: "thematicArea",
      header: "THEMATIC AREA",
      cell: ({ row }) => {
        const area = row.original.thematicArea;
        const badgeClass = thematicBadgeStyles[area] || "bg-gray-100 text-gray-700 border-gray-200";
        return (
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${badgeClass}`}>
            {area}
          </span>
        );
      },
    };

    // E. ROLE-SPECIFIC: MENTOR Columns
    const experienceCol: ColumnDef<ClinicalUser> = {
      id: "experience",
      header: "EXP.",
      cell: ({ row }) => {
        const mentor = row.original as MentorUser;
        return <span className="text-sm font-medium text-gray-700">{mentor.yearsOfExperience} yrs</span>;
      },
    };

    const loadCol: ColumnDef<ClinicalUser> = {
      id: "load",
      header: "LOAD",
      cell: ({ row }) => {
        const mentor = row.original as MentorUser;
        return (
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            {mentor.assignedMenteesCount} Mentees
          </span>
        );
      },
    };

    // F. ROLE-SPECIFIC: MENTEE Columns
    const assignedMentorCol: ColumnDef<ClinicalUser> = {
      id: "assignedMentor",
      header: "ASSIGNED MENTOR",
      cell: ({ row }) => {
        const mentee = row.original as MenteeUser;
        const mentor = mentee.assignedMentor;
        if (mentor.status === "assigned") {
          return (
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-semibold text-xs">
                {mentor.avatarInitials}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-900">{mentor.name}</span>
                <span className="text-[11px] text-gray-500">{mentor.title}</span>
              </div>
            </div>
          );
        }
        return (
          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Pending Review
          </span>
        );
      },
    };

    const knowledgeScoreCol: ColumnDef<ClinicalUser> = {
      id: "knowledgeScore",
      header: "KNOWLEDGE SCORE",
      cell: ({ row }) => {
        const mentee = row.original as MenteeUser;
        const isRemediation = mentee.scoreTier === "Remediation";
        return (
          <div className="flex flex-col gap-1 w-32">
            <div className="flex items-center justify-between text-xs">
              <span className={`font-bold ${isRemediation ? "text-red-600" : "text-gray-900"}`}>
                {mentee.knowledgeScore}%
              </span>
              <span className="text-[11px] text-gray-500">{mentee.scoreTier}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full ${
                  isRemediation ? "bg-red-500" : mentee.knowledgeScore >= 80 ? "bg-[#194611]" : "bg-amber-500"
                }`}
                style={{ width: `${mentee.knowledgeScore}%` }}
              />
            </div>
          </div>
        );
      },
    };

    // G. SHARED: Status Column
    const statusCol: ColumnDef<ClinicalUser> = {
      accessorKey: "status",
      header: "STATUS",
      cell: ({ row }) => {
        const status = row.original.status;
        const isActive = status === "active";
        return (
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
            <span className="text-xs font-semibold capitalize text-gray-700">{status}</span>
          </div>
        );
      },
    };

    // H. SHARED: Row Actions
    const actionsCol: ColumnDef<ClinicalUser> = {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <button
          onClick={() => onEditUser?.(row.original)}
          className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-700 transition"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      ),
    };

    // Compose columns based on role
    if (role === "mentor") {
      return [identityCol, professionCol, facilityCol, thematicAreaCol, experienceCol, loadCol, statusCol, actionsCol];
    } else {
      return [identityCol, professionCol, facilityCol, assignedMentorCol, thematicAreaCol, knowledgeScoreCol, statusCol, actionsCol];
    }
  }, [role, onEditUser]);

  // 2. CLIENT-SIDE FILTERING (Text search & dropdowns)
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Global search matches name, systemId, profession, or facility
      if (globalFilter.trim()) {
        const query = globalFilter.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesId = item.systemId.toLowerCase().includes(query);
        const matchesFacility = item.facility.toLowerCase().includes(query);
        const matchesThematic = item.thematicArea.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesFacility && !matchesThematic) {
          return false;
        }
      }

      // Dropdown filters
      if (selectedThematicArea !== "all" && item.thematicArea !== selectedThematicArea) {
        return false;
      }
      if (selectedFacility !== "all" && item.facility !== selectedFacility) {
        return false;
      }
      if (selectedStatus !== "all" && item.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [data, globalFilter, selectedThematicArea, selectedFacility, selectedStatus]);

  // 3. TANSTACK TABLE INSTANCE
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Extract unique facilities and thematic areas for dropdown options
  const facilitiesList = useMemo(() => Array.from(new Set(data.map((d) => d.facility))), [data]);
  const thematicList = useMemo(() => Array.from(new Set(data.map((d) => d.thematicArea))), [data]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* TOOLBAR CONTROLS (Figma spec) */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Search & Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Bar */}
          <div className="relative min-w-[300px] flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={`Search by ${role} name, ID, facility, or specialty...`}
              className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#194611]/20 focus:border-[#194611]"
            />
          </div>

          {/* Thematic Area Filter */}
          <div className="relative">
            <select
              value={selectedThematicArea}
              onChange={(e) => setSelectedThematicArea(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer"
            >
              <option value="all">All Thematic Areas</option>
              {thematicList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Facility Filter */}
          <div className="relative">
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer"
            >
              <option value="all">All Facilities</option>
              {facilitiesList.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer"
            >
              <option value="all">Training Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setGlobalFilter("");
              setSelectedThematicArea("all");
              setSelectedFacility("all");
              setSelectedStatus("all");
            }}
            className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-xs font-medium transition"
            title="Reset Filters"
          >
            <Filter className="h-4 w-4" />
          </button>

          <button
            onClick={() => {
              // Export CSV
              const headers = ["Name", "ID", "Facility", "Thematic Area", "Status"];
              const rows = filteredData.map((d) => [d.name, d.systemId, d.facility, d.thematicArea, d.status]);
              const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", `${role}-management-export.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-xs font-medium transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* TABLE BODY */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-gray-100 bg-[#fafafa]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-gray-500">
                  No {role}s match the selected filters or search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* TABLE PAGINATION FOOTER */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600 bg-white">
        <div>
          Showing <span className="font-semibold text-gray-900">{filteredData.length > 0 ? 1 : 0}</span> to{" "}
          <span className="font-semibold text-gray-900">
            {Math.min(table.getState().pagination.pageSize, filteredData.length)}
          </span>{" "}
          of <span className="font-semibold text-gray-900">{filteredData.length}</span> {role}s
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span>Rows:</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="border border-gray-200 rounded px-2 py-1 text-xs font-medium focus:outline-none bg-white cursor-pointer"
            >
              {[5, 10, 20, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize} per page
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-medium text-gray-800">
              {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
