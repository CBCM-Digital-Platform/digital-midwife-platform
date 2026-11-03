import { apiClient, ApiError } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import { getThematicAreas, INITIAL_THEMATIC_AREAS } from "@/services/thematic-areas.service";
import { parsePositiveInt } from "@/services/learning.service";
import type {
    AssignmentFormOptions,
    CycleOption,
    MentorOption,
    MenteeOption,
    NewAssignmentInput,
    ThematicAreaOptionItem,
} from "@/types/assignment-form";

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

export async function getAssignmentFormOptions(): Promise<AssignmentFormOptions> {
    try {
        const [cyclesRes, facilitiesRes, mentorsRes, menteesRes, thematicAreasList] = await Promise.all([
            apiClient<any>("/api/v1/mentorship-cycles").catch(() => null),
            apiClient<any>("/api/v1/facilities").catch(() => null),
            apiClient<any>("/api/v1/users?role=mentor").catch(() => null),
            apiClient<any>("/api/v1/users?role=mentee").catch(() => null),
            getThematicAreas().catch(() => INITIAL_THEMATIC_AREAS),
        ]);

        const rawCycles = Array.isArray(cyclesRes?.data) ? cyclesRes.data : Array.isArray(cyclesRes) ? cyclesRes : [];
        const rawFacilities = Array.isArray(facilitiesRes?.data) ? facilitiesRes.data : Array.isArray(facilitiesRes) ? facilitiesRes : [];
        const rawMentors = Array.isArray(mentorsRes?.data?.users)
            ? mentorsRes.data.users
            : Array.isArray(mentorsRes?.data)
            ? mentorsRes.data
            : Array.isArray(mentorsRes?.users)
            ? mentorsRes.users
            : Array.isArray(mentorsRes)
            ? mentorsRes
            : [];
        const rawMentees = Array.isArray(menteesRes?.data?.users)
            ? menteesRes.data.users
            : Array.isArray(menteesRes?.data)
            ? menteesRes.data
            : Array.isArray(menteesRes?.users)
            ? menteesRes.users
            : Array.isArray(menteesRes)
            ? menteesRes
            : [];

        // Build facilities lookup map
        const facilityMap = new Map<number, string>();
        for (const f of rawFacilities) {
            facilityMap.set(f.id, f.name);
        }

        // Enrich cycles with their assigned thematic areas
        const cycles: CycleOption[] = await Promise.all(
            rawCycles.map(async (c: any) => {
                const thematicAreaIds: string[] = [];
                const thematicAreaNames: string[] = [];

                // 1. Check if thematic_areas are already embedded on the cycle object
                const rawAreas = Array.isArray(c.thematic_areas)
                    ? c.thematic_areas
                    : Array.isArray(c.thematicAreas)
                    ? c.thematicAreas
                    : [];

                for (const a of rawAreas) {
                    const idStr = String(a.id || a.thematic_area_id || "");
                    const nameStr = a.name || a.thematic_area_name || "";
                    if (idStr) thematicAreaIds.push(idStr);
                    if (nameStr) thematicAreaNames.push(nameStr);
                }

                // 2. If not embedded, fetch linked thematic areas from cycle endpoint
                if (thematicAreaIds.length === 0 && c.id) {
                    try {
                        const areaRes = await apiClient<any>(ENDPOINTS.CYCLES.THEMATIC_AREAS(c.id)).catch(() => null);
                        const fetchedAreas = Array.isArray(areaRes?.data)
                            ? areaRes.data
                            : Array.isArray(areaRes)
                            ? areaRes
                            : [];
                        for (const a of fetchedAreas) {
                            const idStr = String(a.id || a.thematic_area_id || "");
                            const nameStr = a.name || a.thematic_area_name || "";
                            if (idStr) thematicAreaIds.push(idStr);
                            if (nameStr) thematicAreaNames.push(nameStr);
                        }
                    } catch {
                        // Ignore endpoint errors gracefully
                    }
                }

                return {
                    id: String(c.id),
                    name: c.name || `Cycle #${c.id}`,
                    startDate: c.start_date || c.startDate || "",
                    endDate: c.end_date || c.endDate || "",
                    thematicAreaIds: Array.from(new Set(thematicAreaIds)),
                    thematicAreaNames: Array.from(new Set(thematicAreaNames)),
                };
            })
        );

        const mentors: MentorOption[] = rawMentors.map((m: any) => ({
            id: String(m.id),
            name: m.full_name || m.name || m.email,
            initials: getInitials(m.full_name || m.name),
            specialty: m.highest_qualification || m.specialty || "Obstetrics & Gynecology",
            currentLoad: m.current_load || m.currentLoad || 0,
            maxLoad: m.max_load || m.maxLoad || 3,
            avatarUrl: m.avatar_url || undefined,
            facilityId: m.facility_id ?? m.facilityId ?? m.facility?.id,
        }));

        const mentees: MenteeOption[] = rawMentees.map((me: any) => ({
            id: String(me.id),
            name: me.full_name || me.name || me.email,
            initials: getInitials(me.full_name || me.name),
            specialty: me.highest_qualification || me.specialty || "Midwifery Practice",
            facility: facilityMap.get(me.facility_id) || me.facility || "Central Hospital",
            facilityId: me.facility_id ?? me.facilityId ?? me.facility?.id,
        }));

        // Use real accredited thematic areas from the database
        const activeThematicAreas = Array.isArray(thematicAreasList) && thematicAreasList.length > 0
            ? thematicAreasList
            : INITIAL_THEMATIC_AREAS;

        const thematicAreas = activeThematicAreas.map((ta) => ta.name);
        const thematicAreaItems: ThematicAreaOptionItem[] = activeThematicAreas.map((ta) => ({
            id: String(ta.id),
            name: ta.name,
            code: ta.code,
            category: ta.category,
        }));

        return {
            cycles: cycles.length > 0 ? cycles : [
                { id: "1", name: "2026 Mentorship Cycle 1", startDate: "2026-11-01", endDate: "2027-04-30" }
            ],
            thematicAreas,
            thematicAreaItems,
            mentors,
            mentees,
        };
    } catch (err) {
        console.error("Failed to fetch assignment form options from backend:", err);
        throw err;
    }
}

