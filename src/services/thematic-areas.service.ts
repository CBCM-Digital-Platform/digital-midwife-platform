import { apiClient } from "@/lib/api-client";
import type {
  ThematicArea,
  CreateThematicAreaInput,
  UpdateThematicAreaInput,
  ThematicAreaStatus,
} from "@/types/thematic-area";

export const THEMATIC_AREA_ID_MAP: Record<number | string, string> = {
  1: "Adolescent & Youth Sexual Reproductive Health",
  2: "Emergency Obstetric & Newborn Care",
  3: "Maternal & Child Health",
  4: "Family Planning & Comprehensive Abortion Care",
  5: "Pediatrics & Neonatal Care",
  6: "Infectious Diseases & PMTCT",
  7: "Surgery & Critical Midwifery Care",
  8: "Internal Medicine & Perinatal Complications",
};

/**
 * Resolves a thematic area ID or raw identifier into a human-readable domain name.
 */
export function resolveThematicAreaName(idOrName?: number | string | null): string | undefined {
  if (idOrName === undefined || idOrName === null) return undefined;
  const str = String(idOrName).trim();
  if (!str) return undefined;
  if (THEMATIC_AREA_ID_MAP[str]) return THEMATIC_AREA_ID_MAP[str];
  const num = Number(str);
  if (!isNaN(num) && THEMATIC_AREA_ID_MAP[num]) return THEMATIC_AREA_ID_MAP[num];
  // If it's already a descriptive text name (not a pure number or "thematic area #X")
  if (!/^\d+$/.test(str) && !/^thematic\s*area\s*#?\d+$/i.test(str)) {
    return str;
  }
  return undefined;
}

export const INITIAL_THEMATIC_AREAS: ThematicArea[] = [
  {
    id: "1",
    code: "AYSRH",
    name: "Adolescent & Youth Sexual Reproductive Health",
    competenciesCount: 18,
    modulesCount: 4,
    status: "active",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-06-10T11:30:00Z",
  },
  {
    id: "2",
    code: "EmONC",
    name: "Emergency Obstetric & Newborn Care",
    competenciesCount: 24,
    modulesCount: 6,
    status: "active",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-07-20T14:15:00Z",
  },
  {
    id: "3",
    code: "MCH",
    name: "Maternal & Child Health",
    competenciesCount: 16,
    modulesCount: 4,
    status: "active",
    createdAt: "2024-02-01T09:00:00Z",
    updatedAt: "2024-08-05T10:00:00Z",
  },
  {
    id: "4",
    code: "FP-CAC",
    name: "Family Planning & Comprehensive Abortion Care",
    competenciesCount: 14,
    modulesCount: 3,
    status: "active",
    createdAt: "2024-02-15T10:30:00Z",
    updatedAt: "2024-08-12T16:00:00Z",
  },
  {
    id: "5",
    code: "PNC",
    name: "Pediatrics & Neonatal Care",
    competenciesCount: 15,
    modulesCount: 4,
    status: "active",
    createdAt: "2024-03-01T08:45:00Z",
    updatedAt: "2024-09-01T12:20:00Z",
  },
  {
    id: "6",
    code: "PMTCT",
    name: "Infectious Diseases & PMTCT",
    competenciesCount: 12,
    modulesCount: 3,
    status: "active",
    createdAt: "2024-03-20T11:00:00Z",
    updatedAt: "2024-09-15T09:40:00Z",
  },
  {
    id: "7",
    code: "SCC",
    name: "Surgery & Critical Midwifery Care",
    competenciesCount: 10,
    modulesCount: 2,
    status: "under_review",
    createdAt: "2024-04-10T13:15:00Z",
    updatedAt: "2024-09-25T15:00:00Z",
  },
  {
    id: "8",
    code: "IM-PC",
    name: "Internal Medicine & Perinatal Complications",
    competenciesCount: 9,
    modulesCount: 2,
    status: "inactive",
    createdAt: "2024-05-01T09:30:00Z",
    updatedAt: "2024-10-02T11:10:00Z",
  },
];

const LOCAL_STORAGE_KEY = "cbcm_thematic_areas_store";

export function getStoredAreas(): ThematicArea[] {
  if (typeof window === "undefined") return INITIAL_THEMATIC_AREAS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_THEMATIC_AREAS));
      return INITIAL_THEMATIC_AREAS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_THEMATIC_AREAS;
  } catch {
    return INITIAL_THEMATIC_AREAS;
  }
}

export function saveStoredAreas(areas: ThematicArea[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(areas));
  } catch (e) {
    console.warn("Failed to persist thematic areas locally:", e);
  }
}

/**
 * Normalizes raw backend API data into strongly-typed ThematicArea
 */
