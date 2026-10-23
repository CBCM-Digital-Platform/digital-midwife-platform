import { apiClient } from "@/lib/api-client";
import { getFacilities } from "@/services/facilities.service";
import { FACILITY_ID_MAP } from "@/services/users.service";
import type {
  FacilityAdmin,
  CreateFacilityAdminInput,
  FacilityAdminStatus,
} from "@/types/facility-admin";

/**
 * Normalizes a raw backend user record into a strongly-typed FacilityAdmin object.
 */
export function normalizeFacilityAdmin(
  raw: any,
  facilityLookup?: Map<number, string>
): FacilityAdmin {
  if (!raw) return {} as FacilityAdmin;

  const id = String(raw.id ?? raw._id ?? `fadmin-${Date.now()}`);
  const name =
    raw.full_name ||
    raw.name ||
    raw.fullName ||
    (raw.firstName && raw.lastName ? `${raw.firstName} ${raw.lastName}` : "") ||
    raw.email?.split("@")[0] ||
    "Facility Admin";

  const initials =
    raw.avatarInitials ||
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part: string) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ||
    "FA";

  const facilityId =
    raw.facility_id !== undefined && raw.facility_id !== null
      ? Number(raw.facility_id)
      : raw.facilityId !== undefined && raw.facilityId !== null
      ? Number(raw.facilityId)
      : undefined;

  let facilityName = "Unassigned Facility";
  if (facilityId !== undefined) {
    if (facilityLookup?.has(facilityId)) {
      facilityName = facilityLookup.get(facilityId)!;
    } else if (FACILITY_ID_MAP[facilityId]) {
      facilityName = FACILITY_ID_MAP[facilityId];
    } else if (raw.facility?.name) {
      facilityName = raw.facility.name;
    } else {
      facilityName = `Facility #${facilityId}`;
    }
  }

  const rawStatus = String(raw.status || "").toLowerCase().trim();
  let status: FacilityAdminStatus = "active";
  if (rawStatus === "inactive" || rawStatus === "disabled" || rawStatus === "deactivated") {
    status = "inactive";
  } else if (rawStatus === "suspended") {
    status = "suspended";
  } else if (rawStatus === "pending") {
    status = "pending";
  } else {
    status = "active";
  }

  return {
    id,
    name,
    email: raw.email || "",
    phone: raw.phone || undefined,
    role: "facility_admin",
    facilityId,
    facilityName,
    highestQualification:
      raw.highest_qualification ||
      raw.highestQualification ||
      raw.qualification ||
      undefined,
    trainingStatus: raw.training_status || undefined,
    status,
    avatarInitials: initials,
    avatarBgColor: "bg-emerald-100 text-emerald-800",
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt,
  };
}

/**
 * GET /api/v1/users?role=facility_admin
 * Fetches the master list of facility administrators.
 */
export async function getFacilityAdmins(): Promise<FacilityAdmin[]> {
  try {
    const [usersRes, facilities] = await Promise.all([
      apiClient.get<any>("/api/v1/users?role=facility_admin&limit=100"),
      getFacilities().catch(() => []),
    ]);

    const facilityLookup = new Map<number, string>();
    facilities.forEach((f) => {
      const numId = Number(f.id);
      if (!isNaN(numId)) {
        facilityLookup.set(numId, f.name);
      }
    });

    const rawList = Array.isArray(usersRes?.data?.users)
      ? usersRes.data.users
      : Array.isArray(usersRes?.data)
      ? usersRes.data
      : Array.isArray(usersRes?.users)
      ? usersRes.users
      : Array.isArray(usersRes)
      ? usersRes
      : [];

    return rawList.map((u: any) => normalizeFacilityAdmin(u, facilityLookup));
  } catch (error: any) {
    console.warn("Failed to fetch facility admins from API:", error?.message || error);
    return [];
  }
}

/**
 * GET /api/v1/users/{id}
 * Fetches a single facility administrator by ID.
 */
export async function getFacilityAdmin(id: string): Promise<FacilityAdmin | null> {
  try {
    const res = await apiClient.get<any>(`/api/v1/users/${id}`);
    const raw = res?.data?.user || res?.data || res?.user || res;
    if (!raw || (!raw.id && !raw.email)) return null;
    return normalizeFacilityAdmin(raw);
  } catch (error) {
    console.warn(`Failed to fetch facility admin ${id}:`, error);
    return null;
  }
}

/**
 * POST /api/v1/users
 * Registers a new facility administrator in the system.
 */
export async function createFacilityAdmin(
  data: CreateFacilityAdminInput
): Promise<FacilityAdmin> {
  const fullName =
    data.name?.trim() ||
    `${data.firstName?.trim() || ""} ${data.lastName?.trim() || ""}`.trim();

  // Construct payload strictly matching the backend OpenAPI CreateUserRequest schema
  const payload: Record<string, any> = {
    full_name: fullName,
    email: data.email.trim().toLowerCase(),
    password: data.password || "TemporaryPass1!",
    role: "facility_admin",
    facility_id: Number(data.facilityId),
    must_change_password: true,
  };

  if (data.phone?.trim()) {
    payload.phone = data.phone.trim();
  }

  if (data.highestQualification?.trim()) {
    payload.highest_qualification = data.highestQualification.trim();
  }

  const res = await apiClient.post<any>("/api/v1/users", payload);
  const raw = res?.data?.user || res?.data || res?.user || res;
  return normalizeFacilityAdmin(raw);
}

/**
 * PATCH /api/v1/users/{id}/status
 * Updates the operational status of a facility administrator (active, inactive, suspended).
 */
export async function updateFacilityAdminStatus(
  id: string,
  status: FacilityAdminStatus
): Promise<{ success: boolean; message?: string; status: FacilityAdminStatus }> {
  try {
    const res = await apiClient.patch<any>(`/api/v1/users/${id}/status`, { status });
    return {
      success: res?.success ?? true,
      message: res?.message || `Status updated to ${status}`,
      status,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to update admin status",
      status,
    };
  }
}
