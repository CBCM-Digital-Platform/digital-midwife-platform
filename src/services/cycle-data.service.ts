import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import type {
    Cycle,
    CycleStatus,
    CycleFacility,
    CycleThematicArea,
    CycleMentor,
    CycleMentee,
} from "@/types/cycle";
import type { CreateCycleInput, Facility } from "@/types/newCycle";
import { FACILITY_ID_MAP } from "@/services/users.service";
import { getThematicAreas, INITIAL_THEMATIC_AREAS } from "@/services/thematic-areas.service";

export const CREATED_CYCLES_STORAGE_KEY = "cbcm_created_cycles";

/**
 * Retrieves newly created cycles stored locally in the browser.
 */
export function getLocallyCreatedCycles(facilityId?: string | number | null): Cycle[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(CREATED_CYCLES_STORAGE_KEY);
        if (!raw) return [];
        const parsed: Cycle[] = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        if (facilityId !== undefined && facilityId !== null) {
            const targetId = String(facilityId);
            return parsed.filter((c) => {
                if (c.ownerFacilityId !== undefined && c.ownerFacilityId !== null) {
                    return String(c.ownerFacilityId) === targetId;
                }
                return c.facilityList?.length === 1 && String(c.facilityList[0].id) === targetId;
            });
        }
        return parsed;
    } catch (e) {
        console.error("Error reading locally created cycles:", e);
        return [];
    }
}

/**
 * Saves a newly created cycle to localStorage.
 */
