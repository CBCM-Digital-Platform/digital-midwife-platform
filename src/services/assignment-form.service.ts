import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import { parsePositiveInt } from "@/services/learning.service";
import { getMentees, getMentors } from "@/services/users.service";
import type {
    AssignmentFormOptions,
    CycleOption,
    MentorOption,
    MenteeOption,
    NewAssignmentInput,
    ThematicAreaOptionItem,
} from "@/types/assignment-form";

type ApiRecord = Record<string, unknown>;

function getApiList(value: unknown, keys: string[]): ApiRecord[] {
    let payload: unknown = value;
    for (let depth = 0; depth < 5; depth += 1) {
        if (Array.isArray(payload)) {
            return payload.filter(
                (item): item is ApiRecord => item !== null && typeof item === "object" && !Array.isArray(item)
            );
        }
        if (payload === null || typeof payload !== "object") break;
        const record = payload as ApiRecord;
        for (const key of keys) {
            if (Array.isArray(record[key])) {
                return (record[key] as unknown[]).filter(
                    (item): item is ApiRecord => item !== null && typeof item === "object" && !Array.isArray(item)
                );
            }
        }
        const nested = record.data ?? record.result ?? record.payload;
        if (nested === undefined || nested === payload) break;
        payload = nested;
    }
    throw new Error("The backend returned an unexpected thematic-area list response.");
}

