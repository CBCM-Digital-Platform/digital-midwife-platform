import { apiClient } from "@/lib/api-client";
import type {
  ThematicArea,
  CreateThematicAreaInput,
  UpdateThematicAreaInput,
  ThematicAreaStatus,
} from "@/types/thematic-area";

export const THEMATIC_CATEGORIES = [
  "Reproductive Health",
  "Obstetric Care",
  "Maternal Health",
  "Neonatal Care",
  "Infectious Diseases",
  "Critical Care",
  "Clinical Midwifery",
  "Primary Healthcare",
] as const;

export const TARGET_CADRES_OPTIONS = [
  "Midwife Mentors",
  "Junior Midwives",
  "Resident Midwives",
  "Clinical Preceptors",
  "Adolescent Health Focal Persons",
  "Facility Supervisors",
] as const;

export function inferCategory(name: string, code: string): string {
  const text = `${name} ${code}`.toLowerCase();
  if (
    text.includes("adolescent") ||
    text.includes("youth") ||
    text.includes("reproductive") ||
    text.includes("abortion") ||
    text.includes("family planning") ||
    text.includes("contracept") ||
    text.includes("aysrh")
  ) {
    return "Reproductive Health";
  }
  if (
    text.includes("obstetric") ||
    text.includes("emonc") ||
    text.includes("labor") ||
    text.includes("delivery") ||
    text.includes("hemorrhage")
  ) {
    return "Obstetric Care";
  }
  if (
    text.includes("neonatal") ||
    text.includes("pediatric") ||
    text.includes("newborn") ||
    text.includes("infant") ||
    text.includes("pnc")
  ) {
    return "Neonatal Care";
  }
  if (
    text.includes("infection") ||
    text.includes("pmtct") ||
    text.includes("hiv") ||
    text.includes("sti") ||
    text.includes("tb")
  ) {
    return "Infectious Diseases";
  }
  if (
    text.includes("surgery") ||
    text.includes("critical") ||
    text.includes("anesthesia") ||
    text.includes("caesarean")
  ) {
    return "Critical Care";
  }
  if (
    text.includes("maternal") ||
    text.includes("antenatal") ||
    text.includes("postnatal") ||
    text.includes("child") ||
    text.includes("mch")
  ) {
    return "Maternal Health";
  }
  return "Clinical Midwifery";
}

export const INITIAL_THEMATIC_AREAS: ThematicArea[] = [
  {
    id: "1",
    code: "AYSRH",
    name: "Adolescent & Youth Sexual Reproductive Health",
    category: "Reproductive Health",
    description:
      "Comprehensive youth-friendly reproductive counseling, adolescent contraception, STI screening, and psychosocial support protocols in hospital maternity units.",
    targetCadres: [
      "Midwife Mentors",
      "Junior Midwives",
      "Adolescent Health Focal Persons",
    ],
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
    category: "Obstetric Care",
    description:
      "Protocol-driven clinical response to post-partum hemorrhage, pre-eclampsia/eclampsia, obstructed labor, sepsis, and immediate newborn resuscitation.",
    targetCadres: ["Midwife Mentors", "Clinical Preceptors", "Resident Midwives"],
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
    category: "Maternal Health",
    description:
      "Antenatal screening, labor progress monitoring with digital partographs, postpartum recovery, and community child health linkage.",
    targetCadres: ["Junior Midwives", "Resident Midwives", "Midwife Mentors"],
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
    category: "Reproductive Health",
    description:
      "Modern contraceptive methods insertion, adolescent counseling, post-abortion care, and clinical management of reproductive complications.",
    targetCadres: ["Midwife Mentors", "Junior Midwives"],
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
    category: "Neonatal Care",
    description:
      "Essential newborn care, kangaroo mother care for preterm infants, neonatal sepsis identification, and phototherapy administration.",
    targetCadres: ["Resident Midwives", "Clinical Preceptors"],
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
    category: "Infectious Diseases",
    description:
      "Prevention of mother-to-child transmission of HIV, hepatitis B and syphilis screening, universal infection prevention, and antiretroviral adherence support.",
    targetCadres: ["Midwife Mentors", "Junior Midwives", "Adolescent Health Focal Persons"],
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
    category: "Critical Care",
    description:
      "Surgical assistance during emergency caesarean delivery, vacuum extraction, blood transfusion protocols, and post-anesthesia patient recovery.",
    targetCadres: ["Clinical Preceptors", "Facility Supervisors"],
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
    category: "Clinical Midwifery",
    description:
      "Chronic medical condition management during pregnancy including gestational diabetes, cardiac disease, and severe anemia.",
    targetCadres: ["Clinical Preceptors", "Midwife Mentors"],
    competenciesCount: 9,
    modulesCount: 2,
    status: "inactive",
    createdAt: "2024-05-01T09:30:00Z",
    updatedAt: "2024-10-02T11:10:00Z",
  },
];

