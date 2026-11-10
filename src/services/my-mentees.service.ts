import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import { FACILITY_ID_MAP } from "@/services/users.service";
import { getStoredAssessments } from "@/services/mentor-assessments.service";
import type { CompetencyLevel, MyMentee } from "@/types/my-mentee";
import type { MentorAssessment } from "@/types/mentor-assessment";

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

function getId(value: unknown): string | number | undefined {
    return typeof value === "string" || typeof value === "number" ? value : undefined;
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
    const firstName = String(mentee.first_name ?? mentee.firstName ?? "").trim();
    const lastName = String(mentee.last_name ?? mentee.lastName ?? "").trim();
    const fullName = `${firstName} ${lastName}`.trim();
    for (const candidate of [
        mentee.full_name,
        mentee.fullName,
        fullName,
        mentee.name,
        mentee.username,
        mentee.user_name,
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

    if (typeof mentee.email === "string" && mentee.email.includes("@")) {
        return mentee.email.slice(0, mentee.email.indexOf("@")).replace(/[._-]+/g, " ").trim();
    }

    return "Name unavailable";
}

/**
 * Fetches real active mentees assigned specifically to the logged-in mentor from the backend database.
 * No mock data fallback is used; returns real assigned mentees or empty array.
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

        const [assignmentsResponse, facilitiesRes, rawAssessmentsRes] = await Promise.all([
            apiClient<unknown>(ENDPOINTS.ASSIGNMENTS.MENTOR_ASSIGNMENTS(myId)),
            apiClient<any>("/api/v1/facilities?limit=100").catch(() => null),
            apiClient<any>(`${ENDPOINTS.ASSESSMENTS.BASE}?limit=100`).catch(() => null),
        ]);
        const allAssignments = getApiList(assignmentsResponse, ["assignments", "items", "results"]);
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
        for (const facility of getApiList(facilitiesRes, ["facilities"])) {
            if (facility.id && facility.name) {
                facilityMap.set(String(facility.id), String(facility.name));
            }
        }

        // Find mentee IDs assigned to this mentor
        const assignedMenteeIds = new Set<string>();
        const assignedMenteeMap = new Map<string, ApiRecord>();
        const assignmentIdsByMentee = new Map<string, Set<string | number>>();
        const assignmentContextByMentee = new Map<
            string,
            { facilityId?: string | number; cycleId?: string | number }
        >();

        for (const assignment of allAssignments) {
            const mentor = getApiRecord(assignment, ["mentor"]);
            const assignmentMentorId = String(
                assignment.mentor_id ?? assignment.mentorId ?? mentor.id ?? ""
            );
            if (assignmentMentorId && !isSameId(assignmentMentorId, myId)) continue;

            const mentee = getApiRecord(assignment, [
                "mentee",
                "mentee_user",
                "menteeUser",
                "mentee_profile",
            ]);
            const menteeId = String(
                assignment.mentee_id ?? assignment.menteeId ?? mentee.id ?? ""
            );
            if (!menteeId || menteeId === "undefined" || menteeId === "null") continue;

            assignedMenteeIds.add(menteeId);
            assignedMenteeMap.set(
                menteeId,
                Object.keys(mentee).length > 0 ? mentee : assignment
            );

            const assignmentId = assignment.id ?? assignment.assignment_id;
            if (typeof assignmentId === "string" || typeof assignmentId === "number") {
                const assignmentIds = assignmentIdsByMentee.get(menteeId) ?? new Set();
                assignmentIds.add(assignmentId);
                assignmentIdsByMentee.set(menteeId, assignmentIds);
            }

            const facilityId = getId(assignment.facility_id ?? assignment.facilityId);
            const cycleId = getId(assignment.cycle_id ?? assignment.cycleId);
            assignmentContextByMentee.set(menteeId, { facilityId, cycleId });
        }

        // If no assignments exist for this mentor, return empty list (NO MOCK DATA)
        if (assignedMenteeIds.size === 0) {
            if (allAssignments.length > 0) {
                throw new Error(
                    `The backend returned ${allAssignments.length} assignments, but none matched the signed-in mentor ID ${myId}.`
                );
            }
            return [];
        }

        // Parse assessments without calling getAssessments() to avoid circular recursion
        const parsedAssessments: MentorAssessment[] = [];
        const rawAstList = getApiList(rawAssessmentsRes, ["assessments", "items", "results"]);
        rawAstList.forEach((ast: any) => {
            parsedAssessments.push({
                id: String(ast.id),
                menteeId: String(ast.mentee_id || ast.menteeId),
                menteeName: ast.mentee?.full_name || ast.mentee_name || "Mentee",
                menteeTitle: ast.mentee?.highest_qualification || "Resident Midwife",
                date: ast.assessment_date || ast.date || new Date().toISOString().slice(0, 10),
                type: ast.thematic_area?.name || ast.title || ast.type || "Clinical Assessment",
                status: ast.status || "PENDING",
                scorePct: ast.score !== undefined ? ast.score : null,
                dueDate: ast.due_date || ast.dueDate,
                instructions: ast.instructions,
            });
        });
        const storedAssessments = getStoredAssessments();
        const allAssessments = [...storedAssessments, ...parsedAssessments];

        // Build MyMentee list from real assigned mentees
        const result: MyMentee[] = [];

        for (const assignedId of Array.from(assignedMenteeIds)) {
            const assignmentProfile = assignedMenteeMap.get(assignedId);
            const contactProfile = contactsById.get(assignedId);
            const userObj: ApiRecord = {
                ...(contactProfile ?? {}),
                ...(assignmentProfile ?? {}),
                id: assignmentProfile?.id ?? contactProfile?.id ?? assignedId,
            };

            const facility = getApiRecord(userObj, ["facility"]);
            const facilityValue = userObj.facility;
            const facId = String(userObj.facility_id ?? userObj.facilityId ?? facility.id ?? "");
            const facName =
                (facId && facilityMap.get(facId)) ||
                userObj.facility_name ||
                facility.name ||
                (typeof facilityValue === "string" ? facilityValue : "Assigned Facility");

            const active = userObj.status ? String(userObj.status).toLowerCase() !== "inactive" : true;
            const title = String(
                userObj.highest_qualification ||
                userObj.specialty ||
                userObj.subtitle ||
                userObj.profession ||
                userObj.training_status ||
                "Resident Midwife"
            );
            const level = parseCompetencyLevel(
                String(userObj.competency_level ?? userObj.cadreLevel ?? userObj.level ?? ""),
                title
            );

            const lastSession = String(
                userObj.last_session_date ||
                String(userObj.updated_at ?? "").slice(0, 10) ||
                userObj.assignedDate ||
                new Date().toISOString().slice(0, 10)
            );

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
                code: String(userObj.code || userObj.systemId || `M-${String(assignedId).padStart(4, "0")}`),
                name: menteeName,
                title,
                facility: String(facName),
                level,
                active,
                lastSession,
                overdue: daysSinceSession > 14,
                avatarUrl: typeof (userObj.avatar_url ?? userObj.avatarUrl) === "string"
                    ? String(userObj.avatar_url ?? userObj.avatarUrl)
                    : null,
                assignmentIds: Array.from(assignmentIdsByMentee.get(assignedId) ?? []),
                facilityId: getId(userObj.facility_id ?? userObj.facilityId ?? facility.id) ??
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
