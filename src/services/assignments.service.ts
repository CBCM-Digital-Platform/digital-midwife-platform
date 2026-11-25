import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import type { Assignment, AssignmentStats, MentorLead, Person } from "@/types/assignment";

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
    lookups: {
        mentors: Map<string, ApiRecord>;
        mentees: Map<string, ApiRecord>;
        facilities: Map<string, string>;
        thematicAreas: Map<string, string>;
        cycles?: Map<string, string>;
    },
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

    // Resolve Thematic Area by NAME (never display raw numeric ID or "Thematic area #X")
    let thematicDomainName = String(
        area.name ??
        raw.thematic_area_name ??
        raw.thematic_area_title ??
        raw.thematic_domain ??
        raw.thematicDomain ??
        ""
    ).trim();

    // If empty or looks like a raw ID string / generic placeholder, resolve from lookups
    if (
        (!thematicDomainName ||
            /^thematic\s*area\s*#?\d+$/i.test(thematicDomainName) ||
            /^\d+$/.test(thematicDomainName)) &&
        thematicAreaId
    ) {
        const lookedUp = lookups.thematicAreas.get(String(thematicAreaId));
        if (lookedUp) {
            thematicDomainName = lookedUp;
        }
    }

    // Try extracting from matching_reason if created with "[Domain: <name>]"
    if (
        !thematicDomainName ||
        /^thematic\s*area\s*#?\d+$/i.test(thematicDomainName) ||
        /^\d+$/.test(thematicDomainName)
    ) {
        const match =
            typeof raw.matching_reason === "string" &&
            raw.matching_reason.match(/\[Domain:\s*([^\]]+)\]/i);
        if (match && match[1]) {
            thematicDomainName = match[1].trim();
        }
    }

    // Fallback: human-readable name, never raw ID
    if (
        !thematicDomainName ||
        /^thematic\s*area\s*#?\d+$/i.test(thematicDomainName) ||
        /^\d+$/.test(thematicDomainName)
    ) {
        thematicDomainName = "Maternal & Newborn Care";
    }

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
        thematicDomain: thematicDomainName,
        assignedDate,
        dateNote: String(raw.date_note ?? raw.dateNote ?? ""),
        status: ["assigned", "active"].includes(status) ? "active" : "pending",
        backendStatus: status || undefined,
        isNew,
        cycleName: String(
            asRecord(raw.cycle).name ??
            raw.cycle_name ??
            raw.cycleName ??
            (cycleId && lookups.cycles ? lookups.cycles.get(String(cycleId)) : "") ??
            ""
        ).trim(),
        notes: typeof raw.notes === "string" ? raw.notes : undefined,
        createdAt: assignedAt || undefined,
        facilityId: typeof facilityId === "string" || typeof facilityId === "number" ? facilityId : undefined,
        cycleId: typeof cycleId === "string" || typeof cycleId === "number" ? cycleId : undefined,
        thematicAreaId: typeof thematicAreaId === "string" || typeof thematicAreaId === "number" ? thematicAreaId : undefined,
        matchingReason: typeof raw.matching_reason === "string" ? raw.matching_reason : undefined,
    };
}