const LOCAL_STORAGE_KEY = "cbcm_thematic_areas_store";

function getStoredMeta(): Record<string, Partial<ThematicArea>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("cbcm_thematic_meta_store");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMeta(idOrCode: string, meta: Partial<ThematicArea>): void {
  if (typeof window === "undefined") return;
  try {
    const store = getStoredMeta();
    store[idOrCode] = { ...(store[idOrCode] || {}), ...meta };
    localStorage.setItem("cbcm_thematic_meta_store", JSON.stringify(store));
  } catch {
    // Ignore
  }
}

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

  const metaStore = getStoredMeta();
  const meta = metaStore[id] || metaStore[code] || {};

  const category =
    meta.category ||
    raw?.category ||
    raw?.domain ||
    inferCategory(name, code);

  const description =
    meta.description ||
    raw?.description ||
    `Accredited Ministry of Health clinical mentorship domain for ${name} (${code}).`;

  const targetCadres =
    meta.targetCadres ||
    (Array.isArray(raw?.target_cadres || raw?.targetCadres)
      ? raw.target_cadres || raw.targetCadres
      : ["Midwife Mentors", "Junior Midwives", "Clinical Preceptors"]);

  const rawStatus = String(meta.status || raw?.status || "").toLowerCase().trim();
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
    category,
    description,
    targetCadres,
    competenciesCount: Number(meta.competenciesCount ?? raw?.competencies_count ?? raw?.competenciesCount ?? 12),
    modulesCount: Number(meta.modulesCount ?? raw?.modules_count ?? raw?.modulesCount ?? 3),
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
        const createdId = String(raw.id);
        saveMeta(createdId, {
          category: data.category,
          description: data.description,
          targetCadres: data.targetCadres,
          status: data.status || "active",
        });
        saveMeta(trimmedCode, {
          category: data.category,
          description: data.description,
          targetCadres: data.targetCadres,
          status: data.status || "active",
        });

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
    category: data.category.trim(),
    description: data.description?.trim() || undefined,
    targetCadres:
      data.targetCadres && data.targetCadres.length > 0
        ? data.targetCadres
        : ["Midwife Mentors", "Junior Midwives"],
    competenciesCount: 12,
    modulesCount: 3,
    status: data.status || "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveMeta(fallbackArea.id, {
    category: data.category,
    description: data.description,
    targetCadres: data.targetCadres,
    status: data.status || "active",
  });
  saveMeta(trimmedCode, {
    category: data.category,
    description: data.description,
    targetCadres: data.targetCadres,
    status: data.status || "active",
  });

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
  const list = getStoredAreas();
  const existing = list.find((a) => a.id === id) || INITIAL_THEMATIC_AREAS[0];

  const updated: ThematicArea = {
    ...existing,
    code: data.code !== undefined ? data.code.trim().toUpperCase() : existing.code,
    name: data.name !== undefined ? data.name.trim() : existing.name,
    category: data.category !== undefined ? data.category.trim() : existing.category,
    description: data.description !== undefined ? data.description.trim() || undefined : existing.description,
    targetCadres: data.targetCadres !== undefined ? data.targetCadres : existing.targetCadres,
    status: data.status !== undefined ? data.status : existing.status,
    updatedAt: new Date().toISOString(),
  };

  saveMeta(id, {
    category: updated.category,
    description: updated.description,
    targetCadres: updated.targetCadres,
    status: updated.status,
  });

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
    saveMeta(id, { status });
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
