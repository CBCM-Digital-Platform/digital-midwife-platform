export type UserRole = "mentor" | "mentee" | "admin";

export type MentorStatus = "active" | "inactive" | "on_leave";
export type MenteeStatus = "active" | "pending_start" | "inactive";

export type ThematicArea =
  | "Pediatrics & Neo"
  | "Emergency Care"
  | "Maternal & Child"
  | "Surgery & Critical"
  | "Internal Medicine"
  | "Infectious Diseases"
  | "Oncology"
  | "Cardiovascular"
  | "Critical Care";

export interface Facility {
  id: string;
  name: string;
  type?: "Teaching Hospital" | "Regional Center" | "Clinic" | "Specialty Hospital";
}

export interface BaseUser {
  id: string;
  systemId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  facility: string;
  facilityType?: string;
  thematicArea: ThematicArea;
  avatarInitials: string;
  avatarBgColor?: string;
  avatarUrl?: string;
}

export interface MentorUser extends BaseUser {
  role: "mentor";
  profession: string;
  department: string;
  yearsOfExperience: number;
  assignedMenteesCount: number;
  status: MentorStatus;
}

export interface AssignedMentorInfo {
  name?: string;
  title?: string;
  avatarInitials?: string;
  status: "assigned" | "pending_review" | "unassigned";
}

export interface MenteeUser extends BaseUser {
  role: "mentee";
  profession: string;
  cadreLevel: string;
  assignedMentor: AssignedMentorInfo;
  knowledgeScore: number;
  scoreTier: "Tier 1" | "Tier 2" | "Remediation";
  status: MenteeStatus;
}

export type ClinicalUser = MentorUser | MenteeUser;

export interface MentorSummaryStats {
  totalMentors: number;
  activeCount: number;
  inactiveCount: number;
  quarterTrend: string;
  partnerFacilities: number;
  teachingHospitals: number;
  clinicsCount: number;
  activeMentees: number;
  avgPerPreceptor: number;
  loadStatus: "Optimal Load" | "High Load" | "Low Load";
  completionPercentage: number;
  completionTrend: string;
  completionTarget: number;
}
