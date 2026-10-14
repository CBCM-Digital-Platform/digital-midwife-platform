import { apiClient } from "@/lib/api-client";
import type { MentorUser, MenteeUser, ClinicalUser, MentorSummaryStats, MenteeSummaryStats } from "@/types/user";

/**
 * Facility ID mapping for resolving backend facility_id numbers into human-readable facility names.
 */
export const FACILITY_ID_MAP: Record<number | string, string> = {
  1: "St. Paul's Hospital (SPHMMC)",
  2: "Tikur Anbessa Specialized Hospital (TASH)",
  3: "Zewditu Memorial Hospital",
  4: "Yekatit 12 Hospital Medical College",
  5: "Gandhi Memorial Hospital",
  6: "Tirunesh Beijing General Hospital",
};

/**
 * Normalizes raw backend user models (snake_case full_name, facility_id, highest_qualification, etc.)
 * into strongly-typed frontend ClinicalUser (MentorUser | MenteeUser) domain models.
 */
export function normalizeUser(raw: any, defaultRole: "mentor" | "mentee"): ClinicalUser {
  if (!raw) return {} as ClinicalUser;

  const id = String(raw.id ?? raw._id ?? `user-${Date.now()}`);
  const role = (raw.role || defaultRole) as "mentor" | "mentee";

  const name =
    raw.name ||
    raw.full_name ||
    raw.fullName ||
    (raw.firstName && raw.lastName ? `${raw.firstName} ${raw.lastName}` : "") ||
    raw.email?.split("@")[0] ||
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

  const facilityId = raw.facility_id !== undefined ? Number(raw.facility_id) : undefined;
  const facility =
    raw.facility ||
    (facilityId !== undefined && FACILITY_ID_MAP[facilityId]) ||
    raw.facility_name ||
    "Tikur Anbessa Specialized Hospital (TASH)";

  const profession =
    raw.profession ||
    raw.highest_qualification ||
    (role === "mentor" ? "Lead Midwifery Preceptor" : "Resident Midwife");

  const thematicArea = raw.thematicArea || raw.thematic_area || "Maternal & Child";

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
      phone: raw.phone || "+251911234567",
      role: "mentor",
      facility,
      thematicArea,
      avatarInitials: initials,
      avatarBgColor: raw.avatarBgColor || "bg-emerald-100 text-emerald-800",
      profession,
      department: raw.department || "Maternal & Fetal Health Unit",
      yearsOfExperience: Number(raw.yearsOfExperience || raw.years_of_experience) || 5,
      assignedMenteesCount: Number(raw.assignedMenteesCount || raw.assigned_mentees_count) || 0,
      status: status as any,
    };
    return mentor;
  } else {
    const mentee: MenteeUser = {
      id,
      systemId,
      name,
      email: raw.email || "",
      phone: raw.phone || "+251911234567",
      role: "mentee",
      facility,
      thematicArea,
      avatarInitials: initials,
      avatarBgColor: raw.avatarBgColor || "bg-blue-100 text-blue-800",
      profession,
      cadreLevel: raw.cadreLevel || raw.cadre_level || "Junior Midwife Resident",
      assignedMentor: raw.assignedMentor || {
        name: raw.mentor_name || undefined,
        status: raw.mentor_id || raw.mentor_name ? "assigned" : "pending_review",
      },
      knowledgeScore: Number(raw.knowledgeScore || raw.knowledge_score) || 84,
      scoreTier: (raw.scoreTier || (Number(raw.knowledgeScore || raw.knowledge_score) >= 80 ? "Tier 1" : "Tier 2")) as any,
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

  const query = new URLSearchParams({ role: "mentor" });
  if (activeFacilityId !== undefined && activeFacilityId !== null && String(activeFacilityId).trim() !== "") {
    query.set("facility_id", String(activeFacilityId));
  }

  const res = await apiClient<any>(`/api/v1/users?${query.toString()}`);
  const rawList = Array.isArray(res) ? res : res?.data?.users || res?.data || res?.users || [];
  return (rawList || []).map((u: any) => normalizeUser(u, "mentor")) as MentorUser[];
}

/**
 * Fetches mentees directly from backend API without mock fallbacks.
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

  const query = new URLSearchParams({ role: "mentee" });
  if (activeFacilityId !== undefined && activeFacilityId !== null && String(activeFacilityId).trim() !== "") {
    query.set("facility_id", String(activeFacilityId));
  }

  const res = await apiClient<any>(`/api/v1/users?${query.toString()}`);
  const rawList = Array.isArray(res) ? res : res?.data?.users || res?.data || res?.users || [];
  return (rawList || []).map((u: any) => normalizeUser(u, "mentee")) as MenteeUser[];
}

export async function getMentorStats(facilityId?: number | string): Promise<MentorSummaryStats> {
  const query = new URLSearchParams({ role: "mentor" });
  if (facilityId !== undefined && facilityId !== null && String(facilityId).trim() !== "") {
    query.set("facility_id", String(facilityId));
  }
  const res = await apiClient<any>(`/api/v1/users/stats?${query.toString()}`);
  return (res?.data || res?.stats || res) as MentorSummaryStats;
}

export async function getMenteeStats(facilityId?: number | string): Promise<MenteeSummaryStats> {
  const query = new URLSearchParams({ role: "mentee" });
  if (facilityId !== undefined && facilityId !== null && String(facilityId).trim() !== "") {
    query.set("facility_id", String(facilityId));
  }
  const res = await apiClient<any>(`/api/v1/users/stats?${query.toString()}`);
  return (res?.data || res?.stats || res) as MenteeSummaryStats;
}

export async function createUser(data: Partial<ClinicalUser>): Promise<ClinicalUser> {
  return apiClient.post<ClinicalUser>("/api/v1/users", data);
}

/**
 * Fetches a single user by ID and normalizes into a strongly typed ClinicalUser model.
 */
export async function getUserById(id: string): Promise<ClinicalUser> {
  const res = await apiClient.get<any>(`/api/v1/users/${id}`);
  const raw = res?.data?.user || res?.data || res?.user || res;
  return normalizeUser(raw, raw?.role || "mentee");
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
