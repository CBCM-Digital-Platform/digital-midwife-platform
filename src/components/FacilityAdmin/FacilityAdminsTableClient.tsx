"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Users,
  Building2,
  Plus,
  Phone,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Eye,
  CheckCircle2,
  X,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { DataTable } from "@/components/common/DataTable";
import { ActionMenu, ActionMenuItem } from "@/components/common/ActionMenu";
import { FacilityAdminFormDialog } from "@/components/FacilityAdmin/FacilityAdminFormDialog";
import { FacilityAdminDetailDialog } from "@/components/FacilityAdmin/FacilityAdminDetailDialog";
import { updateFacilityAdminStatus } from "@/services/facility-admins.service";
import type { FacilityAdmin, FacilityAdminStatus } from "@/types/facility-admin";
import type { Facility } from "@/types/facility";
import { cn } from "@/lib/utils";

interface FacilityAdminsTableClientProps {
  initialAdmins: FacilityAdmin[];
  facilities: Facility[];
}

export function FacilityAdminsTableClient({
  initialAdmins,
  facilities,
}: FacilityAdminsTableClientProps) {
  const [admins, setAdmins] = useState<FacilityAdmin[]>(initialAdmins);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedAdminForDetail, setSelectedAdminForDetail] = useState<FacilityAdmin | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [facilityFilter, setFacilityFilter] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Auto-dismiss toast notification after 4 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleCreated = (newAdmin: FacilityAdmin) => {
    setAdmins((prev) => [newAdmin, ...prev]);
    setToastMessage({
      type: "success",
      text: `Facility administrator "${newAdmin.name}" was successfully registered.`,
    });
  };

  const handleStatusChange = async (adminId: string, newStatus: FacilityAdminStatus) => {
    try {
      const res = await updateFacilityAdminStatus(adminId, newStatus);
      if (res.success) {
        setAdmins((prev) =>
          prev.map((a) => (a.id === adminId ? { ...a, status: newStatus } : a))
        );
        setToastMessage({
          type: "success",
          text: `Administrator status successfully updated to "${newStatus}".`,
        });
      } else {
        setToastMessage({
          type: "error",
          text: res.message || "Failed to update administrator status.",
        });
      }
    } catch {
      setToastMessage({
        type: "error",
        text: "An error occurred while updating status.",
      });
    }
  };

  // Filtered dataset for TanStack Table
  const filteredData = useMemo(() => {
    return admins.filter((admin) => {
      if (statusFilter !== "all" && admin.status !== statusFilter) {
        return false;
      }
      if (facilityFilter !== "all" && String(admin.facilityId) !== facilityFilter) {
        return false;
      }
      return true;
    });
  }, [admins, statusFilter, facilityFilter]);

  // Stat metrics
  const totalCount = admins.length;
  const activeCount = admins.filter((a) => a.status === "active").length;
  const inactiveOrSuspended = admins.filter(
    (a) => a.status === "inactive" || a.status === "suspended"
  ).length;
  const uniqueFacilitiesCount = new Set(
    admins.map((a) => a.facilityId).filter(Boolean)
  ).size;

  // TanStack Column Definitions
  const columns = useMemo<ColumnDef<FacilityAdmin>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Administrator",
        cell: ({ row }) => {
          const admin = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#194611] text-[#FDD028] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {admin.avatarInitials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-gray-900 truncate">
                  {admin.name}
                </span>
                <span className="text-xs text-gray-500 truncate flex items-center gap-1">
                  <Mail className="h-3 w-3 text-gray-400" />
                  {admin.email}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "facilityName",
        header: "Assigned Facility",
        cell: ({ row }) => {
          const admin = row.original;
          return (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#194611] shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-gray-900 truncate">
                  {admin.facilityName}
                </span>
                {admin.facilityId && (
                  <span className="text-[11px] text-gray-400 font-mono">
                    ID: #{admin.facilityId}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "highestQualification",
        header: "Qualification / Title",
        cell: ({ row }) => {
          const val = row.original.highestQualification;
          return (
            <div className="flex items-center gap-1.5 text-xs text-gray-700">
              <Briefcase className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span>{val || "Facility Lead"}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Phone Contact",
        cell: ({ row }) => {
          const phone = row.original.phone;
          return phone ? (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              <span>{phone}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">Not recorded</span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const statusStyles: Record<
            FacilityAdminStatus,
            { label: string; badge: string; dot: string }
          > = {
            active: {
              label: "Active",
              badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
              dot: "bg-emerald-500",
            },
            inactive: {
              label: "Inactive",
              badge: "bg-gray-100 text-gray-700 border-gray-200",
              dot: "bg-gray-400",
            },
            suspended: {
              label: "Suspended",
              badge: "bg-red-50 text-red-700 border-red-200",
              dot: "bg-red-500",
            },
            pending: {
              label: "Pending",
              badge: "bg-amber-50 text-amber-700 border-amber-200",
              dot: "bg-amber-500",
            },
          };
          const current = statusStyles[status] || statusStyles.active;

          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                current.badge
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", current.dot)} />
              {current.label}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const admin = row.original;
          const menuItems: ActionMenuItem[] = [
            {
              label: "View Full Profile",
              icon: <Eye className="h-3.5 w-3.5" />,
              onClick: () => setSelectedAdminForDetail(admin),
            },
            ...(admin.status !== "active"
              ? [
                  {
                    label: "Mark as Active",
                    icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />,
                    onClick: () => handleStatusChange(admin.id, "active"),
                  },
                ]
              : []),
            ...(admin.status !== "inactive"
              ? [
                  {
                    label: "Set as Inactive",
                    icon: <Clock className="h-3.5 w-3.5 text-gray-500" />,
                    onClick: () => handleStatusChange(admin.id, "inactive"),
                  },
                ]
              : []),
            ...(admin.status !== "suspended"
              ? [
                  {
                    label: "Suspend Account",
                    icon: <ShieldAlert className="h-3.5 w-3.5 text-red-500" />,
                    variant: "destructive" as const,
                    onClick: () => handleStatusChange(admin.id, "suspended"),
                  },
                ]
              : []),
          ];

          return <ActionMenu items={menuItems} align="right" />;
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={cn(
            "flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm shadow-sm transition animate-in fade-in-0 slide-in-from-top-1",
            toastMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          )}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Facility Admins
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">Accredited hospital leads</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-green-50 text-[#194611] flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Active In System
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {totalCount > 0
                ? `${Math.round((activeCount / totalCount) * 100)}% operational`
                : "0% operational"}
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Managed Facilities
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {uniqueFacilitiesCount}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Assigned healthcare centers</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Inactive / Suspended
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {inactiveOrSuspended}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Requires audit or action</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Data Table utilizing the reusable DataTable component */}
      <DataTable
        columns={columns}
        data={filteredData}
        searchPlaceholder="Search admins by name, email, or facility..."
        emptyMessage="No facility administrators found matching the criteria."
        filters={
          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194611] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>

            {/* Facility Filter */}
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194611] cursor-pointer max-w-[200px] truncate"
            >
              <option value="all">All Facilities</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        }
        actions={
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#194611] hover:bg-[#12330c] text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Facility Admin</span>
          </button>
        }
      />

      {/* Add Facility Admin Dialog */}
      <FacilityAdminFormDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        facilities={facilities}
        onSuccess={handleCreated}
      />

      {/* Detail & Status Management Dialog */}
      <FacilityAdminDetailDialog
        admin={selectedAdminForDetail}
        open={!!selectedAdminForDetail}
        onOpenChange={(open) => !open && setSelectedAdminForDetail(null)}
        onStatusChanged={(adminId, newStatus) => {
          setAdmins((prev) =>
            prev.map((a) => (a.id === adminId ? { ...a, status: newStatus } : a))
          );
          setToastMessage({
            type: "success",
            text: `Administrator status changed to "${newStatus}".`,
          });
        }}
      />
    </div>
  );
}
