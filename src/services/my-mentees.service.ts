import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import { FACILITY_ID_MAP } from "@/services/users.service";
import { getStoredAssessments } from "@/services/mentor-assessments.service";
import type { CompetencyLevel, MyMentee } from "@/types/my-mentee";

function parseCompetencyLevel(rawLevel?: string, qualification?: string): CompetencyLevel {
    const l = (rawLevel || "").toUpperCase();
    if (l === "ADVANCED" || l === "QUALIFIED" || l === "NOVICE") {
        return l as CompetencyLevel;
    }
    const q = (qualification || "").toLowerCase();
    if (q.includes("year 3") || q.includes("senior") || q.includes("specialist") || q.includes("master")) {
        return "ADVANCED";
    }
    if (q.includes("year 2") || q.includes("resident") || q.includes("bsc") || q.includes("staff")) {
        return "QUALIFIED";
    }
    return "NOVICE";
}

function isSameId(id1?: string | number | null, id2?: string | number | null): boolean {
    if (id1 === undefined || id1 === null || id2 === undefined || id2 === null) return false;
    const s1 = String(id1).trim();
    const s2 = String(id2).trim();
    if (!s1 || !s2) return false;
    if (s1.toLowerCase() === s2.toLowerCase()) return true;
    const n1 = s1.replace(/\D/g, "");
    const n2 = s2.replace(/\D/g, "");
    if (n1 && n2 && n1 === n2) return true;
    return false;
}

type ApiRecord = Record<string, unknown>;

