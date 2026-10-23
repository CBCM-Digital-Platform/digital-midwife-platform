"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Building2,
  Plus,
  Edit2,
  MapPin,
  Users,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
} from "lucide-react";
import { DataTable } from "@/components/common/DataTable";
import { ActionMenu, ActionMenuItem } from "@/components/common/ActionMenu";
import { FacilityFormDialog } from "@/components/Facility/FacilityFormDialog";
import type { Facility, FacilityStatus } from "@/types/facility";
import { cn } from "@/lib/utils";

interface FacilitiesTableClientProps {
  initialFacilities: Facility[];
}

export function FacilitiesTableClient({
  initialFacilities,
}: FacilitiesTableClientProps) {
  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedFacilityForEdit, setSelectedFacilityForEdit] = useState<Facility | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
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

  const handleCreated = (newFacility: Facility) => {
    setFacilities((prev) => [newFacility, ...prev]);
    setToastMessage({
      type: "success",
      text: `Facility "${newFacility.name}" was successfully registered.`,
    });
  };

  const handleUpdated = (updatedFacility: Facility) => {
    setFacilities((prev) =>
      prev.map((f) => (f.id === updatedFacility.id ? updatedFacility : f))
    );
    setToastMessage({
      type: "success",
      text: `Facility "${updatedFacility.name}" was successfully updated (Status: ${updatedFacility.status}).`,
    });
  };

  // Filter by status if selected
  const filteredData = useMemo(() => {
    if (statusFilter === "all") return facilities;
    return facilities.filter((f) => f.status === statusFilter);
  }, [facilities, statusFilter]);

  // Column definitions for TanStack Table
  const columns = useMemo<ColumnDef<Facility>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Facility Name & Code",
        cell: ({ row }) => {
          const f = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-green-50 border border-green-200 text-[#194611] flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900 line-clamp-1">{f.name}</span>
                <span className="text-xs text-gray-400 font-mono">
                  {f.code || `ID: ${f.id}`}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Facility Type",
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
            {row.original.type || "General Hospital"}
          </span>
        ),
      },
      {
        accessorKey: "region",
        header: "Location",
        cell: ({ row }) => {
          const f = row.original;
          return (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span>
                {f.region}
                {f.zone ? ` • ${f.zone}` : ""}
              </span>
            </div>
          );
        },
      },
      {
        id: "clinicalStaff",
        header: "Mentors & Mentees",
        cell: ({ row }) => {
          const f = row.original;
          return (
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                <Users className="h-3 w-3" />
                {f.activeMentorsCount ?? 0} mentors
              </span>
              <span className="text-gray-500">
                {f.activeMenteesCount ?? 0} mentees
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          if (status === "active") {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="h-3 w-3" />
                Active
              </span>
            );
          }
          if (status === "pending") {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                <Clock className="h-3 w-3" />
                Pending
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
              <AlertCircle className="h-3 w-3" />
              Inactive
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const facility = row.original;
          const menuItems: ActionMenuItem[] = [
            {
              label: "Edit Facility",
              icon: <Edit2 className="h-3.5 w-3.5" />,
              onClick: () => setSelectedFacilityForEdit(facility),
            },
          ];

          return <ActionMenu items={menuItems} align="right" />;
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={filteredData}
        searchPlaceholder="Search facilities by name, code, or location..."
        emptyMessage="No clinical facilities found matching your search."
        filters={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        }
        actions={
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#194611] hover:bg-[#194611]/90 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Facility</span>
          </button>
        }
      />

      {/* Add Facility Dialog */}
      <FacilityFormDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        existingFacilities={facilities}
        onSuccess={handleCreated}
      />

      {/* Edit Facility Dialog */}
      {selectedFacilityForEdit && (
        <FacilityFormDialog
          open={Boolean(selectedFacilityForEdit)}
          onOpenChange={(open) => {
            if (!open) setSelectedFacilityForEdit(null);
          }}
          facility={selectedFacilityForEdit}
          existingFacilities={facilities}
          onSuccess={handleUpdated}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-2xl border transition-all animate-in fade-in slide-in-from-bottom-4 duration-300",
            toastMessage.type === "success"
              ? "bg-[#194611] border-emerald-800"
              : "bg-red-800 border-red-900"
          )}
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
    </div>
  );
}
