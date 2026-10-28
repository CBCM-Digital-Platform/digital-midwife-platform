import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import { getResources } from "@/services/resources.service";
import type { AdminResource } from "@/types/resource";

export interface MenteeAssessmentItem {
  id: string;
  title: string;
  type: string;
  status: "PENDING" | "NEEDS_REVIEW" | "IN_REVIEW" | "PASS" | "DRAFT" | "FINALIZED";
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
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  isActiveNow: boolean;
  joinUrl?: string;
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

// Fallback assessments for when backend is unseeded or running in mock development
const FALLBACK_MENTEE_ASSESSMENTS: MenteeAssessmentItem[] = [
  {
    id: "asm-1",
    title: "Active Phase Labor & Partograph Interpretation",
    type: "Labor & Delivery Competency",
    status: "PENDING",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    checklistTotal: 6,
    checklistCompleted: 4,
    evidenceCount: 0,
    needsEvidence: true,
    needsChecklist: true,
    instructions:
      "Complete the 6-point clinical partograph checklist and upload a scan or photo of your supervised case plot.",
    mentorName: "Sr. Preceptor Almaz Tadesse",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "asm-2",
    title: "Neonatal Resuscitation & Bag-Mask Ventilation Drill",
    type: "Neonatal Care Competency",
    status: "NEEDS_REVIEW",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    checklistTotal: 5,
    checklistCompleted: 5,
    evidenceCount: 1,
    needsEvidence: false,
    needsChecklist: false,
    instructions:
      "All checklist items verified by preceptor. Awaiting final simulation score from clinical lead.",
    mentorName: "Dr. Yonas Bekele",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "asm-3",
    title: "Postpartum Hemorrhage Medical Intervention Protocol",
    type: "Obstetric Care",
    status: "PENDING",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    checklistTotal: 8,
    checklistCompleted: 2,
    evidenceCount: 0,
    needsEvidence: true,
    needsChecklist: true,
    instructions:
      "Observe and document oxytocin administration and uterine balloon tamponade readiness.",
    mentorName: "Sr. Bethlehem Haile",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Fallback sessions for when backend is unseeded or running in mock development
const FALLBACK_MENTEE_SESSIONS: MenteeSessionItem[] = [
  {
    id: "ses-1",
    title: "Virtual Preceptor Case Review: Eclampsia & Severe Preeclampsia",
    mentorName: "Dr. Yonas Bekele",
    mentorRole: "Obstetric Clinical Preceptor",
    mode: "virtual",
    scheduledAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // Starts in 15 mins (active)
    durationMinutes: 45,
    clinicalSetting: "Tele-Mentorship Video Conference",
    sessionGoals: "Case management walk-through of Magnesium Sulfate loading and maintenance dosing.",
    preparationNotes: "Review hospital MgSO4 emergency kit chart beforehand.",
    status: "in_progress",
    isActiveNow: true,
    joinUrl: "https://meet.google.com/cbcm-midwife-session",
  },
  {
    id: "ses-2",
    title: "Bedside Clinical Supervision: Labor Ward Stage II Management",
    mentorName: "Sr. Preceptor Almaz Tadesse",
    mentorRole: "Senior Midwife Lead",
    mode: "in_person",
    scheduledAt: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 60,
    clinicalSetting: "Labor & Delivery Ward — Suite 4",
    sessionGoals: "Direct observation of non-pharmacological pain relief and perineal support technique.",
    preparationNotes: "Ensure sanitized instruments and partograph chart ready.",
    status: "scheduled",
    isActiveNow: false,
  },
  {
    id: "ses-3",
    title: "Post-Delivery Debrief & Neonatal Resuscitation Review",
    mentorName: "Sr. Bethlehem Haile",
    mentorRole: "Clinical Midwife Supervisor",
    mode: "virtual",
    scheduledAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 30,
    clinicalSetting: "Virtual Skill Reflection Hub",
    sessionGoals: "Evaluate resuscitation timing and identify clinical learning opportunities.",
    preparationNotes: "Bring case summary from yesterday's night shift.",
    status: "scheduled",
    isActiveNow: false,
    joinUrl: "https://meet.google.com/cbcm-midwife-review",
  },
];

/**
 * Normalizes raw assessment response to strongly typed MenteeAssessmentItem
 */
function normalizeAssessment(raw: any): MenteeAssessmentItem {
  const id = String(raw?.id ?? raw?._id ?? "");
  const title = String(raw?.title || raw?.type || "Clinical Competency Assessment");
  const type = String(raw?.type || "General Midwifery");
  const status = String(raw?.status || "PENDING").toUpperCase() as any;

  const checklistItems = Array.isArray(raw?.checklistItems || raw?.checklist_items)
    ? raw?.checklistItems || raw?.checklist_items
    : [];
  const checklistTotal = checklistItems.length || Number(raw?.checklistTotal || 5);
  const checklistCompleted = checklistItems.filter((i: any) => i.checked || i.completed).length;

  const evidence = Array.isArray(raw?.evidence) ? raw?.evidence : [];
  const evidenceCount = evidence.length || Number(raw?.evidenceCount || 0);

  const needsEvidence = evidenceCount === 0 && status !== "PASS" && status !== "FINALIZED";
  const needsChecklist = checklistCompleted < checklistTotal && status !== "PASS";

  const mentorName =
    raw?.mentor?.name ||
    raw?.mentor?.full_name ||
    raw?.mentorName ||
    raw?.assignedBy ||
    "Assigned Clinical Mentor";

  return {
    id,
    title,
    type,
    status,
    dueDate: raw?.due_date || raw?.dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    checklistTotal,
    checklistCompleted,
    evidenceCount,
    needsEvidence,
    needsChecklist,
    scorePct: raw?.score_pct !== undefined ? raw?.score_pct : raw?.scorePct ?? null,
    instructions: raw?.instructions || raw?.description || "Complete clinical criteria checklist.",
    mentorName,
    createdAt: raw?.created_at || raw?.createdAt || new Date().toISOString(),
  };
}

/**
 * Normalizes raw session response to strongly typed MenteeSessionItem
 */
function normalizeSession(raw: any): MenteeSessionItem {
  const id = String(raw?.id ?? raw?._id ?? "");
  const title = String(
    raw?.session_goals || raw?.sessionGoals || raw?.title || "Clinical Mentorship Supervision"
  );
  const mentor = raw?.mentor || {};
  const mentorName =
    raw?.mentor_name ||
    raw?.mentorName ||
    mentor?.full_name ||
    mentor?.name ||
    "Assigned Mentor";

  const mode = String(raw?.mode || "virtual").toLowerCase() as any;
  const scheduledAt = raw?.scheduled_at || raw?.scheduledAt || new Date().toISOString();
  const durationMinutes = Number(raw?.duration_minutes || raw?.durationMinutes || 45);

  const status = String(raw?.status || "scheduled").toLowerCase() as any;

  // A session is active now if it is currently in progress or within 30 minutes of scheduled time
  const scheduledTime = new Date(scheduledAt).getTime();
  const now = Date.now();
  const diffMinutes = (now - scheduledTime) / (1000 * 60);
  const isActiveNow =
    status === "in_progress" ||
    (status === "scheduled" && diffMinutes >= -15 && diffMinutes <= durationMinutes);

  return {
    id,
    title,
    mentorName,
    mentorRole: mentor?.profession || "Certified Midwife Preceptor",
    mode: mode === "in_person" ? "in_person" : mode === "hybrid" ? "hybrid" : "virtual",
    scheduledAt,
    durationMinutes,
    clinicalSetting: raw?.clinical_setting || raw?.clinicalSetting || (mode === "in_person" ? "Hospital Ward" : "Tele-Mentorship Video Call"),
    sessionGoals: raw?.session_goals || raw?.sessionGoals || "Skill direct observation and feedback.",
    preparationNotes: raw?.preparation_notes || raw?.preparationNotes || undefined,
    status: status === "completed" ? "completed" : status === "cancelled" ? "cancelled" : isActiveNow ? "in_progress" : "scheduled",
    isActiveNow,
    joinUrl: raw?.join_url || raw?.joinUrl || undefined,
  };
}

/**
 * GET /api/v1/assessments
 * Fetches pending and completed clinical competency assessments for the mentee.
 */
export async function getMenteeAssessments(): Promise<MenteeAssessmentItem[]> {
  try {
    const res = await apiClient.get<any>(`${ENDPOINTS.ASSESSMENTS.BASE}?limit=50`);
    const rawList = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.assessments)
      ? res.data.assessments
      : Array.isArray(res?.assessments)
      ? res.assessments
      : Array.isArray(res)
      ? res
      : [];

    if (rawList.length > 0) {
      return rawList.map((a: any) => normalizeAssessment(a));
    }
  } catch (err: any) {
    console.warn("Could not fetch assessments from backend API (falling back to initial cohort list):", err?.message || err);
  }

  return FALLBACK_MENTEE_ASSESSMENTS;
}

/**
 * GET /api/v1/sessions/available-times or /api/v1/sessions
 * Fetches upcoming mentoring sessions for the mentee.
 */
export async function getUpcomingSessions(): Promise<MenteeSessionItem[]> {
  try {
    // Attempt fetching from available-times or sessions list
    const res = await apiClient
      .get<any>(`${ENDPOINTS.SESSIONS.BASE}?limit=30`)
      .catch(() => apiClient.get<any>(ENDPOINTS.SESSIONS.AVAILABLE_TIMES));

    const rawList = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.sessions)
      ? res.data.sessions
      : Array.isArray(res?.sessions)
      ? res.sessions
      : Array.isArray(res)
      ? res
      : [];

    if (rawList.length > 0) {
      return rawList.map((s: any) => normalizeSession(s));
    }
  } catch (err: any) {
    console.warn("Could not fetch upcoming sessions from backend API (falling back to cohort schedule):", err?.message || err);
  }

  return FALLBACK_MENTEE_SESSIONS;
}

/**
 * POST /api/v1/sessions/{id}/join-token
 * Generates or retrieves an authenticated video meeting join token for a virtual session.
 */
export async function joinSession(
  sessionId: string
): Promise<{ token: string; joinUrl: string }> {
  try {
    const res = await apiClient.post<any>(
      ENDPOINTS.SESSIONS.JOIN_TOKEN(sessionId),
      {}
    );

    const token = res?.data?.token || res?.token || `token-${Date.now()}`;
    const joinUrl =
      res?.data?.joinUrl ||
      res?.data?.join_url ||
      res?.joinUrl ||
      res?.join_url ||
      `https://meet.jit.si/cbcm-midwife-session-${sessionId}`;

    return { token, joinUrl };
  } catch (err: any) {
    console.warn("Live join token generation failed, generating local meeting link:", err?.message || err);
    return {
      token: `mock-token-${Date.now()}`,
      joinUrl: `https://meet.jit.si/cbcm-midwife-session-${sessionId}`,
    };
  }
}

/**
 * Fetches assigned learning resources for the mentee.
 */
export async function getMenteeAssignedResources(): Promise<MenteeResourceItem[]> {
  try {
    // 1. Fetch assigned resources scoped to mentee from hierarchical-resources endpoint
    const hierRes = await apiClient.get<any>(
      `${ENDPOINTS.HIERARCHICAL_RESOURCES.BASE}?limit=100`
    ).catch(() => null);

    const hierList = Array.isArray(hierRes?.data)
      ? hierRes.data
      : Array.isArray(hierRes?.data?.resources)
      ? hierRes.data.resources
      : Array.isArray(hierRes)
      ? hierRes
      : [];

    if (hierList.length > 0) {
      const baseUrl = (
        process.env.NEXT_PUBLIC_API_URL || "https://cbcm-backend-1.onrender.com/api/v1"
      ).replace(/\/+$/, "");

      return hierList.map((r: any, idx: number) => {
        const rawType = String(r?.type || "").toLowerCase();
        const type: "document" | "video" | "link" = rawType.includes("video")
          ? "video"
          : rawType.includes("link")
          ? "link"
          : "document";

        return {
          id: String(r.id),
          title: r.title || "Clinical Resource",
          description: r.description || "Assigned clinical protocol module.",
          type,
          url: `${baseUrl}/hierarchical-resources/${r.id}/content`,
          fileName: r.original_filename || r.fileName,
          assignedBy: "Facility Clinical Preceptor",
          assignedAt: r.created_at || r.createdAt || new Date(Date.now() - idx * 24 * 60 * 60 * 1000).toISOString(),
        };
      });
    }

    // 2. Fall back to master clinical resources
    const masterList = await getResources();
    if (masterList.length > 0) {
      return masterList.map((r: AdminResource, idx: number) => ({
        id: r.id,
        title: r.title,
        description: r.description || "Authorized clinical guideline module.",
        type: r.type,
        url: r.url,
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
