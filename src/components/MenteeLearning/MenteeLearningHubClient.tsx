"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import {
  BookOpen,
  Video,
  ClipboardCheck,
  FileText,
  Link2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  User,
  MapPin,
  UploadCloud,
  CheckSquare,
  ArrowUpRight,
  Loader2,
  Sparkles,
  Info,
  LayoutGrid,
  Table as TableIcon,
  Play,
  FileCheck,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  MenteeAssessmentItem,
  MenteeSessionItem,
  MenteeResourceItem,
  joinSession,
} from "@/services/mentee.service";

interface MenteeLearningHubClientProps {
  initialResources: MenteeResourceItem[];
  initialSessions: MenteeSessionItem[];
  initialAssessments: MenteeAssessmentItem[];
}

export function MenteeLearningHubClient({
  initialResources,
  initialSessions,
  initialAssessments,
}: MenteeLearningHubClientProps) {
  const [activeTab, setActiveTab] = useState<string>("resources");
  const [resourceViewMode, setResourceViewMode] = useState<"table" | "grid">("table");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("all");

  // Joining session state
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);

  // Active Assessment for Evidence/Checklist Modal
  const [selectedAssessment, setSelectedAssessment] =
    useState<MenteeAssessmentItem | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceNotes, setEvidenceNotes] = useState<string>("");
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState<boolean>(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "info" | "error";
    text: string;
  } | null>(null);

  const showToast = (text: string, type: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Handle joining a virtual video call
  const handleJoinCall = async (session: MenteeSessionItem) => {
    try {
      setJoiningSessionId(session.id);
      showToast(`Initiating secure clinical video bridge for "${session.title}"...`, "info");
      
      const { joinUrl } = await joinSession(session.id);
      
      // Open video call link in new tab
      if (typeof window !== "undefined") {
        window.open(joinUrl, "_blank", "noopener,noreferrer");
      }
      showToast(`Connected to video session with ${session.mentorName}`, "success");
    } catch (err: any) {
      showToast(err?.message || "Could not launch video session room", "error");
    } finally {
      setJoiningSessionId(null);
    }
  };

  // Evidence submit mock handler
  const handleSubmitEvidence = () => {
    if (!evidenceFile && !evidenceNotes.trim()) {
      showToast("Please select a file or provide clinical case notes.", "error");
      return;
    }
    setIsSubmittingEvidence(true);
    setTimeout(() => {
      setIsSubmittingEvidence(false);
      showToast(
        `Clinical evidence for "${selectedAssessment?.title}" submitted to preceptor for verification!`,
        "success"
      );
      setSelectedAssessment(null);
      setEvidenceFile(null);
      setEvidenceNotes("");
    }, 1200);
  };

  // Resource Filter
  const filteredResources = useMemo(() => {
    if (resourceTypeFilter === "all") return initialResources;
    return initialResources.filter((r) => r.type === resourceTypeFilter);
  }, [initialResources, resourceTypeFilter]);

  // Statistics
  const totalResources = initialResources.length;
  const activeSessionsCount = initialSessions.filter((s) => s.isActiveNow).length;
  const totalUpcomingSessions = initialSessions.length;
  const pendingAssessmentsCount = initialAssessments.filter(
    (a) => a.status === "PENDING" || a.status === "NEEDS_REVIEW"
  ).length;

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return "Flexible timeline";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "Date to be confirmed";
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Columns for Resources DataTable
  const resourceColumns = useMemo<ColumnDef<MenteeResourceItem>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Resource Title",
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
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                  {res.description}
                </p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                  {res.fileName && (
                    <span className="truncate max-w-[200px]">
                      {res.fileName}
                      {res.fileSizeMb ? ` (${res.fileSizeMb} MB)` : ""}
                    </span>
                  )}
                  {res.assignedBy && (
                    <span>Assigned by {res.assignedBy}</span>
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
                  <span>Clinical Demo</span>
                </Badge>
              )}
              {type === "link" && (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-800 border-amber-200 font-semibold text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5"
                >
                  <Link2 className="w-3 h-3" />
                  <span>Online Guideline</span>
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "assignedAt",
        header: "Assigned Date",
        cell: ({ row }) => {
          return (
            <span className="text-xs text-gray-600 font-medium">
              {formatDate(row.original.assignedAt)}
            </span>
          );
        },
      },
      {
        id: "action",
        header: "Access",
        cell: ({ row }) => {
          const res = row.original;
          const hasLink = Boolean(res.url && res.url !== "#");

          return (
            <div>
              {hasLink ? (
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#194611]/10 text-[#194611] hover:bg-[#194611] hover:text-white transition"
                >
                  <span>Open Resource</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-medium border-gray-200 text-gray-700 hover:border-[#194611] hover:text-[#194611]"
                  onClick={() =>
                    showToast(
                      `Downloading ${res.fileName || res.title}...`,
                      "info"
                    )
                  }
                >
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  <span>View Material</span>
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {toastMessage && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2",
            toastMessage.type === "success" &&
              "bg-emerald-50 border-emerald-200 text-[#194611]",
            toastMessage.type === "info" &&
              "bg-indigo-50 border-indigo-200 text-indigo-900",
            toastMessage.type === "error" && "bg-rose-50 border-rose-200 text-rose-800"
          )}
        >
          {toastMessage.type === "success" && (
            <CheckCircle2 className="w-4 h-4 text-[#194611]" />
          )}
          {toastMessage.type === "info" && (
            <Info className="w-4 h-4 text-indigo-600" />
          )}
          {toastMessage.type === "error" && (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Clinical Resources & Mentee Hub"
        description="Comprehensive clinical curriculum, preceptor mentoring sessions, and practical competency assessments."
        badge={
          <Badge
            variant="outline"
            className="bg-[#194611]/10 text-[#194611] border-[#194611]/20 font-semibold px-2.5 py-0.5"
          >
            Clinical Cohort 2026
          </Badge>
        }
        actions={
          <Link href="/learning">
            <Button className="bg-[#194611] hover:bg-[#14370d] text-white text-xs font-bold h-10 px-5 rounded-xl flex items-center gap-2 shadow-md shadow-[#194611]/20 cursor-pointer transition">
              <Play className="w-4 h-4 fill-current text-[#FDD028]" />
              <span>Resume Active Lesson (AMTSL)</span>
            </Button>
          </Link>
        }
      />

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Resources"
          value={totalResources}
          icon={BookOpen}
          subtext="Standard clinical manuals & guides"
        />
        <StatCard
          title="Upcoming Sessions"
          value={totalUpcomingSessions}
          icon={Calendar}
          subtext={
            activeSessionsCount > 0 ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {activeSessionsCount} active session now
              </span>
            ) : (
              "Virtual & facility bedside rounds"
            )
          }
        />
        <StatCard
          title="Pending Assessments"
          value={pendingAssessmentsCount}
          icon={ClipboardCheck}
          subtext="Competency checklists & evidence"
        />
        <StatCard
          title="Clinical Progress"
          value="78%"
          icon={Sparkles}
          subtext="Midwifery milestone pathway"
        />
      </div>

      {/* Main Tabs Navigation */}
      <Tabs
        defaultValue="resources"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200/80 pb-3">
          <TabsList className="bg-gray-100/80 p-1 rounded-xl border border-gray-200/60 inline-flex">
            <TabsTrigger
              value="resources"
              className="data-[selected]:bg-white data-[selected]:text-[#194611] data-[selected]:shadow-xs px-4 py-2 font-medium text-xs rounded-lg flex items-center gap-2"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Assigned Resources</span>
              <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700">
                {totalResources}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="sessions"
              className="data-[selected]:bg-white data-[selected]:text-[#194611] data-[selected]:shadow-xs px-4 py-2 font-medium text-xs rounded-lg flex items-center gap-2"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Mentoring Sessions</span>
              {activeSessionsCount > 0 ? (
                <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold animate-pulse">
                  {activeSessionsCount} LIVE
                </span>
              ) : (
                <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700">
                  {totalUpcomingSessions}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="assessments"
              className="data-[selected]:bg-white data-[selected]:text-[#194611] data-[selected]:shadow-xs px-4 py-2 font-medium text-xs rounded-lg flex items-center gap-2"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Pending Assessments</span>
              <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                {pendingAssessmentsCount}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* =========================================================================
            TAB 1: ASSIGNED CLINICAL RESOURCES
            ========================================================================= */}
        <TabsContent value="resources" className="space-y-4 outline-none">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Assigned Clinical Learning Materials
              </h2>
              <p className="text-xs text-gray-500">
                Read-only repository of evidence-based clinical protocols assigned by facility preceptors.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Type Filter */}
              <select
                value={resourceTypeFilter}
                onChange={(e) => setResourceTypeFilter(e.target.value)}
                className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194611] cursor-pointer"
              >
                <option value="all">All Types ({totalResources})</option>
                <option value="document">Documents</option>
                <option value="video">Clinical Videos</option>
                <option value="link">Web Guidelines</option>
              </select>

              {/* View Switcher: Table vs Card Grid */}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setResourceViewMode("table")}
                  className={cn(
                    "p-1.5 rounded-md text-xs font-medium transition cursor-pointer",
                    resourceViewMode === "table"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                  title="Table View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setResourceViewMode("grid")}
                  className={cn(
                    "p-1.5 rounded-md text-xs font-medium transition cursor-pointer",
                    resourceViewMode === "grid"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {resourceViewMode === "table" ? (
            <DataTable
              columns={resourceColumns}
              data={filteredResources}
              searchPlaceholder="Search assigned resources by title, mentor, description..."
              emptyMessage="No assigned clinical resources found."
              pageSize={8}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((res) => (
                <div
                  key={res.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:border-[#194611]/40 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                          res.type === "document" &&
                            "bg-emerald-50 border-emerald-200 text-[#194611]",
                          res.type === "video" &&
                            "bg-indigo-50 border-indigo-200 text-indigo-700",
                          res.type === "link" &&
                            "bg-amber-50 border-amber-200 text-amber-700"
                        )}
                      >
                        {res.type === "video" ? (
                          <Video className="w-5 h-5" />
                        ) : res.type === "link" ? (
                          <Link2 className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[11px] capitalize font-medium"
                      >
                        {res.type}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">
                      {res.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                      {res.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span className="text-[11px] text-gray-400">
                      {res.assignedBy || "Facility Preceptor"}
                    </span>
                    {res.url && res.url !== "#" ? (
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#194611] hover:underline text-xs"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[11px] font-medium text-gray-600">
                        {res.fileName || "File attached"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* =========================================================================
            TAB 2: UPCOMING MENTORING SESSIONS
            ========================================================================= */}
        <TabsContent value="sessions" className="space-y-4 outline-none">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Upcoming Mentorship & Bedside Sessions
              </h2>
              <p className="text-xs text-gray-500">
                Scheduled virtual reviews, simulated skills drills, and facility mentoring rounds.
              </p>
            </div>
          </div>

          {initialSessions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-gray-800">
                No Mentoring Sessions Scheduled
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Your preceptors have not scheduled upcoming sessions yet. New sessions will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialSessions.map((session) => {
                const isVirtual = session.mode === "virtual";
                const isJoining = joiningSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    className={cn(
                      "bg-white rounded-xl border p-5 shadow-xs transition flex flex-col justify-between relative overflow-hidden",
                      session.isActiveNow
                        ? "border-emerald-300 ring-2 ring-emerald-500/10"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {/* Active Session Top Banner */}
                    {session.isActiveNow && (
                      <div className="bg-emerald-600 text-white text-[11px] font-bold px-4 py-1 -mx-5 -mt-5 mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                          <span>SESSION IN PROGRESS (JOIN NOW)</span>
                        </span>
                        <span className="text-emerald-100 font-normal">
                          Preceptor is waiting online
                        </span>
                      </div>
                    )}

                    <div>
                      {/* Session Header / Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5",
                              isVirtual
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-teal-50 text-teal-800 border-teal-200"
                            )}
                          >
                            {isVirtual ? (
                              <>
                                <Video className="w-3 h-3" />
                                <span>Virtual Video Call</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="w-3 h-3" />
                                <span>In-Person Bedside</span>
                              </>
                            )}
                          </Badge>

                          <span className="text-xs text-gray-500 font-medium inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>{session.durationMinutes} mins</span>
                          </span>
                        </div>

                        {session.status === "in_progress" && (
                          <Badge className="bg-emerald-600 text-white font-semibold text-[10px]">
                            Live
                          </Badge>
                        )}
                      </div>

                      {/* Title & Goals */}
                      <h3 className="font-bold text-gray-900 text-base mb-1.5">
                        {session.title}
                      </h3>

                      {session.sessionGoals && (
                        <p className="text-xs text-gray-600 mb-3 bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                          <strong className="text-gray-800 font-semibold">Goal: </strong>
                          {session.sessionGoals}
                        </p>
                      )}

                      {/* Mentor Info & Schedule */}
                      <div className="space-y-2 mb-4 text-xs">
                        <div className="flex items-center gap-2 text-gray-700">
                          <User className="w-4 h-4 text-[#194611]" />
                          <span className="font-semibold">{session.mentorName}</span>
                          {session.mentorRole && (
                            <span className="text-gray-400">• {session.mentorRole}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">
                            {formatDateTime(session.scheduledAt)}
                          </span>
                        </div>

                        {session.clinicalSetting && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{session.clinicalSetting}</span>
                          </div>
                        )}

                        {session.preparationNotes && (
                          <div className="mt-2 text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60">
                            <strong>Mentee Prep: </strong>
                            {session.preparationNotes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button: Join Video Call or Facility Guidance */}
                    <div className="pt-3 border-t border-gray-100">
                      {isVirtual ? (
                        <Button
                          onClick={() => handleJoinCall(session)}
                          disabled={isJoining}
                          className={cn(
                            "w-full font-bold text-xs h-10 transition rounded-xl flex items-center justify-center gap-2",
                            session.isActiveNow
                              ? "bg-[#194611] hover:bg-[#14370d] text-white shadow-md shadow-[#194611]/20"
                              : "bg-gray-900 hover:bg-gray-800 text-white"
                          )}
                        >
                          {isJoining ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Connecting to Video Call...</span>
                            </>
                          ) : (
                            <>
                              <Video className="w-4 h-4" />
                              <span>
                                {session.isActiveNow
                                  ? "Join Video Call Now"
                                  : "Join Video Call (Room Ready)"}
                              </span>
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-center text-xs text-gray-600 font-medium">
                          In-person observation session. Check in at the facility station 10 minutes before rounds.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* =========================================================================
            TAB 3: PENDING COMPETENCY ASSESSMENTS
            ========================================================================= */}
        <TabsContent value="assessments" className="space-y-4 outline-none">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Pending Clinical Competency Assessments
              </h2>
              <p className="text-xs text-gray-500">
                Track your active case plots, skill verification checklists, and required clinical evidence submissions.
              </p>
            </div>
          </div>

          {initialAssessments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <ClipboardCheck className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-gray-800">
                No Pending Assessments
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                All clinical competency evaluations are up to date! Check back when your mentor assigns your next module.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {initialAssessments.map((assessment) => {
                const percentCompleted =
                  assessment.checklistTotal > 0
                    ? Math.round(
                        (assessment.checklistCompleted /
                          assessment.checklistTotal) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={assessment.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:border-gray-300 transition"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left: Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#194611] border-emerald-200"
                          >
                            {assessment.type}
                          </Badge>

                          {/* Requirement Flags */}
                          {assessment.needsEvidence && (
                            <Badge
                              variant="outline"
                              className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1"
                            >
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>Evidence Upload Required</span>
                            </Badge>
                          )}

                          {assessment.needsChecklist && (
                            <Badge
                              variant="outline"
                              className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1"
                            >
                              <CheckSquare className="w-3 h-3 text-blue-600" />
                              <span>Checklist Items Incomplete</span>
                            </Badge>
                          )}

                          {!assessment.needsEvidence && !assessment.needsChecklist && (
                            <Badge
                              variant="outline"
                              className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3 text-purple-600" />
                              <span>Awaiting Mentor Sign-Off</span>
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-bold text-gray-900 text-base">
                          {assessment.title}
                        </h3>

                        {assessment.instructions && (
                          <p className="text-xs text-gray-600 leading-relaxed max-w-3xl">
                            {assessment.instructions}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                          {assessment.mentorName && (
                            <span className="flex items-center gap-1.5 font-medium text-gray-700">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              <span>Evaluating Mentor: {assessment.mentorName}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>Target Due Date: {formatDate(assessment.dueDate)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Right: Progress & Action */}
                      <div className="lg:w-72 flex flex-col gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                        {/* Checklist progress bar */}
                        <div>
                          <div className="flex items-center justify-between text-xs font-semibold mb-1">
                            <span className="text-gray-700">Checklist Progress</span>
                            <span className="text-[#194611]">
                              {assessment.checklistCompleted} / {assessment.checklistTotal} verified ({percentCompleted}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[#194611] h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentCompleted}%` }}
                            />
                          </div>
                        </div>

                        {/* Evidence Status */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Verified Evidence Documents:</span>
                          <span className="font-bold text-gray-900">
                            {assessment.evidenceCount} file{assessment.evidenceCount === 1 ? "" : "s"}
                          </span>
                        </div>

                        {/* Action: Open evidence / checklist submission dialog */}
                        <Button
                          onClick={() => setSelectedAssessment(assessment)}
                          size="sm"
                          className="w-full bg-white hover:bg-gray-50 text-[#194611] border border-[#194611] font-semibold text-xs h-9 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          <UploadCloud className="w-4 h-4 text-[#194611]" />
                          <span>Submit Clinical Evidence</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* =========================================================================
          EVIDENCE SUBMISSION & CHECKLIST MODAL DIALOG
          ========================================================================= */}
      <Dialog
        open={Boolean(selectedAssessment)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAssessment(null);
            setEvidenceFile(null);
            setEvidenceNotes("");
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#194611]" />
              <span>Submit Clinical Evidence</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Provide clinical documentation, scanned partograph records, or supervised shift notes for mentor verification.
            </DialogDescription>
          </DialogHeader>

          {selectedAssessment && (
            <div className="space-y-4 py-2">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Assessment Focus
                </span>
                <p className="font-semibold text-gray-900 text-sm mt-0.5">
                  {selectedAssessment.title}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-600 mt-2">
                  <span>Assigned Mentor: <strong>{selectedAssessment.mentorName}</strong></span>
                  <span>•</span>
                  <span>Target Due Date: <strong>{formatDate(selectedAssessment.dueDate)}</strong></span>
                </div>
              </div>

              {/* Checklist completion summary */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 block">
                  Checklist Criteria Verification Status
                </label>
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3 text-xs text-gray-700 flex items-center justify-between">
                  <span>
                    <strong>{selectedAssessment.checklistCompleted}</strong> of{" "}
                    <strong>{selectedAssessment.checklistTotal}</strong> items observed & signed by preceptor
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-white text-[#194611] border-emerald-300 font-bold"
                  >
                    {Math.round(
                      (selectedAssessment.checklistCompleted /
                        selectedAssessment.checklistTotal) *
                        100
                    )}
                    %
                  </Badge>
                </div>
              </div>

              {/* Upload Case File */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 block">
                  Upload Case Plot / Supervision Record (PDF, JPG, PNG)
                </label>
                <div className="border-2 border-dashed border-gray-300 hover:border-[#194611] rounded-xl p-4 text-center cursor-pointer transition bg-gray-50/50">
                  <input
                    type="file"
                    id="evidence-upload"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setEvidenceFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label
                    htmlFor="evidence-upload"
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    <UploadCloud className="w-8 h-8 text-[#194611] mb-1" />
                    {evidenceFile ? (
                      <span className="text-xs font-bold text-gray-900">
                        Selected: {evidenceFile.name} ({(evidenceFile.size / 1024).toFixed(1)} KB)
                      </span>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-gray-800">
                          Click to browse case document or drop file here
                        </span>
                        <span className="text-[11px] text-gray-400 mt-0.5">
                          Maximum file size 10MB
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Mentee Clinical Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 block">
                  Clinical Reflection / Case Notes (Optional)
                </label>
                <textarea
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  placeholder="Detail clinical context, patient vital observations, or specific questions for your mentor..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#194611] bg-white resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedAssessment(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSubmittingEvidence}
              onClick={handleSubmitEvidence}
              className="bg-[#194611] hover:bg-[#14370d] text-white text-xs font-bold px-4"
            >
              {isSubmittingEvidence ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit to Preceptor</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
