import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import type {
  AdminResource,
  AdminResourceType,
  CreateResourceInput,
  UpdateResourceInput,
} from "@/types/resource";

const LOCAL_STORAGE_KEY = "cbcm_admin_resources_cache";
const LOCAL_ASSIGNMENTS_KEY = "cbcm_mentor_assigned_resources";

export interface StoredMentorAssignment {
  resourceId: string;
  mentorIds: string[];
  facilityId?: string;
  instructions?: string;
  assignedAt: string;
}

export function getStoredMentorAssignments(): StoredMentorAssignment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMentorResourceAssignment(assignment: StoredMentorAssignment): void {
  if (typeof window === "undefined") return;
  try {
    const stored = getStoredMentorAssignments();
    const updated = [
      assignment,
      ...stored.filter(
        (a) =>
          !(
            a.resourceId === assignment.resourceId &&
            a.mentorIds.some((m) => assignment.mentorIds.includes(m))
          )
      ),
    ];
    localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to store mentor assignment locally:", err);
  }
}

/**
 * Normalizes backend raw API object from /api/v1/resources to a standard AdminResource.
 */
export function normalizeAdminResource(raw: any): AdminResource {
  const id = String(raw?.id ?? raw?._id ?? "");
  const title = String(raw?.title || raw?.name || "Untitled Resource").trim();
  const description = String(raw?.description || raw?.summary || "").trim();

  // Normalize type to "document" | "video" | "link"
  const rawType = String(raw?.type || raw?.kind || "").toLowerCase().trim();
  let type: AdminResourceType = "document";
  if (rawType.includes("video")) {
    type = "video";
  } else if (rawType.includes("link") || rawType.includes("url")) {
    type = "link";
  } else {
    type = "document";
  }

  const fileId = raw?.file_id ?? raw?.fileId ?? raw?.file?.id;
  const fileName = raw?.file?.name || raw?.file_name || raw?.fileName;
  const sizeBytes = raw?.file?.sizeBytes ?? raw?.size_bytes;
  const fileSizeMb = sizeBytes
    ? Number((sizeBytes / (1024 * 1024)).toFixed(1))
    : raw?.sizeMb ?? undefined;

  let url = raw?.url || "";
  if (!url && fileId) {
    const baseUrl = (
      process.env.NEXT_PUBLIC_API_URL || "https://cbcm-backend-1.onrender.com/api/v1"
    ).replace(/\/+$/, "");
    url = `${baseUrl}/uploads/${fileId}/content`;
  }

  const createdAt = raw?.created_at || raw?.createdAt || new Date().toISOString();
  const updatedAt = raw?.updated_at || raw?.updatedAt || createdAt;

  return {
    id,
    title,
    description,
    type,
    url: url || undefined,
    fileId,
    fileName,
    fileSizeMb,
    thematicAreaId: raw?.thematic_area_id || raw?.thematicAreaId,
    thematicAreaName: raw?.thematicArea?.name || raw?.thematic_area_name,
    createdAt,
    updatedAt,
  };
}

/**
 * Normalizes backend raw API object from /api/v1/hierarchical-resources to a standard AdminResource.
 */
export function normalizeHierarchicalResource(raw: any): AdminResource {
  const id = String(raw?.id ?? raw?._id ?? "");
  const title = String(raw?.title || raw?.name || "Untitled Resource").trim();
  const description = String(raw?.description || "").trim();

  const rawType = String(raw?.type || "").toLowerCase().trim();
  let type: AdminResourceType = "document";
  if (rawType.includes("video")) {
    type = "video";
  } else if (rawType.includes("link") || rawType.includes("url")) {
    type = "link";
  } else {
    type = "document";
  }

  const baseUrl = (
    process.env.NEXT_PUBLIC_API_URL || "https://cbcm-backend-1.onrender.com/api/v1"
  ).replace(/\/+$/, "");
  const url = `${baseUrl}/hierarchical-resources/${id}/content`;

  const createdAt = raw?.created_at || raw?.createdAt || new Date().toISOString();
  const updatedAt = raw?.updated_at || raw?.updatedAt || createdAt;

  return {
    id,
    title,
    description,
    type,
    url,
    fileName: raw?.original_filename || raw?.originalFilename || raw?.fileName,
    createdAt,
    updatedAt,
  };
}

