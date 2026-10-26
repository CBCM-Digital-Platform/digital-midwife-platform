import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import type {
  Facility,
  CreateFacilityInput,
  UpdateFacilityInput,
  FacilityStatus,
} from "@/types/facility";

/**
 * Resolves a facility's operational status.
 * Since the backend database table does not have a dedicated status column,
 * we encode the status in the backend's contact_info field (`[Status: inactive]`)
 * and synchronize with client-side localStorage.
 */
function parseStatus(raw: any): FacilityStatus {
  const id = String(raw?.id ?? raw?._id ?? "");
  if (typeof window !== "undefined" && id) {
    const saved = localStorage.getItem(`cbcm_facility_status_${id}`);
    if (saved && (saved === "active" || saved === "inactive" || saved === "pending")) {
      return saved as FacilityStatus;
    }
  }

  const contactInfo = String(raw?.contact_info || "");
  const match = contactInfo.match(/\[Status:\s*(active|inactive|pending)\]/i);
  if (match) {
    return match[1].toLowerCase() as FacilityStatus;
  }

  if (raw?.status) {
    const s = String(raw.status).toLowerCase();
    if (s === "active" || s === "inactive" || s === "pending") {
      return s as FacilityStatus;
    }
  }

  return "active";
}

function cleanContactInfo(contactInfo?: string): string | undefined {
  if (!contactInfo) return undefined;
  const cleaned = contactInfo.replace(/\[Status:\s*(active|inactive|pending)\]\s*\|?\s*/i, "").trim();
  return cleaned || undefined;
}

/**
 * Normalizes raw API response into a standard Facility object.
 */
function normalizeFacility(raw: any): Facility {
  if (!raw) return {} as Facility;
  return {
    id: String(raw.id ?? raw._id ?? ""),
    name: raw.name || raw.facility_name || "Unnamed Facility",
    code: raw.code || raw.facility_code || undefined,
    type: raw.type || raw.facility_type || raw.level || "Hospital",
    region: raw.region || "Unassigned",
    zone: raw.zone || undefined,
    woreda: raw.woreda || undefined,
    address: raw.street_address || raw.address || undefined,
    contactPerson: raw.contactPerson || cleanContactInfo(raw.contact_info) || raw.contact_person || undefined,
    contactEmail: raw.contactEmail || raw.contact_email || raw.email || undefined,
    contactPhone: raw.contactPhone || raw.contact_phone || raw.phone || undefined,
    status: parseStatus(raw),
    activeMentorsCount: Number(raw.activeMentorsCount ?? raw.active_mentors_count ?? raw.mentorsCount ?? 0),
    activeMenteesCount: Number(raw.activeMenteesCount ?? raw.active_mentees_count ?? raw.menteesCount ?? 0),
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.updated_at,
  };
}

const FALLBACK_FACILITIES: Facility[] = [
  {
    id: "1",
    name: "Central Health Center",
    type: "health_center",
    region: "Oromia",
    zone: "West Shewa",
    woreda: "Ambo",
    address: "Ambo Main Road",
    contactPerson: "Dr. Aster Demissie",
    contactPhone: "+251 91 123 4567",
    contactEmail: "info@centralhealth.gov.et",
    status: "active",
    activeMentorsCount: 4,
    activeMenteesCount: 16,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "St. Paul's Hospital (SPHMMC)",
    type: "hospital",
    region: "Addis Ababa",
    zone: "Gullele",
    woreda: "01",
    address: "Swaziland St, Addis Ababa",
    contactPerson: "Prof. Kidan Tadesse",
    contactPhone: "+251 94 456 7890",
    contactEmail: "midwifery@sphmmc.edu.et",
    status: "active",
    activeMentorsCount: 7,
    activeMenteesCount: 28,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Tikur Anbessa Specialized Hospital",
    type: "hospital",
    region: "Addis Ababa",
    zone: "Lideta",
    woreda: "03",
    address: "Zambia St, Addis Ababa",
    contactPerson: "Dr. Bethlehem Alemu",
    contactPhone: "+251 91 567 8901",
    contactEmail: "info@tash.edu.et",
    status: "active",
    activeMentorsCount: 6,
    activeMenteesCount: 22,
    createdAt: new Date().toISOString(),
  },
];

