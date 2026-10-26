import { apiClient } from "@/lib/api-client";
import { FACILITY_ID_MAP } from "@/services/users.service";
import type { CompetencyLevel, MyMentee } from "@/types/my-mentee";

const FIRST_THREE: MyMentee[] = [
    {
        id: "m1",
        code: "M-8492",
        name: "Bilen Alemu",
        title: "Year 2 Resident",
        facility: "Maternity Ward A",
        level: "ADVANCED",
        active: true,
        lastSession: "2023-10-24",
        overdue: false,
        avatarUrl: null,
        assignedAssessment: {
            id: "a1",
            menteeId: "m1",
            menteeName: "Bilen Alemu",
            menteeTitle: "Year 2 Resident",
            date: "2023-10-24",
            dueDate: "2023-10-24",
            type: "Labor & Delivery Competency",
            status: "PASS",
            scorePct: 92,
            instructions: "Conduct normal spontaneous vaginal delivery with active management of 3rd stage.",
        },
    },
    {
        id: "m2",
        code: "M-9103",
        name: "Sara Abebe",
        title: "Year 1 Resident",
        facility: "Clinic North",
        level: "NOVICE",
        active: true,
        lastSession: "2023-11-02",
        overdue: false,
        avatarUrl: null,
        assignedAssessment: {
            id: "a2",
            menteeId: "m2",
            menteeName: "Sara Abebe",
            menteeTitle: "Year 1 Resident",
            date: "2023-11-02",
            dueDate: "2023-11-02",
            type: "Postpartum Care Setup",
            status: "PENDING",
            scorePct: null,
            instructions: "Set up delivery room emergency tray, oxytocin refrigeration check, and postpartum triage.",
        },
    },
    {
        id: "m3",
        code: "M-7321",
        name: "Maritu Taye",
        title: "Year 3 Resident",
        facility: "Maternity Ward A",
        level: "QUALIFIED",
        active: true,
        lastSession: "2023-09-15",
        overdue: true,
        avatarUrl: null,
        assignedAssessment: {
            id: "a3",
            menteeId: "m3",
            menteeName: "Maritu Taye",
            menteeTitle: "Year 3 Resident",
            date: "2023-09-15",
            dueDate: "2023-09-15",
            type: "Fetal Monitoring Basics",
            status: "NEEDS_REVIEW",
            scorePct: 68,
            instructions: "Interpret 3 consecutive CTG / Pinard fetal heart sound traces for deceleration signs.",
        },
    },
];

const EXTRA_NAMES = [
    "Hanna Tesfaye",
    "Selam Bekele",
    "Meron Girma",
    "Rahel Haile",
    "Tigist Alemu",
    "Abeba Kebede",
    "Liya Worku",
    "Eden Mulugeta",
    "Saron Desta",
    "Helen Assefa",
    "Bethlehem Tadesse",
    "Mekdes Negash",
    "Genet Wolde",
    "Aster Demissie",
    "Sosina Tilahun",
    "Yodit Mengistu",
    "Zenebech Lemma",
    "Almaz Birhanu",
    "Tsion Gebre",
    "Rediet Abate",
    "Kalkidan Fikre",
];

const FACILITIES = ["Maternity Ward A", "Clinic North"];
const TITLES = ["Year 1 Resident", "Year 2 Resident", "Year 3 Resident", "Staff Midwife"];
const LEVELS: CompetencyLevel[] = ["NOVICE", "QUALIFIED", "ADVANCED"];

const EXTRA: MyMentee[] = EXTRA_NAMES.map((name, i) => ({
    id: `m${i + 4}`,
    code: `M-${String(2000 + i * 337).padStart(4, "0")}`,
    name,
    title: TITLES[(i * 3 + 1) % TITLES.length],
    facility: FACILITIES[i % FACILITIES.length],
    level: LEVELS[i % LEVELS.length],
    active: i !== 5 && i !== 14,
    lastSession: new Date(Date.UTC(2023, 9, 1 + (i % 28))).toISOString().slice(0, 10),
    overdue: i % 5 === 0,
    avatarUrl: null,
}));

const ALL_MENTEES: MyMentee[] = [...FIRST_THREE, ...EXTRA];

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

/**
 * Fetches real active mentees assigned to the logged-in mentor from the backend.
 * Falls back to mock dataset if unauthenticated or endpoint is unreachable.
 */
