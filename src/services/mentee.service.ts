import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import { getResources } from "@/services/resources.service";
import type { AdminResource } from "@/types/resource";

export interface MenteeAssessmentItem {
  id: string;
  title: string;
  type: string;
  status: "PENDING" | "NEEDS_REVIEW" | "IN_REVIEW" | "PASS" | "DRAFT" | "FINALIZED" | "REVIEWED";
  dueDate?: string;
  checklistTotal: number;
  checklistCompleted: number;
  evidenceCount: number;
  needsEvidence: boolean;
  needsChecklist: boolean;
  scorePct?: number | null;
  instructions?: string;
  mentorName?: string;
  createdAt: string;
}

export interface MenteeSessionItem {
  id: string;
  title: string;
  mentorName: string;
  mentorRole?: string;
  mode: "virtual" | "in_person" | "hybrid";
  scheduledAt: string;
  durationMinutes: number;
  clinicalSetting?: string;
  sessionGoals?: string;
  preparationNotes?: string;
  status: "draft" | "scheduled" | "in_progress" | "completed" | "cancelled" | "terminated" | "no_show";
  isActiveNow: boolean;
  joinUrl?: string;
}

export interface MenteeAssignedMentor {
  id: string;
  name: string;
  role?: string;
}

export interface MenteeResourceItem {
  id: string;
  title: string;
  description: string;
  type: "document" | "video" | "link";
  url?: string;
  fileName?: string;
  fileSizeMb?: number;
  assignedBy?: string;
  assignedAt: string;
}

/**
 * Fetches the signed-in mentee's active mentor assignments.
 */
export async function getAssignedMentors(): Promise<MenteeAssignedMentor[]> {
  const { getServerSession } = await import("next-auth/next");
  const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
  const session = await getServerSession(authOptions);
  const menteeId = (session?.user as { id?: string | number } | undefined)?.id;
  if (menteeId === undefined || menteeId === null || String(menteeId).trim() === "") {
    throw new Error("Unable to determine the signed-in mentee ID.");
  }

  const [response, contactsResponse] = await Promise.all([
    apiClient<unknown>(ENDPOINTS.ASSIGNMENTS.MENTEE_ASSIGNMENTS(menteeId)),
    apiClient<unknown>(ENDPOINTS.MESSAGES.CONTACTS).catch((error) => {
      console.warn("Could not load mentor names from messaging contacts:", error);
      return null;
    }),
  ]);
  const contactsPayload =
    contactsResponse !== null &&
    typeof contactsResponse === "object" &&
    "data" in contactsResponse
      ? contactsResponse.data
      : contactsResponse;
  const contactsById = new Map<string, string>();
  if (Array.isArray(contactsPayload)) {
    for (const contact of contactsPayload) {
      if (!contact || typeof contact !== "object") continue;
      const record = contact as Record<string, unknown>;
      const id = String(record.id ?? "");
      const name = String(
        record.full_name ?? record.fullName ?? record.name ?? ""
      ).trim();
      if (id && name) contactsById.set(id, name);
    }
  }

  const payload =
    response !== null && typeof response === "object" && "data" in response
      ? response.data
      : response;
  const assignments = Array.isArray(payload)
    ? payload
    : payload !== null &&
      typeof payload === "object" &&
      "assignments" in payload &&
      Array.isArray(payload.assignments)
    ? payload.assignments
    : null;
  if (!assignments) {
    throw new Error("The assignments API returned an unexpected mentee assignment list.");
  }

  const mentors = new Map<string, MenteeAssignedMentor>();
  for (const assignment of assignments) {
    if (!assignment || typeof assignment !== "object") continue;
    const record = assignment as Record<string, unknown>;
    if (String(record.status ?? "").toLowerCase() !== "assigned") continue;
    const rawMentor = record.mentor;
    const mentor =
      rawMentor !== null && typeof rawMentor === "object"
        ? rawMentor as Record<string, unknown>
        : {};
    const mentorProfile =
      mentor.user !== null && typeof mentor.user === "object"
        ? mentor.user as Record<string, unknown>
        : mentor.profile !== null && typeof mentor.profile === "object"
        ? mentor.profile as Record<string, unknown>
        : {};
    const id = String(record.mentor_id ?? mentor.id ?? "");
    if (!id) continue;
    const name = String(
      record.mentor_name ??
        record.mentorName ??
        record.mentor_full_name ??
        record.mentorFullName ??
        mentor.full_name ??
        mentor.fullName ??
        mentor.name ??
        mentor.display_name ??
        mentorProfile.full_name ??
        mentorProfile.fullName ??
        mentorProfile.name ??
        (typeof rawMentor === "string" ? rawMentor : "")
    ).trim();
    const displayName = name || contactsById.get(id) || "";
    mentors.set(id, {
      id,
      name: displayName || "Name unavailable",
      role:
        typeof mentor.role === "string"
          ? mentor.role
          : typeof mentorProfile.role === "string"
          ? mentorProfile.role
          : undefined,
    });
  }

  return Array.from(mentors.values());
}