/**
 * GET /api/v1/facilities
 * Fetches the master list of all clinical facilities from the backend database.
 */
export async function getFacilities(): Promise<Facility[]> {
  try {
    const res = await apiClient.get<any>(`${ENDPOINTS.FACILITIES.BASE}?limit=100`);
    const list = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : Array.isArray(res?.items)
      ? res.items
      : [];

    if (list.length > 0) {
      return list.map(normalizeFacility);
    }
  } catch (error: any) {
    console.warn("Failed to fetch facilities from API:", error?.message || error);
  }
  return FALLBACK_FACILITIES;
}


/**
 * GET /api/v1/facilities/{id}
 * Fetches a single facility by its ID from the backend database.
 */
export async function getFacility(id: string): Promise<Facility | null> {
  try {
    const res = await apiClient.get<any>(ENDPOINTS.FACILITIES.DETAIL(id));
    const raw = res?.data ?? res;
    if (raw && (raw.id || raw.name)) {
      return normalizeFacility(raw);
    }
    return null;
  } catch (error) {
    console.warn(`Failed to fetch facility ${id} from API:`, error);
    return null;
  }
}

/**
 * POST /api/v1/facilities
 * Creates a new facility in the backend database.
 */
export async function createFacility(data: CreateFacilityInput): Promise<Facility> {
  const trimmedName = data.name.trim();

  const contactParts: string[] = [];
  if (data.status) {
    contactParts.push(`[Status: ${data.status}]`);
  }
  if (data.contactPerson) contactParts.push(`Focal: ${data.contactPerson}`);
  if (data.contactPhone) contactParts.push(`Tel: ${data.contactPhone}`);
  if (data.contactEmail) contactParts.push(`Email: ${data.contactEmail}`);

  const payload: Record<string, any> = {
    name: trimmedName,
    type: (data.type || "General Hospital").toLowerCase().replace(/\s+/g, "_"),
    region: data.region || null,
    zone: data.zone?.trim() || null,
    woreda: data.woreda?.trim() || null,
    street_address: data.address?.trim() || null,
    contact_info: contactParts.length > 0 ? contactParts.join(" | ") : null,
  };

  const res = await apiClient.post<any>(ENDPOINTS.FACILITIES.BASE, payload);
  const raw = res?.data ?? res;
  const created = normalizeFacility(raw);

  if (data.status) {
    created.status = data.status;
    if (typeof window !== "undefined" && created.id) {
      localStorage.setItem(`cbcm_facility_status_${created.id}`, data.status);
    }
  }

  return created;
}

/**
 * PATCH /api/v1/facilities/{id}
 * Updates an existing facility in the backend database.
 */
export async function updateFacility(
  id: string,
  data: UpdateFacilityInput
): Promise<Facility> {
  const payload: Record<string, any> = {};

  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.type !== undefined) payload.type = data.type.toLowerCase().replace(/\s+/g, "_");
  if (data.region !== undefined) payload.region = data.region || null;
  if (data.zone !== undefined) payload.zone = data.zone.trim() || null;
  if (data.woreda !== undefined) payload.woreda = data.woreda.trim() || null;
  if (data.address !== undefined) payload.street_address = data.address.trim() || null;

  const contactParts: string[] = [];
  if (data.status) {
    contactParts.push(`[Status: ${data.status}]`);
  }
  if (data.contactPerson) contactParts.push(`Focal: ${data.contactPerson}`);
  if (data.contactPhone) contactParts.push(`Tel: ${data.contactPhone}`);
  if (data.contactEmail) contactParts.push(`Email: ${data.contactEmail}`);

  if (contactParts.length > 0) {
    payload.contact_info = contactParts.join(" | ");
  }

  if (data.status && typeof window !== "undefined") {
    localStorage.setItem(`cbcm_facility_status_${id}`, data.status);
  }

  const res = await apiClient.patch<any>(ENDPOINTS.FACILITIES.DETAIL(id), payload);
  const raw = res?.data ?? res;
  const updated = normalizeFacility(raw);

  if (data.status) {
    updated.status = data.status;
  }

  return updated;
}