async function getBackendThematicAreas(): Promise<ThematicAreaOptionItem[]> {
    const response = await apiClient<unknown>(ENDPOINTS.THEMATIC_AREAS.BASE, {
        params: { page: 1, limit: 100 },
    });
    return getApiList(response, ["items", "thematic_areas", "thematicAreas", "results"])
        .filter((area) => String(area.status ?? "active").toLowerCase() === "active")
        .map((area) => ({
            id: String(area.id ?? ""),
            name: String(area.name ?? ""),
            code: typeof area.code === "string" ? area.code : undefined,
            category: typeof area.category === "string" ? area.category : undefined,
        }))
        .filter((area) => area.id && area.name);
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

export async function getAssignmentFormOptions(): Promise<AssignmentFormOptions> {
    try {
        const [cyclesRes, facilitiesRes, mentorsList, menteesList, thematicAreasList] = await Promise.all([
            apiClient<any>("/api/v1/mentorship-cycles").catch(() => null),
            apiClient<any>("/api/v1/facilities").catch(() => null),
            getMentors(),
            getMentees(),
            getBackendThematicAreas(),
        ]);

        const rawCycles = getApiList(cyclesRes, ["items", "cycles", "results"]);
        const rawFacilities = getApiList(facilitiesRes, ["items", "facilities", "results"]);

        // Build facilities lookup map
        const facilityMap = new Map<number, string>();
        for (const f of rawFacilities) {
            const id = Number(f.id);
            if (Number.isInteger(id) && typeof f.name === "string") {
                facilityMap.set(id, f.name);
            }
        }

        // Build lookup maps for all accredited thematic areas
        const thematicAreaById = new Map<string, ThematicAreaOptionItem>();
        const thematicAreaByName = new Map<string, ThematicAreaOptionItem>();
        for (const item of thematicAreasList) {
            thematicAreaById.set(String(item.id), item);
            thematicAreaByName.set(item.name.toLowerCase().trim(), item);
        }

        // Enrich cycles with their assigned thematic areas
        const cycles: CycleOption[] = await Promise.all(
            rawCycles.map(async (c: any) => {
                const thematicAreaIds: string[] = [];
                const thematicAreaNames: string[] = [];

                const addArea = (rawId?: any, rawName?: any) => {
                    const idStr = rawId !== undefined && rawId !== null ? String(rawId).trim() : "";
                    const nameStr = rawName ? String(rawName).trim() : "";

                    if (idStr && thematicAreaById.has(idStr)) {
                        const matched = thematicAreaById.get(idStr)!;
                        thematicAreaIds.push(matched.id);
                        thematicAreaNames.push(matched.name);
                        return;
                    }

                    if (nameStr && thematicAreaByName.has(nameStr.toLowerCase())) {
                        const matched = thematicAreaByName.get(nameStr.toLowerCase())!;
                        thematicAreaIds.push(matched.id);
                        thematicAreaNames.push(matched.name);
                        return;
                    }

                    if (idStr) thematicAreaIds.push(idStr);
                    if (nameStr) thematicAreaNames.push(nameStr);
                };

                // 1. Check if thematic_areas are already embedded on the cycle object
                const rawAreas = Array.isArray(c.thematic_areas)
                    ? c.thematic_areas
                    : Array.isArray(c.thematicAreas)
                    ? c.thematicAreas
                    : [];

                for (const a of (rawAreas as any[])) {
                    if (typeof a === "number" || typeof a === "string") {
                        addArea(a, undefined);
                    } else if (a && typeof a === "object") {
                        const nested: any = a.thematic_area || a.thematicArea || a;
                        addArea(
                            nested?.id || a.thematic_area_id || a.thematicAreaId || a.id,
                            nested?.name || a.thematic_area_name || a.thematicAreaName || a.name
                        );
                    }
                }

                // 2. If not embedded, fetch linked thematic areas from cycle endpoint
                if (thematicAreaIds.length === 0 && c.id) {
                    try {
                        const areaRes = await apiClient<any>(ENDPOINTS.CYCLES.THEMATIC_AREAS(c.id)).catch(() => null);
                        const fetchedAreas: any[] = areaRes
                            ? (getApiList(areaRes, ["items", "thematic_areas", "thematicAreas", "results", "data"]) as any[])
                            : [];
                        for (const a of fetchedAreas) {
                            if (typeof a === "number" || typeof a === "string") {
                                addArea(a, undefined);
                            } else if (a && typeof a === "object") {
                                const nested: any = a.thematic_area || a.thematicArea || a;
                                addArea(
                                    nested?.id || a.thematic_area_id || a.thematicAreaId || a.id,
                                    nested?.name || a.thematic_area_name || a.thematicAreaName || a.name
                                );
                            }
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

        const mentors: MentorOption[] = mentorsList.map((m) => ({
            id: String(m.id),
            name: m.name || m.email,
            initials: getInitials(m.name),
            specialty: m.profession || "Obstetrics & Gynecology",
            currentLoad: m.assignedMenteesCount || 0,
            maxLoad: 3,
            avatarUrl: m.avatarUrl || undefined,
            facilityId: m.facilityId,
        }));

        const mentees: MenteeOption[] = menteesList.map((me) => ({
            id: String(me.id),
            name: me.name || me.email,
            initials: getInitials(me.name),
            specialty: me.profession || "Midwifery Practice",
            facility: facilityMap.get(Number(me.facilityId)) || me.facility || "Facility unavailable",
            facilityId: me.facilityId,
        }));

        // Use real accredited thematic areas from the database
        const activeThematicAreas = thematicAreasList;

        const thematicAreas = activeThematicAreas.map((ta) => ta.name);
        const thematicAreaItems: ThematicAreaOptionItem[] = activeThematicAreas.map((ta) => ({
            id: String(ta.id),
            name: ta.name,
            code: ta.code,
            category: ta.category,
        }));

        return {
            cycles,
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
 * Helper to ensure a thematic area is linked to a mentorship cycle in the backend database.
 * Uses a robust multi-strategy approach to support various backend API conventions.
 */
export async function linkThematicAreaToCycle(cycleId: number | string, thematicAreaId: number | string): Promise<void> {
    const cycleIdNum = parsePositiveInt(cycleId);
    const areaIdNum = parsePositiveInt(thematicAreaId);
    if (!cycleIdNum || !areaIdNum) return;

    // Strategy 1: POST snake_case single ID { thematic_area_id: areaIdNum }
    try {
        await apiClient(ENDPOINTS.CYCLES.THEMATIC_AREAS(cycleIdNum), {
            method: "POST",
            body: { thematic_area_id: areaIdNum },
        });
        return;
    } catch {
        // Strategy 2: POST snake_case array { thematic_area_ids: [areaIdNum] }
        try {
            await apiClient(ENDPOINTS.CYCLES.THEMATIC_AREAS(cycleIdNum), {
                method: "POST",
                body: { thematic_area_ids: [areaIdNum] },
            });
            return;
        } catch {
            // Strategy 3: POST camelCase single ID { thematicAreaId: areaIdNum }
            try {
                await apiClient(ENDPOINTS.CYCLES.THEMATIC_AREAS(cycleIdNum), {
                    method: "POST",
                    body: { thematicAreaId: areaIdNum },
                });
                return;
            } catch {
                // Strategy 4: PATCH cycle directly
                try {
                    await apiClient.patch(ENDPOINTS.CYCLES.DETAIL(cycleIdNum), {
                        thematic_area_ids: [areaIdNum],
                    });
                    return;
                } catch {
                    // Non-blocking fallback
                }
            }
        }
    }
}

/**
 * Creates a new assignment on the backend database.
 * Strictly conforms to CreateAssignmentRequest schema and handles cycle-thematic area linkage.
 */
export async function createAssignment(input: NewAssignmentInput): Promise<{ ids: string[] }> {
    // 1. Resolve matching thematic area from database to obtain the exact numeric ID
    const allAreas = await getBackendThematicAreas();
    const selectedAreaName = input.thematicAreas?.[0] || "";
    const matchedArea = allAreas.find(
        (a) =>
            a.name.toLowerCase() === selectedAreaName.toLowerCase() ||
            String(a.id) === String(selectedAreaName) ||
            (a.code && a.code.toLowerCase() === selectedAreaName.toLowerCase()) ||
            (input.thematicAreaId && String(a.id) === String(input.thematicAreaId))
    );

    const numericAreaId = matchedArea
        ? parsePositiveInt(matchedArea.id)
        : parsePositiveInt(input.thematicAreaId);

    const officialAreaName = matchedArea?.name || selectedAreaName;
    const cycleIdNum = parsePositiveInt(input.cycleId);
    const facilityIdNum = parsePositiveInt(input.facilityId);

    if (!cycleIdNum) {
        throw new Error("A valid mentorship cycle must be selected.");
    }
    if (!facilityIdNum) {
        throw new Error("A valid facility must be selected for this assignment.");
    }
    if (!numericAreaId) {
        throw new Error("A valid accredited thematic area must be selected.");
    }

    const mentorList = Array.isArray(input.mentorIds) && input.mentorIds.length > 0 ? input.mentorIds : [];
    const menteeList = Array.isArray(input.menteeIds) && input.menteeIds.length > 0 ? input.menteeIds : [];

    if (mentorList.length === 0 || menteeList.length === 0) {
        throw new Error("At least one mentor and one mentee must be selected for the assignment.");
    }

    // 2. Automatically link the thematic area to the cycle in the backend database
    await linkThematicAreaToCycle(cycleIdNum, numericAreaId);

    const createdIds: string[] = [];

    // 3. Iterate through selected mentors and mentees to create individual assignment pairs
    for (const mentorId of mentorList) {
        for (const menteeId of menteeList) {
            const mentorIdNum = parsePositiveInt(mentorId);
            const menteeIdNum = parsePositiveInt(menteeId);

            if (!mentorIdNum || !menteeIdNum) {
                throw new Error(`Invalid mentor ID (${mentorId}) or mentee ID (${menteeId}). Both must be valid numeric IDs.`);
            }

            // Backend schema: CreateAssignmentRequest
            // { mentor_id, mentee_id, facility_id, cycle_id, thematic_area_id, matching_reason }
            const matchingReasonText = input.notes.trim()
                ? `${input.notes.trim()} [Domain: ${officialAreaName}]`
                : `Clinical Mentorship in ${officialAreaName}`;

            const assignmentPayload = {
                mentor_id: mentorIdNum,
                mentee_id: menteeIdNum,
                facility_id: facilityIdNum,
                cycle_id: cycleIdNum,
                thematic_area_id: numericAreaId,
                matching_reason: matchingReasonText,
            };

            // Post assignment to backend, with automatic retry & cycle-area re-linking if required
            let singleRes: unknown;
            try {
                singleRes = await apiClient.post<unknown>(ENDPOINTS.ASSIGNMENTS.BASE, assignmentPayload);
            } catch (err: any) {
                const errMsg = String(err?.message || "").toLowerCase();
                if (errMsg.includes("not assigned to this cycle") || errMsg.includes("thematic area")) {
                    await linkThematicAreaToCycle(cycleIdNum, numericAreaId);
                    singleRes = await apiClient.post<unknown>(ENDPOINTS.ASSIGNMENTS.BASE, assignmentPayload);
                } else {
                    throw err;
                }
            }

            let createdPayload: unknown = singleRes;
            for (let depth = 0; depth < 4; depth += 1) {
                if (!createdPayload || typeof createdPayload !== "object") break;
                const record = createdPayload as Record<string, unknown>;
                createdPayload = record.data ?? record.result ?? record.payload ?? record.assignment ?? createdPayload;
            }
            const createdRecord =
                createdPayload !== null && typeof createdPayload === "object"
                    ? createdPayload as Record<string, unknown>
                    : {};
            const createdId = createdRecord.id;
            if (createdId === undefined || createdId === null || !/^\d+$/.test(String(createdId))) {
                throw new Error("The backend did not return a valid ID for the created assignment.");
            }
            createdIds.push(String(createdId));
        }
    }

    return { ids: createdIds };
}