export function saveCreatedCycleLocally(cycle: Cycle): void {
    if (typeof window === "undefined") return;
    try {
        const existing = getLocallyCreatedCycles();
        const filtered = existing.filter((c) => String(c.id) !== String(cycle.id));
        const updated = [cycle, ...filtered];
        localStorage.setItem(CREATED_CYCLES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error("Error saving cycle to localStorage:", e);
    }
}

/**
 * Removes a created cycle from localStorage.
 */
export function removeLocallyCreatedCycle(id: string | number): void {
    if (typeof window === "undefined") return;
    try {
        const existing = getLocallyCreatedCycles();
        const updated = existing.filter((c) => String(c.id) !== String(id));
        localStorage.setItem(CREATED_CYCLES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error("Error removing cycle from localStorage:", e);
    }
}

/**
 * Retrieves a single locally created cycle by its ID.
 */
export function getLocallyCreatedCycle(id: string | number): Cycle | null {
    if (typeof window === "undefined") return null;
    try {
        const existing = getLocallyCreatedCycles();
        return existing.find((c) => String(c.id) === String(id)) || null;
    } catch {
        return null;
    }
}

/**
 * Normalizes backend cycle status into the frontend CycleStatus enum.
 */
function normalizeCycleStatus(rawStatus?: string): CycleStatus {
    switch (rawStatus?.toLowerCase()) {
        case "active":
            return "ACTIVE";
        case "planned":
            return "PLANNING";
        case "draft":
            return "DRAFT";
        case "completed":
            return "COMPLETED";
        case "cancelled":
            return "CANCELLED";
        default:
            return "PLANNING";
    }
}

/**
 * Calculates estimated progress based on cycle status and elapsed date window.
 */
function calculateCycleProgress(status: CycleStatus, startDate?: string, endDate?: string): number {
    if (status === "COMPLETED") return 100;
    if (status === "CANCELLED") return 0;
    if (status === "DRAFT") return 10;
    if (status === "PLANNING") return 25;

    if (startDate && endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        const now = Date.now();

        if (now <= start) return 5;
        if (now >= end) return 95;
        const total = end - start;
        const elapsed = now - start;
        return Math.min(95, Math.max(5, Math.round((elapsed / total) * 100)));
    }

    return 50;
}

/**
 * Fetches all mentorship cycles from the backend API,
 * enriched with live facility counts, and active mentors/mentees from real users.
 */
export async function getCycles(options?: {
    status?: string;
    page?: number;
    limit?: number;
    facilityId?: string | number | null;
}): Promise<Cycle[]> {
    try {
        const params: Record<string, string | number> = {
            limit: options?.limit ?? 50,
            page: options?.page ?? 1,
        };
        if (options?.status) {
            params.status = options.status.toLowerCase();
        }
        // Scope cycles to a specific facility when provided
        if (options?.facilityId !== undefined && options.facilityId !== null) {
            const facilityId = Number(options.facilityId);
            if (!Number.isInteger(facilityId) || facilityId <= 0) {
                return [];
            }
            params.facility_id = facilityId;
        }

        const [res, assignmentsRes, mentorsRes, menteesRes, facilitiesRes] = await Promise.all([
            apiClient<any>(ENDPOINTS.CYCLES.BASE, { params }),
            apiClient<any>("/api/v1/assignments?limit=100").catch(() => null),
            apiClient<any>("/api/v1/users?role=mentor&limit=100").catch(() => null),
            apiClient<any>("/api/v1/users?role=mentee&limit=100").catch(() => null),
            apiClient<any>("/api/v1/facilities?limit=100").catch(() => null),
        ]);

        const rawCycles = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.items)
            ? res.data.items
            : Array.isArray(res)
            ? res
            : Array.isArray(res?.items)
            ? res.items
            : null;
        if (!rawCycles || rawCycles.length === 0) {
            return [];
        }

        const allAssignments = Array.isArray(assignmentsRes?.data?.items)
            ? assignmentsRes.data.items
            : Array.isArray(assignmentsRes?.data)
            ? assignmentsRes.data
            : Array.isArray(assignmentsRes)
            ? assignmentsRes
            : [];

        const allMentors = Array.isArray(mentorsRes?.data?.users)
            ? mentorsRes.data.users
            : Array.isArray(mentorsRes?.data)
            ? mentorsRes.data
            : Array.isArray(mentorsRes)
            ? mentorsRes
            : [];

        const allMentees = Array.isArray(menteesRes?.data?.users)
            ? menteesRes.data.users
            : Array.isArray(menteesRes?.data)
            ? menteesRes.data
            : Array.isArray(menteesRes)
            ? menteesRes
            : [];

        const allFacilities = Array.isArray(facilitiesRes?.data)
            ? facilitiesRes.data
            : Array.isArray(facilitiesRes)
            ? facilitiesRes
            : [];

        // Enrich cycles with their assigned facilities and live clinician counts in parallel
        const enrichedCycles = await Promise.all(
            rawCycles.map(async (raw: any): Promise<Cycle> => {
                const cycleId = String(raw.id);
                const status = normalizeCycleStatus(raw.status);

                // Fetch facilities assigned to this cycle
                let facilitiesCount = 0;
                let facilityList: CycleFacility[] = [];
                try {
                    const facRes = await apiClient<any>(ENDPOINTS.CYCLES.FACILITIES(raw.id)).catch(() => null);
                    const rawFacs = Array.isArray(facRes?.data) ? facRes.data : Array.isArray(facRes) ? facRes : [];
                    facilitiesCount = rawFacs.length;
                    facilityList = rawFacs.map((f: any) => ({
                        id: Number(f.id),
                        name: f.name,
                        type: f.type,
                        region: f.region,
                    }));
                } catch {
                    facilitiesCount = 0;
                }

                const facIds = new Set(facilityList.map((f) => f.id));

                // 1. Direct assignments linked to this cycle
                const cycleAssignments = allAssignments.filter(
                    (a: any) => String(a.cycle_id || a.cycleId || "") === cycleId
                );

                // 2. Clinicians linked by facility
                const facilityMentors = allMentors.filter((m: any) => facIds.has(Number(m.facility_id ?? m.facilityId)));
                const facilityMentees = allMentees.filter((m: any) => facIds.has(Number(m.facility_id ?? m.facilityId)));

                // 3. Clinician counts from real direct assignments or linked facility staff
                const mentorCount =
                    cycleAssignments.length > 0
                        ? new Set(cycleAssignments.map((a: any) => a.mentor_id || a.mentorId)).size
                        : facilityMentors.length > 0
                        ? facilityMentors.length
                        : 0;

                const menteeCount =
                    cycleAssignments.length > 0
                        ? new Set(cycleAssignments.map((a: any) => a.mentee_id || a.menteeId)).size
                        : facilityMentees.length > 0
                        ? facilityMentees.length
                        : 0;

                const assignmentsCount = cycleAssignments.length;

                const startDate = raw.start_date || raw.startDate || new Date().toISOString().slice(0, 10);
                const endDate = raw.end_date || raw.endDate || new Date().toISOString().slice(0, 10);
                const progress = calculateCycleProgress(status, startDate, endDate);

                return {
                    id: cycleId,
                    name: raw.name || `Mentorship Cycle ${cycleId}`,
                    ownerFacilityId:
                        raw.owner_facility_id ??
                        raw.ownerFacilityId ??
                        raw.facility_id ??
                        raw.facilityId ??
                        raw.facility?.id,
                    status,
                    startDate,
                    endDate,
                    facilities: facilitiesCount,
                    mentors: mentorCount,
                    mentees: menteeCount,
                    progress,
                    assignmentsLinked: assignmentsCount,
                    averageScore: Number(raw.average_score || raw.averageScore || 0),
                    milestones: [],
                    rawStatus: raw.status,
                    facilityList,
                    createdAt: raw.created_at,
                    updatedAt: raw.updated_at,
                };
            })
        );

        let finalCycles = enrichedCycles;

        // Strictly scope cycles to facility when facilityId is provided
        if (options?.facilityId !== undefined && options.facilityId !== null) {
            const targetFacId = String(options.facilityId);
            finalCycles = enrichedCycles.filter((c) => {
                if (c.ownerFacilityId !== undefined && c.ownerFacilityId !== null) {
                    return String(c.ownerFacilityId) === targetFacId;
                }
                const inList = c.facilityList?.some((f: CycleFacility) => String(f.id) === targetFacId);
                return inList;
            });
        }

        return finalCycles;
    } catch (error) {
        console.error("Failed to fetch cycles from backend API:", error);
        throw error;
    }
}

/**
 * Fetches a single cycle by its ID along with its assigned facilities, thematic areas,
 * and live assigned mentors and mentees from real backend records.
 */
export async function getCycleById(id: string | number): Promise<Cycle | null> {
    try {
        const [cycleRes, facRes, areaRes, assignmentsRes, mentorsRes, menteesRes, facilitiesRes] = await Promise.all([
            apiClient<any>(ENDPOINTS.CYCLES.DETAIL(id)),
            apiClient<any>(ENDPOINTS.CYCLES.FACILITIES(id)).catch(() => null),
            apiClient<any>(ENDPOINTS.CYCLES.THEMATIC_AREAS(id)).catch(() => null),
            apiClient<any>(`/api/v1/assignments?cycle_id=${id}&limit=100`).catch(() => null),
            apiClient<any>("/api/v1/users?role=mentor&limit=100").catch(() => null),
            apiClient<any>("/api/v1/users?role=mentee&limit=100").catch(() => null),
            apiClient<any>("/api/v1/facilities?limit=100").catch(() => null),
        ]);

        const raw = cycleRes?.data || cycleRes;
        if (!raw || !raw.id) return getLocallyCreatedCycle(id);

        let facilityList: CycleFacility[] = (Array.isArray(facRes?.data) ? facRes.data : []).map((f: any) => ({
            id: Number(f.id),
            name: f.name,
            type: f.type,
            region: f.region,
        }));

        const thematicAreaList: CycleThematicArea[] = (Array.isArray(areaRes?.data) ? areaRes.data : []).map((a: any) => ({
            id: Number(a.id),
            code: a.code,
            name: a.name,
        }));

        const facIds = new Set(facilityList.map((f) => f.id));

        const rawAssignments = Array.isArray(assignmentsRes?.data?.items)
            ? assignmentsRes.data.items
            : Array.isArray(assignmentsRes?.data)
            ? assignmentsRes.data
            : Array.isArray(assignmentsRes)
            ? assignmentsRes
            : [];

        const allMentors = Array.isArray(mentorsRes?.data?.users)
            ? mentorsRes.data.users
            : Array.isArray(mentorsRes?.data)
            ? mentorsRes.data
            : Array.isArray(mentorsRes)
            ? mentorsRes
            : [];

        const allMentees = Array.isArray(menteesRes?.data?.users)
            ? menteesRes.data.users
            : Array.isArray(menteesRes?.data)
            ? menteesRes.data
            : Array.isArray(menteesRes)
            ? menteesRes
            : [];

        // Build mentor map
        const mentorMap = new Map<string, any>();
        allMentors.forEach((m: any) => mentorMap.set(String(m.id), m));

        // Build mentee map
        const menteeMap = new Map<string, any>();
        allMentees.forEach((m: any) => menteeMap.set(String(m.id), m));

        // Mentors assigned to this cycle
        const mentorIdsInCycle = new Set<string>();
        rawAssignments.forEach((a: any) => {
            if (a.mentor_id) mentorIdsInCycle.add(String(a.mentor_id));
        });

        // Clinicians in the assigned facilities
        allMentors.forEach((m: any) => {
            if (facIds.has(Number(m.facility_id ?? m.facilityId))) {
                mentorIdsInCycle.add(String(m.id));
            }
        });

        const mentorList: CycleMentor[] = Array.from(mentorIdsInCycle)
            .map((mentorId) => {
                const u = mentorMap.get(mentorId);
                if (!u) return null;
                const assignedCount = rawAssignments.filter(
                    (a: any) => String(a.mentor_id) === mentorId
                ).length || 0;
                const facId = u.facility_id ?? u.facilityId;
                const facilityName =
                    (facId && FACILITY_ID_MAP[facId]) ||
                    facilityList.find((f) => f.id === Number(facId))?.name ||
                    facilityList[0]?.name ||
                    "Assigned Facility";

                return {
                    id: u.id,
                    name: u.full_name || u.name || "Clinical Mentor",
                    email: u.email || "",
                    phone: u.phone || "",
                    profession: u.highest_qualification || "Lead Midwifery Preceptor",
                    facility: facilityName,
                    assignedMenteesCount: assignedCount,
                    status: u.status || "active",
                };
            })
            .filter(Boolean) as CycleMentor[];

        // Mentees assigned to this cycle
        const menteeIdsInCycle = new Set<string>();
        rawAssignments.forEach((a: any) => {
            if (a.mentee_id) menteeIdsInCycle.add(String(a.mentee_id));
        });

        allMentees.forEach((m: any) => {
            if (facIds.has(Number(m.facility_id ?? m.facilityId))) {
                menteeIdsInCycle.add(String(m.id));
            }
        });

        const menteeList: CycleMentee[] = Array.from(menteeIdsInCycle)
            .map((menteeId, idx) => {
                const u = menteeMap.get(menteeId);
                if (!u) return null;
                const pairing = rawAssignments.find((a: any) => String(a.mentee_id) === menteeId);
                const pairedMentor = pairing?.mentor_id
                    ? mentorMap.get(String(pairing.mentor_id))
                    : mentorList[idx % (mentorList.length || 1)];

                const facId = u.facility_id ?? u.facilityId;
                const facilityName =
                    (facId && FACILITY_ID_MAP[facId]) ||
                    facilityList.find((f) => f.id === Number(facId))?.name ||
                    facilityList[0]?.name ||
                    "Assigned Facility";

                return {
                    id: u.id,
                    name: u.full_name || u.name || "Resident Mentee",
                    email: u.email || "",
                    phone: u.phone || "",
                    cadreLevel: u.highest_qualification || u.training_status || "Junior Midwife Resident",
                    facility: facilityName,
                    mentorName: pairedMentor?.full_name || pairedMentor?.name,
                    status: u.status || "active",
                };
            })
            .filter(Boolean) as CycleMentee[];

        const status = normalizeCycleStatus(raw.status);
        const startDate = raw.start_date || raw.startDate || new Date().toISOString().slice(0, 10);
        const endDate = raw.end_date || raw.endDate || new Date().toISOString().slice(0, 10);

        const durationWeeks =
            startDate && endDate && endDate > startDate
                ? Math.ceil(
                    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                    (7 * 24 * 60 * 60 * 1000)
                )
                : 12;

        const code =
            raw.code ||
            `CYC-${new Date(startDate).getUTCFullYear()}-${String(raw.id).padStart(3, "0")}`;

        const description =
            raw.description ||
            "Clinical capacity enhancement and preceptor mentorship cycle across designated regional referral and primary healthcare facilities.";

        const maxMenteesPerMentor = Number(raw.max_mentees_per_mentor || raw.maxMenteesPerMentor || 3);
        const maxFacilitiesPerMentor = Number(raw.max_facilities_per_mentor || raw.maxFacilitiesPerMentor || 2);
        const assessmentFrequency = raw.assessment_frequency || raw.assessmentFrequency || "BI_WEEKLY";
        const notes =
            raw.notes ||
            raw.special_instructions ||
            "Preceptors are requested to conduct bi-weekly clinical observations and review resident logbooks regularly.";

        return {
            id: String(raw.id),
            name: raw.name,
            ownerFacilityId:
                raw.owner_facility_id ??
                raw.ownerFacilityId ??
                raw.facility_id ??
                raw.facilityId ??
                raw.facility?.id,
            code,
            description,
            status,
            startDate,
            endDate,
            durationWeeks,
            facilities: facilityList.length,
            mentors: mentorList.length,
            mentees: menteeList.length,
            targetMentors: mentorList.length,
            targetMentees: menteeList.length,
            maxMenteesPerMentor,
            maxFacilitiesPerMentor,
            assessmentFrequency,
            notes,
            progress: calculateCycleProgress(status, startDate, endDate),
            assignmentsLinked: rawAssignments.length,
            averageScore: Number(raw.average_score || 0),
            milestones: [],
            rawStatus: raw.status,
            facilityList,
            thematicAreaList,
            mentorList,
            menteeList,
            createdAt: raw.created_at,
            updatedAt: raw.updated_at,
        };
    } catch (error) {
        console.warn(`Failed to fetch cycle ${id}:`, error);
        return getLocallyCreatedCycle(id);
    }
}

/**
 * Fetches the master list of clinical facilities from the backend API.
 */
export async function getFacilities(): Promise<Facility[]> {
    try {
        const res = await apiClient<any>(`${ENDPOINTS.FACILITIES.BASE}?limit=100`);
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

        if (list.length > 0) {
            return list.map((f: any) => ({
                id: String(f.id),
                name: f.name || `Facility #${f.id}`,
            }));
        }

        return [];
    } catch (error) {
        console.error("Failed to fetch facilities from backend API:", error);
        throw error;
    }
}

/**
 * Creates a new mentorship cycle in the backend, reliably links selected facilities,
 * and links selected thematic areas.
 */
export async function createCycle(input: CreateCycleInput & { ownerFacilityId?: string | number | null }): Promise<{ id: string }> {
    const ownerFacId = input.ownerFacilityId != null ? String(input.ownerFacilityId) : null;
    if (ownerFacId && (!Number.isInteger(Number(ownerFacId)) || Number(ownerFacId) <= 0)) {
        throw new Error("A valid facility must be assigned before creating this cycle.");
    }

    // 1. Backend POST /api/v1/mentorship-cycles has strict schema: { name, start_date?, end_date? }
    const payload: { name: string; start_date?: string | null; end_date?: string | null } = {
        name: input.name.trim(),
    };

    if (input.startDate) {
        payload.start_date = input.startDate;
    }
    if (input.endDate) {
        payload.end_date = input.endDate;
    }

    const cycleRes = await apiClient<any>(ENDPOINTS.CYCLES.BASE, {
        method: "POST",
        body: payload,
    });
    const createdCycle = cycleRes?.data || cycleRes;
    const cycleId = createdCycle?.id ? String(createdCycle.id) : null;
    if (!cycleId) {
        throw new Error("The backend did not return an ID for the created cycle.");
    }

    // 2. Build the list of facilities to link.
    // Facility-admin-created cycles belong only to their own facility.
    const selectedIds: string[] = Array.isArray(input.facilityIds) ? input.facilityIds : [];

    const facilityIdSet = ownerFacId ? new Set([ownerFacId]) : new Set(selectedIds);

    // If still empty (super admin creating without selecting any), skip linking
    const targetFacilityIds = Array.from(facilityIdSet);

    for (const facId of targetFacilityIds) {
        const numericId = Number(facId);
        if (!Number.isInteger(numericId) || numericId <= 0) {
            throw new Error(`Cycle ${cycleId} was created, but facility ID "${facId}" is invalid.`);
        }
        try {
            await apiClient(ENDPOINTS.CYCLES.FACILITIES(cycleId), {
                method: "POST",
                body: { facility_id: numericId },
            });
        } catch (error) {
            throw new Error(
                `Cycle ${cycleId} was created, but facility ${numericId} could not be linked.`,
                { cause: error }
            );
        }
    }

    // 3. Link selected thematic areas via POST /api/v1/mentorship-cycles/{cycleId}/thematic-areas
    const allAreas = await getThematicAreas().catch(() => INITIAL_THEMATIC_AREAS);
    if (Array.isArray(input.thematicAreas) && input.thematicAreas.length > 0) {
        for (const areaId of input.thematicAreas) {
            let numericId = Number(areaId);
            if (isNaN(numericId) || numericId <= 0) {
                const found = (allAreas as any[]).find(
                    (a) => a.name.toLowerCase() === String(areaId).toLowerCase() ||
                           (a.code && a.code.toLowerCase() === String(areaId).toLowerCase())
                );
                if (found) {
                    numericId = Number(found.id);
                }
            }
            if (!isNaN(numericId) && numericId > 0) {
                try {
                    await apiClient(ENDPOINTS.CYCLES.THEMATIC_AREAS(cycleId), {
                        method: "POST",
                        body: { thematic_area_id: numericId },
                    });
                } catch (error) {
                    throw new Error(
                        `Cycle ${cycleId} was created, but thematic area ${areaId} could not be linked.`,
                        { cause: error }
                    );
                }
            } else {
                throw new Error(
                    `Cycle ${cycleId} was created, but thematic area "${areaId}" could not be matched to a backend record.`
                );
            }
        }
    }

    // 4. If dates are provided, transition status to planned
    if (input.startDate && input.endDate) {
        try {
            await apiClient(ENDPOINTS.CYCLES.STATUS(cycleId), {
                method: "PATCH",
                body: { status: "planned" },
            });
        } catch (error) {
            throw new Error(
                `Cycle ${cycleId} was created, but its status could not be set to planned.`,
                { cause: error }
            );
        }
    }

    return { id: cycleId };
}

/**
 * Deletes or cancels a mentorship cycle in the backend and local storage.
 * Uses DELETE /api/v1/mentorship-cycles/{id} or transitions status to "cancelled" (terminal cancelled state).
 */
export async function deleteCycle(id: string | number): Promise<boolean> {
    removeLocallyCreatedCycle(id);
    try {
        await apiClient(`${ENDPOINTS.CYCLES.BASE}/${id}`, {
            method: "DELETE",
        }).catch(async () => {
            await apiClient(ENDPOINTS.CYCLES.STATUS(id), {
                method: "PATCH",
                body: { status: "cancelled" },
            });
        });
        return true;
    } catch (err) {
        console.warn(`Failed to delete or cancel cycle ${id}:`, err);
        return true;
    }
}

/**
 * Transitions a cycle's lifecycle status.
 * Allowed backend transitions:
 * draft -> planned | cancelled
 * planned -> active | cancelled
 * active -> completed | cancelled
 */
export async function transitionCycleStatus(
    id: string | number,
    status: "draft" | "planned" | "active" | "completed" | "cancelled"
): Promise<any> {
    return apiClient(ENDPOINTS.CYCLES.STATUS(id), {
        method: "PATCH",
        body: { status },
    });
}

/**
 * Updates basic cycle metadata (name, dates).
 */
export async function updateCycle(
    id: string | number,
    data: { name?: string; startDate?: string; endDate?: string }
): Promise<any> {
    const body: any = {};
    if (data.name) body.name = data.name.trim();
    if (data.startDate) body.start_date = data.startDate;
    if (data.endDate) body.end_date = data.endDate;

    return apiClient(ENDPOINTS.CYCLES.DETAIL(id), {
        method: "PATCH",
        body,
    });
}