/**
 * Retrieves user-created resources from browser localStorage.
 * Strictly ignores any predefined mock data.
 */
export function getStoredResources(): AdminResource[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out dummy/mock items
    const dummyIds = new Set(["1", "2", "3", "4", "5", "6"]);
    return parsed.filter(
      (item: any) =>
        item &&
        typeof item.id === "string" &&
        !dummyIds.has(item.id) &&
        !item.id.match(/^res-[0-9]+$/)
    );
  } catch {
    return [];
  }
}

/**
 * Saves user-created resources to browser localStorage.
 */
export function saveStoredResources(resources: AdminResource[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(resources));
  } catch (err) {
    console.warn("Failed to persist resources locally:", err);
  }
}

/**
 * Helper to check whether the current user is in a mock session.
 */
async function isMockUserSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { getSession } = await import("next-auth/react");
    const session = await getSession();
    const token = (session as any)?.accessToken || (session as any)?.user?.accessToken;
    return !token || String(token).startsWith("mock-");
  } catch {
    return false;
  }
}

/**
 * GET /api/v1/resources & /api/v1/hierarchical-resources
 * Fetches real clinical resources directly from the backend database.
 */
export async function getResources(): Promise<AdminResource[]> {
  const mergedList: AdminResource[] = [];
  const seenIds = new Set<string>();

  // 1. Fetch standard resources
  try {
    const res = await apiClient.get<any>(`${ENDPOINTS.RESOURCES.BASE}?limit=100`);

    const rawList = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.resources)
      ? res.data.resources
      : Array.isArray(res?.data?.data)
      ? res.data.data
      : Array.isArray(res?.resources)
      ? res.resources
      : Array.isArray(res)
      ? res
      : [];

    for (const r of rawList) {
      const norm = normalizeAdminResource(r);
      if (norm.id && !seenIds.has(norm.id)) {
        seenIds.add(norm.id);
        mergedList.push(norm);
      }
    }
  } catch (err: any) {
    console.warn("Failed to fetch standard resources from backend API:", err?.message || err);
  }

  // 2. Fetch hierarchical resources
  try {
    const hierRes = await apiClient.get<any>(
      `${ENDPOINTS.HIERARCHICAL_RESOURCES.BASE}?limit=100`
    ).catch(() => null);

    const hierList = Array.isArray(hierRes?.data)
      ? hierRes.data
      : Array.isArray(hierRes?.data?.resources)
      ? hierRes.data.resources
      : Array.isArray(hierRes)
      ? hierRes
      : [];

    for (const r of hierList) {
      const norm = normalizeHierarchicalResource(r);
      if (norm.id && !seenIds.has(norm.id)) {
        seenIds.add(norm.id);
        mergedList.push(norm);
      }
    }
  } catch (err: any) {
    console.warn("Failed to fetch hierarchical resources from backend API:", err?.message || err);
  }

  // If in browser, merge with custom locally created items
  if (typeof window !== "undefined") {
    const stored = getStoredResources();
    const localCustom = stored.filter(
      (s: AdminResource) => !seenIds.has(s.id)
    );
    return [...localCustom, ...mergedList];
  }

  return mergedList;
}

/**
 * POST /api/v1/resources
 * Creates a resource in the backend database.
 */
