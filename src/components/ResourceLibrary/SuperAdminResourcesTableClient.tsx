"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  FileText,
  Video,
  Link2,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  FolderOpen,
  Eye,
} from "lucide-react";
import { DataTable } from "@/components/common/DataTable";
import { ActionMenu, ActionMenuItem } from "@/components/common/ActionMenu";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ResourceFormDialog } from "@/components/ResourceLibrary/ResourceFormDialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  deleteResource,
  getStoredResources,
} from "@/services/resources.service";
import type { AdminResource, AdminResourceType } from "@/types/resource";
import { cn } from "@/lib/utils";

interface SuperAdminResourcesTableClientProps {
  initialResources: AdminResource[];
}

export function SuperAdminResourcesTableClient({
  initialResources,
}: SuperAdminResourcesTableClientProps) {
  const [resources, setResources] = useState<AdminResource[]>(initialResources);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedResourceForEdit, setSelectedResourceForEdit] =
    useState<AdminResource | null>(null);
  const [resourceToDelete, setResourceToDelete] =
    useState<AdminResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Synchronize with local storage on mount for mock sessions or offline edits
  useEffect(() => {
    const stored = getStoredResources();
    if (stored && stored.length > 0) {
      setResources((prev) => {
        const prevIds = new Set(prev.map((r) => r.id));
        const localCustom = stored.filter(
          (s) => s.id.startsWith("res-custom-") && !prevIds.has(s.id)
        );
        if (localCustom.length > 0) {
          return [...localCustom, ...prev];
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

  const handleCreated = (newRes: AdminResource) => {
    setResources((prev) => [newRes, ...prev]);
    setToastMessage({
      type: "success",
      text: `Resource "${newRes.title}" was successfully published.`,
    });
  };

  const handleUpdated = (updatedRes: AdminResource) => {
    setResources((prev) =>
      prev.map((r) => (r.id === updatedRes.id ? updatedRes : r))
    );
    setToastMessage({
      type: "success",
      text: `Resource "${updatedRes.title}" was successfully updated.`,
    });
  };

  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;
    setIsDeleting(true);

    try {
      await deleteResource(resourceToDelete.id);
      setResources((prev) => prev.filter((r) => r.id !== resourceToDelete.id));
      setToastMessage({
        type: "success",
        text: `Resource "${resourceToDelete.title}" was deleted.`,
      });
      setResourceToDelete(null);
    } catch (err: any) {
      console.error("Delete failed:", err);
      setToastMessage({
        type: "error",
        text:
          err?.message ||
          `Failed to delete resource "${resourceToDelete.title}".`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered dataset by type dropdown
  const filteredData = useMemo(() => {
    if (typeFilter === "all") return resources;
    return resources.filter((r) => r.type === typeFilter);
  }, [resources, typeFilter]);

  // Metrics for summary cards
  const totalCount = resources.length;
  const documentCount = resources.filter((r) => r.type === "document").length;
  const videoCount = resources.filter((r) => r.type === "video").length;
  const linkCount = resources.filter((r) => r.type === "link").length;

  // Table Column Definitions
  const columns = useMemo<ColumnDef<AdminResource>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => {
          const res = row.original;
          return (
            <div className="flex items-start gap-3 py-1">
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border",
                  res.type === "document" &&
                    "bg-emerald-50 border-emerald-200 text-[#194611]",
                  res.type === "video" &&
                    "bg-indigo-50 border-indigo-200 text-indigo-700",
                  res.type === "link" &&
                    "bg-amber-50 border-amber-200 text-amber-700"
                )}
              >
                {res.type === "video" ? (
                  <Video className="w-4 h-4" />
                ) : res.type === "link" ? (
                  <Link2 className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 max-w-md">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 group-hover:text-[#194611] transition">
                    {res.title}
                  </span>
                  {res.url && res.url !== "#" && (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[#194611] inline-flex items-center transition"
                      title="Open external resource"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                {res.description && (
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                    {res.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                  {res.fileName && (
                    <span className="truncate max-w-[200px]">
                      {res.fileName}
                      {res.fileSizeMb ? ` (${res.fileSizeMb} MB)` : ""}
                    </span>
                  )}
                  {res.updatedAt && (
                    <span>
                      Updated {new Date(res.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const type = row.original.type;
          return (
            <div>
              {type === "document" && (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-[#194611] border-emerald-200 font-semibold text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5"
                >
                  <FileText className="w-3 h-3" />
                  <span>Document</span>
                </Badge>
              )}
              {type === "video" && (
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5"
                >
                  <Video className="w-3 h-3" />
                  <span>Video</span>
                </Badge>
              )}
              {type === "link" && (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-800 border-amber-200 font-semibold text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5"
                >
                  <Link2 className="w-3 h-3" />
                  <span>Link</span>
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const res = row.original;

          const actionItems: ActionMenuItem[] = [
            {
              label: "Edit Resource",
              icon: <Edit2 className="w-4 h-4 text-gray-500" />,
              onClick: () => setSelectedResourceForEdit(res),
            },
          ];

          if (res.url && res.url !== "#") {
            actionItems.push({
              label: "View / Open Link",
              icon: <Eye className="w-4 h-4 text-emerald-600" />,
              onClick: () => window.open(res.url, "_blank", "noopener,noreferrer"),
            });
          }

          actionItems.push({
            label: "Delete Resource",
            icon: <Trash2 className="w-4 h-4 text-red-500" />,
            variant: "destructive",
            onClick: () => setResourceToDelete(res),
          });

          return (
            <div className="flex items-center justify-end">
              <ActionMenu items={actionItems} triggerAriaLabel="Resource actions" />
            </div>
          );
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
            "p-4 rounded-xl border flex items-center justify-between shadow-sm animate-in fade-in-0 duration-200",
            toastMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          )}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="text-sm font-medium">{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-gray-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Resource Library"
        description="Publish, curate, and maintain accredited clinical guidelines, instructional videos, and reference manuals."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#194611]/10 text-[#194611] border border-[#194611]/20">
            <BookOpen className="w-3 h-3 text-[#FDD028]" />
            Super Admin
          </span>
        }
        actions={
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-[#194611] hover:bg-[#14380e] text-white font-semibold rounded-xl h-10 px-4 text-sm shadow-xs cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-[#FDD028]" />
            <span>Add Resource</span>
          </Button>
        }
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Resources"
          value={totalCount}
          icon={FolderOpen}
          subtext="Curated learning modules"
        />
        <StatCard
          title="Clinical Documents"
          value={documentCount}
          icon={FileText}
          subtext="Protocols & manuals"
        />
        <StatCard
          title="Training Videos"
          value={videoCount}
          icon={Video}
          subtext="Instructional demonstrations"
        />
        <StatCard
          title="External Portals"
          value={linkCount}
          icon={Link2}
          subtext="WHO & guideline links"
        />
      </div>

      {/* Reusable DataTable Component */}
      <DataTable
        columns={columns}
        data={filteredData}
        searchPlaceholder="Search resources by title, description..."
        emptyMessage="No clinical resources found matching your search criteria."
        pageSize={10}
        filters={
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194611] cursor-pointer"
            >
              <option value="all">All Resource Types ({totalCount})</option>
              <option value="document">Documents ({documentCount})</option>
              <option value="video">Videos ({videoCount})</option>
              <option value="link">Links ({linkCount})</option>
            </select>
          </div>
        }
      />

      {/* Add / Edit Resource Modal */}
      <ResourceFormDialog
        open={isAddOpen || Boolean(selectedResourceForEdit)}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setSelectedResourceForEdit(null);
          }
        }}
        resource={selectedResourceForEdit}
        onSuccess={(savedRes) => {
          if (selectedResourceForEdit) {
            handleUpdated(savedRes);
          } else {
            handleCreated(savedRes);
          }
        }}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(resourceToDelete)}
        onOpenChange={(open) => {
          if (!open) setResourceToDelete(null);
        }}
      >
        <AlertDialogContent className="bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 sm:max-w-md">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-2">
              <Trash2 className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-gray-900">
              Delete Clinical Resource?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                &ldquo;{resourceToDelete?.title}&rdquo;
              </span>
              ? This action will permanently remove the resource from the platform
              and revoke access across all mentoring cohorts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-5 flex items-center gap-3">
            <AlertDialogCancel
              disabled={isDeleting}
              className="h-10 px-4 text-xs font-medium rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              className="h-10 px-4 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs cursor-pointer"
            >
              {isDeleting ? "Deleting..." : "Delete Resource"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
