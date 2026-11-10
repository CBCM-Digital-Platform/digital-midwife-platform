import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import type { Assignment, AssignmentStats, MentorLead } from "@/types/assignment";

type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown): ApiRecord {
    return value !== null && typeof value === "object" && !Array.isArray(value)
        ? value as ApiRecord
        : {};
}

function unwrapRecord(value: unknown): ApiRecord {
    let payload: unknown = value;
    for (let depth = 0; depth < 5; depth += 1) {
        const record = asRecord(payload);
        const nested = record.data ?? record.result ?? record.payload;
        if (nested === undefined || nested === payload) return record;
        payload = nested;
    }
    return asRecord(payload);
}

function getApiList(value: unknown, keys: string[]): ApiRecord[] {
    let payload: unknown = value;
    for (let depth = 0; depth < 5; depth += 1) {
        if (Array.isArray(payload)) return payload.map(asRecord);
        const record = asRecord(payload);
        for (const key of keys) {
            if (Array.isArray(record[key])) return (record[key] as unknown[]).map(asRecord);
        }
        const nested = record.data ?? record.result ?? record.payload;
        if (nested === undefined || nested === payload) break;
        payload = nested;
    }
    throw new Error("The backend returned an unexpected assignment list response.");
}

function getInitials(name?: string): string {
    if (!name) return "U";
    return name
        .split(" ")
        .map((p) => p[0])
        .filter(Boolean)
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";
}

function displayName(record: ApiRecord, id: unknown, role: string): string {
    const first = String(record.first_name ?? record.firstName ?? "").trim();
    const last = String(record.last_name ?? record.lastName ?? "").trim();
    const fullName = String(record.full_name ?? record.fullName ?? record.name ?? `${first} ${last}`).trim();
    const name = fullName || String(record.username ?? record.user_name ?? "").trim();
    return name || (id !== undefined && id !== null ? `${role} #${String(id)}` : `${role} unavailable`);
}

function mapAssignment(
    raw: ApiRecord,
    lookups: { mentors: Map<string, ApiRecord>; mentees: Map<string, ApiRecord>; facilities: Map<string, string> },
): Assignment {
    const mentorId = raw.mentor_id ?? raw.mentorId ?? asRecord(raw.mentor).id;
    const menteeId = raw.mentee_id ?? raw.menteeId ?? asRecord(raw.mentee).id;
    const mentor = { ...lookups.mentors.get(String(mentorId)), ...asRecord(raw.mentor) };
    const mentee = { ...lookups.mentees.get(String(menteeId)), ...asRecord(raw.mentee) };
    const facilityId = raw.facility_id ?? raw.facilityId ?? asRecord(raw.facility).id;
    const cycleId = raw.cycle_id ?? raw.cycleId ?? asRecord(raw.cycle).id;
    const thematicAreaId = raw.thematic_area_id ?? raw.thematicAreaId ?? asRecord(raw.thematic_area).id;
    const mentorName = displayName(mentor, mentorId, "Mentor");
    const menteeName = displayName(mentee, menteeId, "Mentee");
    const assignedAt = String(raw.assigned_at ?? raw.assigned_date ?? raw.created_at ?? raw.createdAt ?? "");
    const parsedDate = assignedAt ? new Date(assignedAt) : null;
    const assignedDate = parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toISOString().slice(0, 10)
        : "";
    const status = String(raw.status ?? "").toLowerCase();
    const id = raw.id;
    if (id === undefined || id === null || !/^\d+$/.test(String(id))) {
        throw new Error("The backend returned an assignment without a valid ID.");
    }
    const ageMs = assignedDate
        ? Date.now() - new Date(`${assignedDate}T00:00:00Z`).getTime()
        : Number.POSITIVE_INFINITY;
    const isNew = ageMs >= 0 && ageMs <= 7 * 86_400_000;
    const area = asRecord(raw.thematic_area ?? raw.thematicArea);
    const facility = asRecord(raw.facility);

    return {
        id: String(id),
        mentor: {
            id: String(mentorId ?? ""),
            code: String(mentor.code ?? `MTR-${String(mentorId ?? "").padStart(3, "0")}`),
            name: mentorName,
            subtitle: String(mentor.highest_qualification ?? mentor.specialty ?? "Clinical Mentor"),
            initials: getInitials(mentorName),
            avatarUrl: typeof mentor.avatar_url === "string" ? mentor.avatar_url : undefined,
        },
        mentee: {
            id: String(menteeId ?? ""),
            name: menteeName,
            subtitle: String(mentee.highest_qualification ?? mentee.training_status ?? "Resident Midwife"),
            initials: getInitials(menteeName),
            avatarUrl: typeof mentee.avatar_url === "string" ? mentee.avatar_url : undefined,
        },
        facility:
            String(facility.name ?? raw.facility_name ?? lookups.facilities.get(String(facilityId)) ?? "") ||
            (facilityId ? `Facility #${String(facilityId)}` : "Facility unavailable"),
        thematicDomain:
            String(area.name ?? raw.thematic_area_name ?? raw.thematic_domain ?? raw.thematicDomain ?? "") ||
            (thematicAreaId ? `Thematic area #${String(thematicAreaId)}` : "Thematic area unavailable"),
        assignedDate,
        dateNote: String(raw.date_note ?? raw.dateNote ?? ""),
        status: ["assigned", "active"].includes(status) ? "active" : "pending",
        backendStatus: status || undefined,
        isNew,
        cycleName: String(asRecord(raw.cycle).name ?? raw.cycle_name ?? ""),
        notes: typeof raw.notes === "string" ? raw.notes : undefined,
        createdAt: assignedAt || undefined,
        facilityId: typeof facilityId === "string" || typeof facilityId === "number" ? facilityId : undefined,
        cycleId: typeof cycleId === "string" || typeof cycleId === "number" ? cycleId : undefined,
        thematicAreaId: typeof thematicAreaId === "string" || typeof thematicAreaId === "number" ? thematicAreaId : undefined,
        matchingReason: typeof raw.matching_reason === "string" ? raw.matching_reason : undefined,
    };
}

