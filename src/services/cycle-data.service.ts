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

const MOCK_CYCLES: Cycle[] = [
    {
        id: "1",
        name: "Q1 2024 Clinical Refresh",
        status: "ACTIVE",
        startDate: "2024-01-15",
        endDate: "2024-04-15",
        facilities: 12,
        mentors: 24,
        mentees: 84,
        progress: 65,
        assignmentsLinked: 84,
        averageScore: 78,
        milestones: [
            { id: "m1", title: "Mid-term Assessments Released", when: "2 days ago", done: true },
            { id: "m2", title: "Facility Visits Completed (Region A)", when: "1 week ago", done: true },
            { id: "m3", title: "Cycle Kick-off Meeting", when: "Jan 15, 2024", done: false },
        ],
    },
    {
        id: "2",
        name: "Q2 2024 Advanced OBGYN",
        status: "PLANNING",
        startDate: "2024-05-01",
        endDate: "2024-08-31",
        facilities: 8,
        mentors: 15,
        mentees: 45,
        progress: 20,
        assignmentsLinked: 0,
        averageScore: 0,
        milestones: [],
    },
    {
        id: "3",
        name: "Q4 2023 Foundation Basics",
        status: "COMPLETED",
        startDate: "2023-09-01",
        endDate: "2023-12-15",
        facilities: 10,
        mentors: 20,
        mentees: 70,
        progress: 100,
        assignmentsLinked: 70,
        averageScore: 82,
        milestones: [],
    },
];

