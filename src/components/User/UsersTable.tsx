"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  Clock,
  Link2Off,
  MapPin,
} from "lucide-react";
import { ClinicalUser, MentorUser, MenteeUser } from "@/types/user";
import { changeUserStatus } from "@/services/users.service";
import { UserDetailDialog } from "@/components/User/UserDetailDialog";
import { UsersTableToolbar } from "@/components/User/UsersTableToolbar";
import { UsersTablePagination } from "@/components/User/UsersTablePagination";
import { UserActionMenu } from "@/components/User/UserActionMenu";
import { UserStatusConfirmDialog } from "@/components/User/UserStatusConfirmDialog";
import { UserToast } from "@/components/User/UserToast";

interface UsersTableProps {
  role: "mentor" | "mentee";
  data: ClinicalUser[];
  onEditUser?: (user: ClinicalUser) => void;
  cohortLabel?: string;
  totalCohortCount?: number;
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

export function UsersTable({
  role,
  data,
  cohortLabel = "Central Academic Registry Cohort 2024-Q3",
  totalCohortCount,
}: UsersTableProps) {
  const router = useRouter();
  const [usersData, setUsersData] = useState<ClinicalUser[]>(data);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedThematicArea, setSelectedThematicArea] = useState<string>("all");
  const [selectedFacility, setSelectedFacility] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedMentor, setSelectedMentor] = useState<string>("all");

  // User detail dialog & action dropdown state
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<ClinicalUser | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  const [updatingStatusUserId, setUpdatingStatusUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Alert dialog confirmation state for destructive status changes
  const [confirmStatusAction, setConfirmStatusAction] = useState<{
    user: ClinicalUser;
    targetStatus: "inactive" | "suspended";
  } | null>(null);

  // Sync state if props change
  useEffect(() => {
    setUsersData(data);
  }, [data]);

  // Click outside to close action menu
  useEffect(() => {
    if (!activeMenuUserId) return;
    const handleClickOutside = () => setActiveMenuUserId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [activeMenuUserId]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleUpdateStatus = async (user: ClinicalUser, newStatus: string) => {
    setActiveMenuUserId(null);
    setUpdatingStatusUserId(String(user.id));
    setToastMessage(null);

    try {
      const res = await changeUserStatus(String(user.id), newStatus);
      if (res.success) {
        setUsersData((prev) =>
          prev.map((u) => (String(u.id) === String(user.id) ? ({ ...u, status: newStatus as any } as ClinicalUser) : u))
        );
        setToastMessage({
          type: "success",
          text: `Status for ${user.name || "user"} successfully changed to "${newStatus}".`,
        });
        router.refresh();
      } else {
        setToastMessage({
          type: "error",
          text: res.message || "Failed to update status on server.",
        });
      }
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err?.message || "Failed to update status.",
      });
    } finally {
      setUpdatingStatusUserId(null);
    }
  };

  const handleOpenDetail = (user: ClinicalUser) => {
    setSelectedUserForDetail(user);
    setIsDetailOpen(true);
  };

  // 1. DYNAMIC COLUMNS ENGINE (Based on role)
  const columns = useMemo<ColumnDef<ClinicalUser>[]>(() => {
    // User Identity Column
    const identityCol: ColumnDef<ClinicalUser> = {
      id: "identity",
      header: role === "mentor" ? "MENTOR NAME & ID" : "MENTEE NAME & ID",
      cell: ({ row }) => {
        const user = row.original;
        const name = user.name || (user as any).full_name || user.email || "Clinician";
        const initials =
          user.avatarInitials ||
          name
            .trim()
            .split(" ")
            .filter(Boolean)
            .map((part: string) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase() ||
          "CP";
        const systemId = user.systemId || `ID-${user.id || "001"}`;

        return (
          <div
            onClick={() => handleOpenDetail(user)}
            className="flex items-center gap-3 cursor-pointer group"
            title="Click to view full profile"
          >
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 group-hover:ring-2 group-hover:ring-[#194611]/30 transition ${
                user.avatarBgColor || "bg-gray-100 text-gray-700"
              }`}
            >
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-gray-900 group-hover:text-[#194611] transition leading-snug">
                {name}
              </span>
              <span className="text-[11px] text-gray-500 font-mono tracking-wider">{systemId}</span>
            </div>
          </div>
        );
      },
    };

    // Profession & Cadre Column
    const professionCol: ColumnDef<ClinicalUser> = {
      id: "profession",
      header: "PROFESSION",
      cell: ({ row }) => {
        const user = row.original;
        const profession =
          user.profession ||
          (user as any).highest_qualification ||
          (user.role === "mentor" ? "Midwifery Preceptor" : "Resident Midwife");
        if (user.role === "mentor") {
          const mentor = user as MentorUser;
          return (
            <div className="flex flex-col max-w-[210px]">
              <span className="text-sm font-semibold text-gray-900 leading-tight">{profession}</span>
              <span className="text-xs text-gray-500 truncate mt-0.5">{mentor.department || "Clinical Unit"}</span>
            </div>
          );
        } else {
          const mentee = user as MenteeUser;
          return (
            <div className="flex flex-col max-w-[210px]">
              <span className="text-sm font-semibold text-gray-900 leading-tight">{profession}</span>
              <span className="text-xs text-gray-500 truncate mt-0.5">{mentee.cadreLevel || "Clinical Midwifery"}</span>
            </div>
          );
        }
      },
    };

    // Affiliated Facility
    const facilityCol: ColumnDef<ClinicalUser> = {
      accessorKey: "facility",
      header: "FACILITY",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-700 max-w-[200px]">
          <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="font-medium truncate">{row.original.facility || "Regional Health Facility"}</span>
        </div>
      ),
    };

    // Role-specific: MENTEE Assigned Mentor
    const assignedMentorCol: ColumnDef<ClinicalUser> = {
      id: "assignedMentor",
      header: "ASSIGNED MENTOR",
      cell: ({ row }) => {
        const mentee = row.original as MenteeUser;
        const mentor = mentee.assignedMentor;

        if (mentor?.status === "assigned" && mentor.name) {
          return (
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] shrink-0">
                {mentor.avatarInitials || mentor.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-900 leading-tight">{mentor.name}</span>
                <span className="text-[11px] text-gray-500 leading-tight">{mentor.title || "Clinical Mentor"}</span>
              </div>
            </div>
          );
        }

        if (mentor?.status === "unassigned") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
              <Link2Off className="h-3 w-3 text-gray-400" />
              Unassigned
            </span>
          );
        }

        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3 text-amber-600" />
            Pending Review
          </span>
        );
      },
    };

    // Thematic Area
    const thematicAreaCol: ColumnDef<ClinicalUser> = {
      accessorKey: "thematicArea",
      header: "THEMATIC AREA",
      cell: ({ row }) => {
        const area = row.original.thematicArea;
        const badgeClass = thematicBadgeStyles[area] || "bg-gray-100 text-gray-700 border-gray-200";
        return (
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}>
            {area}
          </span>
        );
      },
    };

    // Role-specific: MENTEE Knowledge Score
    const knowledgeScoreCol: ColumnDef<ClinicalUser> = {
      id: "knowledgeScore",
      header: "KNOWLEDGE SCORE",
      cell: ({ row }) => {
        const mentee = row.original as MenteeUser;
        const score = mentee.knowledgeScore;
        const isRemediation = mentee.scoreTier === "Remediation" || score < 60;
        const isTier1 = mentee.scoreTier === "Tier 1" || score >= 80;

        return (
          <div className="flex flex-col gap-1 w-28">
            <div className="flex items-center justify-between text-xs">
              <span className={`font-extrabold ${isRemediation ? "text-red-600" : "text-gray-900"}`}>
                {score}%
              </span>
              <span className={`text-[11px] font-medium ${isRemediation ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                {mentee.scoreTier}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isRemediation ? "bg-red-500" : isTier1 ? "bg-[#194611]" : "bg-amber-500"
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        );
      },
    };

    // Role-specific: MENTOR Experience
    const experienceCol: ColumnDef<ClinicalUser> = {
      id: "experience",
      header: "EXPERIENCE",
      cell: ({ row }) => {
        const mentor = row.original as MentorUser;
        return <span className="text-sm font-semibold text-gray-800">{mentor.yearsOfExperience} yrs</span>;
      },
    };

    // Role-specific: MENTOR Load
    const loadCol: ColumnDef<ClinicalUser> = {
      id: "load",
      header: "LOAD",
      cell: ({ row }) => {
        const mentor = row.original as MentorUser;
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            {mentor.assignedMenteesCount} Mentees
          </span>
        );
      },
    };

    // Status Column
    const statusCol: ColumnDef<ClinicalUser> = {
      accessorKey: "status",
      header: "STATUS",
      cell: ({ row }) => {
        const status = row.original.status;
        const isActive = status === "active";
        const isPending = status === "pending" || status === "pending_start";
        const isSuspended = (status as string) === "suspended";
        const isOnLeave = status === "on_leave";

        const dotColor = isActive
          ? "bg-emerald-500"
          : isPending
          ? "bg-amber-500"
          : isSuspended
          ? "bg-red-500"
          : isOnLeave
          ? "bg-blue-500"
          : "bg-gray-400";

        const label =
          isPending
            ? "Pending"
            : isOnLeave
            ? "On Leave"
            : isSuspended
            ? "Suspended"
            : isActive
            ? "Active"
            : "Inactive";

        return (
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${dotColor}`} />
            <span className="text-xs font-semibold text-gray-800">{label}</span>
          </div>
        );
      },
    };

    // Row Actions
    const actionsCol: ColumnDef<ClinicalUser> = {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const user = row.original;
        const isMenuOpen = activeMenuUserId === user.id;
        const isUpdating = updatingStatusUserId === user.id;

        return (
          <UserActionMenu
            user={user}
            isOpen={isMenuOpen}
            isUpdating={isUpdating}
            onToggle={() => setActiveMenuUserId((prev) => (prev === user.id ? null : String(user.id)))}
            onClose={() => setActiveMenuUserId(null)}
            onOpenDetail={handleOpenDetail}
            onUpdateStatus={handleUpdateStatus}
            onConfirmStatusAction={(u, targetStatus) => setConfirmStatusAction({ user: u, targetStatus })}
          />
        );
      },
    };

    // Composition based on role
    if (role === "mentor") {
      return [identityCol, professionCol, facilityCol, thematicAreaCol, experienceCol, loadCol, statusCol, actionsCol];
    } else {
      return [identityCol, professionCol, facilityCol, assignedMentorCol, thematicAreaCol, knowledgeScoreCol, statusCol, actionsCol];
    }
  }, [role, activeMenuUserId, updatingStatusUserId]);

  // 2. CLIENT-SIDE FILTERING (Text search & dropdowns)
  const filteredData = useMemo(() => {
    return usersData.filter((item) => {
      // Global search matches name, systemId, profession, or facility
      if (globalFilter.trim()) {
        const query = globalFilter.toLowerCase();
        const matchesName = (item.name || "").toLowerCase().includes(query);
        const matchesId = (item.systemId || "").toLowerCase().includes(query);
        const matchesFacility = (item.facility || "").toLowerCase().includes(query);
        const matchesThematic = (item.thematicArea || "").toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesFacility && !matchesThematic) {
          return false;
        }
      }

      // Thematic area filter
      if (selectedThematicArea !== "all" && item.thematicArea !== selectedThematicArea) {
        return false;
      }

      // Facility filter
      if (selectedFacility !== "all" && item.facility !== selectedFacility) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all" && item.status !== selectedStatus) {
        return false;
      }

      // Mentor filter (for mentee role)
      if (role === "mentee" && selectedMentor !== "all") {
        const mentee = item as MenteeUser;
        if (selectedMentor === "unassigned") {
          if (mentee.assignedMentor?.status !== "unassigned") return false;
        } else if (selectedMentor === "pending_review") {
          if (mentee.assignedMentor?.status !== "pending_review") return false;
        } else {
          if (mentee.assignedMentor?.name !== selectedMentor) return false;
        }
      }

      return true;
    });
  }, [usersData, globalFilter, selectedThematicArea, selectedFacility, selectedStatus, selectedMentor, role]);

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

  // Unique options for filters
  const thematicList = useMemo(
    () =>
      Array.from(
        new Set(
          usersData
            .map((d) => d?.thematicArea)
            .filter((t): t is NonNullable<typeof t> => Boolean(t))
        )
      ),
    [usersData]
  );
  const mentorsList = useMemo(() => {
    if (role !== "mentee") return [];
    const mentors = new Set<string>();
    (usersData as MenteeUser[]).forEach((m) => {
      const name = m?.assignedMentor?.name;
      if (name && typeof name === "string" && name.trim()) mentors.add(name.trim());
    });
    return Array.from(mentors);
  }, [usersData, role]);

  const totalDisplayCount = totalCohortCount || usersData.length;

  const handleExportCsv = () => {
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
  };

  const handleResetFilters = () => {
    setGlobalFilter("");
    setSelectedThematicArea("all");
    setSelectedFacility("all");
    setSelectedStatus("all");
    setSelectedMentor("all");
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Top Search, Filters & Cohort Header */}
        <UsersTableToolbar
          role={role}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          selectedThematicArea={selectedThematicArea}
          onThematicAreaChange={setSelectedThematicArea}
          thematicList={thematicList}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedMentor={selectedMentor}
          onMentorChange={setSelectedMentor}
          mentorsList={mentorsList}
          onResetFilters={handleResetFilters}
          onExportCsv={handleExportCsv}
          showingCount={Math.min(table.getState().pagination.pageSize, filteredData.length)}
          totalDisplayCount={totalDisplayCount}
          cohortLabel={cohortLabel}
        />

        {/* Table Body */}
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-200 bg-[#fafafa]">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider"
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
                      <td key={cell.id} className="px-4 py-3.5 whitespace-nowrap">
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

        {/* Table Pagination Footer */}
        <UsersTablePagination
          pageSize={table.getState().pagination.pageSize}
          pageIndex={table.getState().pagination.pageIndex}
          filteredCount={filteredData.length}
          totalDisplayCount={totalDisplayCount}
          canPreviousPage={table.getCanPreviousPage()}
          canNextPage={table.getCanNextPage()}
          onPageSizeChange={(size) => table.setPageSize(size)}
          onPreviousPage={() => table.previousPage()}
          onNextPage={() => table.nextPage()}
        />
      </div>

      {/* User Detail Dialog */}
      <UserDetailDialog
        user={selectedUserForDetail}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onStatusUpdated={(userId, newStatus) => {
          setUsersData((prev) =>
            prev.map((u) => (String(u.id) === String(userId) ? ({ ...u, status: newStatus as any } as ClinicalUser) : u))
          );
          setToastMessage({
            type: "success",
            text: `Status updated to "${newStatus}".`,
          });
          router.refresh();
        }}
      />

      {/* Status Confirmation Alert Dialog */}
      <UserStatusConfirmDialog
        confirmAction={confirmStatusAction}
        onClose={() => setConfirmStatusAction(null)}
        onConfirm={async (user, targetStatus) => {
          await handleUpdateStatus(user, targetStatus);
        }}
        isUpdating={Boolean(updatingStatusUserId)}
      />

      {/* Toast Notification */}
      <UserToast
        toast={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </>
  );
}
