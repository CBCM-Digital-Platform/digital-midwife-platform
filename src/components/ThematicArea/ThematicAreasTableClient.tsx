"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Layers,
  Plus,
  Eye,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  BookOpen,
  Award,
  Archive,
  Trash2,
} from "lucide-react";
import { DataTable } from "@/components/common/DataTable";
import { ActionMenu, ActionMenuItem } from "@/components/common/ActionMenu";
import { PageHeader } from "@/components/common/PageHeader";
import { ThematicAreaFormDialog } from "@/components/ThematicArea/ThematicAreaFormDialog";
import { ThematicAreaDetailDialog } from "@/components/ThematicArea/ThematicAreaDetailDialog";
import {
  updateThematicAreaStatus,
  deleteThematicArea,
  getStoredAreas,
  THEMATIC_CATEGORIES,
} from "@/services/thematic-areas.service";
import type { ThematicArea, ThematicAreaStatus } from "@/types/thematic-area";
import { cn } from "@/lib/utils";

interface ThematicAreasTableClientProps {
  initialThematicAreas: ThematicArea[];
}

export function ThematicAreasTableClient({
  initialThematicAreas,
}: ThematicAreasTableClientProps) {
  const [areas, setAreas] = useState<ThematicArea[]>(initialThematicAreas);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedAreaForEdit, setSelectedAreaForEdit] = useState<ThematicArea | null>(null);
  const [selectedAreaForDetail, setSelectedAreaForDetail] = useState<ThematicArea | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Synchronize with client-side storage on mount to ensure created/edited areas persist across page reloads
  useEffect(() => {
    const stored = getStoredAreas();
    if (stored && stored.length > 0) {
      setAreas((prev) => {
        // If stored has local custom additions (e.g. created during mock development), merge them at the top
        const prevIds = new Set(prev.map((a) => a.id));
        const localCustomItems = stored.filter(
          (a) => a.id.startsWith("ta-") && !prevIds.has(a.id)
        );
        if (localCustomItems.length > 0) {
          return [...localCustomItems, ...prev];
        }

        // If stored has custom items, preserve the full stored set
        const hasCustomItems = stored.some((a) => a.id.startsWith("ta-"));
        if (hasCustomItems) {
          return stored;
        }

        return prev;
      });
    }
  }, []);

  // Auto-dismiss toast notification after 4 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleCreated = (newArea: ThematicArea) => {
    setAreas((prev) => [newArea, ...prev]);
    setToastMessage({
      type: "success",
      text: `Thematic area "${newArea.name}" was successfully registered.`,
    });
  };

  const handleUpdated = (updatedArea: ThematicArea) => {
    setAreas((prev) =>
      prev.map((a) => (a.id === updatedArea.id ? updatedArea : a))
    );
    setToastMessage({
      type: "success",
      text: `Thematic area "${updatedArea.name}" was successfully updated.`,
    });
  };

  const handleStatusChange = async (areaId: string, newStatus: ThematicAreaStatus) => {
    try {
      const res = await updateThematicAreaStatus(areaId, newStatus);
      if (res.success) {
        setAreas((prev) =>
          prev.map((a) => (a.id === areaId ? { ...a, status: newStatus } : a))
        );
        setToastMessage({
          type: "success",
          text: `Status changed to "${newStatus.replace("_", " ")}".`,
        });
      } else {
        setToastMessage({
          type: "error",
          text: res.message || "Failed to update thematic area status.",
        });
      }
    } catch {
      setToastMessage({
        type: "error",
        text: "An error occurred while updating status.",
      });
    }
  };

  const handleDelete = async (area: ThematicArea) => {
    if (!confirm(`Are you sure you want to delete thematic area "${area.name}" (${area.code})?`)) {
      return;
    }
    try {
      await deleteThematicArea(area.id);
      setAreas((prev) => prev.filter((a) => a.id !== area.id));
      setToastMessage({
        type: "success",
        text: `Thematic area "${area.name}" was successfully removed.`,
      });
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err?.message || "Failed to delete thematic area.",
      });
    }
  };

  // Filtered dataset for TanStack Table
  const filteredData = useMemo(() => {
    return areas.filter((area) => {
      if (statusFilter !== "all" && area.status !== statusFilter) {
        return false;
      }
      if (categoryFilter !== "all" && area.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [areas, statusFilter, categoryFilter]);

  // Table Column Definitions
  const columns = useMemo<ColumnDef<ThematicArea>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Thematic Area & Code",
        cell: ({ row }) => {
          const area = row.original;
          return (
            <div className="flex items-center gap-2.5 max-w-[260px] sm:max-w-[280px]">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-200 text-[#194611] flex items-center justify-center shrink-0 font-bold text-xs">
                <Layers className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-semibold text-gray-900 truncate text-xs" title={area.name}>
                    {area.name}
                  </span>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 shrink-0">
                    {area.code}
                  </span>
                </div>
                {area.description && (
                  <span className="text-[11px] text-gray-400 truncate mt-0.5" title={area.description}>
                    {area.description}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Clinical Domain",
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-100 whitespace-nowrap">
            {row.original.category}
          </span>
        ),
      },
      {
        accessorKey: "competenciesCount",
        header: "Competencies & Modules",
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className="flex items-center gap-2 text-xs text-gray-600 whitespace-nowrap">
              <span className="flex items-center gap-1 font-medium">
                <Award className="h-3.5 w-3.5 text-gray-400" />
                {a.competenciesCount || 12} Skills
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1 font-medium">
                <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                {a.modulesCount || 3} Modules
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "targetCadres",
        header: "Applicable Cadres",
        cell: ({ row }) => {
          const cadres = row.original.targetCadres || [];
          if (cadres.length === 0) {
            return <span className="text-xs text-gray-400 whitespace-nowrap">All Midwifery Cadres</span>;
          }
          return (
            <div className="flex items-center gap-1 max-w-[150px] truncate">
              <span className="text-xs text-gray-700 font-medium truncate" title={cadres.join(", ")}>
                {cadres[0]}
              </span>
              {cadres.length > 1 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-gray-100 text-gray-600 font-medium shrink-0">
                  +{cadres.length - 1}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          let badgeClasses = "bg-gray-100 text-gray-700 border-gray-200";
          let label = "Inactive";

          if (status === "active") {
            badgeClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
            label = "Active";
          } else if (status === "under_review") {
            badgeClasses = "bg-amber-50 text-amber-800 border-amber-200";
            label = "Under Review";
          }

          return (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap",
                badgeClasses
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5" />
              {label}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const area = row.original;
          const actionItems: ActionMenuItem[] = [
            {
              label: "View Area Details",
              icon: <Eye className="h-3.5 w-3.5" />,
              onClick: () => setSelectedAreaForDetail(area),
            },
            {
              label: "Edit Thematic Area",
              icon: <Edit2 className="h-3.5 w-3.5" />,
              onClick: () => setSelectedAreaForEdit(area),
            },
          ];

          if (area.status !== "active") {
            actionItems.push({
              label: "Activate Domain",
              icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />,
              onClick: () => handleStatusChange(area.id, "active"),
            });
          }

          if (area.status !== "under_review") {
            actionItems.push({
              label: "Set Under Review",
              icon: <AlertCircle className="h-3.5 w-3.5 text-amber-600" />,
              onClick: () => handleStatusChange(area.id, "under_review"),
            });
          }

          if (area.status !== "inactive") {
            actionItems.push({
              label: "Archive Area",
              icon: <Archive className="h-3.5 w-3.5 text-gray-500" />,
              onClick: () => handleStatusChange(area.id, "inactive"),
            });
          }

          actionItems.push({
            label: "Delete Thematic Area",
            icon: <Trash2 className="h-3.5 w-3.5 text-red-600" />,
            variant: "destructive",
            onClick: () => handleDelete(area),
          });

          return <ActionMenu items={actionItems} />;
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Dynamic Header with reactive thematic areas counter */}
      <PageHeader
        title="Clinical Thematic Areas"
        description="Oversee accredited clinical learning domains, competencies, and specialized midwifery curricula across health facilities."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-[#194611] border border-green-200">
            <Layers className="h-3.5 w-3.5" />
            {areas.length} Thematic Areas
          </span>
        }
      />

      {/* Toast Feedback Notification Banner */}
      {toastMessage && (
        <div
          className={cn(
            "p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium shadow-xs transition-all animate-in fade-in slide-in-from-top-1",
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
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-gray-700 transition cursor-pointer"
            aria-label="Dismiss toast"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main TanStack Data Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        searchPlaceholder="Search thematic areas by code, title, or clinical domain..."
        emptyMessage="No thematic areas found matching your filter criteria."
        actions={
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#194611] hover:bg-[#12330c] text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>New Thematic Area</span>
          </button>
        }
        filters={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194611] cursor-pointer"
              aria-label="Filter by operational status"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="under_review">Under Review</option>
              <option value="inactive">Inactive / Archived</option>
            </select>

            {/* Category / Domain Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194611] cursor-pointer"
              aria-label="Filter by clinical category"
            >
              <option value="all">All Domains</option>
              {THEMATIC_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Add Thematic Area Dialog */}
      <ThematicAreaFormDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        existingAreas={areas}
        onSuccess={handleCreated}
      />

      {/* Edit Thematic Area Dialog */}
      {selectedAreaForEdit && (
        <ThematicAreaFormDialog
          open={!!selectedAreaForEdit}
          onOpenChange={(open) => !open && setSelectedAreaForEdit(null)}
          thematicArea={selectedAreaForEdit}
          existingAreas={areas}
          onSuccess={handleUpdated}
        />
      )}

      {/* Detail / View Profile Dialog */}
      <ThematicAreaDetailDialog
        thematicArea={selectedAreaForDetail}
        open={!!selectedAreaForDetail}
        onOpenChange={(open) => !open && setSelectedAreaForDetail(null)}
        onStatusChanged={handleStatusChange}
        onEditClick={(area) => setSelectedAreaForEdit(area)}
      />
    </div>
  );
}