async function getAssignmentLookups() {
    const [mentorsResponse, menteesResponse, facilitiesResponse, thematicAreasResponse, cyclesResponse] = await Promise.all([
        apiClient<unknown>("/api/v1/users", { params: { role: "mentor", page: 1, limit: 100 } }).catch(() => null),
        apiClient<unknown>("/api/v1/users", { params: { role: "mentee", page: 1, limit: 100 } }).catch(() => null),
        apiClient<unknown>(ENDPOINTS.FACILITIES.BASE, { params: { page: 1, limit: 100 } }).catch(() => null),
        apiClient<unknown>(ENDPOINTS.THEMATIC_AREAS.BASE, { params: { page: 1, limit: 100 } }).catch(() => null),
        apiClient<unknown>(ENDPOINTS.CYCLES.BASE, { params: { page: 1, limit: 100 } }).catch(() => null),
    ]);
    const mentors = mentorsResponse ? getApiList(mentorsResponse, ["items", "users", "results"]) : [];
    const mentees = menteesResponse ? getApiList(menteesResponse, ["items", "users", "results"]) : [];
    const facilities = facilitiesResponse ? getApiList(facilitiesResponse, ["items", "facilities", "results"]) : [];
    const thematicAreas = thematicAreasResponse ? getApiList(thematicAreasResponse, ["items", "thematic_areas", "thematicAreas", "results"]) : [];
    const cycles = cyclesResponse ? getApiList(cyclesResponse, ["items", "cycles", "mentorship_cycles", "results"]) : [];

    const thematicAreaMap = new Map<string, string>();
    for (const ta of thematicAreas) {
        const id = String(ta.id ?? "");
        const name = String(ta.name ?? ta.title ?? "").trim();
        if (id && name) {
            thematicAreaMap.set(id, name);
        }
        const code = String(ta.code ?? "").trim();
        if (code && name) {
            thematicAreaMap.set(code.toLowerCase(), name);
        }
    }

    const cycleMap = new Map<string, string>();
    for (const cy of cycles) {
        const id = String(cy.id ?? "");
        const name = String(cy.name ?? cy.title ?? cy.cycle_name ?? "").trim();
        if (id && name) {
            cycleMap.set(id, name);
        }
    }

    return {
        mentors: new Map(mentors.map((user) => [String(user.id), user])),
        mentees: new Map(mentees.map((user) => [String(user.id), user])),
        facilities: new Map(facilities.map((facility) => [String(facility.id), String(facility.name ?? "")])),
        thematicAreas: thematicAreaMap,
        cycles: cycleMap,
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
    } else if (activeFacilityId === undefined && typeof window !== "undefined") {
        try {
            const { getSession } = await import("next-auth/react");
            const session = await getSession();
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
    const [response, lookups, allAssignmentsRes] = await Promise.all([
        apiClient<unknown>(ENDPOINTS.ASSIGNMENTS.DETAIL(numericId)),
        getAssignmentLookups(),
        apiClient<unknown>(ENDPOINTS.ASSIGNMENTS.BASE, { params: { page: 1, limit: 100 } }).catch(() => null),
    ]);
    const result = unwrapRecord(response);
    const assignment = asRecord(result.assignment ?? result);
    if (assignment.id === undefined || assignment.id === null) return null;
    const mapped = mapAssignment(assignment, lookups);

    // If the mentor has other assignments, aggregate their mentees so all assigned mentees are visible
    if (allAssignmentsRes) {
        try {
            const rawList = getApiList(allAssignmentsRes, ["items", "assignments", "results"]);
            const mentorAssignments = rawList.filter(
                (a) =>
                    String(a.mentor_id ?? a.mentorId ?? asRecord(a.mentor).id ?? "").trim() ===
                    String(mapped.mentor.id).trim(),
            );
            if (mentorAssignments.length > 1) {
                const menteesMap = new Map<string, Person & { facility?: string }>();
                if (mapped.mentee && mapped.mentee.id) {
                    menteesMap.set(String(mapped.mentee.id), { ...mapped.mentee, facility: mapped.facility });
                }
                for (const rawA of mentorAssignments) {
                    const mAssignment = mapAssignment(rawA, lookups);
                    if (mAssignment.mentee && mAssignment.mentee.id) {
                        menteesMap.set(String(mAssignment.mentee.id), {
                            ...mAssignment.mentee,
                            facility: mAssignment.facility,
                        });
                    }
                    if (mAssignment.mentees) {
                        for (const m of mAssignment.mentees) {
                            menteesMap.set(String(m.id), m);
                        }
                    }
                }
                mapped.mentees = Array.from(menteesMap.values());
            }
        } catch {
            // Ignore error and use base assignment
        }
    }

    return mapped;
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
        const [mentorsRes, menteesRes, assignmentsList] = await Promise.all([
            apiClient<any>("/api/v1/users?role=mentor").catch(() => null),
            apiClient<any>("/api/v1/users?role=mentee").catch(() => null),
            getAssignments(activeFacilityId).catch(() => []),
        ]);

        const storedAssignments = typeof window !== "undefined" ? getStoredCreatedAssignments() : [];
        const allAssignments = [...assignmentsList, ...storedAssignments];

        const rawMentors = Array.isArray(mentorsRes?.data) ? mentorsRes.data : Array.isArray(mentorsRes) ? mentorsRes : [];
        const rawMentees = Array.isArray(menteesRes?.data) ? menteesRes.data : Array.isArray(menteesRes) ? menteesRes : [];

        // Scope to facility if provided
        const mentors = activeFacilityId !== undefined && activeFacilityId !== null && String(activeFacilityId).trim() !== ""
            ? rawMentors.filter((m: any) => String(m.facility_id ?? m.facilityId ?? m.facility?.id ?? "") === String(activeFacilityId))
            : rawMentors;

        const mentees = activeFacilityId !== undefined && activeFacilityId !== null && String(activeFacilityId).trim() !== ""
            ? rawMentees.filter((m: any) => String(m.facility_id ?? m.facilityId ?? m.facility?.id ?? "") === String(activeFacilityId))
            : rawMentees;

        // Map assigned mentee IDs and mentor loads from live assignments
        const assignedMenteeIds = new Set<string>();
        const mentorLoadMap = new Map<string, number>();

        for (const a of allAssignments) {
            const mentorId = String(a.mentor?.id ?? "").trim();
            const menteeId = String(a.mentee?.id ?? "").trim();
            if (menteeId) {
                assignedMenteeIds.add(menteeId);
            }
            let count = menteeId ? 1 : 0;
            if (Array.isArray(a.mentees)) {
                for (const m of a.mentees) {
                    if (m?.id) {
                        assignedMenteeIds.add(String(m.id).trim());
                    }
                }
                count = Math.max(count, a.mentees.length);
            }
            if (mentorId) {
                mentorLoadMap.set(mentorId, (mentorLoadMap.get(mentorId) || 0) + count);
            }
        }

        const unassignedMenteesList = mentees.filter((m: any) => !assignedMenteeIds.has(String(m.id).trim()));

        const leads: MentorLead[] = mentors.slice(0, 3).map((m: any) => {
            const load = mentorLoadMap.get(String(m.id).trim()) || 0;
            return {
                id: String(m.id),
                name: m.full_name || m.name || m.email,
                initials: getInitials(m.full_name || m.name),
                specialty: m.highest_qualification || m.highestQualification || m.thematic_area || "Clinical Midwifery",
                load: `${load}/3`,
            };
        });

        // Group unassigned mentees by real qualification
        const specialtyCounts = new Map<string, number>();
        for (const m of unassignedMenteesList) {
            const label = m.highest_qualification || m.highestQualification || "General Midwifery";
            specialtyCounts.set(label, (specialtyCounts.get(label) || 0) + 1);
        }
        const specialties = Array.from(specialtyCounts.entries()).map(([label, count]) => ({
            label,
            count,
        }));

        let readyToIntake = 0;
        let vacant = 0;
        let balanced = 0;
        let atLimit = 0;

        for (const m of mentors) {
            const load = mentorLoadMap.get(String(m.id).trim()) || 0;
            if (load === 0) {
                vacant += 1;
                readyToIntake += 1;
            } else if (load < 3) {
                balanced += 1;
                readyToIntake += 1;
            } else {
                atLimit += 1;
            }
        }

        const nextMentee = unassignedMenteesList[0];

        return {
            availableMentors: {
                readyToIntake,
                vacant,
                balanced,
                atLimit,
                leads,
            },
            unassignedMentees: {
                total: unassignedMenteesList.length,
                urgent: unassignedMenteesList.filter((m: any) => m.status === "pending").length,
                waitingOver14Days: 0,
                bySpecialty: specialties,
                nextInQueue: nextMentee
                    ? {
                          name: nextMentee.full_name || nextMentee.name || nextMentee.email,
                          specialty: nextMentee.highest_qualification || nextMentee.highestQualification || "Midwifery Practice",
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
 * with the horizontal list of their unique assigned mentees.
 * Uses both mentor ID and normalized mentor name to resolve the same mentor across records.
 */
export function groupAssignmentsByMentor(assignments: Assignment[]): Assignment[] {
    const map = new Map<string, Assignment>();
    const nameToKeyMap = new Map<string, string>();

    for (const a of assignments) {
        const mentorId = String(a.mentor?.id ?? "").trim();
        const mentorName = String(a.mentor?.name ?? "").trim().toLowerCase();

        let mentorKey = mentorId;
        if (!mentorKey && mentorName) {
            mentorKey = nameToKeyMap.get(mentorName) || mentorName;
        } else if (mentorKey && mentorName) {
            if (nameToKeyMap.has(mentorName)) {
                mentorKey = nameToKeyMap.get(mentorName)!;
            } else {
                nameToKeyMap.set(mentorName, mentorKey);
            }
        }

        const existing = map.get(mentorKey);

        const currentMentees: (Person & { facility?: string })[] =
            a.mentees && a.mentees.length > 0
                ? a.mentees
                : a.mentee && (a.mentee.id || a.mentee.name)
                ? [{ ...a.mentee, facility: a.facility }]
                : [];

        if (existing) {
            const existingMentees = existing.mentees || [
                { ...existing.mentee, facility: existing.facility },
            ];
            const seenIds = new Set(existingMentees.map((m) => String(m.id ?? "").trim()).filter(Boolean));
            const seenNames = new Set(existingMentees.map((m) => String(m.name ?? "").trim().toLowerCase()).filter(Boolean));

            for (const m of currentMentees) {
                const id = String(m.id ?? "").trim();
                const name = String(m.name ?? "").trim().toLowerCase();
                const alreadySeen = (id && seenIds.has(id)) || (name && seenNames.has(name));
                if (!alreadySeen) {
                    if (id) seenIds.add(id);
                    if (name) seenNames.add(name);
                    existingMentees.push(m);
                }
            }
            existing.mentees = existingMentees;

            // If any assignment is active, mark the grouped record as active
            if (a.status === "active") {
                existing.status = "active";
            }
            // If any assignment is newly created, retain the new indicator
            if (a.isNew) {
                existing.isNew = true;
            }
        } else {
            if (mentorName) {
                nameToKeyMap.set(mentorName, mentorKey);
            }
            map.set(mentorKey, {
                ...a,
                id: a.id || `grouped-${mentorKey}`,
                mentees: [...currentMentees],
            });
        }
    }

    return Array.from(map.values());
}