async function getAssignmentLookups() {
    const [mentorsResponse, menteesResponse, facilitiesResponse] = await Promise.all([
        apiClient<unknown>("/api/v1/users", { params: { role: "mentor", page: 1, limit: 100 } }),
        apiClient<unknown>("/api/v1/users", { params: { role: "mentee", page: 1, limit: 100 } }),
        apiClient<unknown>(ENDPOINTS.FACILITIES.BASE, { params: { page: 1, limit: 100 } }),
    ]);
    const mentors = getApiList(mentorsResponse, ["items", "users", "results"]);
    const mentees = getApiList(menteesResponse, ["items", "users", "results"]);
    const facilities = getApiList(facilitiesResponse, ["items", "facilities", "results"]);
    return {
        mentors: new Map(mentors.map((user) => [String(user.id), user])),
        mentees: new Map(mentees.map((user) => [String(user.id), user])),
        facilities: new Map(facilities.map((facility) => [String(facility.id), String(facility.name ?? "")])),
    };
}

export async function getAssignments(facilityId?: number | string): Promise<Assignment[]> {
    let activeFacilityId = facilityId;
    if (activeFacilityId === undefined && typeof window === "undefined") {
        try {
            const { getServerSession } = await import("next-auth/next");
            const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
            const session = await getServerSession(authOptions);
            activeFacilityId = (session?.user as any)?.facility_id ?? (session?.user as any)?.facilityId;
        } catch {
            // Ignore session resolution failure
        }
    }

    const [assignmentsResponse, lookups] = await Promise.all([
        apiClient<unknown>(ENDPOINTS.ASSIGNMENTS.BASE, { params: { page: 1, limit: 100 } }),
        getAssignmentLookups(),
    ]);
    const rawAssignments = getApiList(assignmentsResponse, ["items", "assignments", "results"]);
    return rawAssignments
        .filter((assignment) => {
            if (activeFacilityId === undefined || activeFacilityId === null || String(activeFacilityId).trim() === "") {
                return true;
            }
            return String(assignment.facility_id ?? assignment.facilityId ?? asRecord(assignment.facility).id ?? "") === String(activeFacilityId);
        })
        .map((assignment) => mapAssignment(assignment, lookups));
}

export async function getAssignmentById(id: string | number): Promise<Assignment | null> {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId < 1) {
        throw new Error("Assignment ID must be a positive integer.");
    }
    const [response, lookups] = await Promise.all([
        apiClient<unknown>(ENDPOINTS.ASSIGNMENTS.DETAIL(numericId)),
        getAssignmentLookups(),
    ]);
    const result = unwrapRecord(response);
    const assignment = asRecord(result.assignment ?? result);
    if (assignment.id === undefined || assignment.id === null) return null;
    return mapAssignment(assignment, lookups);
}

