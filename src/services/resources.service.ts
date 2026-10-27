import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import type {
  AdminResource,
  AdminResourceType,
  CreateResourceInput,
  UpdateResourceInput,
} from "@/types/resource";

const LOCAL_STORAGE_KEY = "cbcm_admin_resources_cache";

/**
 * Normalizes backend raw API object to a standard AdminResource.
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
 * GET /api/v1/resources
 * Fetches real clinical resources directly from the backend database.
 */
export async function getResources(): Promise<AdminResource[]> {
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

    if (rawList.length > 0) {
      const liveList = rawList.map((r: any) => normalizeAdminResource(r));

      // Merge with custom locally created items if in browser
      if (typeof window !== "undefined") {
        const stored = getStoredResources();
        const liveIds = new Set(liveList.map((l: AdminResource) => l.id));
        const localCustom = stored.filter(
          (s: AdminResource) => !liveIds.has(s.id)
        );
        return [...localCustom, ...liveList];
      }

      return liveList;
    }
  } catch (err: any) {
    console.warn("Failed to fetch resources from backend API:", err?.message || err);
  }

  // If in browser, return any resources created locally by the user
  if (typeof window !== "undefined") {
    return getStoredResources();
  }

  return [];
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
  };

  const isMock = await isMockUserSession();

  if (!isMock) {
    try {
      const res = await apiClient.post<any>(ENDPOINTS.RESOURCES.BASE, payload);
      const raw = res?.data || res;
      if (raw && (raw.id || raw.title)) {
        const created = normalizeAdminResource(raw);
        if (fileName && !created.fileName) created.fileName = fileName;
        if (fileSizeMb && !created.fileSizeMb) created.fileSizeMb = fileSizeMb;

        const stored = getStoredResources();
        saveStoredResources([created, ...stored.filter((r) => r.id !== created.id)]);
        return created;
      }
    } catch (err: any) {
      console.warn("Live backend resource creation error:", err?.message || err);
      throw err;
    }
  }

  // Local fallback if running in mock token session
  const createdResource: AdminResource = {
    id: `res-custom-${Date.now()}`,
    title: input.title.trim(),
    description: input.description?.trim() || "",
    type: input.type,
    url: input.url?.trim() || (input.file ? URL.createObjectURL(input.file) : undefined),
    fileId: fileId || (input.file ? `file-${Date.now()}` : undefined),
    fileName: fileName || (input.type === "document" ? `${input.title.replace(/\s+/g, "_")}.pdf` : undefined),
    fileSizeMb: fileSizeMb || (input.type === "document" ? 1.5 : undefined),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const stored = getStoredResources();
  saveStoredResources([createdResource, ...stored]);
  return createdResource;
}

/**
 * PATCH /api/v1/resources/{id}
 * Updates an existing resource in the backend database.
 */
export async function updateResource(
  id: string | number,
  input: UpdateResourceInput
): Promise<AdminResource> {
  let fileId = input.fileId;
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
      console.warn("Failed to upload file update to backend API:", uploadErr);
    }
  }

  const payload: Record<string, any> = {};
  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.description !== undefined) payload.description = input.description.trim() || null;
  if (input.type !== undefined) payload.type = input.type;
  if (input.url !== undefined) payload.url = input.url.trim() || null;
  if (fileId !== undefined) payload.file_id = fileId;

  const isMock = await isMockUserSession();
  const idStr = String(id);

  if (!isMock && !idStr.startsWith("res-custom-")) {
    try {
      const res = await apiClient.patch<any>(ENDPOINTS.RESOURCES.DETAIL(id), payload);
      const raw = res?.data || res;
      if (raw && (raw.id || raw.title)) {
        const updated = normalizeAdminResource(raw);
        const stored = getStoredResources();
        saveStoredResources(stored.map((r) => (r.id === idStr ? updated : r)));
        return updated;
      }
    } catch (err: any) {
      console.warn("Live backend resource patch error:", err?.message || err);
      throw err;
    }
  }

  const stored = getStoredResources();
  const existing = stored.find((r) => r.id === idStr);

  const updated: AdminResource = {
    id: idStr,
    title: input.title !== undefined ? input.title.trim() : (existing?.title || "Untitled Resource"),
    description: input.description !== undefined ? input.description.trim() : (existing?.description || ""),
    type: input.type !== undefined ? input.type : (existing?.type || "document"),
    url: input.url !== undefined ? input.url.trim() || undefined : existing?.url,
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