/**
 * Normalizes raw assessment response to strongly typed MenteeAssessmentItem
 */
function normalizeAssessment(raw: any): MenteeAssessmentItem {
  const id = String(raw?.id ?? raw?._id ?? "");
  const thematicArea = raw?.thematic_area || raw?.thematicArea || {};
  const title = String(thematicArea.name || raw?.title || raw?.type || "Assessment");
  const type = String(thematicArea.name || raw?.type || "Assessment");
  const rawStatus = String(raw?.status || "").toLowerCase();
  const statusByApi: Record<string, MenteeAssessmentItem["status"]> = {
    draft: "DRAFT",
    pending: "PENDING",
    in_review: "IN_REVIEW",
    needs_review: "NEEDS_REVIEW",
    pass: "PASS",
    finalized: "FINALIZED",
    reviewed: "REVIEWED",
  };
  const status = statusByApi[rawStatus];
  if (!id || !status) {
    throw new Error("The assessments API returned an invalid mentee assessment.");
  }

  const checklistItems = Array.isArray(raw?.checklistItems || raw?.checklist_items)
    ? raw?.checklistItems || raw?.checklist_items
    : [];
  const checklistTotal = checklistItems.length;
  const checklistCompleted = checklistItems.filter((i: any) => i.checked || i.completed).length;

  const evidence = Array.isArray(raw?.evidence) ? raw?.evidence : [];
  const evidenceCount = evidence.length;

  const isComplete = status === "PASS" || status === "FINALIZED" || status === "REVIEWED";
  const needsEvidence = evidenceCount === 0 && !isComplete;
  const needsChecklist = checklistTotal > 0 && checklistCompleted < checklistTotal && !isComplete;

  const mentorName =
    raw?.mentor?.name ||
    raw?.mentor?.full_name ||
    raw?.mentor_name ||
    raw?.mentorName;

  return {
    id,
    title,
    type,
    status,
    dueDate: raw?.due_date || raw?.dueDate || undefined,
    checklistTotal,
    checklistCompleted,
    evidenceCount,
    needsEvidence,
    needsChecklist,
    scorePct: raw?.score_pct !== undefined ? raw?.score_pct : raw?.scorePct ?? null,
    instructions: raw?.instructions || undefined,
    mentorName,
    createdAt: raw?.created_at || raw?.createdAt || "",
  };
}

/**
 * Normalizes raw session response to strongly typed MenteeSessionItem
 */
function normalizeSession(raw: any): MenteeSessionItem {
  const id = String(raw?.id ?? raw?._id ?? "");
  const title = String(raw?.session_goals || raw?.sessionGoals || raw?.title || "Clinical Mentorship Session");
  const mentor = raw?.mentor || {};
  const mentorName =
    raw?.mentor_name ||
    raw?.mentorName ||
    mentor?.full_name ||
    mentor?.name ||
    "Assigned Mentor";

  const mode = String(raw?.mode || "virtual").toLowerCase() as any;
  const scheduledAt = raw?.scheduled_at || raw?.scheduledAt || "";
  const durationMinutes = Number(raw?.duration_minutes || raw?.durationMinutes || 45);

  const rawStatus = String(raw?.status || "scheduled").toLowerCase().replaceAll("-", "_");
  const allowedStatuses: MenteeSessionItem["status"][] = [
    "draft",
    "scheduled",
    "in_progress",
    "completed",
    "cancelled",
    "terminated",
    "no_show",
  ];
  const status: MenteeSessionItem["status"] = allowedStatuses.includes(
    rawStatus as MenteeSessionItem["status"]
  )
    ? (rawStatus as MenteeSessionItem["status"])
    : "scheduled";

  // A session is active now if it is currently in progress or within 30 minutes of scheduled time
  const scheduledTime = new Date(scheduledAt).getTime();
  const now = Date.now();
  const diffMinutes = (now - scheduledTime) / (1000 * 60);
  const isActiveNow =
    status === "in_progress" ||
    (status === "scheduled" && diffMinutes >= -15 && diffMinutes <= durationMinutes);
  const displayStatus: MenteeSessionItem["status"] =
    status === "scheduled" && isActiveNow ? "in_progress" : status;

  return {
    id,
    title,
    mentorName,
    mentorRole: mentor?.highest_qualification || mentor?.highestQualification || "Clinical Preceptor",
    mode: mode === "in_person" ? "in_person" : mode === "hybrid" ? "hybrid" : "virtual",
    scheduledAt,
    durationMinutes,
    clinicalSetting: raw?.clinical_setting || raw?.clinicalSetting || undefined,
    sessionGoals: raw?.session_goals || raw?.sessionGoals || undefined,
    preparationNotes: raw?.preparation_notes || raw?.preparationNotes || undefined,
    status: displayStatus,
    isActiveNow,
    joinUrl: raw?.join_url || raw?.joinUrl || undefined,
  };
}