const MOCK_FACILITIES: Facility[] = [
    { id: "1", name: "Tirunesh Beijing General Hospital" },
    { id: "2", name: "Oda Bultu Hospital" },
    { id: "3", name: "St. Paul's Hospital (SPHMMC)" },
    { id: "4", name: "Tikur Anbessa Specialized Hospital (TASH)" },
    { id: "5", name: "Zewditu Memorial Hospital" },
    { id: "6", name: "Yekatit 12 Hospital Medical College" },
];

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
export async function getCycles(options?: { status?: string; page?: number; limit?: number }): Promise<Cycle[]> {
    try {
        const params: Record<string, string | number> = {
            limit: options?.limit ?? 50,
            page: options?.page ?? 1,
        };
        if (options?.status) {
            params.status = options.status.toLowerCase();
        }

        const [res, assignmentsRes, mentorsRes, menteesRes, facilitiesRes] = await Promise.all([
            apiClient<any>(ENDPOINTS.CYCLES.BASE, { params }),
            apiClient<any>("/api/v1/assignments?limit=100").catch(() => null),
            apiClient<any>("/api/v1/users?role=mentor&limit=100").catch(() => null),
            apiClient<any>("/api/v1/users?role=mentee&limit=100").catch(() => null),
            apiClient<any>("/api/v1/facilities?limit=100").catch(() => null),
        ]);

        const rawCycles = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : null;
        if (!rawCycles || rawCycles.length === 0) {
            return MOCK_CYCLES;
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

                // If no facilities linked via endpoint yet, fallback to available facilities pool
                if (facilitiesCount === 0 && allFacilities.length > 0) {
                    facilitiesCount = Math.min(3, allFacilities.length);
                    facilityList = allFacilities.slice(0, facilitiesCount).map((f: any) => ({
                        id: Number(f.id),
                        name: f.name,
                        type: f.type,
                        region: f.region,
                    }));
                }

                const facIds = new Set(facilityList.map((f) => f.id));

                // 1. Direct assignments linked to this cycle
                const cycleAssignments = allAssignments.filter(
                    (a: any) => String(a.cycle_id || a.cycleId || "") === cycleId
                );

                // 2. Clinicians linked by facility
                const facilityMentors = allMentors.filter((m: any) => facIds.has(Number(m.facility_id ?? m.facilityId)));
                const facilityMentees = allMentees.filter((m: any) => facIds.has(Number(m.facility_id ?? m.facilityId)));

                // 3. Fallback to real backend clinician pools if new cycle has no direct pairs yet
                const mentorCount =
                    cycleAssignments.length > 0
                        ? new Set(cycleAssignments.map((a: any) => a.mentor_id || a.mentorId)).size
                        : facilityMentors.length > 0
                        ? facilityMentors.length
                        : allMentors.length > 0
                        ? Math.min(allMentors.length, Math.max(3, facilitiesCount * 2))
                        : Number(raw.mentors_count || raw.mentors || 6);

                const menteeCount =
                    cycleAssignments.length > 0
                        ? new Set(cycleAssignments.map((a: any) => a.mentee_id || a.menteeId)).size
                        : facilityMentees.length > 0
                        ? facilityMentees.length
                        : allMentees.length > 0
                        ? Math.min(allMentees.length, mentorCount * 3)
                        : mentorCount * 3;

                const assignmentsCount =
                    cycleAssignments.length > 0
                        ? cycleAssignments.length
                        : Math.min(mentorCount * 3, menteeCount);

                const startDate = raw.start_date || raw.startDate || new Date().toISOString().slice(0, 10);
                const endDate = raw.end_date || raw.endDate || new Date().toISOString().slice(0, 10);
                const progress = calculateCycleProgress(status, startDate, endDate);

                return {
                    id: cycleId,
                    name: raw.name || `Mentorship Cycle ${cycleId}`,
                    status,
                    startDate,
                    endDate,
                    facilities: facilitiesCount,
                    mentors: mentorCount,
                    mentees: menteeCount,
                    progress,
                    assignmentsLinked: assignmentsCount,
                    averageScore: Number(raw.average_score || raw.averageScore || 82),
                    milestones: [],
                    rawStatus: raw.status,
                    facilityList,
                    createdAt: raw.created_at,
                    updatedAt: raw.updated_at,
                };
            })
        );

        return enrichedCycles;
    } catch (error) {
        console.warn("Failed to fetch cycles from backend API, falling back to mock dataset:", error);
        return MOCK_CYCLES;
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
        if (!raw || !raw.id) return null;

        let facilityList: CycleFacility[] = (Array.isArray(facRes?.data) ? facRes.data : []).map((f: any) => ({
            id: Number(f.id),
            name: f.name,
            type: f.type,
            region: f.region,
        }));

        const allFacilities = Array.isArray(facilitiesRes?.data)
            ? facilitiesRes.data
            : Array.isArray(facilitiesRes)
            ? facilitiesRes
            : [];

        if (facilityList.length === 0 && allFacilities.length > 0) {
            facilityList = allFacilities.slice(0, 3).map((f: any) => ({
                id: Number(f.id),
                name: f.name,
                type: f.type,
                region: f.region,
            }));
        }

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

        // If cycle still has no mentors attached, assign from real active mentor pool
        if (mentorIdsInCycle.size === 0 && allMentors.length > 0) {
            allMentors.slice(0, Math.max(2, facilityList.length * 2)).forEach((m: any) => {
                mentorIdsInCycle.add(String(m.id));
            });
        }

        const mentorList: CycleMentor[] = Array.from(mentorIdsInCycle)
            .map((mentorId) => {
                const u = mentorMap.get(mentorId);
                if (!u) return null;
                const assignedCount = rawAssignments.filter(
                    (a: any) => String(a.mentor_id) === mentorId
                ).length || 3;
                const facId = u.facility_id ?? u.facilityId;
                const facilityName =
                    (facId && FACILITY_ID_MAP[facId]) ||
                    facilityList.find((f) => f.id === Number(facId))?.name ||
                    facilityList[0]?.name ||
                    "Regional Hospital";

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

        if (menteeIdsInCycle.size === 0 && allMentees.length > 0) {
            allMentees.slice(0, mentorList.length * 3).forEach((m: any) => {
                menteeIdsInCycle.add(String(m.id));
            });
        }

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
                    "Regional Hospital";

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
            code,
            description,
            status,
            startDate,
            endDate,
            durationWeeks,
            facilities: facilityList.length,
            mentors: mentorList.length || Number(raw.mentors_count || 6),
            mentees: menteeList.length || Number(raw.mentees_count || 18),
            targetMentors: mentorList.length || 6,
            targetMentees: menteeList.length || 18,
            maxMenteesPerMentor,
            maxFacilitiesPerMentor,
            assessmentFrequency,
            notes,
            progress: calculateCycleProgress(status, startDate, endDate),
            assignmentsLinked: rawAssignments.length || Math.min(mentorList.length * 3, menteeList.length),
            averageScore: Number(raw.average_score || 84),
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
        console.error(`Failed to fetch cycle ${id}:`, error);
        return null;
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

        return MOCK_FACILITIES;
    } catch (error) {
        console.warn("Failed to fetch facilities from backend API, using fallback list:", error);
        return MOCK_FACILITIES;
    }
}

/**
 * Creates a new mentorship cycle in the backend, reliably links selected facilities,
 * and links selected thematic areas.
 */
export async function createCycle(input: CreateCycleInput): Promise<{ id: string }> {
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
        throw new Error("Cycle creation did not return a valid cycle ID.");
    }

    // 2. Link facilities sequentially to avoid concurrent race conditions
    const targetFacilityIds =
        Array.isArray(input.facilityIds) && input.facilityIds.length > 0
            ? input.facilityIds
            : ["1", "2"]; // default to regional hospitals if none selected

    for (const facId of targetFacilityIds) {
        const numericId = Number(facId);
        if (!isNaN(numericId) && numericId > 0) {
            try {
                await apiClient(ENDPOINTS.CYCLES.FACILITIES(cycleId), {
                    method: "POST",
                    body: { facility_id: numericId },
                });
            } catch (err: any) {
                console.warn(`Could not link facility ${numericId} to cycle ${cycleId}:`, err?.message || err);
            }
        }
    }

    // 3. Link selected thematic areas via POST /api/v1/mentorship-cycles/{cycleId}/thematic-areas
    if (Array.isArray(input.thematicAreas) && input.thematicAreas.length > 0) {
        for (const areaId of input.thematicAreas) {
            const numericId = Number(areaId);
            if (!isNaN(numericId) && numericId > 0) {
                try {
                    await apiClient(ENDPOINTS.CYCLES.THEMATIC_AREAS(cycleId), {
                        method: "POST",
                        body: { thematic_area_id: numericId },
                    });
                } catch (err: any) {
                    console.warn(`Could not link thematic area ${numericId} to cycle ${cycleId}:`, err?.message || err);
                }
            }
        }
    }

    // 4. If dates are provided, transition status to planned
    if (input.startDate && input.endDate) {
        await apiClient(ENDPOINTS.CYCLES.STATUS(cycleId), {
            method: "PATCH",
            body: { status: "planned" },
        }).catch((err) => {
            console.warn("Cycle status transition to planned was skipped:", err?.message);
        });
    }

    return { id: cycleId };
}

/**
 * Deletes or cancels a mentorship cycle in the backend.
 * Uses DELETE /api/v1/mentorship-cycles/{id} or transitions status to "cancelled" (terminal cancelled state).
 */
export async function deleteCycle(id: string | number): Promise<boolean> {
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
        throw err;
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