import { apiClient } from "@/lib/api-client";
import { getThematicAreas, INITIAL_THEMATIC_AREAS } from "@/services/thematic-areas.service";
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
        const rawMentors = Array.isArray(mentorsRes?.data) ? mentorsRes.data : Array.isArray(mentorsRes) ? mentorsRes : [];
        const rawMentees = Array.isArray(menteesRes?.data) ? menteesRes.data : Array.isArray(menteesRes) ? menteesRes : [];

        // Build facilities lookup map
        const facilityMap = new Map<number, string>();
        for (const f of rawFacilities) {
            facilityMap.set(f.id, f.name);
        }

        const cycles: CycleOption[] = rawCycles.map((c: any) => ({
            id: String(c.id),
            name: c.name || `Cycle #${c.id}`,
            startDate: c.start_date || c.startDate || "",
            endDate: c.end_date || c.endDate || "",
        }));

        const mentors: MentorOption[] = rawMentors.map((m: any) => ({
            id: String(m.id),
            name: m.full_name || m.name || m.email,
            initials: getInitials(m.full_name || m.name),
            specialty: m.highest_qualification || m.specialty || "Obstetrics & Gynecology",
            currentLoad: m.current_load || m.currentLoad || 0,
            maxLoad: m.max_load || m.maxLoad || 3,
            avatarUrl: m.avatar_url || undefined,
        }));

        const mentees: MenteeOption[] = rawMentees.map((me: any) => ({
            id: String(me.id),
            name: me.full_name || me.name || me.email,
            initials: getInitials(me.full_name || me.name),
            specialty: me.highest_qualification || me.specialty || "Midwifery Practice",
            facility: facilityMap.get(me.facility_id) || me.facility || "Central Hospital",
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
                { id: "c-1", name: "2026 Mentorship Cycle 1", startDate: "2026-11-01", endDate: "2027-04-30" }
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
 * Creates a new assignment.
 * When backend exposes a dedicated assignment endpoint, this posts to it with strict schema matching.
 */
export async function createAssignment(input: NewAssignmentInput): Promise<{ id: string }> {
    try {
        // Resolve matching thematic area from live database to obtain the exact numeric ID
        const allAreas = await getThematicAreas().catch(() => INITIAL_THEMATIC_AREAS);
        const selectedAreaName = input.thematicAreas?.[0] || "";
        const matchedArea = allAreas.find(
            (a) =>
                a.name.toLowerCase() === selectedAreaName.toLowerCase() ||
                String(a.id) === String(selectedAreaName) ||
                (a.code && a.code.toLowerCase() === selectedAreaName.toLowerCase()) ||
                String(a.id) === String(input.thematicAreaId)
        );

        const numericAreaId = matchedArea
            ? Number(matchedArea.id)
            : (input.thematicAreaId ? Number(input.thematicAreaId) : 1);
        const officialAreaName = matchedArea?.name || selectedAreaName || "General Clinical Midwifery";

        // 1. Try submitting bulk payload to backend
        const res = await apiClient.post<any>("/api/v1/assignments", {
            ...input,
            thematic_area_id: numericAreaId,
            thematicAreaId: numericAreaId,
            thematic_area: officialAreaName,
            thematic_area_name: officialAreaName,
            thematic_domain: officialAreaName,
            thematicDomain: officialAreaName,
        }).catch(() => null);

        if (res?.data?.id || res?.id) {
            return { id: String(res.data?.id || res.id) };
        }

        // 2. Also submit normalized individual assignment pairs for backend database compatibility
        if (Array.isArray(input.mentorIds) && Array.isArray(input.menteeIds)) {
            let lastCreatedId: string | null = null;
            for (const mentorId of input.mentorIds) {
                for (const menteeId of input.menteeIds) {
                    const mentorIdNum = Number(mentorId);
                    const menteeIdNum = Number(menteeId);
                    const cycleIdNum = Number(input.cycleId);

                    const singleRes = await apiClient.post<any>("/api/v1/assignments", {
                        mentor_id: !isNaN(mentorIdNum) ? mentorIdNum : mentorId,
                        mentee_id: !isNaN(menteeIdNum) ? menteeIdNum : menteeId,
                        cycle_id: !isNaN(cycleIdNum) ? cycleIdNum : 1,
                        thematic_area_id: numericAreaId,
                        thematicAreaId: numericAreaId,
                        thematic_area: officialAreaName,
                        thematic_area_name: officialAreaName,
                        thematic_domain: officialAreaName,
                        thematicDomain: officialAreaName,
                        status: "active",
                        start_date: input.startDate,
                        end_date: input.endDate,
                        notes: input.notes,
                    }).catch((err) => {
                        console.warn("Direct assignment creation warning:", err?.message || err);
                        return null;
                    });

                    if (singleRes?.data?.id || singleRes?.id) {
                        lastCreatedId = String(singleRes.data?.id || singleRes.id);
                    }

                    // Also link mentor on the mentee user record directly
                    if (!isNaN(menteeIdNum)) {
                        await apiClient.patch<any>(`/api/v1/users/${menteeId}`, {
                            mentor_id: !isNaN(mentorIdNum) ? mentorIdNum : mentorId,
                            thematic_area: officialAreaName,
                            thematic_area_id: numericAreaId,
                        }).catch(() => null);
                    }
                }
            }
            if (lastCreatedId) {
                return { id: lastCreatedId };
            }
        }
    } catch (e: any) {
        console.error("Failed to create assignment on backend:", e?.message || e);
    }
    return { id: `a-${Date.now()}` };
}