export function normalizeThematicArea(raw: any): ThematicArea {
  const id = String(raw?.id ?? raw?._id ?? `ta-${Date.now()}`);
  const code = String(raw?.code || raw?.area_code || `TA-${id}`).trim();
  const name = String(raw?.name || raw?.title || "Unnamed Thematic Area").trim();

  const rawStatus = String(raw?.status || "").toLowerCase().trim();
  let status: ThematicAreaStatus = "active";
  if (rawStatus === "inactive" || rawStatus === "disabled") {
    status = "inactive";
  } else if (rawStatus === "under_review" || rawStatus === "pending") {
    status = "under_review";
  }

  return {
    id,
    code,
    name,
    competenciesCount: Number(raw?.competencies_count ?? raw?.competenciesCount ?? 12),
    modulesCount: Number(raw?.modules_count ?? raw?.modulesCount ?? 3),
    status,
    createdAt: raw?.created_at || raw?.createdAt || new Date().toISOString(),
    updatedAt: raw?.updated_at || raw?.updatedAt,
  };
}

/**
 * GET /api/v1/thematic-areas
 * Fetches the master list of all curriculum thematic areas directly from live backend API.
 */
export async function getThematicAreas(): Promise<ThematicArea[]> {
  try {
    const res = await apiClient.get<any>("/api/v1/thematic-areas?limit=100").catch(() => null);
    const rawList = Array.isArray(res?.data?.items)
      ? res.data.items
      : Array.isArray(res?.items)
      ? res.items
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : null;

    if (rawList && rawList.length > 0) {
      const liveList = rawList.map(normalizeThematicArea);
      saveStoredAreas(liveList);
      return liveList;
    }
  } catch (err) {
    console.warn("Thematic areas endpoint unavailable or session expired, reading master store:", err);
  }

  return getStoredAreas();
}

/**
 * GET /api/v1/thematic-areas/{id}
 * Fetches a single thematic area by ID directly from backend API.
 */
export async function getThematicArea(id: string): Promise<ThematicArea | null> {
  try {
    const res = await apiClient.get<any>(`/api/v1/thematic-areas/${id}`).catch(() => null);
    const raw = res?.data?.thematicArea || res?.data || res;
    if (raw && (raw.id || raw.name)) {
      return normalizeThematicArea(raw);
    }
  } catch (e) {
    // Fallback to local store
  }

  const list = getStoredAreas();
  return list.find((a) => a.id === id) || null;
}

/**
 * POST /api/v1/thematic-areas
 * Registers a new clinical thematic area in the live backend database.
 * If running in a local mock session, persists locally so changes survive page refreshes.
 */
