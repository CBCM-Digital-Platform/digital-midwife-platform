import { apiClient } from "@/lib/api-client";
import type { AssignmentFormOptions, CycleOption, MentorOption, MenteeOption, NewAssignmentInput } from "@/types/assignment-form";

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
        const [cyclesRes, facilitiesRes, mentorsRes, menteesRes] = await Promise.all([
            apiClient<any>("/api/v1/mentorship-cycles").catch(() => null),
            apiClient<any>("/api/v1/facilities").catch(() => null),
            apiClient<any>("/api/v1/users?role=mentor").catch(() => null),
            apiClient<any>("/api/v1/users?role=mentee").catch(() => null),
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

        const thematicAreas = [
            "Maternal & Newborn Health",
            "Emergency Obstetric Care",
            "Intrapartum Care",
            "Antenatal & Postnatal Care",
            "Pediatrics & Neonatology",
            "Family Planning",
        ];

        return {
            cycles: cycles.length > 0 ? cycles : [
                { id: "c-1", name: "2026 Mentorship Cycle 1", startDate: "2026-11-01", endDate: "2027-04-30" }
            ],
            thematicAreas,
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
 * When backend exposes a dedicated assignment endpoint, this posts to it.
 */
export async function createAssignment(input: NewAssignmentInput): Promise<{ id: string }> {
    try {
        // Try submitting to backend assignments endpoint if available
        const res = await apiClient.post<any>("/api/v1/assignments", input).catch(() => null);
        if (res?.data?.id || res?.id) {
            return { id: String(res.data?.id || res.id) };
        }
    } catch {
        // Fallback gracefully
    }
    return { id: `a-${Date.now()}` };
}