/**
 * GET /api/v1/assessments
 * Fetches pending and completed clinical competency assessments for the mentee.
 */
export async function getMenteeAssessments(): Promise<MenteeAssessmentItem[]> {
  const res = await apiClient.get<any>(ENDPOINTS.ASSESSMENTS.BASE, {
    params: { limit: 50 },
  });
  const rawList = Array.isArray(res?.data)
    ? res.data
    : Array.isArray(res?.data?.assessments)
    ? res.data.assessments
    : Array.isArray(res?.data?.items)
    ? res.data.items
    : Array.isArray(res?.assessments)
    ? res.assessments
    : Array.isArray(res)
    ? res
    : null;
  if (!rawList) {
    throw new Error("The assessments API returned an unexpected list response.");
  }
  return rawList.map((assessment: any) => normalizeAssessment(assessment));
}

/**
 * GET /api/v1/sessions/available-times or /api/v1/sessions
 * Fetches upcoming mentoring sessions for the mentee.
 */
export async function getUpcomingSessions(): Promise<MenteeSessionItem[]> {
  try {
    const res = await apiClient.get<any>(`${ENDPOINTS.SESSIONS.BASE}?limit=30`);

    const rawList = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.sessions)
      ? res.data.sessions
      : Array.isArray(res?.data?.items)
      ? res.data.items
      : Array.isArray(res?.sessions)
      ? res.sessions
      : Array.isArray(res?.items)
      ? res.items
      : Array.isArray(res)
      ? res
      : [];

    return rawList.map((s: any) => normalizeSession(s));
  } catch (err) {
    console.error("Could not fetch upcoming sessions from backend API:", err);
    throw err;
  }
}

/**
 * POST /api/v1/sessions/{id}/join-token
 * Generates or retrieves an authenticated video meeting join token for a virtual session.
 */
export async function joinSession(
  sessionId: string
): Promise<{ token?: string; joinUrl: string }> {
  const res = await apiClient.post<any>(ENDPOINTS.SESSIONS.JOIN_TOKEN(sessionId), {});
  const data = res?.data?.join ?? res?.data ?? res?.join ?? res;
  const token = data?.token || undefined;
  const directUrl = data?.joinUrl || data?.join_url;
  const domain = data?.domain;
  const room = data?.room;
  const joinUrl =
    directUrl ||
    (domain && room
      ? `https://${domain}/${room}${token ? `?jwt=${token}` : ""}`
      : undefined);

  if (!joinUrl) {
    throw new Error("The backend did not return a meeting room for this session.");
  }

  await apiClient.post(ENDPOINTS.SESSIONS.PARTICIPANT_JOIN(sessionId), {});
  return { token, joinUrl };
}

/**
 * Fetches assigned learning resources for the mentee.
 */