function isApiRecord(value: unknown): value is ApiRecord {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getApiList(response: unknown, collectionKeys: string[]): ApiRecord[] {
    let payload = response;
    for (let depth = 0; depth < 4; depth += 1) {
        if (Array.isArray(payload)) return payload.filter(isApiRecord);
        if (!isApiRecord(payload)) return [];

        for (const key of collectionKeys) {
            const collection = payload[key];
            if (Array.isArray(collection)) return collection.filter(isApiRecord);
        }

        payload = payload.data ?? payload.result ?? payload.payload;
    }
    return [];
}

function getApiRecord(response: unknown, recordKeys: string[]): ApiRecord {
    let payload = response;
    for (let depth = 0; depth < 4; depth += 1) {
        if (!isApiRecord(payload)) return {};
        for (const key of recordKeys) {
            const record = payload[key];
            if (isApiRecord(record)) return record;
        }
        if (payload.id !== undefined) return payload;
        payload = payload.data ?? payload.result ?? payload.payload;
    }
    return {};
}

function getMenteeDisplayName(mentee: ApiRecord): string {
    const records: ApiRecord[] = [];
    const visited = new Set<ApiRecord>();
    const pending = [mentee];
    while (pending.length > 0) {
        const record = pending.shift();
        if (!record || visited.has(record)) continue;
        visited.add(record);
        records.push(record);
        for (const value of Object.values(record)) {
            if (isApiRecord(value)) pending.push(value);
        }
    }

    for (const record of records) {
        const firstName = String(
            record.first_name ??
            record.firstName ??
            record.mentee_first_name ??
            record.menteeFirstName ??
            ""
        ).trim();
        const lastName = String(
            record.last_name ??
            record.lastName ??
            record.mentee_last_name ??
            record.menteeLastName ??
            ""
        ).trim();
        const fullName = `${firstName} ${lastName}`.trim();
        for (const candidate of [
            record.mentee_name,
            record.menteeName,
            record.mentee_full_name,
            record.menteeFullName,
            record.full_name,
            record.fullName,
            fullName,
            record.name,
        ]) {
            if (
                typeof candidate === "string" &&
                candidate.trim() &&
                !["mentee", "mentor", "clinician", "user", "resident midwife"].includes(
                    candidate.trim().toLowerCase()
                )
            ) {
                return candidate.trim();
            }
        }
    }

    for (const record of records) {
        for (const candidate of [record.username, record.user_name]) {
            if (typeof candidate === "string" && candidate.trim()) {
                return candidate.trim();
            }
        }
    }

    for (const record of records) {
        if (typeof record.email === "string" && record.email.includes("@")) {
            return record.email.slice(0, record.email.indexOf("@")).replace(/[._-]+/g, " ").trim();
        }
    }

    return "Name unavailable";
}

/**
 * Fetches real active mentees assigned specifically to the logged-in mentor from the backend database.
 * Only backend assignments linked to this mentor are used to build the list.
 */
export async function getMyMentees(mentorIdOverride?: string | number): Promise<MyMentee[]> {
    try {
        let myId = mentorIdOverride ? String(mentorIdOverride) : null;

        // In Server Components, extract user info directly from session
        if (!myId && typeof window === "undefined") {
            try {
                const { getServerSession } = await import("next-auth/next");
                const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
                const session = await getServerSession(authOptions);
                if ((session?.user as any)?.id) {
                    myId = String((session?.user as any).id);
                }
            } catch {
                // Ignore session lookup errors
            }
        }

        if (!myId) {
            const meRes = await apiClient<unknown>("/api/v1/users/me");
            const meUser = getApiRecord(meRes, ["user", "profile"]);
            if (meUser.id !== undefined && meUser.id !== null) {
                myId = String(meUser.id);
            }
        }
        if (!myId) {
            throw new Error("Unable to determine the signed-in mentor ID.");
        }

        const assignmentsResponse = await apiClient<unknown>(
            ENDPOINTS.ASSIGNMENTS.MENTOR_ASSIGNMENTS(myId)
        );
        const allAssignments = getApiList(assignmentsResponse, [
            "assignments",
            "items",
            "results",
        ]);
        const contactsById = new Map<string, ApiRecord>();
        try {
            const contactsResponse = await apiClient<unknown>("/api/v1/messages/contacts");
            for (const contact of getApiList(contactsResponse, [])) {
                const contactId = contact.id;
                if (typeof contactId === "string" || typeof contactId === "number") {
                    contactsById.set(String(contactId), contact);
                }
            }
        } catch (error) {
            console.warn("Could not load assigned mentee contacts for profile names:", error);
        }

        // Build facilities lookup map
        const facilityMap = new Map<string, string>();
        Object.entries(FACILITY_ID_MAP).forEach(([k, v]) => facilityMap.set(String(k), v));

        // Find mentee IDs assigned to this mentor
        const assignedMenteeIds = new Set<string>();
        const assignedMenteeMap = new Map<string, any>();
        const assignmentIdsByMentee = new Map<string, Set<string | number>>();
        const assignmentContextByMentee = new Map<
            string,
            { facilityId?: string | number; cycleId?: string | number }
        >();
        const addAssignmentContext = (menteeId: string, assignment: any) => {
            const facilityId =
                assignment.facility_id ??
                assignment.facilityId ??
                assignment.facility?.id;
            const cycleId = assignment.cycle_id ?? assignment.cycleId;
            const current = assignmentContextByMentee.get(menteeId) ?? {};
            assignmentContextByMentee.set(menteeId, {
                facilityId: current.facilityId ?? facilityId,
                cycleId: current.cycleId ?? cycleId,
            });
        };

        for (const a of allAssignments) {
            const mentor = getApiRecord(a, ["mentor"]);
            const assignMentorId = String(a.mentor_id || a.mentorId || mentor.id || "");

            const isMatch =
                isSameId(assignMentorId, myId) ||
                !assignMentorId;

            if (isMatch) {
                // Single mentee reference
                const menteeRecord =
                    getApiRecord(a, ["mentee", "mentee_user", "menteeUser", "mentee_profile"]);
                const singleId = String(a.mentee_id || a.menteeId || menteeRecord.id || "");
                if (singleId && singleId !== "undefined" && singleId !== "null") {
                    assignedMenteeIds.add(singleId);
                    if (Object.keys(menteeRecord).length > 0) {
                        assignedMenteeMap.set(singleId, menteeRecord);
                    } else {
                        assignedMenteeMap.set(singleId, a);
                    }
                    addAssignmentContext(singleId, a);
                    const assignmentId = a.id ?? a.assignment_id;
                    if (typeof assignmentId === "string" || typeof assignmentId === "number") {
                        const assignmentIds = assignmentIdsByMentee.get(singleId) ?? new Set();
                        assignmentIds.add(assignmentId);
                        assignmentIdsByMentee.set(singleId, assignmentIds);
                    }
                }

                // Array of mentees
                if (Array.isArray(a.mentees)) {
                    for (const m of a.mentees) {
                        const mid = String(m.id || m.mentee_id || "");
                        if (mid && mid !== "undefined" && mid !== "null") {
                            assignedMenteeIds.add(mid);
                            const menteeRecord = getApiRecord(m, ["user", "mentee", "profile"]);
                            assignedMenteeMap.set(
                                mid,
                                Object.keys(menteeRecord).length > 0 ? menteeRecord : m
                            );
                            addAssignmentContext(mid, a);
                            const assignmentId = a.id ?? a.assignment_id;
                            if (typeof assignmentId === "string" || typeof assignmentId === "number") {
                                const assignmentIds = assignmentIdsByMentee.get(mid) ?? new Set();
                                assignmentIds.add(assignmentId);
                                assignmentIdsByMentee.set(mid, assignmentIds);
                            }
                        }
                    }
                }
            }
        }

        // If no assignments exist for this mentor, return empty list (NO MOCK DATA)
        if (assignedMenteeIds.size === 0) {
            if (allAssignments.length > 0) {
                throw new Error(
                    `The backend returned ${allAssignments.length} assignments, but none matched the signed-in mentor ID${myId ? ` ${myId}` : ""}. Verify that the assignment's mentor_id matches this account.`
                );
            }
            return [];
        }

        const allAssessments = getStoredAssessments();
        const menteeById = new Map<string, any>();

        // Use profile data embedded in the mentor's assignment if the bulk user list omits it.
        for (const assignedId of assignedMenteeIds) {
            if (menteeById.has(assignedId)) continue;
            const assignmentMentee = assignedMenteeMap.get(assignedId);
            menteeById.set(
                assignedId,
                assignmentMentee && typeof assignmentMentee === "object"
                    ? { ...assignmentMentee, id: assignmentMentee.id ?? assignedId }
                    : { id: assignedId }
            );
        }

        // Build MyMentee list from real assigned mentees
        const result: MyMentee[] = [];

        for (const assignedId of Array.from(assignedMenteeIds)) {
            const userObj = menteeById.get(assignedId);
            if (!userObj) continue;

            const facId = String(userObj.facility_id ?? userObj.facilityId ?? userObj.facility?.id ?? "");
            const facName =
                (facId && facilityMap.get(facId)) ||
                userObj.facility_name ||
                userObj.facility?.name ||
                (typeof userObj.facility === "string" ? userObj.facility : "Assigned Facility");

            const active = userObj.status ? userObj.status.toLowerCase() !== "inactive" : true;
            const title =
                userObj.highest_qualification ||
                userObj.specialty ||
                userObj.subtitle ||
                userObj.profession ||
                userObj.training_status ||
                "Resident Midwife";
            const level = parseCompetencyLevel(
                userObj.competency_level || userObj.cadreLevel || userObj.level,
                title
            );

            const lastSession =
                userObj.last_session_date ||
                userObj.updated_at?.slice(0, 10) ||
                userObj.assignedDate ||
                new Date().toISOString().slice(0, 10);

            const daysSinceSession = Math.floor(
                (Date.now() - new Date(lastSession).getTime()) / 86_400_000
            );

            // Find any active assessment assigned to this mentee
            const menteeAssessment = allAssessments.find(
                (ast) => String(ast.menteeId) === assignedId
            );

            const assignmentName = getMenteeDisplayName(userObj);
            const menteeName =
                assignmentName !== "Name unavailable"
                    ? assignmentName
                    : getMenteeDisplayName(contactsById.get(assignedId) ?? {});

            result.push({
                id: assignedId,
                code: userObj.code || userObj.systemId || `M-${String(assignedId).padStart(4, "0")}`,
                name: menteeName,
                title,
                facility: facName,
                level,
                active,
                lastSession,
                overdue: daysSinceSession > 14,
                avatarUrl: userObj.avatar_url || userObj.avatarUrl || null,
                assignmentIds: Array.from(assignmentIdsByMentee.get(assignedId) ?? []),
                facilityId:
                    userObj.facility_id ??
                    userObj.facilityId ??
                    userObj.facility?.id ??
                    assignmentContextByMentee.get(assignedId)?.facilityId,
                cycleId: assignmentContextByMentee.get(assignedId)?.cycleId,
                assignedAssessment: menteeAssessment,
            });
        }

        return result;
    } catch (error) {
        console.error("Failed to fetch live assigned mentees from database:", error);
        throw error;
    }
}

/**
 * Fetches all mentees across the mentor's facilities from the real backend.
 * Provides live relative session tracking against today's date.
 */
export async function getFacilityRoster(): Promise<{ asOf: string; mentees: MyMentee[] }> {
    const today = new Date().toISOString().slice(0, 10);

    try {
        const [meRes, menteesRes, facilitiesRes] = await Promise.all([
            apiClient<any>("/api/v1/users/me").catch(() => null),
            apiClient<any>("/api/v1/users?role=mentee&limit=200").catch(() => null),
            apiClient<any>("/api/v1/facilities?limit=100").catch(() => null),
        ]);

        const rawMentees = Array.isArray(menteesRes?.data?.users)
            ? menteesRes.data.users
            : Array.isArray(menteesRes?.data)
            ? menteesRes.data
            : Array.isArray(menteesRes)
            ? menteesRes
            : [];

        if (rawMentees.length === 0) {
            return { asOf: today, mentees: [] };
        }

        const facilityMap = new Map<string, string>();
        Object.entries(FACILITY_ID_MAP).forEach(([k, v]) => facilityMap.set(String(k), v));
        const rawFacilities = Array.isArray(facilitiesRes?.data) ? facilitiesRes.data : [];
        rawFacilities.forEach((f: any) => {
            if (f.id && f.name) facilityMap.set(String(f.id), f.name);
        });

        const meUser = meRes?.data || meRes;
        const myFacilityId = meUser?.facility_id ? String(meUser.facility_id) : null;

        const liveFacilityMentees = rawMentees
            .filter((u: any) => {
                if (!myFacilityId) return true;
                const facId = String(u.facility_id ?? u.facilityId ?? "");
                return facId === myFacilityId;
            })
            .map((u: any, idx: number) => {
                const uid = String(u.id);
                const facId = String(u.facility_id ?? u.facilityId ?? "");
                const facName = (facId && facilityMap.get(facId)) || u.facility_name || u.facility?.name || "Assigned Facility";
                const active = u.status?.toLowerCase() !== "inactive";
                const level = parseCompetencyLevel(u.competency_level, u.highest_qualification);

                const lastSession =
                    u.last_session_date ||
                    u.updated_at?.slice(0, 10) ||
                    today;

                const daysSince = Math.floor(
                    (Date.now() - new Date(lastSession).getTime()) / 86_400_000
                );

                return {
                    id: uid,
                    code: u.code || `M-${String(u.id).padStart(4, "0")}`,
                    name: u.full_name || u.name || `Resident Midwife #${uid}`,
                    title: u.highest_qualification || "Resident Midwife",
                    facility: facName,
                    level,
                    active,
                    lastSession,
                    overdue: daysSince > 14,
                    avatarUrl: u.avatar_url || null,
                };
            });

        return {
            asOf: today,
            mentees: liveFacilityMentees,
        };
    } catch (error) {
        console.warn("Failed to fetch live facility roster:", error);
        return { asOf: today, mentees: [] };
    }
}