export async function createThematicArea(
  data: CreateThematicAreaInput
): Promise<ThematicArea> {
  const trimmedCode = data.code.trim().toUpperCase();
  const trimmedName = data.name.trim();

  // Validate unique name and code against existing thematic areas
  const existingList = await getThematicAreas().catch(() => getStoredAreas());
  const duplicateName = existingList.find(
    (a) => a.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );
  if (duplicateName) {
    throw new Error(`A thematic area with the title "${trimmedName}" already exists (Code: ${duplicateName.code}).`);
  }

  const duplicateCode = existingList.find(
    (a) => a.code.trim().toUpperCase() === trimmedCode
  );
  if (duplicateCode) {
    throw new Error(`Thematic area code "${trimmedCode}" is already in use by "${duplicateCode.name}".`);
  }

  // Check if current user is logged in with a local development mock token
  let isMockSession = false;
  if (typeof window !== "undefined") {
    try {
      const { getSession } = await import("next-auth/react");
      const session = await getSession();
      const token = (session as any)?.accessToken || (session as any)?.user?.accessToken;
      if (!token || String(token).startsWith("mock-")) {
        isMockSession = true;
      }
    } catch {
      isMockSession = false;
    }
  }

  // 1. Live backend request if authenticated with a real backend access token
  if (!isMockSession) {
    try {
      const res = await apiClient.post<any>("/api/v1/thematic-areas", {
        code: trimmedCode,
        name: trimmedName,
      });

      const raw = res?.data?.thematicArea || res?.data || res;
      if (raw && (raw.id || raw.code)) {
        const normalized = normalizeThematicArea(raw);
        const list = getStoredAreas();
        saveStoredAreas([normalized, ...list.filter((a) => a.id !== normalized.id)]);
        return normalized;
      }
    } catch (e: any) {
      console.warn("Live backend thematic area creation error:", e?.message || e);
      if (e?.status === 409 || e?.statusCode === 409) {
        throw new Error(`Thematic area code "${trimmedCode}" already exists on the backend.`);
      }
      throw e;
    }
  }

  // 2. Local development / mock account persistence
  const fallbackArea: ThematicArea = {
    id: `ta-${Date.now()}`,
    code: trimmedCode,
    name: trimmedName,
    competenciesCount: 12,
    modulesCount: 3,
    status: data.status || "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const list = getStoredAreas();
  saveStoredAreas([fallbackArea, ...list.filter((a) => a.id !== fallbackArea.id)]);
  return fallbackArea;
}

/**
 * PATCH /api/v1/thematic-areas/{id}
 * Updates an existing clinical thematic area in the backend database.
 */
export async function updateThematicArea(
  id: string,
  data: UpdateThematicAreaInput
): Promise<ThematicArea> {
  // Validate unique name and code against existing thematic areas
  if (data.name !== undefined || data.code !== undefined) {
    const existingList = await getThematicAreas().catch(() => getStoredAreas());
    if (data.name !== undefined) {
      const trimmedNewName = data.name.trim().toLowerCase();
      const duplicateName = existingList.find(
        (a) => a.id !== id && a.name.trim().toLowerCase() === trimmedNewName
      );
      if (duplicateName) {
        throw new Error(
          `A thematic area with the title "${data.name.trim()}" already exists (Code: ${duplicateName.code}).`
        );
      }
    }
    if (data.code !== undefined) {
      const trimmedNewCode = data.code.trim().toUpperCase();
      const duplicateCode = existingList.find(
        (a) => a.id !== id && a.code.trim().toUpperCase() === trimmedNewCode
      );
      if (duplicateCode) {
        throw new Error(
          `Thematic area code "${data.code.trim().toUpperCase()}" is already in use by "${duplicateCode.name}".`
        );
      }
    }
  }

  const list = getStoredAreas();
  const existing = list.find((a) => a.id === id) || INITIAL_THEMATIC_AREAS[0];

  const updated: ThematicArea = {
    ...existing,
    code: data.code !== undefined ? data.code.trim().toUpperCase() : existing.code,
    name: data.name !== undefined ? data.name.trim() : existing.name,
    status: data.status !== undefined ? data.status : existing.status,
    updatedAt: new Date().toISOString(),
  };

  let isMockSession = false;
  if (typeof window !== "undefined") {
    try {
      const { getSession } = await import("next-auth/react");
      const session = await getSession();
      const token = (session as any)?.accessToken || (session as any)?.user?.accessToken;
      if (!token || String(token).startsWith("mock-")) {
        isMockSession = true;
      }
    } catch {
      isMockSession = false;
    }
  }

  if (!isMockSession && !id.startsWith("ta-")) {
    try {
      await apiClient.patch<any>(`/api/v1/thematic-areas/${id}`, {
        code: updated.code,
        name: updated.name,
      });
    } catch (e: any) {
      console.warn("Backend patch error:", e?.message || e);
      if (e?.status === 409 || e?.statusCode === 409) {
        throw new Error(`Thematic area code "${updated.code}" already exists on the backend.`);
      }
      throw e;
    }
  }

  saveStoredAreas(list.map((a) => (a.id === id ? updated : a)));
  return updated;
}

/**
 * Updates the status of a thematic area.
 */
export async function updateThematicAreaStatus(
  id: string,
  status: ThematicAreaStatus
): Promise<{ success: boolean; status: ThematicAreaStatus; message?: string }> {
  try {
    const list = getStoredAreas();
    saveStoredAreas(
      list.map((a) => (a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a))
    );
    return { success: true, status };
  } catch (e: any) {
    return {
      success: false,
      status,
      message: e?.message || "Failed to update thematic area status",
    };
  }
}

/**
 * DELETE /api/v1/thematic-areas/{id}
 * Deletes a thematic area from the live backend database.
 */
export async function deleteThematicArea(
  id: string
): Promise<{ success: boolean; message?: string }> {
  let isMockSession = false;
  if (typeof window !== "undefined") {
    try {
      const { getSession } = await import("next-auth/react");
      const session = await getSession();
      const token = (session as any)?.accessToken || (session as any)?.user?.accessToken;
      if (!token || String(token).startsWith("mock-")) {
        isMockSession = true;
      }
    } catch {
      isMockSession = false;
    }
  }

  if (!isMockSession && !id.startsWith("ta-")) {
    try {
      await apiClient.delete<any>(`/api/v1/thematic-areas/${id}`);
    } catch (e: any) {
      console.warn("Backend delete error:", e?.message || e);
      if (e?.status === 409 || e?.statusCode === 409) {
        throw new Error("This thematic area is currently linked to active cycles or assignments and cannot be deleted.");
      }
      throw e;
    }
  }

  const list = getStoredAreas();
  saveStoredAreas(list.filter((a) => a.id !== id));
  return { success: true };
}
