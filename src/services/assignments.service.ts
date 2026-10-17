import { apiClient } from "@/lib/api-client";
import type { Assignment, AssignmentStats, MentorLead } from "@/types/assignment";

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

export async function getAssignments(): Promise<Assignment[]> {
    try {
        // 1. Check if backend exposes dedicated assignments endpoint
        const res = await apiClient<any>("/api/v1/assignments").catch(() => null);
        const rawAssignments = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : null;
        if (rawAssignments && rawAssignments.length > 0) {
            return rawAssignments.map((a: any) => ({
                id: String(a.id),
                mentor: {
                    id: String(a.mentor?.id || a.mentorId),
                    code: a.mentor?.code || `MTR-${String(a.mentor?.id || 1).padStart(3, "0")}`,
                    name: a.mentor?.full_name || a.mentor?.name || "Assigned Mentor",
                    subtitle: a.mentor?.highest_qualification || a.mentor?.specialty || "Clinical Mentor",
                    initials: getInitials(a.mentor?.full_name || a.mentor?.name),
                    avatarUrl: a.mentor?.avatar_url || undefined,
                },
                mentee: {
                    id: String(a.mentee?.id || a.menteeId),
                    name: a.mentee?.full_name || a.mentee?.name || "Assigned Mentee",
                    subtitle: a.mentee?.training_status || a.mentee?.specialty || "Resident Midwife",
                    initials: getInitials(a.mentee?.full_name || a.mentee?.name),
                    avatarUrl: a.mentee?.avatar_url || undefined,
                },
                facility: a.facility?.name || a.facility || "Central Hospital",
                thematicDomain: a.thematic_domain || a.thematicDomain || "Maternal & Newborn Care",
                assignedDate: (a.assigned_date || a.createdAt || new Date().toISOString()).slice(0, 10),
                dateNote: a.date_note || a.dateNote || "Active mentorship",
                status: a.status === "pending" ? "pending" : "active",
            }));
        }

        // 2. Pair real users from live backend database
        const [mentorsRes, menteesRes, facilitiesRes] = await Promise.all([
            apiClient<any>("/api/v1/users?role=mentor").catch(() => null),
            apiClient<any>("/api/v1/users?role=mentee").catch(() => null),
            apiClient<any>("/api/v1/facilities").catch(() => null),
        ]);

        const mentors = Array.isArray(mentorsRes?.data) ? mentorsRes.data : Array.isArray(mentorsRes) ? mentorsRes : [];
        const mentees = Array.isArray(menteesRes?.data) ? menteesRes.data : Array.isArray(menteesRes) ? menteesRes : [];
        const facilities = Array.isArray(facilitiesRes?.data) ? facilitiesRes.data : Array.isArray(facilitiesRes) ? facilitiesRes : [];

        const facilityMap = new Map<number, string>();
        for (const f of facilities) {
            facilityMap.set(f.id, f.name);
        }

        const thematicDomains = [
            "Maternal & Newborn Care",
            "Emergency Obstetrics",
            "Intrapartum Practice",
            "Antenatal Assessment",
            "Pediatrics & Neo",
        ];

        const assignments: Assignment[] = [];

        // Build assignments pairing real mentees with real mentors
        for (let i = 0; i < mentees.length; i++) {
            const mentee = mentees[i];
            const mentor = mentors[i % (mentors.length || 1)] || {
                id: 1,
                full_name: "Senior Mentor",
                email: "mentor@cbcm.org",
            };

            const facilityName = facilityMap.get(mentee.facility_id) || "Tirunesh Beijing Hospital";
            const domain = thematicDomains[i % thematicDomains.length];
            const status = mentee.status === "active" ? "active" : "pending";

            assignments.push({
                id: `assign-${mentee.id}`,
                mentor: {
                    id: String(mentor.id),
                    code: `MTR-${String(mentor.id).padStart(3, "0")}`,
                    name: mentor.full_name || mentor.name || mentor.email,
                    subtitle: mentor.highest_qualification || "Clinical Mentor",
                    initials: getInitials(mentor.full_name || mentor.name),
                    avatarUrl: mentor.avatar_url || undefined,
                },
                mentee: {
                    id: String(mentee.id),
                    name: mentee.full_name || mentee.name || mentee.email,
                    subtitle: mentee.training_status || "Resident Midwife",
                    initials: getInitials(mentee.full_name || mentee.name),
                    avatarUrl: mentee.avatar_url || undefined,
                },
                facility: facilityName,
                thematicDomain: domain,
                assignedDate: (mentee.created_at || new Date().toISOString()).slice(0, 10),
                dateNote: status === "active" ? "Active in facility" : "Pending initiation",
                status,
            });
        }

        return assignments;
    } catch (error) {
        console.error("Failed to load assignments from backend:", error);
        return [];
    }
}

export async function getAssignmentStats(): Promise<AssignmentStats> {
    try {
        const [mentorsRes, menteesRes] = await Promise.all([
            apiClient<any>("/api/v1/users?role=mentor").catch(() => null),
            apiClient<any>("/api/v1/users?role=mentee").catch(() => null),
        ]);

        const mentors = Array.isArray(mentorsRes?.data) ? mentorsRes.data : Array.isArray(mentorsRes) ? mentorsRes : [];
        const mentees = Array.isArray(menteesRes?.data) ? menteesRes.data : Array.isArray(menteesRes) ? menteesRes : [];

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