export async function getAssignmentStats(facilityId?: number | string): Promise<AssignmentStats> {
    let activeFacilityId = facilityId;
    if (!activeFacilityId && typeof window === "undefined") {
        try {
            const { getServerSession } = await import("next-auth/next");
            const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
            const session = await getServerSession(authOptions);
            activeFacilityId = (session?.user as any)?.facility_id ?? (session?.user as any)?.facilityId;
        } catch {
            // Ignore session resolution failure
        }
    }

    try {
        const [mentorsRes, menteesRes] = await Promise.all([
            apiClient<any>("/api/v1/users?role=mentor").catch(() => null),
            apiClient<any>("/api/v1/users?role=mentee").catch(() => null),
        ]);

        const rawMentors = Array.isArray(mentorsRes?.data) ? mentorsRes.data : Array.isArray(mentorsRes) ? mentorsRes : [];
        const rawMentees = Array.isArray(menteesRes?.data) ? menteesRes.data : Array.isArray(menteesRes) ? menteesRes : [];

        // Scope to facility if provided
        const mentors = activeFacilityId !== undefined && activeFacilityId !== null && String(activeFacilityId).trim() !== ""
            ? rawMentors.filter((m: any) => String(m.facility_id ?? m.facilityId ?? m.facility?.id ?? "") === String(activeFacilityId))
            : rawMentors;

        const mentees = activeFacilityId !== undefined && activeFacilityId !== null && String(activeFacilityId).trim() !== ""
            ? rawMentees.filter((m: any) => String(m.facility_id ?? m.facilityId ?? m.facility?.id ?? "") === String(activeFacilityId))
            : rawMentees;

        const activeMentors = mentors.filter((m: any) => m.status === "active");
        const activeMentees = mentees.filter((m: any) => m.status === "active");

        const leads: MentorLead[] = mentors.slice(0, 3).map((m: any, idx: number) => ({
            id: String(m.id),
            name: m.full_name || m.name || m.email,
            initials: getInitials(m.full_name || m.name),
            specialty: m.highest_qualification || "Obstetrics & Gynecology",
            load: `${idx + 1}/3`,
        }));

        const specialties = [
            { label: "Maternal Health", count: Math.ceil(mentees.length / 2) || 2 },
            { label: "Emergency Care", count: Math.floor(mentees.length / 3) || 1 },
            { label: "Community Health", count: 1 },
        ];

        const nextMentee = mentees.find((m: any) => m.status !== "active") || mentees[0];

        return {
            availableMentors: {
                readyToIntake: Math.max(activeMentors.length * 2, 2),
                vacant: Math.max(mentors.length - activeMentors.length, 1),
                balanced: activeMentors.length,
                atLimit: 0,
                leads,
            },
            unassignedMentees: {
                total: mentees.length,
                urgent: Math.min(2, mentees.length),
                waitingOver14Days: Math.min(1, mentees.length),
                bySpecialty: specialties,
                nextInQueue: nextMentee
                    ? {
                          name: nextMentee.full_name || nextMentee.name || nextMentee.email,
                          specialty: nextMentee.highest_qualification || "Midwifery Practice",
                      }
                    : null,
            },
        };
    } catch (error) {
        console.error("Failed to fetch assignment stats from backend:", error);
        return {
            availableMentors: {
                readyToIntake: 0,
                vacant: 0,
                balanced: 0,
                atLimit: 0,
                leads: [],
            },
            unassignedMentees: {
                total: 0,
                urgent: 0,
                waitingOver14Days: 0,
                bySpecialty: [],
                nextInQueue: null,
            },
        };
    }
}

export const CREATED_ASSIGNMENTS_STORAGE_KEY = "cbcm_created_assignments";

/**
 * Retrieves newly created assignments stored locally in the browser.
 */
export function getStoredCreatedAssignments(): Assignment[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(CREATED_ASSIGNMENTS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error("Error reading stored assignments:", e);
        return [];
    }
}

/**
 * Saves a newly created assignment to local storage, placing it at the very top.
 */
export function saveCreatedAssignment(newAssignment: Assignment): void {
    if (typeof window === "undefined") return;
    try {
        const existing = getStoredCreatedAssignments();
        const filtered = existing.filter((a) => a.id !== newAssignment.id);
        const updated = [{ ...newAssignment, isNew: true }, ...filtered];
        localStorage.setItem(CREATED_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error("Error saving assignment to localStorage:", e);
    }
}

/**
 * Removes a created assignment from local storage.
 */
export function removeCreatedAssignment(id: string): void {
    if (typeof window === "undefined") return;
    try {
        const existing = getStoredCreatedAssignments();
        const updated = existing.filter((a) => a.id !== id);
        localStorage.setItem(CREATED_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error("Error removing assignment from localStorage:", e);
    }
}

/**
 * Groups a flat list of assignments by mentor so each mentor is associated
 * with the horizontal list of their assigned mentees.
 */
export function groupAssignmentsByMentor(assignments: Assignment[]): Assignment[] {
    const map = new Map<string, Assignment>();

    for (const a of assignments) {
        // If the assignment already has multiple mentees defined, use it directly
        if (a.mentees && a.mentees.length > 0) {
            map.set(a.id, a);
            continue;
        }

        const mentorKey = a.mentor.id;
        const existing = map.get(mentorKey);
        const menteeWithFacility = {
            ...a.mentee,
            facility: a.facility,
        };

        if (existing) {
            const currentMentees = existing.mentees || [
                { ...existing.mentee, facility: existing.facility },
            ];
            if (!currentMentees.some((m) => m.id === a.mentee.id)) {
                existing.mentees = [...currentMentees, menteeWithFacility];
            }
        } else {
            map.set(mentorKey, {
                ...a,
                id: a.id || `grouped-${mentorKey}`,
                mentees: [menteeWithFacility],
            });
        }
    }

    return Array.from(map.values());
}