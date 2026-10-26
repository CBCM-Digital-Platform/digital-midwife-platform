import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import { getMyMentees } from "@/services/my-mentees.service";
import type {
    ClinicalSession,
    ClinicalSessionNote,
    CreateSessionInput,
    SessionStatus,
} from "@/types/clinical-session";

const MOCK_SESSIONS: ClinicalSession[] = [
    {
        id: "1",
        assignmentId: 101,
        mentorId: 1,
        mentorName: "Sr. Preceptor Almaz",
        menteeId: 1,
        menteeName: "Bilen Alemu",
        menteeTitle: "Year 2 Resident",
        mode: "in_person",
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        durationMinutes: 45,
        clinicalSetting: "Labor & Delivery Suite 3",
        sessionGoals: "Direct observation of active phase labor monitoring and partograph plotting.",
        preparationNotes: "Review fetal heart rate trace interpretation chart beforehand.",
        status: "scheduled",
        createdAt: new Date().toISOString(),
    },
    {
        id: "2",
        assignmentId: 102,
        mentorId: 1,
        mentorName: "Sr. Preceptor Almaz",
        menteeId: 2,
        menteeName: "Sara Abebe",
        menteeTitle: "Year 1 Resident",
        mode: "virtual",
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        durationMinutes: 30,
        clinicalSetting: "Virtual Preceptor Case Review",
        sessionGoals: "Neonatal resuscitation algorithm walk-through and Q&A.",
        preparationNotes: "Review WHO newborn care protocol.",
        status: "scheduled",
        createdAt: new Date().toISOString(),
    },
    {
        id: "3",
        assignmentId: 103,
        mentorId: 1,
        mentorName: "Sr. Preceptor Almaz",
        menteeId: 3,
        menteeName: "Maritu Taye",
        menteeTitle: "Year 3 Resident",
        mode: "in_person",
        scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        durationMinutes: 60,
        clinicalSetting: "Postpartum Triage Unit",
        sessionGoals: "Management of primary postpartum hemorrhage simulation.",
        preparationNotes: "Emergency tray readiness check completed.",
        status: "completed",
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
];

function normalizeSession(raw: any): ClinicalSession {
    const id = String(raw.id ?? raw._id ?? "");
    const mentee = raw.mentee || {};
    const mentor = raw.mentor || {};

    const menteeName =
        raw.mentee_name ||
        raw.menteeName ||
        mentee.full_name ||
        mentee.name ||
        `Mentee #${raw.mentee_id ?? id}`;

    const mentorName =
        raw.mentor_name ||
        raw.mentorName ||
        mentor.full_name ||
        mentor.name ||
        "Clinical Mentor";

    return {
        id,
        assignmentId: raw.assignment_id ?? raw.assignmentId,
        mentorId: raw.mentor_id ?? raw.mentorId,
        mentorName,
        menteeId: raw.mentee_id ?? raw.menteeId,
        menteeName,
        menteeTitle: mentee.highest_qualification || mentee.training_status || "Resident Midwife",
        mode: raw.mode || "in_person",
        scheduledAt: raw.scheduled_at || raw.scheduledAt || new Date().toISOString(),
        durationMinutes: Number(raw.duration_minutes ?? raw.durationMinutes ?? 45),
        clinicalSetting: raw.clinical_setting || raw.clinicalSetting || "Clinical Ward",
        sessionGoals: raw.session_goals || raw.sessionGoals || "Supervised clinical rotation and competency assessment.",
        preparationNotes: raw.preparation_notes || raw.preparationNotes || "",
        status: (raw.status || "scheduled").toLowerCase() as SessionStatus,
        createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    };
}

/**
 * Fetches clinical sessions from backend GET /api/v1/sessions.
 */
export async function getSessions(status?: string): Promise<ClinicalSession[]> {
    try {
        const query = status ? `?status=${status}&limit=50` : "?limit=50";
        const res = await apiClient.get<any>(`${ENDPOINTS.SESSIONS.BASE}${query}`);
        const list = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
            ? res
            : [];

        if (list.length > 0) {
            return list.map(normalizeSession);
        }
    } catch (err) {
        console.warn("Could not fetch sessions from backend API (using local data):", err);
    }

    if (status) {
        return MOCK_SESSIONS.filter((s) => s.status === status);
    }
    return MOCK_SESSIONS;
}

/**
 * Creates a new clinical session via POST /api/v1/sessions.
 */
export async function createSession(input: CreateSessionInput): Promise<ClinicalSession> {
    const payload = {
        assignment_id: input.assignmentId,
        mode: input.mode,
        scheduled_at: input.scheduledAt,
        duration_minutes: input.durationMinutes,
        clinical_setting: input.clinicalSetting || null,
        session_goals: input.sessionGoals || null,
        preparation_notes: input.preparationNotes || null,
        status: input.status || "scheduled",
    };

    const res = await apiClient.post<any>(ENDPOINTS.SESSIONS.BASE, payload);
    const raw = res?.data ?? res;
    return normalizeSession(raw);
}

/**
 * Updates session status (e.g. in_progress, completed, cancelled) via PATCH /api/v1/sessions/{id}/status.
 */
export async function updateSessionStatus(
    sessionId: string | number,
    status: SessionStatus,
    reason?: string
): Promise<boolean> {
    try {
        await apiClient.patch(ENDPOINTS.SESSIONS.STATUS(sessionId), {
            status,
            reason: reason || undefined,
        });
        return true;
    } catch (err) {
        console.warn(`Failed to update session ${sessionId} status on backend:`, err);
        return false;
    }
}

/**
 * Adds a clinical note via POST /api/v1/sessions/{id}/notes.
 */
export async function addSessionNote(
    sessionId: string | number,
    note: string
): Promise<ClinicalSessionNote | null> {
    try {
        const res = await apiClient.post<any>(ENDPOINTS.SESSIONS.NOTES(sessionId), {
            note,
        });
        const raw = res?.data ?? res;
        return {
            id: raw.id,
            encounterId: raw.encounter_id ?? Number(sessionId),
            mentorId: raw.mentor_id ?? 1,
            mentorName: raw.mentor?.full_name || "Mentor Preceptor",
            note: raw.note,
            createdAt: raw.created_at || new Date().toISOString(),
        };
    } catch (err) {
        console.warn("Failed to add clinical session note on backend:", err);
        return null;
    }
}

/**
 * Retrieves all clinical notes for a session via GET /api/v1/sessions/{id}/notes.
 */
export async function getSessionNotes(
    sessionId: string | number
): Promise<ClinicalSessionNote[]> {
    try {
        const res = await apiClient.get<any>(ENDPOINTS.SESSIONS.NOTES(sessionId));
        const list = Array.isArray(res?.data) ? res.data : [];
        return list.map((n: any) => ({
            id: n.id,
            encounterId: n.encounter_id ?? Number(sessionId),
            mentorId: n.mentor_id ?? 1,
            mentorName: n.mentor?.full_name || "Mentor Preceptor",
            note: n.note,
            createdAt: n.created_at || new Date().toISOString(),
        }));
    } catch (err) {
        console.warn(`Failed to fetch notes for session ${sessionId}:`, err);
        return [];
    }
}

/**
 * Generates signed Jitsi join token for a virtual session via POST /api/v1/sessions/{id}/join-token.
 */
export async function getSessionJoinToken(
    sessionId: string | number
): Promise<{ domain?: string; room?: string; token?: string } | null> {
    try {
        const res = await apiClient.post<any>(ENDPOINTS.SESSIONS.JOIN_TOKEN(sessionId));
        return res?.data ?? res;
    } catch (err) {
        console.warn(`Failed to get virtual session join token for ${sessionId}:`, err);
        return null;
    }
}