export async function createResource(
  input: CreateResourceInput
): Promise<AdminResource> {
  let fileId: number | string | undefined = input.fileId;
  let fileName: string | undefined = undefined;
  let fileSizeMb: number | undefined = undefined;

  // Handle file upload if a File instance is provided
  if (input.file) {
    fileName = input.file.name;
    fileSizeMb = Number((input.file.size / (1024 * 1024)).toFixed(1));

    try {
      const formData = new FormData();
      formData.append("file", input.file);
      formData.append("context", "resource");

      const uploadRes = await apiClient.post<any>(ENDPOINTS.UPLOADS.BASE, formData);
      const uploaded = uploadRes?.data ?? uploadRes;
      if (uploaded?.id) {
        fileId = uploaded.id;
      }
    } catch (uploadErr) {
      console.warn("Failed to upload file to backend API:", uploadErr);
    }
  }

  const payload = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    type: input.type,
    file_id: fileId || null,
    url: input.url?.trim() || null,
    thematic_area_id: input.thematicAreaId || null,
  };

  const isMock = await isMockUserSession();

  if (!isMock) {
    try {
      const res = await apiClient.post<any>(ENDPOINTS.RESOURCES.BASE, payload);
      const created = res?.data ?? res;
      if (created?.id) {
        return normalizeAdminResource(created);
      }
    } catch (err: any) {
      console.warn("Live backend resource create failed, persisting locally:", err?.message || err);
    }
  }

  // Fallback local persistence
  const newResource: AdminResource = {
    id: `res-custom-${Date.now()}`,
    title: input.title.trim(),
    description: input.description?.trim() || "",
    type: input.type,
    url: input.url?.trim(),
    fileId,
    fileName,
    fileSizeMb,
    thematicAreaId: input.thematicAreaId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const stored = getStoredResources();
  saveStoredResources([newResource, ...stored]);
  return newResource;
}

/**
 * PATCH /api/v1/resources/{id}
 * Updates a resource in the backend database.
 */
export async function updateResource(
  id: string | number,
  input: UpdateResourceInput
): Promise<AdminResource> {
  const idStr = String(id);
  let fileId: number | string | undefined = input.fileId;
  let fileName: string | undefined = undefined;
  let fileSizeMb: number | undefined = undefined;

  if (input.file) {
    fileName = input.file.name;
    fileSizeMb = Number((input.file.size / (1024 * 1024)).toFixed(1));

    try {
      const formData = new FormData();
      formData.append("file", input.file);
      formData.append("context", "resource");

      const uploadRes = await apiClient.post<any>(ENDPOINTS.UPLOADS.BASE, formData);
      const uploaded = uploadRes?.data ?? uploadRes;
      if (uploaded?.id) {
        fileId = uploaded.id;
      }
    } catch (uploadErr) {
      console.warn("Failed to upload updated file to backend API:", uploadErr);
    }
  }

  const payload: Record<string, any> = {};
  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.description !== undefined) payload.description = input.description?.trim() || null;
  if (input.type !== undefined) payload.type = input.type;
  if (fileId !== undefined) payload.file_id = fileId;
  if (input.url !== undefined) payload.url = input.url?.trim() || null;
  if (input.thematicAreaId !== undefined) payload.thematic_area_id = input.thematicAreaId;

  const isMock = await isMockUserSession();

  if (!isMock && !idStr.startsWith("res-custom-")) {
    try {
      const res = await apiClient.patch<any>(ENDPOINTS.RESOURCES.DETAIL(id), payload);
      const updated = res?.data ?? res;
      if (updated?.id) {
        return normalizeAdminResource(updated);
      }
    } catch (err: any) {
      console.warn("Live backend resource update error:", err?.message || err);
      throw err;
    }
  }

  // Fallback local update
  const stored = getStoredResources();
  const existing = stored.find((r) => r.id === idStr);

  const updated: AdminResource = {
    id: idStr,
    title: input.title !== undefined ? input.title.trim() : existing?.title || "",
    description: input.description !== undefined ? (input.description?.trim() || "") : (existing?.description || ""),
    type: input.type !== undefined ? input.type : existing?.type || "document",
    url: input.url !== undefined ? input.url?.trim() : existing?.url,
    fileId: fileId !== undefined ? fileId : existing?.fileId,
    fileName: fileName || existing?.fileName,
    fileSizeMb: fileSizeMb || existing?.fileSizeMb,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveStoredResources(stored.map((r) => (r.id === idStr ? updated : r)));
  return updated;
}

