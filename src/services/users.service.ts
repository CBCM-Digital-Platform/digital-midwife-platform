import { apiClient } from "@/lib/api-client";
import type { MentorUser, MenteeUser, ClinicalUser, MentorSummaryStats, MenteeSummaryStats } from "@/types/user";

/**
 * Facility ID mapping for resolving backend facility_id numbers into human-readable facility names.
 */
export const FACILITY_ID_MAP: Record<number | string, string> = {
  1: "Tirunesh Beijing General Hospital",
  2: "Oda Bultu Hospital",
  3: "St. Paul's Hospital (SPHMMC)",
  4: "Tikur Anbessa Specialized Hospital (TASH)",
  5: "Zewditu Memorial Hospital",
  6: "Yekatit 12 Hospital Medical College",
};

/**
 * Normalizes raw backend user models (snake_case full_name, facility_id, highest_qualification, etc.)
 * into strongly-typed frontend ClinicalUser (MentorUser | MenteeUser) domain models.
 */
export function normalizeUser(raw: any, defaultRole: "mentor" | "mentee"): ClinicalUser {
  if (!raw) return {} as ClinicalUser;

  const id = String(raw.id ?? raw._id ?? `user-${Date.now()}`);
  const role = (raw.role || defaultRole) as "mentor" | "mentee";

  const firstName = raw.first_name || raw.firstName || "";
  const lastName = raw.last_name || raw.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const rawName = typeof raw.name === "string" ? raw.name.trim() : "";
  const isGenericName = ["mentee", "mentor", "clinician", "user", "resident midwife"].includes(
    rawName.toLowerCase()
  );
  const name =
    raw.full_name ||
    raw.fullName ||
    fullName ||
    raw.username ||
    raw.user_name ||
    raw.email?.split("@")[0] ||
    (!isGenericName ? rawName : "") ||
    "Clinician";

  const initials =
    raw.avatarInitials ||
    name
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((part: string) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ||
    "CP";

  const facilityId =
    raw.facility_id !== undefined && raw.facility_id !== null
      ? Number(raw.facility_id)
      : raw.facilityId !== undefined && raw.facilityId !== null
      ? Number(raw.facilityId)
      : undefined;

  const facility =
    (typeof raw.facility === "object" ? raw.facility?.name : raw.facility) ||
    raw.facility_name ||
    (facilityId !== undefined && FACILITY_ID_MAP[facilityId]) ||
    (facilityId !== undefined ? `Facility #${facilityId}` : "Unassigned Facility");

  const profession =
    raw.profession ||
    raw.highest_qualification ||
    "";

  const thematicAreaId =
    raw.thematic_area_id !== undefined && raw.thematic_area_id !== null
      ? Number(raw.thematic_area_id)
      : raw.thematicAreaId !== undefined && raw.thematicAreaId !== null
      ? Number(raw.thematicAreaId)
      : raw.thematic_area?.id !== undefined && raw.thematic_area?.id !== null
      ? Number(raw.thematic_area.id)
      : raw.thematicArea?.id !== undefined && raw.thematicArea?.id !== null
      ? Number(raw.thematicArea.id)
      : undefined;

  const rawThematicAreaName =
    (typeof raw.thematic_area === "object" ? raw.thematic_area?.name : raw.thematic_area) ||
    (typeof raw.thematicArea === "object" ? raw.thematicArea?.name : raw.thematicArea) ||
    raw.thematicAreaName ||
    raw.thematic_area_name;

  const thematicArea = rawThematicAreaName || undefined;

  const rawStatus = String(raw.status || "").toLowerCase().trim();
  const rawTrainingStatus = String(raw.training_status || "").toLowerCase().trim();

  let status: "active" | "pending" | "inactive" | "on_leave" | "suspended" = "active";

  if (rawStatus === "inactive" || rawStatus === "disabled" || rawStatus === "deactivated") {
    status = "inactive";
  } else if (rawStatus === "suspended") {
    status = "suspended";
  } else if (rawStatus === "on_leave") {
    status = "on_leave";
  } else if (rawStatus === "pending" || rawStatus === "pending_start" || rawStatus === "pending_review") {
    status = "pending";
  } else if (rawStatus === "active") {
    status = "active";
  } else if (rawTrainingStatus === "in_training" || rawTrainingStatus === "pending_start") {
    status = "pending";
  } else {
    status = "active";
  }

  const systemId =
    raw.systemId ||
    (role === "mentor"
      ? `MEN-2024-${String(id).padStart(3, "0").slice(-3)}`
      : `MNT-2024-${String(id).padStart(3, "0").slice(-3)}`);

  if (role === "mentor") {
    const mentor: MentorUser = {
      id,
      systemId,
      name,
      email: raw.email || "",
      phone: raw.phone || "",
      role: "mentor",
      facility,
      facilityId,
      thematicArea,
      thematicAreaId,
      avatarInitials: initials,
      avatarBgColor: raw.avatarBgColor || "bg-emerald-100 text-emerald-800",
      profession,
      department: raw.department || "",
      yearsOfExperience: Number(raw.yearsOfExperience || raw.years_of_experience) || 0,
      assignedMenteesCount: Number(raw.assignedMenteesCount || raw.assigned_mentees_count) || 0,
      status: status as any,
    };
    return mentor;
  } else {
    const rawScore = raw.knowledgeScore ?? raw.knowledge_score;
    const menteeScore =
      rawScore !== undefined && rawScore !== null && !isNaN(Number(rawScore))
        ? Number(rawScore)
        : undefined;

    const menteeTier =
      raw.scoreTier ||
      (menteeScore !== undefined ? (menteeScore >= 80 ? "Tier 1" : "Tier 2") : undefined);

    const mentee: MenteeUser = {
      id,
      systemId,
      name,
      email: raw.email || "",
      phone: raw.phone || "",
      role: "mentee",
      facility,
      facilityId,
      thematicArea: thematicArea || undefined,
      thematicAreaId,
      avatarInitials: initials,
      avatarBgColor: raw.avatarBgColor || "bg-blue-100 text-blue-800",
      profession,
      cadreLevel: raw.cadreLevel || raw.cadre_level || raw.highest_qualification || "",
      assignedMentor: raw.assignedMentor || {
        name: raw.mentor_name || undefined,
        status: raw.mentor_id || raw.mentor_name ? "assigned" : "unassigned",
      },
      knowledgeScore: menteeScore,
      scoreTier: menteeTier as any,
      status: status as any,
    };
    return mentee;
  }
}

/**
 * Fetches mentors directly from backend API without mock fallbacks.
 * Automatically respects facilityId for Facility Admins.
 */
export async function getMentors(facilityId?: number | string): Promise<MentorUser[]> {
  let activeFacilityId = facilityId;
  if (!activeFacilityId) {
    if (typeof window === "undefined") {
      try {
        const { getServerSession } = await import("next-auth/next");
        const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
        const session = await getServerSession(authOptions);
        activeFacilityId = (session?.user as any)?.facility_id ?? (session?.user as any)?.facilityId;
      } catch {
        // Ignore session resolution failure
      }
    } else {
      try {
        const { getSession } = await import("next-auth/react");
        const session = await getSession();
        activeFacilityId = (session?.user as any)?.facility_id ?? (session?.user as any)?.facilityId;
      } catch {
        // Ignore session resolution failure
      }
    }
  }

  const query = new URLSearchParams({ role: "mentor", page: "1", limit: "100" });

  try {
    const [res, assignmentsRes] = await Promise.all([
      apiClient<any>(`/api/v1/users?${query.toString()}`),
      apiClient<any>("/api/v1/assignments?limit=100").catch(() => null),
    ]);

    // Count real assigned mentees per mentor from live assignments
    const mentorMenteesCountMap = new Map<string, number>();
    const rawAssignments = Array.isArray(assignmentsRes?.data?.items)
      ? assignmentsRes.data.items
      : Array.isArray(assignmentsRes?.data)
      ? assignmentsRes.data
      : Array.isArray(assignmentsRes?.items)
      ? assignmentsRes.items
      : Array.isArray(assignmentsRes)
      ? assignmentsRes
      : [];

    for (const a of rawAssignments) {
      const mentorId = String(a.mentor_id ?? a.mentorId ?? a.mentor?.id ?? "").trim();
      if (mentorId) {
        mentorMenteesCountMap.set(mentorId, (mentorMenteesCountMap.get(mentorId) || 0) + 1);
      }
    }

    const rawList = Array.isArray(res) ? res : res?.data?.users || res?.data || res?.users || [];
    let list = (rawList || []).map((u: any) => {
      const mentor = normalizeUser(u, "mentor") as MentorUser;
      const count = mentorMenteesCountMap.get(String(mentor.id));
      if (count !== undefined && count > 0) {
        mentor.assignedMenteesCount = count;
      }
      return mentor;
    }) as MentorUser[];

    // Ensure users are filtered to the active facility
    if (activeFacilityId !== undefined && activeFacilityId !== null && String(activeFacilityId).trim() !== "") {
      list = list.filter((u) => String(u.facilityId ?? "") === String(activeFacilityId));
    }

    return list;
  } catch (error: any) {
    console.warn("Failed to fetch mentors from API (session expired or unauthenticated):", error?.message || error);
    return [];
  }
}

/**
 * Fetches mentees directly from backend API without mock fallbacks.
 * Automatically links real assigned mentors from /api/v1/assignments.
 * Automatically respects facilityId for Facility Admins.
 */
export async function getMentees(facilityId?: number | string): Promise<MenteeUser[]> {
  let activeFacilityId = facilityId;
  if (!activeFacilityId && typeof window === "undefined") {
    try {
      const { getServerSession } = await import("next-auth/next");
      const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
      const session = await getServerSession(authOptions);
      activeFacilityId = (session?.user as any)?.facility_id ?? (session?.user as any)?.facilityId;
    } catch {
      // Ignore session resolution failure
    }
  }

  const query = new URLSearchParams({ role: "mentee", page: "1", limit: "100" });

  try {
    const [res, assignmentsRes] = await Promise.all([
      apiClient<any>(`/api/v1/users?${query.toString()}`),
      apiClient<any>("/api/v1/assignments?limit=100").catch(() => null),
    ]);

    // Build assignment lookup map: menteeId -> AssignedMentorInfo
    const assignmentMap = new Map<string, { name: string; title: string; avatarInitials: string; status: "assigned" }>();

    const rawAssignments = Array.isArray(assignmentsRes?.data?.items)
      ? assignmentsRes.data.items
      : Array.isArray(assignmentsRes?.data)
      ? assignmentsRes.data
      : Array.isArray(assignmentsRes?.items)
      ? assignmentsRes.items
      : Array.isArray(assignmentsRes)
      ? assignmentsRes
      : [];

    for (const a of rawAssignments) {
      const menteeId = String(a.mentee_id ?? a.menteeId ?? a.mentee?.id ?? "").trim();
      const mentorObj = a.mentor || {};
      const mentorName =
        mentorObj.full_name ||
        mentorObj.name ||
        a.mentor_name ||
        a.mentorName ||
        "";

      if (menteeId && mentorName) {
        assignmentMap.set(menteeId, {
          name: mentorName,
          title: mentorObj.highest_qualification || mentorObj.profession || mentorObj.subtitle || "Clinical Mentor",
          avatarInitials:
            mentorName
              .split(" ")
              .filter(Boolean)
              .map((p: string) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "CM",
          status: "assigned",
        });
      }

      // Check if multiple mentees are grouped in this assignment
      if (Array.isArray(a.mentees)) {
        for (const m of a.mentees) {
          const mId = String(m.id ?? m._id ?? "").trim();
          if (mId && mentorName) {
            assignmentMap.set(mId, {
              name: mentorName,
              title: mentorObj.highest_qualification || mentorObj.profession || mentorObj.subtitle || "Clinical Mentor",
              avatarInitials:
                mentorName
                  .split(" ")
                  .filter(Boolean)
                  .map((p: string) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "CM",
              status: "assigned",
            });
          }
        }
      }
    }

    // Also check newly created assignments stored in browser localStorage
    if (typeof window !== "undefined") {
      try {
        const rawLocal = localStorage.getItem("cbcm_created_assignments");
        if (rawLocal) {
          const localList = JSON.parse(rawLocal);
          if (Array.isArray(localList)) {
            for (const a of localList) {
              const menteeId = String(a.mentee?.id ?? a.mentee_id ?? "").trim();
              const mentorName = a.mentor?.name || a.mentor?.full_name;
              if (menteeId && mentorName) {
                assignmentMap.set(menteeId, {
                  name: mentorName,
                  title: a.mentor?.subtitle || "Clinical Mentor",
                  avatarInitials: a.mentor?.initials || "CM",
                  status: "assigned",
                });
              }
            }
          }
        }
      } catch {
        // Ignore local storage errors
      }
    }

    const rawList = Array.isArray(res) ? res : res?.data?.users || res?.data || res?.users || [];
    let list = (rawList || []).map((u: any) => {
      const mentee = normalizeUser(u, "mentee") as MenteeUser;
      const assigned = assignmentMap.get(String(mentee.id));
      if (assigned) {
        mentee.assignedMentor = assigned;
      }
      return mentee;
    }) as MenteeUser[];

    // Ensure users are filtered to the active facility
    if (activeFacilityId !== undefined && activeFacilityId !== null && String(activeFacilityId).trim() !== "") {
      list = list.filter((u) => String(u.facilityId ?? "") === String(activeFacilityId));
    }

    return list;
  } catch (error: any) {
    console.warn("Failed to fetch mentees from API (session expired or unauthenticated):", error?.message || error);
    return [];
  }
}

export async function getMentorStats(facilityId?: number | string): Promise<MentorSummaryStats> {
  const query = new URLSearchParams({ role: "mentor" });
  if (facilityId !== undefined && facilityId !== null && String(facilityId).trim() !== "") {
    query.set("facility_id", String(facilityId));
  }
  try {
    const res = await apiClient<any>(`/api/v1/users/stats?${query.toString()}`);
    return (res?.data || res?.stats || res) as MentorSummaryStats;
  } catch (error: any) {
    console.warn("Failed to fetch mentor stats:", error?.message || error);
    return {
      totalMentors: 0,
      activeCount: 0,
      pendingCount: 0,
      inactiveCount: 0,
      quarterTrend: "+0%",
      completionPercentage: 0,
      completionTrend: "+0%",
      completionTarget: 0,
    };
  }
}

export async function getMenteeStats(facilityId?: number | string): Promise<MenteeSummaryStats> {
  const query = new URLSearchParams({ role: "mentee" });
  if (facilityId !== undefined && facilityId !== null && String(facilityId).trim() !== "") {
    query.set("facility_id", String(facilityId));
  }
  try {
    const res = await apiClient<any>(`/api/v1/users/stats?${query.toString()}`);
    return (res?.data || res?.stats || res) as MenteeSummaryStats;
  } catch (error: any) {
    console.warn("Failed to fetch mentee stats:", error?.message || error);
    return {
      totalMentees: 0,
      termTrend: "+0%",
      activeInRotation: 0,
      operationalPercentage: "0%",
      pendingOrientation: 0,
      pendingStage: "None",
      avgKnowledgeMastery: 0,
      cohortTrend: "+0%",
    };
  }
}

export async function createUser(data: Partial<ClinicalUser>): Promise<ClinicalUser> {
  return apiClient.post<ClinicalUser>("/api/v1/users", data);
}

/**
 * Fetches a single user by ID and normalizes into a strongly typed ClinicalUser model.
 */
export async function getUserById(id: string): Promise<ClinicalUser> {
  const [res, assignmentsRes] = await Promise.all([
    apiClient.get<any>(`/api/v1/users/${id}`),
    apiClient.get<any>("/api/v1/assignments?limit=100").catch(() => null),
  ]);
  const raw = res?.data?.user || res?.data || res?.user || res;
  const user = normalizeUser(raw, raw?.role || "mentee");

  if (user.role === "mentee") {
    const rawAssignments = Array.isArray(assignmentsRes?.data?.items)
      ? assignmentsRes.data.items
      : Array.isArray(assignmentsRes?.data)
      ? assignmentsRes.data
      : Array.isArray(assignmentsRes?.items)
      ? assignmentsRes.items
      : Array.isArray(assignmentsRes)
      ? assignmentsRes
      : [];
    const matched = rawAssignments.find(
      (a: any) =>
        String(a.mentee_id ?? a.menteeId ?? a.mentee?.id ?? "").trim() === String(id).trim()
    );
    if (matched) {
      const mentorObj = matched.mentor || {};
      const mentorName =
        mentorObj.full_name ||
        mentorObj.name ||
        matched.mentor_name ||
        matched.mentorName;
      if (mentorName) {
        (user as MenteeUser).assignedMentor = {
          name: mentorName,
          title: mentorObj.highest_qualification || mentorObj.profession || mentorObj.subtitle || "Clinical Mentor",
          avatarInitials:
            mentorName
              .split(" ")
              .filter(Boolean)
              .map((p: string) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "CM",
          status: "assigned",
        };
      }
    }
  }

  return user;
}

export interface ChangeUserStatusResult {
  success: boolean;
  message?: string;
  user?: ClinicalUser;
  status: string;
}

/**
 * Updates a user's status via PATCH /api/v1/users/{id}/status.
 */
export async function changeUserStatus(
  id: string,
  status: string
): Promise<ChangeUserStatusResult> {
  const res = await apiClient.patch<any>(`/api/v1/users/${id}/status`, { status });
  const raw = res?.data?.user || res?.data || res?.user;

  return {
    success: res?.success ?? true,
    message: res?.message,
    user: raw ? normalizeUser(raw, raw?.role || "mentee") : undefined,
    status,
  };
}