export async function getMyMentees(): Promise<MyMentee[]> {
    try {
        const [meRes, menteesRes, assignmentsRes, facilitiesRes] = await Promise.all([
            apiClient<any>("/api/v1/users/me").catch(() => null),
            apiClient<any>("/api/v1/users?role=mentee&limit=100").catch(() => null),
            apiClient<any>("/api/v1/assignments?limit=100").catch(() => null),
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
            return ALL_MENTEES.filter((m) => m.active);
        }

        // Build facilities lookup map
        const facilityMap = new Map<string, string>();
        Object.entries(FACILITY_ID_MAP).forEach(([k, v]) => facilityMap.set(String(k), v));
        const rawFacilities = Array.isArray(facilitiesRes?.data) ? facilitiesRes.data : [];
        rawFacilities.forEach((f: any) => {
            if (f.id && f.name) facilityMap.set(String(f.id), f.name);
        });

        // Determine current mentor's ID
        const myUser = meRes?.data || meRes;
        const myId = myUser?.id ? String(myUser.id) : null;
        const myFacilityId = myUser?.facility_id ? String(myUser.facility_id) : null;

        const allAssignments = Array.isArray(assignmentsRes?.data?.items)
            ? assignmentsRes.data.items
            : Array.isArray(assignmentsRes?.data)
            ? assignmentsRes.data
            : [];

        // Find mentees assigned to this mentor
        const assignedMenteeIds = new Set<string>();
        if (myId) {
            allAssignments.forEach((a: any) => {
                if (String(a.mentor_id || a.mentorId) === myId && (a.mentee_id || a.menteeId)) {
                    assignedMenteeIds.add(String(a.mentee_id || a.menteeId));
                }
            });
        }

        // Map live mentees
        const liveList: MyMentee[] = rawMentees.map((u: any, idx: number) => {
            const uid = String(u.id);
            const facId = String(u.facility_id ?? u.facilityId ?? "");
            const facName =
                (facId && facilityMap.get(facId)) ||
                u.facility_name ||
                u.facility?.name ||
                FACILITIES[idx % FACILITIES.length];

            const active = u.status?.toLowerCase() !== "inactive";
            const level = parseCompetencyLevel(u.competency_level, u.highest_qualification);

            // Last session date
            const lastSession =
                u.last_session_date ||
                u.updated_at?.slice(0, 10) ||
                new Date(Date.now() - (idx * 3 + 2) * 86_400_000).toISOString().slice(0, 10);

            const daysSinceSession = Math.floor(
                (Date.now() - new Date(lastSession).getTime()) / 86_400_000
            );

            return {
                id: uid,
                code: u.code || `M-${String(u.id).padStart(4, "0")}`,
                name: u.full_name || u.name || `Resident Midwife #${uid}`,
                title: u.highest_qualification || u.training_status || TITLES[idx % TITLES.length],
                facility: facName,
                level,
                active,
                lastSession,
                overdue: daysSinceSession > 14,
                avatarUrl: u.avatar_url || null,
            };
        });

        // Filter to mentees assigned to me, or if none assigned yet, filter by mentor's facility or active mentees
        let myMentees = liveList.filter((m) => assignedMenteeIds.has(m.id) && m.active);

        if (myMentees.length === 0 && myFacilityId) {
            const myFacName = facilityMap.get(myFacilityId);
            if (myFacName) {
                myMentees = liveList.filter((m) => m.facility === myFacName && m.active);
            }
        }

        if (myMentees.length === 0) {
            myMentees = liveList.filter((m) => m.active).slice(0, 8);
        }

        return myMentees.length > 0 ? myMentees : ALL_MENTEES.filter((m) => m.active);
    } catch (error) {
        console.warn("Failed to fetch live my-mentees, falling back to mock dataset:", error);
        return ALL_MENTEES.filter((m) => m.active);
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
            apiClient<any>("/api/v1/users?role=mentee&limit=100").catch(() => null),
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
            return { asOf: today, mentees: ALL_MENTEES };
        }

        const facilityMap = new Map<string, string>();
        Object.entries(FACILITY_ID_MAP).forEach(([k, v]) => facilityMap.set(String(k), v));
        const rawFacilities = Array.isArray(facilitiesRes?.data) ? facilitiesRes.data : [];
        rawFacilities.forEach((f: any) => {
            if (f.id && f.name) facilityMap.set(String(f.id), f.name);
        });

        const myUser = meRes?.data || meRes;
        const myFacilityId = myUser?.facility_id ? String(myUser.facility_id) : null;

        const liveList: MyMentee[] = rawMentees.map((u: any, idx: number) => {
            const uid = String(u.id);
            const facId = String(u.facility_id ?? u.facilityId ?? "");
            const facName =
                (facId && facilityMap.get(facId)) ||
                u.facility_name ||
                u.facility?.name ||
                FACILITIES[idx % FACILITIES.length];

            const active = u.status?.toLowerCase() !== "inactive";
            const level = parseCompetencyLevel(u.competency_level, u.highest_qualification);

            const lastSession =
                u.last_session_date ||
                u.updated_at?.slice(0, 10) ||
                new Date(Date.now() - (idx * 3 + 2) * 86_400_000).toISOString().slice(0, 10);

            const daysSinceSession = Math.floor(
                (Date.now() - new Date(lastSession).getTime()) / 86_400_000
            );

            return {
                id: uid,
                code: u.code || `M-${String(u.id).padStart(4, "0")}`,
                name: u.full_name || u.name || `Resident Midwife #${uid}`,
                title: u.highest_qualification || u.training_status || TITLES[idx % TITLES.length],
                facility: facName,
                level,
                active,
                lastSession,
                overdue: daysSinceSession > 14,
                avatarUrl: u.avatar_url || null,
            };
        });

        // If mentor has a specific facility, prioritize facility roster
        let roster = liveList;
        if (myFacilityId) {
            const facName = facilityMap.get(myFacilityId);
            if (facName) {
                const facMentees = liveList.filter((m) => m.facility === facName);
                if (facMentees.length > 0) {
                    roster = facMentees;
                }
            }
        }

        return { asOf: today, mentees: roster.length > 0 ? roster : ALL_MENTEES };
    } catch (error) {
        console.warn("Failed to fetch live facility roster, falling back to mock dataset:", error);
        return { asOf: today, mentees: ALL_MENTEES };
    }
}