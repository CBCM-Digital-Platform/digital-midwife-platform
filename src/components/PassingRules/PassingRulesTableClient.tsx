"use client";

import React, { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  SlidersHorizontal,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Scale,
  Award,
  Layers,
} from "lucide-react";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { PassingRuleFormDialog } from "@/components/PassingRules/PassingRuleFormDialog";
import { PassingRuleDeleteDialog } from "@/components/PassingRules/PassingRuleDeleteDialog";
import type {
  AssessmentPassingRule,
  EnrichedPassingRule,
} from "@/services/assessment-passing-rules.service";
import { cn } from "@/lib/utils";

interface PassingRulesTableClientProps {
  initialRules: EnrichedPassingRule[];
  cycles: Array<{ id: number; name: string }>;
  thematicAreas: Array<{ id: number; name: string; code: string }>;
}

export function PassingRulesTableClient({
  initialRules,
  cycles,
  thematicAreas,
}: PassingRulesTableClientProps) {
  const [rules, setRules] = useState<EnrichedPassingRule[]>(initialRules);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedRuleForEdit, setSelectedRuleForEdit] = useState<EnrichedPassingRule | null>(null);
  const [selectedRuleForDelete, setSelectedRuleForDelete] = useState<EnrichedPassingRule | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cycleFilter, setCycleFilter] = useState<string>("all");
  const [thematicFilter, setThematicFilter] = useState<string>("all");

  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const cycleMap = useMemo(() => new Map(cycles.map((c) => [c.id, c.name])), [cycles]);
  const thematicMap = useMemo(
    () => new Map(thematicAreas.map((t) => [t.id, { name: t.name, code: t.code }])),
    [thematicAreas]
  );

  const handleSaved = (savedRule: AssessmentPassingRule) => {
    const cycleName = savedRule.cycle_id ? cycleMap.get(savedRule.cycle_id) : undefined;
    const ta = savedRule.thematic_area_id ? thematicMap.get(savedRule.thematic_area_id) : undefined;
    const enriched: EnrichedPassingRule = {
      ...savedRule,
      cycleName,
      thematicAreaName: ta?.name,
      thematicAreaCode: ta?.code,
    };

    setRules((prev) => {
      const exists = prev.some((r) => r.id === enriched.id);
      if (exists) {
        return prev.map((r) => (r.id === enriched.id ? enriched : r));
      }
      return [enriched, ...prev];
    });

    showToast(
      "success",
      `Assessment passing rule #${savedRule.id} saved successfully.`
    );
  };

  const handleDeleted = (deletedRuleId: number) => {
    setRules((prev) => prev.filter((r) => r.id !== deletedRuleId));
    showToast("success", `Passing rule #${deletedRuleId} deactivated successfully.`);
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return rules.filter((r) => {
      if (statusFilter === "active" && !r.is_active) return false;
      if (statusFilter === "inactive" && r.is_active) return false;

      if (cycleFilter !== "all" && String(r.cycle_id) !== cycleFilter) return false;
      if (thematicFilter !== "all" && String(r.thematic_area_id) !== thematicFilter) return false;

      return true;
    });
  }, [rules, statusFilter, cycleFilter, thematicFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = rules.length;
    const active = rules.filter((r) => r.is_active).length;
    const avgTheory = total > 0
      ? Math.round(rules.reduce((acc, r) => acc + (r.theory_min_score || 0), 0) / total)
      : 0;
    const avgPractical = total > 0
      ? (rules.reduce((acc, r) => acc + (r.practical_min_score || 0), 0) / total).toFixed(1)
      : "0.0";
    return { total, active, avgTheory, avgPractical };
  }, [rules]);

  // Column definitions
  const columns = useMemo<ColumnDef<EnrichedPassingRule>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Rule ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
            #{row.original.id}
          </span>
        ),
      },
      {
        accessorKey: "cycleName",
        header: "Mentorship Cycle",
        cell: ({ row }) => {
          const rule = row.original;
          return (
            <div className="flex flex-col min-w-0 max-w-[200px]">
              <span className="font-semibold text-xs text-gray-900 truncate" title={rule.cycleName || `Cycle #${rule.cycle_id}`}>
                {rule.cycleName || (rule.cycle_id ? `Cycle #${rule.cycle_id}` : "Global Standards")}
              </span>
              {rule.cycle_id && (
                <span className="text-[10px] text-gray-400 font-mono">ID: {rule.cycle_id}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "thematicAreaName",
        header: "Clinical Domain",
        cell: ({ row }) => {
          const rule = row.original;
          return (
            <div className="flex items-center gap-2 max-w-[240px]">
              {rule.thematicAreaCode && (
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-[#194611] border border-emerald-200 shrink-0">
                  {rule.thematicAreaCode}
                </span>
              )}
              <span className="text-xs font-medium text-gray-800 truncate" title={rule.thematicAreaName || `Domain #${rule.thematic_area_id}`}>
                {rule.thematicAreaName || (rule.thematic_area_id ? `Domain #${rule.thematic_area_id}` : "All Domains")}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "criteria_min_score",
        header: "Criteria Min",
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {row.original.criteria_min_score}%
          </span>
        ),
      },
      {
        accessorKey: "theory_min_score",
        header: "Theory Exam Min",
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            {row.original.theory_min_score}%
          </span>
        ),
      },
      {
        accessorKey: "practical_min_score",
        header: "Practical OSCE Min",
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Level {row.original.practical_min_score} / 5
          </span>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => {
          const active = row.original.is_active;
          return (
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap",
                active
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              )}
            >
              {active ? "Active" : "Inactive"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const rule = row.original;
          return (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedRuleForEdit(rule)}
                className="p-1.5 text-gray-500 hover:text-[#194611] hover:bg-emerald-50 rounded-md transition cursor-pointer"
                title="Edit passing rule"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedRuleForDelete(rule)}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                title="Deactivate rule"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200",
            toastMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          )}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-gray-700 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Assessment Passing Rules"
        description="System administrator configuration of minimum theory exam, practical clinical OSCE, and criteria score thresholds."
      />

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <Scale className="h-4 w-4 text-[#194611]" />
            <span>Configured Rules</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Active Standards</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-800">{stats.active}</p>
        </div>

        <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <Award className="h-4 w-4 text-blue-600" />
            <span>Avg. Theory Target</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-900">{stats.avgTheory}%</p>
        </div>

        <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <Layers className="h-4 w-4 text-amber-600" />
            <span>Avg. Practical Level</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-900">{stats.avgPractical} / 5</p>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        searchPlaceholder="Search passing rules by cycle or clinical domain..."
        emptyMessage={
          rules.length === 0
            ? "No assessment passing rules have been configured yet. Click 'New Passing Rule' to define score thresholds."
            : "No assessment passing rules match the selected filter criteria."
        }
        actions={
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#194611] hover:bg-[#12330c] text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>New Passing Rule</span>
          </button>
        }
        filters={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194611] cursor-pointer"
              aria-label="Filter by rule status"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* Cycle Filter */}
            {cycles.length > 0 && (
              <select
                value={cycleFilter}
                onChange={(e) => setCycleFilter(e.target.value)}
                className="h-9 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194611] cursor-pointer max-w-[160px] truncate"
                aria-label="Filter by mentorship cycle"
              >
                <option value="all">All Cycles</option>
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {/* Thematic Area Filter */}
            {thematicAreas.length > 0 && (
              <select
                value={thematicFilter}
                onChange={(e) => setThematicFilter(e.target.value)}
                className="h-9 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194611] cursor-pointer max-w-[180px] truncate"
                aria-label="Filter by clinical domain"
              >
                <option value="all">All Domains</option>
                {thematicAreas.map((ta) => (
                  <option key={ta.id} value={ta.id}>
                    [{ta.code}] {ta.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        }
      />

      {/* Add Rule Dialog */}
      <PassingRuleFormDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        cycles={cycles}
        thematicAreas={thematicAreas}
        onSuccess={handleSaved}
      />

      {/* Edit Rule Dialog */}
      {selectedRuleForEdit && (
        <PassingRuleFormDialog
          open={Boolean(selectedRuleForEdit)}
          onOpenChange={(open) => !open && setSelectedRuleForEdit(null)}
          rule={selectedRuleForEdit}
          cycles={cycles}
          thematicAreas={thematicAreas}
          onSuccess={handleSaved}
        />
      )}

      {/* Delete / Deactivate Rule Dialog */}
      {selectedRuleForDelete && (
        <PassingRuleDeleteDialog
          open={Boolean(selectedRuleForDelete)}
          onOpenChange={(open) => !open && setSelectedRuleForDelete(null)}
          rule={selectedRuleForDelete}
          onSuccess={handleDeleted}
        />
      )}
    </div>
  );
}
