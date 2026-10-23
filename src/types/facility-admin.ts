export type FacilityAdminStatus = "active" | "inactive" | "suspended" | "pending";

export interface FacilityAdmin {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "facility_admin";
  facilityId?: number;
  facilityName: string;
  highestQualification?: string;
  trainingStatus?: string;
  status: FacilityAdminStatus;
  avatarInitials: string;
  avatarBgColor?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFacilityAdminInput {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  facilityId: number;
  phone?: string;
  highestQualification?: string;
}

export interface FacilityAdminStats {
  totalAdmins: number;
  activeAdmins: number;
  assignedFacilitiesCount: number;
  inactiveOrSuspendedCount: number;
}
