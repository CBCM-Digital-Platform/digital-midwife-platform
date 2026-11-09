import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import type {
    ClinicalSession,
    ClinicalSessionNote,
    CreateSessionInput,
    SessionJoinToken,
    SessionMode,
    SessionStatus,
} from "@/types/clinical-session";

type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown): ApiRecord {
    return value !== null && typeof value === "object" ? value as ApiRecord : {};
}

function unwrap(value: unknown): unknown {
    const response = asRecord(value);
    return response.data ?? value;
}

function unwrapEntity(value: unknown, key: string): ApiRecord {
    const data = asRecord(unwrap(value));
    return asRecord(data[key] ?? data);
}

function getList(value: unknown, keys: string[]): ApiRecord[] {
    const data = unwrap(value);
    if (Array.isArray(data)) return data.map(asRecord);
    const record = asRecord(data);
    for (const key of ["items", "sessions", "results", ...keys]) {
        if (Array.isArray(record[key])) return (record[key] as unknown[]).map(asRecord);
    }
    throw new Error("The sessions API returned an unexpected list response.");
}

function optionalNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
}

function normalizeSession(rawValue: unknown): ClinicalSession {
    const raw = asRecord(rawValue);
    const mentee = asRecord(raw.mentee);
    const mentor = asRecord(raw.mentor);
    const id = String(raw.id ?? raw._id ?? "");
    if (!id) throw new Error("The sessions API returned a session without an ID.");

    const rawMode = String(raw.mode ?? "in_person").toLowerCase().replaceAll("-", "_");
    const mode: SessionMode =
        rawMode === "virtual" || rawMode === "hybrid" ? rawMode : "in_person";
    const rawStatus = String(raw.status ?? "scheduled").toLowerCase().replaceAll("-", "_");
    const allowedStatuses: SessionStatus[] = [
        "draft",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "terminated",
        "no_show",
    ];
    const status = allowedStatuses.includes(rawStatus as SessionStatus)
        ? rawStatus as SessionStatus
        : "scheduled";

    return {
        id,
        assignmentId: optionalNumber(raw.assignment_id ?? raw.assignmentId),
        mentorId: optionalNumber(raw.mentor_id ?? raw.mentorId ?? mentor.id),
        mentorName: String(
            raw.mentor_name ?? raw.mentorName ?? mentor.full_name ?? mentor.name ?? ""
        ) || undefined,
        menteeId: optionalNumber(raw.mentee_id ?? raw.menteeId ?? mentee.id),
        menteeName: String(
            raw.mentee_name ?? raw.menteeName ?? mentee.full_name ?? mentee.name ?? "Mentee"
        ),
        menteeTitle: String(
            mentee.highest_qualification ?? mentee.training_status ?? ""
        ) || undefined,
        mode,
        scheduledAt: String(raw.scheduled_at ?? raw.scheduledAt ?? ""),
        durationMinutes: optionalNumber(raw.duration_minutes ?? raw.durationMinutes) ?? 45,
        clinicalSetting: String(raw.clinical_setting ?? raw.clinicalSetting ?? "") || undefined,
        sessionGoals: String(raw.session_goals ?? raw.sessionGoals ?? "") || undefined,
        preparationNotes: String(raw.preparation_notes ?? raw.preparationNotes ?? "") || undefined,
        status,
        createdAt: String(raw.created_at ?? raw.createdAt ?? "") || undefined,
    };
}

function normalizeNote(rawValue: unknown, sessionId: string | number): ClinicalSessionNote {
    const raw = asRecord(rawValue);
    const id = raw.id;
    if (typeof id !== "string" && typeof id !== "number") {
        throw new Error("The sessions API returned a note without an ID.");
    }
    const rawEncounterId = raw.encounter_id ?? raw.encounterId ?? sessionId;
    return {
        id,
        encounterId:
            typeof rawEncounterId === "string" || typeof rawEncounterId === "number"
                ? rawEncounterId
                : sessionId,
        mentorId: optionalNumber(raw.mentor_id ?? raw.mentorId),
        mentorName: String(asRecord(raw.mentor).full_name ?? raw.mentor_name ?? "") || undefined,
        note: String(raw.note ?? raw.content ?? ""),
        createdAt: String(raw.created_at ?? raw.createdAt ?? ""),
    };
}

