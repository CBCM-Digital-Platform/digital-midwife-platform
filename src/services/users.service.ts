import { apiClient } from "@/lib/api-client";
import { mockMentors, mockMentees, mockMentorStats, mockMenteeStats } from "@/lib/mock-users";
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

  const rawStatus = String(raw.status || raw.training_status || "active").toLowerCase();
  const status =
    rawStatus === "active" || rawStatus === "certified" || rawStatus === "graduated"
      ? "active"
      : rawStatus === "pending" || rawStatus === "in_training" || rawStatus === "pending_start"
      ? "pending"
      : rawStatus === "on_leave"
      ? "on_leave"
      : "active";

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

export async function getMentors(): Promise<MentorUser[]> {
  try {
    const res = await apiClient<any>("/api/v1/users?role=mentor");
    const rawList = Array.isArray(res) ? res : res?.data?.users || res?.data || res?.users || [];
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map((u: any) => normalizeUser(u, "mentor")) as MentorUser[];
    }
    return mockMentors;
  } catch (error) {
    console.warn("Failed to fetch mentors from backend API, falling back to mock dataset:", error);
    return mockMentors;
  }
}

export async function getMentees(): Promise<MenteeUser[]> {
  try {
    const res = await apiClient<any>("/api/v1/users?role=mentee");
    const rawList = Array.isArray(res) ? res : res?.data?.users || res?.data || res?.users || [];
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map((u: any) => normalizeUser(u, "mentee")) as MenteeUser[];
    }
    return mockMentees;
  } catch (error) {
    console.warn("Failed to fetch mentees from backend API, falling back to mock dataset:", error);
    return mockMentees;
  }
}

export async function getMentorStats(): Promise<MentorSummaryStats> {
  try {
    const res = await apiClient<any>("/api/v1/users/stats?role=mentor");
    if (res?.data || res?.stats) {
      return (res.data || res.stats) as MentorSummaryStats;
    }
    return mockMentorStats;
  } catch {
    return mockMentorStats;
  }
}

export async function getMenteeStats(): Promise<MenteeSummaryStats> {
  try {
    const res = await apiClient<any>("/api/v1/users/stats?role=mentee");
    if (res?.data || res?.stats) {
      return (res.data || res.stats) as MenteeSummaryStats;
    }
    return mockMenteeStats;
  } catch {
    return mockMenteeStats;
  }
}

export async function createUser(data: Partial<ClinicalUser>): Promise<ClinicalUser> {
  return apiClient.post<ClinicalUser>("/api/v1/users", data);
}
