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
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Eye,
  Filter,
  Link2Off,
  Loader2,
  MapPin,
  MoreVertical,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
  XCircle,
} from "lucide-react";
import { ClinicalUser, MentorUser, MenteeUser } from "@/types/user";
import { changeUserStatus } from "@/services/users.service";
import { UserDetailDialog } from "@/components/User/UserDetailDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  onEditUser,
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
          <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setActiveMenuUserId((prev) => (prev === user.id ? null : user.id));
              }}
              disabled={isUpdating}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                isMenuOpen
                  ? "bg-gray-100 border-gray-300 text-gray-800"
                  : "border-transparent hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              }`}
              aria-label="Row options"
              title="Actions"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#194611]" />
              ) : (
                <MoreVertical className="h-4 w-4" />
              )}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white shadow-xl border border-gray-200 z-50 py-1 divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100">
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuUserId(null);
                      handleOpenDetail(user);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 text-gray-500" />
                    <span>View Profile</span>
                  </button>
                </div>

                <div className="py-1">
                  <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Change Status
                  </div>
                  <button
                    type="button"
                    disabled={user.status === "active"}
                    onClick={() => handleUpdateStatus(user, "active")}
                    className={`w-full text-left px-3.5 py-1.5 text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                      user.status === "active"
                        ? "text-emerald-700 bg-emerald-50 font-semibold"
                        : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Set Active</span>
                  </button>

                  <button
                    type="button"
                    disabled={user.status === "inactive"}
                    onClick={() => {
                      setActiveMenuUserId(null);
                      setConfirmStatusAction({ user, targetStatus: "inactive" });
                    }}
                    className={`w-full text-left px-3.5 py-1.5 text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                      user.status === "inactive"
                        ? "text-gray-700 bg-gray-100 font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <XCircle className="h-3.5 w-3.5 text-gray-500" />
                    <span>Set Inactive</span>
                  </button>

                  <button
                    type="button"
                    disabled={(user.status as string) === "suspended"}
                    onClick={() => {
                      setActiveMenuUserId(null);
                      setConfirmStatusAction({ user, targetStatus: "suspended" });
                    }}
                    className={`w-full text-left px-3.5 py-1.5 text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                      (user.status as string) === "suspended"
                        ? "text-red-700 bg-red-50 font-semibold"
                        : "text-gray-700 hover:bg-red-50 hover:text-red-700"
                    }`}
                  >
                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    <span>Set Suspended</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      },
    };

    // Composition based on role (clean table without selection checkbox)
    if (role === "mentor") {
      return [identityCol, professionCol, facilityCol, thematicAreaCol, experienceCol, loadCol, statusCol, actionsCol];
    } else {
      return [identityCol, professionCol, facilityCol, assignedMentorCol, thematicAreaCol, knowledgeScoreCol, statusCol, actionsCol];
    }
  }, [role, onEditUser, activeMenuUserId, updatingStatusUserId]);

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
  const facilitiesList = useMemo(
    () =>
      Array.from(
        new Set(
          usersData
            .map((d) => d?.facility)
            .filter((f): f is string => Boolean(f && typeof f === "string" && f.trim()))
        )
      ),
    [usersData]
  );
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

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* 1. TOP SEARCH & EXPORT TOOLBAR */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative min-w-[280px] flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={`Search by ${role} name, clinical ID, or keyword...`}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#194611]/20 focus:border-[#194611]"
          />
        </div>

        {/* Export CSV Button */}
        <button
          onClick={() => {
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
          className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-xs font-semibold transition shadow-sm cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-gray-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* 2. SECOND FILTER ROW */}
      <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-xs font-semibold text-gray-500">
          <Filter className="h-3.5 w-3.5" />
          <span>Filter by:</span>
        </div>

        {/* Thematic Areas Filter */}
        <div className="relative">
          <select
            value={selectedThematicArea}
            onChange={(e) => setSelectedThematicArea(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer shadow-sm"
          >
            <option value="all">All Thematic Areas</option>
            {thematicList.map((t, idx) => (
              <option key={`thematic-${t}-${idx}`} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Statuses Filter */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer shadow-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Mentors Filter (When role === "mentee") */}
        {role === "mentee" && (
          <div className="relative">
            <select
              value={selectedMentor}
              onChange={(e) => setSelectedMentor(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer shadow-sm"
            >
              <option value="all">All Mentors</option>
              {mentorsList.map((m, idx) => (
                <option key={`mentor-${m}-${idx}`} value={m}>
                  {m}
                </option>
              ))}
              <option value="pending_review">Pending Review</option>
              <option value="unassigned">Unassigned</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
        )}

        {/* Reset Filters */}
        <button
          onClick={() => {
            setGlobalFilter("");
            setSelectedThematicArea("all");
            setSelectedFacility("all");
            setSelectedStatus("all");
            setSelectedMentor("all");
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-800 transition cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* 3. COHORT SUMMARY HEADER BANNER */}
      <div className="px-4 py-2.5 bg-slate-50/70 border-b border-gray-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800">
            Showing {Math.min(table.getState().pagination.pageSize, filteredData.length)} of {totalDisplayCount} {role}s
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-500 font-medium">{cohortLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-1 bg-white border border-gray-200 rounded-md text-gray-500 hover:text-gray-700 shadow-xs cursor-pointer" title="Table View Options">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 4. TABLE BODY */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
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

      {/* 5. TABLE PAGINATION FOOTER */}
      <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600 bg-white">
        <div>
          Showing <span className="font-bold text-gray-900">{filteredData.length > 0 ? 1 : 0}</span> to{" "}
          <span className="font-bold text-gray-900">
            {Math.min(table.getState().pagination.pageSize, filteredData.length)}
          </span>{" "}
          of <span className="font-bold text-gray-900">{totalDisplayCount}</span> results
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span>Rows:</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="border border-gray-200 rounded px-2 py-1 text-xs font-semibold focus:outline-none bg-white cursor-pointer"
            >
              {[10, 20, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize} per page
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 font-semibold">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none text-xs text-gray-700 cursor-pointer"
            >
              &lt; Previous
            </button>
            <span className="px-2.5 py-1 rounded bg-[#194611] text-white text-xs font-bold">
              {table.getState().pagination.pageIndex + 1}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none text-xs text-gray-700 cursor-pointer"
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* 6. USER DETAIL DIALOG (Calls getUserById & changeUserStatus) */}
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

    {/* 7. STATUS CONFIRMATION ALERT DIALOG */}
    <AlertDialog
      open={Boolean(confirmStatusAction)}
      onOpenChange={(open) => {
        if (!open) setConfirmStatusAction(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                confirmStatusAction?.targetStatus === "suspended"
                  ? "bg-red-100 text-red-600"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {confirmStatusAction?.targetStatus === "suspended" ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
            </div>
            <AlertDialogTitle>
              {confirmStatusAction?.targetStatus === "suspended"
                ? `Suspend ${confirmStatusAction?.user.name}?`
                : `Deactivate ${confirmStatusAction?.user.name}?`}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {confirmStatusAction?.targetStatus === "suspended"
              ? `Are you sure you want to suspend ${confirmStatusAction?.user.name} (${confirmStatusAction?.user.systemId})? This will immediately suspend account access and active clinical duties.`
              : `Are you sure you want to set ${confirmStatusAction?.user.name} (${confirmStatusAction?.user.systemId}) to inactive? The user will be marked inactive across active facility rosters.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={Boolean(updatingStatusUserId)}
            onClick={() => setConfirmStatusAction(null)}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={Boolean(updatingStatusUserId)}
            onClick={async () => {
              if (!confirmStatusAction) return;
              const { user, targetStatus } = confirmStatusAction;
              await handleUpdateStatus(user, targetStatus);
              setConfirmStatusAction(null);
            }}
            className={
              confirmStatusAction?.targetStatus === "suspended"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-800 hover:bg-gray-900"
            }
          >
            {updatingStatusUserId ? (
              <div className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Updating...</span>
              </div>
            ) : confirmStatusAction?.targetStatus === "suspended" ? (
              "Yes, Suspend User"
            ) : (
              "Yes, Set Inactive"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* 8. TOAST NOTIFICATION */}
    {toastMessage && (
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-2xl border transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 ${
          toastMessage.type === "success"
            ? "bg-[#194611] border-emerald-800"
            : "bg-red-800 border-red-900"
        }`}
      >
        {toastMessage.type === "success" ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-300 shrink-0" />
        )}
        <div className="text-sm">
          <p className="font-semibold text-white">
            {toastMessage.type === "success" ? "Success" : "Error"}
          </p>
          <p className="text-xs text-emerald-100">{toastMessage.text}</p>
        </div>
        <button
          type="button"
          onClick={() => setToastMessage(null)}
          className="ml-2 text-white/80 hover:text-white transition cursor-pointer"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )}
  </>
  );
}