export async function getSessions(status?: string, limit = 50): Promise<ClinicalSession[]> {
    const res = await apiClient.get<unknown>(ENDPOINTS.SESSIONS.BASE, {
        params: { status, limit },
    });
    return getList(res, []).map(normalizeSession);
}

export async function getSessionById(sessionId: string | number): Promise<ClinicalSession> {
    const res = await apiClient.get<unknown>(ENDPOINTS.SESSIONS.DETAIL(sessionId));
    return normalizeSession(unwrapEntity(res, "session"));
}

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
    const res = await apiClient.post<unknown>(ENDPOINTS.SESSIONS.BASE, payload);
    return normalizeSession(unwrapEntity(res, "session"));
}

export interface UpdateSessionInput {
    mode?: SessionMode;
    scheduledAt?: string;
    durationMinutes?: number;
    clinicalSetting?: string;
    sessionGoals?: string;
    preparationNotes?: string;
}

export async function updateSession(
    sessionId: string | number,
    input: UpdateSessionInput
): Promise<ClinicalSession> {
    const payload = {
        ...(input.mode !== undefined && { mode: input.mode }),
        ...(input.scheduledAt !== undefined && { scheduled_at: input.scheduledAt }),
        ...(input.durationMinutes !== undefined && { duration_minutes: input.durationMinutes }),
        ...(input.clinicalSetting !== undefined && { clinical_setting: input.clinicalSetting }),
        ...(input.sessionGoals !== undefined && { session_goals: input.sessionGoals }),
        ...(input.preparationNotes !== undefined && { preparation_notes: input.preparationNotes }),
    };
    const res = await apiClient.patch<unknown>(ENDPOINTS.SESSIONS.DETAIL(sessionId), payload);
    const raw = unwrapEntity(res, "session");
    return raw.id || raw._id ? normalizeSession(raw) : getSessionById(sessionId);
}

export async function getAvailableSessionTimes(
    params?: Record<string, string | number | boolean | undefined | null>
): Promise<unknown> {
    return apiClient.get<unknown>(ENDPOINTS.SESSIONS.AVAILABLE_TIMES, { params });
}

export async function updateSessionStatus(
    sessionId: string | number,
    status: SessionStatus,
    reason?: string
): Promise<void> {
    await apiClient.patch(ENDPOINTS.SESSIONS.STATUS(sessionId), {
        status,
        ...(reason ? { reason } : {}),
    });
}

export async function addSessionNote(
    sessionId: string | number,
    note: string
): Promise<ClinicalSessionNote> {
    const res = await apiClient.post<unknown>(ENDPOINTS.SESSIONS.NOTES(sessionId), { note });
    const raw = unwrapEntity(res, "note");
    return normalizeNote({ ...raw, note: raw.note ?? note }, sessionId);
}

export async function getSessionNotes(
    sessionId: string | number
): Promise<ClinicalSessionNote[]> {
    const res = await apiClient.get<unknown>(ENDPOINTS.SESSIONS.NOTES(sessionId));
    return getList(res, ["notes"]).map((note) => normalizeNote(note, sessionId));
}

export async function getSessionJoinToken(
    sessionId: string | number
): Promise<SessionJoinToken> {
    const res = await apiClient.post<unknown>(ENDPOINTS.SESSIONS.JOIN_TOKEN(sessionId), {});
    const raw = asRecord(unwrap(res));
    const data = asRecord(raw.join ?? raw);
    return {
        domain: String(data.domain ?? "") || undefined,
        room: String(data.room ?? "") || undefined,
        token: String(data.token ?? "") || undefined,
        joinUrl: String(data.join_url ?? data.joinUrl ?? "") || undefined,
    };
}

export async function recordSessionParticipantJoin(
    sessionId: string | number
): Promise<void> {
    await apiClient.post(ENDPOINTS.SESSIONS.PARTICIPANT_JOIN(sessionId), {});
}