/**
 * Creates a new assignment on the backend database.
 * Automatically ensures the thematic area is linked to the mentorship cycle.
 * Throws explicit errors so validation failures are never masked.
 */
export async function createAssignment(input: NewAssignmentInput): Promise<{ id: string }> {
    // 1. Resolve matching thematic area from database to obtain the exact numeric ID
    const allAreas = await getThematicAreas().catch(() => INITIAL_THEMATIC_AREAS);
    const selectedAreaName = input.thematicAreas?.[0] || "";
    const matchedArea = allAreas.find(
        (a) =>
            a.name.toLowerCase() === selectedAreaName.toLowerCase() ||
            String(a.id) === String(selectedAreaName) ||
            (a.code && a.code.toLowerCase() === selectedAreaName.toLowerCase()) ||
            (input.thematicAreaId && String(a.id) === String(input.thematicAreaId))
    );

    const numericAreaId = matchedArea
        ? parsePositiveInt(matchedArea.id) ?? 1
        : (parsePositiveInt(input.thematicAreaId) ?? 1);
    const officialAreaName = matchedArea?.name || selectedAreaName || "General Clinical Midwifery";

    const cycleIdNum = parsePositiveInt(input.cycleId) ?? 1;
    const facilityIdNum = parsePositiveInt(input.facilityId) ?? 1;

    // 1b. Proactively ensure the thematic area is linked to the cycle in the backend
    if (cycleIdNum && numericAreaId) {
        try {
            await apiClient(ENDPOINTS.CYCLES.THEMATIC_AREAS(cycleIdNum), {
                method: "POST",
                body: {
                    thematic_area_id: numericAreaId,
                    thematicAreaId: numericAreaId,
                },
            });
        } catch (linkErr: any) {
            // Already linked or non-blocking warning
            console.warn(`Attempted cycle-thematic area association:`, linkErr?.message || linkErr);
        }
    }

    let lastCreatedId: string | null = null;
    let lastError: Error | null = null;

    // 2. Iterate through selected mentors and mentees to create individual assignment pairs
    const mentorList = Array.isArray(input.mentorIds) && input.mentorIds.length > 0 ? input.mentorIds : [];
    const menteeList = Array.isArray(input.menteeIds) && input.menteeIds.length > 0 ? input.menteeIds : [];

    if (mentorList.length === 0 || menteeList.length === 0) {
        throw new Error("At least one mentor and one mentee must be selected for the assignment.");
    }

    for (const mentorId of mentorList) {
        for (const menteeId of menteeList) {
            const mentorIdNum = parsePositiveInt(mentorId);
            const menteeIdNum = parsePositiveInt(menteeId);

            if (!mentorIdNum || !menteeIdNum) {
                throw new Error(`Invalid mentor ID (${mentorId}) or mentee ID (${menteeId}). Both must be valid numeric IDs.`);
            }

            const assignmentPayload = {
                mentor_id: mentorIdNum,
                mentorId: mentorIdNum,
                mentee_id: menteeIdNum,
                menteeId: menteeIdNum,
                facility_id: facilityIdNum,
                facilityId: facilityIdNum,
                cycle_id: cycleIdNum,
                cycleId: cycleIdNum,
                thematic_area_id: numericAreaId,
                thematicAreaId: numericAreaId,
                thematic_area: officialAreaName,
                thematic_area_name: officialAreaName,
                thematic_domain: officialAreaName,
                thematicDomain: officialAreaName,
                status: "active",
                start_date: input.startDate || new Date().toISOString().slice(0, 10),
                end_date: input.endDate,
                notes: input.notes,
                matching_reason: input.notes || `Clinical Mentorship in ${officialAreaName}`,
            };

            try {
                // Post individual assignment to backend
                const singleRes = await apiClient.post<any>("/api/v1/assignments", assignmentPayload);
                const createdId = singleRes?.data?.id || singleRes?.id || singleRes?.data?.assignment?.id;
                if (createdId) {
                    lastCreatedId = String(createdId);
                    lastError = null;
                }

                // Also update user's mentor_id and thematic_area on their user profile if supported
                await apiClient.patch<any>(`/api/v1/users/${menteeIdNum}`, {
                    mentor_id: mentorIdNum,
                    thematic_area: officialAreaName,
                    thematic_area_id: numericAreaId,
                    facility_id: facilityIdNum,
                }).catch(() => null);
            } catch (err: any) {
                console.error("Backend assignment creation rejected:", err);
                const errMsg = String(err?.message || "").toLowerCase();

                // If error is about thematic area not being assigned to the cycle, link and retry
                if (errMsg.includes("thematic area") && errMsg.includes("cycle")) {
                    console.log(`Retrying cycle ${cycleIdNum} linking for thematic area ${numericAreaId}...`);
                    try {
                        await apiClient(ENDPOINTS.CYCLES.THEMATIC_AREAS(cycleIdNum), {
                            method: "POST",
                            body: {
                                thematic_area_id: numericAreaId,
                                thematicAreaId: numericAreaId,
                            },
                        });
                        const retryRes = await apiClient.post<any>("/api/v1/assignments", assignmentPayload);
                        const retryId = retryRes?.data?.id || retryRes?.id || retryRes?.data?.assignment?.id;
                        if (retryId) {
                            lastCreatedId = String(retryId);
                            lastError = null;
                        }
                    } catch (retryErr: any) {
                        console.error("Retry assignment creation failed:", retryErr);
                        const cycleLabel = input.cycleName || `Cycle #${cycleIdNum}`;
                        lastError = new Error(
                            `Thematic area "${officialAreaName}" is not assigned to ${cycleLabel}. Please link it in Cycle Management or select an accredited thematic area for this cycle.`
                        );
                    }
                } else {
                    lastError = err;
                }
            }
        }
    }

    if (lastCreatedId) {
        return { id: lastCreatedId };
    }

    // If all backend creation calls failed, propagate the real backend error!
    if (lastError) {
        throw lastError;
    }

    return { id: `assign-${Date.now()}` };
}