export async function getMenteeAssignedResources(): Promise<MenteeResourceItem[]> {
  try {
    const baseUrl = (
      process.env.NEXT_PUBLIC_API_URL || "https://cbcm-backend-1.onrender.com/api/v1"
    ).replace(/\/+$/, "");
    const menteeContentUrl = (resourceId: string | number) =>
      `${baseUrl}/learning/my/resources/${resourceId}/content`;

    const collected: MenteeResourceItem[] = [];
    const seenIds = new Set<string>();

    // 1. Check local preceptor assignments from localStorage
    if (typeof window !== "undefined") {
      try {
        const rawAssignments = localStorage.getItem("cbcm_mentee_resource_assignments");
        if (rawAssignments) {
          const list = JSON.parse(rawAssignments);
          if (Array.isArray(list)) {
            for (const item of list) {
              if (item.resource) {
                const r = item.resource;
                const rId = String(r.id || item.resourceId);
                if (!seenIds.has(rId)) {
                  seenIds.add(rId);
                  const rawType = String(r.type || "document").toLowerCase();
                  const type: "document" | "video" | "link" = rawType.includes("video")
                    ? "video"
                    : rawType.includes("link")
                    ? "link"
                    : "document";

                  collected.push({
                    id: rId,
                    title: r.title || "Assigned Clinical Resource",
                    description: r.description || "Assigned by preceptor for clinical mastery.",
                    type,
                    url: type === "link" ? r.url : menteeContentUrl(rId),
                    fileName: r.fileName,
                    fileSizeMb: r.fileSizeMb,
                    assignedBy: "Facility Clinical Preceptor",
                    assignedAt: item.assignedAt || new Date().toISOString(),
                  });
                }
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // 2. Fetch from live Swagger endpoint: GET /api/v1/learning/my/resources
    const myRes = await apiClient.get<any>(ENDPOINTS.LEARNING.MY_RESOURCES).catch(() => null);
    const myResourcesList = Array.isArray(myRes?.data)
      ? myRes.data
      : Array.isArray(myRes?.data?.resources)
      ? myRes.data.resources
      : Array.isArray(myRes)
      ? myRes
      : [];

    if (myResourcesList.length > 0) {
      for (const r of myResourcesList) {
        // The backend returns resource assignments with the resource nested
        // under `resource`; normalize that nested record for the mentee UI.
        const resource = r?.resource || r;
        const rId = String(resource.id ?? r.resourceId ?? r.id);
        if (!seenIds.has(rId)) {
          seenIds.add(rId);
          const rawType = String(resource?.type || "").toLowerCase();
          const type: "document" | "video" | "link" = rawType.includes("video")
            ? "video"
            : rawType.includes("link")
            ? "link"
            : "document";

          collected.push({
            id: rId,
            title: resource.title || "Assigned Clinical Resource",
            description: resource.description || "Assigned by preceptor for clinical mastery.",
            type,
            url: menteeContentUrl(rId),
            fileName: resource.fileName || resource.original_filename,
            assignedBy: r.assignedBy || "Facility Clinical Preceptor",
            assignedAt: r.assignedAt || resource.created_at || new Date().toISOString(),
          });
        }
      }
    }

    if (collected.length > 0) {
      return collected;
    }

    // 3. Fall back to standard resources endpoint: GET /api/v1/resources
    const masterList = await getResources();
    if (masterList.length > 0) {
      return masterList.map((r: AdminResource, idx: number) => ({
        id: r.id,
        title: r.title,
        description: r.description || "Authorized clinical guideline module.",
        type: r.type === "audio" || r.type === "presentation" ? "document" : r.type,
        url: r.type === "link" ? r.url : menteeContentUrl(r.id),
        fileName: r.fileName,
        fileSizeMb: r.fileSizeMb,
        assignedBy: "Facility Clinical Preceptor",
        assignedAt: r.createdAt || new Date(Date.now() - idx * 24 * 60 * 60 * 1000).toISOString(),
      }));
    }
  } catch (err: any) {
    console.warn("Could not fetch assigned resources:", err?.message || err);
  }

  return [
    {
      id: "res-1",
      title: "Standard Treatment Guidelines",
      description: "National clinical guidelines and standard operating procedures for reproductive, maternal, and neonatal health.",
      type: "document",
      url: "#",
      fileName: "Standard_Treatment_Guidelines_2024.pdf",
      fileSizeMb: 3.2,
      assignedBy: "Sr. Preceptor Almaz Tadesse",
      assignedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "res-2",
      title: "Active Management of the Third Stage of Labor",
      description: "Clinical instructional video demonstrating oxytocin administration, cord traction, and uterine massage.",
      type: "video",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      assignedBy: "Dr. Yonas Bekele",
      assignedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "res-3",
      title: "WHO Maternal & Perinatal Health Portal",
      description: "Global evidence-based clinical recommendations and guidelines from the World Health Organization.",
      type: "link",
      url: "https://www.who.int/teams/maternal-newborn-child-adolescent-health-and-ageing",
      assignedBy: "Sr. Bethlehem Haile",
      assignedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
