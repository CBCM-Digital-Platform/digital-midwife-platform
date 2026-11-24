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
    const { getAssignments, getStoredCreatedAssignments } = await import("@/services/assignments.service");
    const [res, assignmentsList] = await Promise.all([
      apiClient<any>(`/api/v1/users?${query.toString()}`),
      getAssignments(activeFacilityId).catch(() => []),
    ]);

    const storedAssignments = typeof window !== "undefined" ? getStoredCreatedAssignments() : [];
    const allAssignments = [...assignmentsList, ...storedAssignments];

    // Count real assigned mentees per mentor from live assignments
    const mentorMenteesCountMap = new Map<string, number>();

    for (const a of allAssignments) {
      const mentorId = String(a.mentor?.id ?? "").trim();
      const mentorName = String(a.mentor?.name ?? "").trim().toLowerCase();
      const count = Array.isArray(a.mentees) && a.mentees.length > 0 ? a.mentees.length : (a.mentee?.id ? 1 : 0);

      if (mentorId) {
        mentorMenteesCountMap.set(mentorId, (mentorMenteesCountMap.get(mentorId) || 0) + count);
      }
      if (mentorName) {
        mentorMenteesCountMap.set(mentorName, (mentorMenteesCountMap.get(mentorName) || 0) + count);
      }
    }

    const rawList = Array.isArray(res) ? res : res?.data?.users || res?.data || res?.users || [];
    let list = (rawList || []).map((u: any) => {
      const mentor = normalizeUser(u, "mentor") as MentorUser;
      const countById = mentorMenteesCountMap.get(String(mentor.id).trim());
      const countByName = mentorMenteesCountMap.get(String(mentor.name).trim().toLowerCase());
      const count = countById !== undefined ? countById : countByName;
      if (count !== undefined) {
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
    const { getAssignments, getStoredCreatedAssignments } = await import("@/services/assignments.service");
    const [res, assignmentsList] = await Promise.all([
      apiClient<any>(`/api/v1/users?${query.toString()}`),
      getAssignments(activeFacilityId).catch(() => []),
    ]);

    const storedAssignments = typeof window !== "undefined" ? getStoredCreatedAssignments() : [];
    const allAssignments = [...assignmentsList, ...storedAssignments];

    // Build assignment lookup map: menteeId / menteeName -> AssignedMentorInfo
    const assignmentMap = new Map<string, { name: string; title: string; avatarInitials: string; status: "assigned" }>();

    for (const a of allAssignments) {
      const mentorName = a.mentor?.name;
      const mentorTitle = a.mentor?.subtitle || "Clinical Mentor";
      const mentorInitials = a.mentor?.initials || "CM";

      if (mentorName) {
        const info = {
          name: mentorName,
          title: mentorTitle,
          avatarInitials: mentorInitials,
          status: "assigned" as const,
        };

        if (a.mentee?.id) {
          assignmentMap.set(String(a.mentee.id).trim(), info);
        }
        if (a.mentee?.name) {
          assignmentMap.set(String(a.mentee.name).trim().toLowerCase(), info);
        }

        if (Array.isArray(a.mentees)) {
          for (const m of a.mentees) {
            if (m?.id) {
              assignmentMap.set(String(m.id).trim(), info);
            }
            if (m?.name) {
              assignmentMap.set(String(m.name).trim().toLowerCase(), info);
            }
          }
        }
      }
    }

    const rawList = Array.isArray(res) ? res : res?.data?.users || res?.data || res?.users || [];
    let list = (rawList || []).map((u: any) => {
      const mentee = normalizeUser(u, "mentee") as MenteeUser;
      const assignedById = assignmentMap.get(String(mentee.id).trim());
      const assignedByName = assignmentMap.get(String(mentee.name).trim().toLowerCase());
      const assigned = assignedById || assignedByName;
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
    if (res?.data || res?.stats) {
      return (res?.data || res?.stats) as MentorSummaryStats;
    }
  } catch (error: any) {
    console.warn("Could not fetch mentor stats from /api/v1/users/stats, deriving from mentors list:", error?.message || error);
  }

  // Derive real statistics from mentors list
  try {
    const mentors = await getMentors(facilityId);
    const totalMentors = mentors.length;
    const activeCount = mentors.filter((m) => m.status === "active").length;
    const pendingCount = mentors.filter((m) => m.status === "pending").length;
    const inactiveCount = mentors.filter((m) => m.status === "inactive" || m.status === "suspended").length;

    return {
      totalMentors,
      activeCount,
      pendingCount,
      inactiveCount,
      quarterTrend: "+0%",
      completionPercentage: totalMentors > 0 ? Math.round((activeCount / totalMentors) * 100) : 0,
      completionTrend: "+0%",
      completionTarget: totalMentors,
    };
  } catch {
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
    if (res?.data || res?.stats) {
      return (res?.data || res?.stats) as MenteeSummaryStats;
    }
  } catch (error: any) {
    console.warn("Could not fetch mentee stats from /api/v1/users/stats, deriving from mentees list:", error?.message || error);
  }

  // Derive real statistics from mentees list
  try {
    const mentees = await getMentees(facilityId);
    const totalMentees = mentees.length;
    const activeInRotation = mentees.filter((m) => m.status === "active").length;
    const pendingOrientation = mentees.filter((m) => m.status === "pending").length;
    const operationalPercentage = totalMentees > 0 ? `${Math.round((activeInRotation / totalMentees) * 100)}%` : "0%";

    return {
      totalMentees,
      termTrend: "+0%",
      activeInRotation,
      operationalPercentage,
      pendingOrientation,
      pendingStage: pendingOrientation > 0 ? "Orientation Pending" : "None",
      avgKnowledgeMastery: 0,
      cohortTrend: "+0%",
    };
  } catch {
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
  const { getAssignments, getStoredCreatedAssignments } = await import("@/services/assignments.service");
  const [res, assignmentsList] = await Promise.all([
    apiClient.get<any>(`/api/v1/users/${id}`),
    getAssignments().catch(() => []),
  ]);
  const raw = res?.data?.user || res?.data || res?.user || res;
  const user = normalizeUser(raw, raw?.role || "mentee");

  const storedAssignments = typeof window !== "undefined" ? getStoredCreatedAssignments() : [];
  const allAssignments = [...assignmentsList, ...storedAssignments];

  if (user.role === "mentee") {
    const matched = allAssignments.find((a) => {
      const mId = String(a.mentee?.id ?? "").trim();
      const mName = String(a.mentee?.name ?? "").trim().toLowerCase();
      const targetId = String(id).trim();
      const targetName = String(user.name).trim().toLowerCase();
      if (mId === targetId || (mName && mName === targetName)) return true;
      if (Array.isArray(a.mentees)) {
        return a.mentees.some(
          (m) =>
            String(m?.id ?? "").trim() === targetId ||
            (m?.name && String(m.name).trim().toLowerCase() === targetName)
        );
      }
      return false;
    });

    if (matched && matched.mentor?.name) {
      (user as MenteeUser).assignedMentor = {
        name: matched.mentor.name,
        title: matched.mentor.subtitle || "Clinical Mentor",
        avatarInitials: matched.mentor.initials || "CM",
        status: "assigned",
      };
    }
  } else if (user.role === "mentor") {
    let count = 0;
    const mentorId = String(id).trim();
    const mentorName = String(user.name).trim().toLowerCase();
    for (const a of allAssignments) {
      if (
        String(a.mentor?.id ?? "").trim() === mentorId ||
        (a.mentor?.name && String(a.mentor.name).trim().toLowerCase() === mentorName)
      ) {
        count += Array.isArray(a.mentees) && a.mentees.length > 0 ? a.mentees.length : (a.mentee?.id ? 1 : 0);
      }
    }
    (user as MentorUser).assignedMenteesCount = count;
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
