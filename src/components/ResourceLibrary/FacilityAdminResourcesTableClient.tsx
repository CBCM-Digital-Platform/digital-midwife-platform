"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  FileText,
  Video,
  Link2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  FolderOpen,
  UserPlus,
  Building2,
  Eye,
} from "lucide-react";
import { DataTable } from "@/components/common/DataTable";
import { ActionMenu, ActionMenuItem } from "@/components/common/ActionMenu";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { AssignResourceDialog } from "@/components/ResourceLibrary/AssignResourceDialog";
import { Badge } from "@/components/ui/badge";
import type { AdminResource } from "@/types/resource";
import type { MentorUser } from "@/types/user";
import { getStoredResources } from "@/services/resources.service";
import { cn } from "@/lib/utils";

interface FacilityAdminResourcesTableClientProps {
  initialResources: AdminResource[];
  availableMentors?: MentorUser[];
}

export function FacilityAdminResourcesTableClient({
  initialResources,
  availableMentors,
}: FacilityAdminResourcesTableClientProps) {
  const [resources, setResources] = useState<AdminResource[]>(initialResources);
  const [selectedResourceForAssign, setSelectedResourceForAssign] =
    useState<AdminResource | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Sync with client-side storage to ensure any user-created resources display
  useEffect(() => {
    const stored = getStoredResources();
    if (stored && stored.length > 0) {
      setResources((prev) => {
        const prevIds = new Set(prev.map((r) => r.id));
        const localCustom = stored.filter((s) => !prevIds.has(s.id));
        if (localCustom.length > 0) {
          return [...localCustom, ...prev];
        }
        return prev;
      });
    }
  }, []);

  // Auto-dismiss toast notification after 5 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleAssigned = (resourceTitle: string, mentorName: string) => {
    setToastMessage({
      type: "success",
      text: `"${resourceTitle}" was successfully assigned to ${mentorName}.`,
    });
  };

  const handleAssignFailed = (resourceTitle: string, errorMessage: string) => {
    setToastMessage({
      type: "error",
      text: `Failed to assign "${resourceTitle}": ${errorMessage}`,
    });
  };

  // Filter dataset by type dropdown
  const filteredData = useMemo(() => {
    if (typeFilter === "all") return resources;
    return resources.filter((r) => r.type === typeFilter);
  }, [resources, typeFilter]);

  // Metrics for summary cards
  const totalCount = resources.length;
  const documentCount = resources.filter((r) => r.type === "document").length;
  const videoCount = resources.filter((r) => r.type === "video").length;
  const linkCount = resources.filter((r) => r.type === "link").length;

  // Table Column Definitions (Title, Type, Link, Actions)
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
                <span className="text-sm font-semibold text-gray-900 block truncate">
                  {res.title}
                </span>
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
        id: "link",
        header: "Link",
        cell: ({ row }) => {
          const res = row.original;
          const hasUrl = Boolean(res.url && res.url !== "#");

          if (!hasUrl && res.fileName) {
            return (
              <span className="text-xs text-gray-500 font-medium inline-flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                <span>Internal Document</span>
              </span>
            );
          }

          if (!hasUrl) {
            return (
              <span className="text-xs text-gray-400 italic">No link available</span>
            );
          }

          return (
            <a
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#194611] hover:text-[#12360d] hover:underline transition"
            >
              <span>
                {res.type === "video"
                  ? "Watch Video"
                  : res.type === "link"
                  ? "Open Portal"
                  : "View Document"}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#194611]" />
            </a>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const res = row.original;

          // Read-only actions: NO edit or delete actions for Facility Admin
          const actionItems: ActionMenuItem[] = [
            {
              label: "Assign to Mentor",
              icon: <UserPlus className="w-4 h-4 text-[#194611]" />,
              onClick: () => setSelectedResourceForAssign(res),
            },
          ];

          if (res.url && res.url !== "#") {
            actionItems.push({
              label: "Open Resource",
              icon: <Eye className="w-4 h-4 text-gray-500" />,
              onClick: () => window.open(res.url, "_blank", "noopener,noreferrer"),
            });
          }

          return (
            <div className="flex items-center justify-end">
              <ActionMenu items={actionItems} triggerAriaLabel="Resource row actions" />
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
        description="Browse accredited clinical guidelines, reference manuals, and instructional videos to assign to facility preceptors."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#194611]/10 text-[#194611] border border-[#194611]/20">
            <Building2 className="w-3 h-3 text-[#FDD028]" />
            Facility Admin
          </span>
        }
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Master Resources"
          value={totalCount}
          icon={FolderOpen}
          subtext="Database clinical repository"
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
          subtext="Clinical demonstrations"
        />
        <StatCard
          title="Guideline Links"
          value={linkCount}
          icon={Link2}
          subtext="WHO & external registries"
        />
      </div>

      {/* Reusable DataTable Component */}
      <DataTable
        columns={columns}
        data={filteredData}
        searchPlaceholder="Search master resources by title, description..."
        emptyMessage="No clinical resources found in the database."
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

      {/* Assign Resource to Mentor Dialog */}
      <AssignResourceDialog
        open={Boolean(selectedResourceForAssign)}
        onOpenChange={(open) => {
          if (!open) setSelectedResourceForAssign(null);
        }}
        resource={selectedResourceForAssign}
        availableMentors={availableMentors}
        onAssigned={handleAssigned}
        onAssignFailed={handleAssignFailed}
      />
    </div>
  );
}