/**
 * DELETE /api/v1/resources/{id}
 * Deletes a resource from the backend database.
 */
export async function deleteResource(
  id: string | number
): Promise<{ success: boolean; message?: string }> {
  const idStr = String(id);
  const isMock = await isMockUserSession();

  if (!isMock && !idStr.startsWith("res-custom-")) {
    try {
      await apiClient.delete<any>(ENDPOINTS.RESOURCES.DETAIL(id));
    } catch (err: any) {
      console.warn("Live backend resource delete error:", err?.message || err);
      throw err;
    }
  }

  const stored = getStoredResources();
  saveStoredResources(stored.filter((r) => r.id !== idStr));
  return { success: true };
}

/**
 * POST /api/v1/hierarchical-resources/{id}/grant-mentor
 * Grants/assigns a clinical resource to mentors (Facility Admin action).
 */
export async function assignResourceToMentor(
  resourceId: string | number,
  mentorIds: (string | number)[],
  facilityId?: string | number,
  instructions?: string
): Promise<{ success: boolean; data?: any }> {
  const numericMentorIds = mentorIds
    .map((id) => (isNaN(Number(id)) ? id : Number(id)))
    .filter((id) => id !== undefined && id !== null && id !== "");
  const numericResourceId = isNaN(Number(resourceId)) ? resourceId : Number(resourceId);

  // Single clean mutation request - fail immediately on error without aggressive cascading retries
  try {
    const res = await apiClient.post<any>(
      ENDPOINTS.HIERARCHICAL_RESOURCES.GRANT_MENTOR(numericResourceId),
      { mentor_ids: numericMentorIds }
    );

    // Save assignment locally for client-side cohort tracking
    saveMentorResourceAssignment({
      resourceId: String(resourceId),
      mentorIds: mentorIds.map(String),
      facilityId: String(facilityId || "1"),
      instructions,
      assignedAt: new Date().toISOString(),
    });

    return { success: true, data: res?.data || res };
  } catch (err: any) {
    console.warn("Resource assignment failed on server:", err?.message || err);
    // Fail immediately and gracefully without aggressive retries or cascading fallback loops
    throw err;
  }
}

export async function assignResourceToMentee(
  resourceId: string | number,
  menteeIds: (string | number)[]
): Promise<{ success: boolean; data?: any }> {
  const numericMenteeIds = menteeIds.map((id) => (isNaN(Number(id)) ? id : Number(id)));

  try {
    const res = await apiClient.post<any>(
      ENDPOINTS.HIERARCHICAL_RESOURCES.ASSIGN_MENTEE(resourceId),
      { mentee_ids: numericMenteeIds }
    );
    return { success: true, data: res?.data || res };
  } catch (err: any) {
    try {
      const fallbackRes = await apiClient.post<any>(
        `/api/v1/resources/${resourceId}/assign-mentee`,
        { mentee_ids: numericMenteeIds }
      );
      return { success: true, data: fallbackRes?.data || fallbackRes };
    } catch {
      console.warn("Mentee resource assignment failed on live endpoints:", err?.message || err);
      throw err;
    }
  }
}

/**
 * POST /api/v1/hierarchical-resources/{id}
 * Grants resource access to facilities (Super Admin action).
 */
export async function grantResourceToFacilities(
  resourceId: string | number,
  facilityIds: (string | number)[]
): Promise<{ success: boolean; data?: any }> {
  const numericFacilityIds = facilityIds.map((id) => (isNaN(Number(id)) ? id : Number(id)));

  try {
    const res = await apiClient.post<any>(
      ENDPOINTS.HIERARCHICAL_RESOURCES.GRANT_FACILITIES(resourceId),
      { facility_ids: numericFacilityIds }
    );
    return { success: true, data: res?.data || res };
  } catch (err: any) {
    console.warn("Facility resource grant failed:", err?.message || err);
    throw err;
  }
}
