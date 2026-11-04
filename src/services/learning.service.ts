import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import { getMentors } from "@/services/users.service";
import {
  getThematicAreas,
  INITIAL_THEMATIC_AREAS,
} from "@/services/thematic-areas.service";
import type {
  LearningModule,
  ModuleContent,
  ModuleMentorAccess,
} from "@/types/learning";

let cachedThematicAreaMap: Map<string, string> | null = null;

/**
 * Returns a fast lookup map for resolving thematic area IDs and codes to actual clinical titles.
 */
export async function getThematicAreaNameMap(): Promise<Map<string, string>> {
  if (cachedThematicAreaMap && cachedThematicAreaMap.size > 0) {
    return cachedThematicAreaMap;
  }

  const map = new Map<string, string>();

  // 1. Seed from known MOH clinical thematic framework
  INITIAL_THEMATIC_AREAS.forEach((ta) => {
    map.set(String(ta.id), ta.name);
    if (ta.code) {
      map.set(ta.code.toLowerCase(), ta.name);
    }
  });

  // 2. Fetch and overlay live backend thematic areas
  try {
    const list = await getThematicAreas();
    if (Array.isArray(list)) {
      list.forEach((ta) => {
        if (ta.id) map.set(String(ta.id), ta.name);
        if (ta.code) map.set(ta.code.toLowerCase(), ta.name);
      });
    }
  } catch {
    // Retain initial seeded map
  }

  cachedThematicAreaMap = map;
  return map;
}

/**
 * Resolves a thematic area ID or placeholder into its official clinical title.
 */
export function resolveThematicAreaTitle(
  id?: string | number,
  rawName?: string,
  map?: Map<string, string>
): string {
  const idStr = id !== undefined && id !== null ? String(id).trim() : "";

  // 1. If we have a thematicAreaId, check the map / cache
  if (idStr) {
    const fromMap = map?.get(idStr) || cachedThematicAreaMap?.get(idStr);
    if (fromMap) return fromMap;

    const fromInitial = INITIAL_THEMATIC_AREAS.find(
      (a) => String(a.id) === idStr || a.code.toLowerCase() === idStr.toLowerCase()
    );
    if (fromInitial) return fromInitial.name;
  }

  // 2. If rawName is already a descriptive title, return it directly
  if (
    rawName &&
    !rawName.startsWith("Thematic Area #") &&
    isNaN(Number(rawName)) &&
    rawName !== "General Midwifery" &&
    rawName.trim() !== ""
  ) {
    return rawName.trim();
  }

  // 3. If rawName was formatted like "Thematic Area #1", extract ID and resolve
  if (rawName && rawName.startsWith("Thematic Area #")) {
    const extractedId = rawName.replace("Thematic Area #", "").trim();
    const fromMap = map?.get(extractedId) || cachedThematicAreaMap?.get(extractedId);
    if (fromMap) return fromMap;

    const fromInitial = INITIAL_THEMATIC_AREAS.find(
      (a) => String(a.id) === extractedId
    );
    if (fromInitial) return fromInitial.name;
  }

  // 4. Fallback if ID is present but unmapped
  if (idStr) {
    return `Thematic Area #${idStr}`;
  }

  return rawName || "General Midwifery";
}

/**
 * Normalizes raw API response into a typed LearningModule domain model.
 */
export function normalizeLearningModule(
  raw: any,
  areaMap?: Map<string, string>
): LearningModule {
  if (!raw) return {} as LearningModule;

  const id = raw.id ?? raw._id ?? "";
  const title = String(raw.title || raw.name || "Untitled Module").trim();
  const description = String(raw.description || raw.summary || "").trim();

  // Resolve thematic area ID
  let thematicAreaId: string | number | undefined =
    raw.thematic_area_id ??
    raw.thematicAreaId ??
    (typeof raw.thematic_area === "object" ? raw.thematic_area?.id : undefined) ??
    (typeof raw.thematicArea === "object" ? raw.thematicArea?.id : undefined);

  // Resolve raw name string if provided by backend
  let rawName: string | undefined;
  if (typeof raw.thematic_area === "string") {
    rawName = raw.thematic_area;
  } else if (raw.thematic_area?.name) {
    rawName = raw.thematic_area.name;
  } else if (typeof raw.thematicArea === "string") {
    rawName = raw.thematicArea;
  } else if (raw.thematicArea?.name) {
    rawName = raw.thematicArea.name;
  } else if (raw.thematic_area_name || raw.thematicAreaName) {
    rawName = raw.thematic_area_name || raw.thematicAreaName;
  }

  // Derive the human-readable clinical title
  const thematicAreaName = resolveThematicAreaTitle(thematicAreaId, rawName, areaMap);

  const rawStatus = String(raw.status || (raw.isPublished ? "published" : "draft")).toLowerCase();
  const status =
    rawStatus === "draft"
      ? "draft"
      : rawStatus === "archived"
      ? "archived"
      : "published";

  const rawContents = Array.isArray(raw.contents) ? raw.contents : [];
  const contents = rawContents.length > 0
    ? rawContents.map((c: any) => normalizeModuleContent(c, id))
    : undefined;

  return {
    id,
    title,
    description,
    thematicAreaId,
    thematicAreaName,
    thematicArea: raw.thematic_area || raw.thematicArea || thematicAreaName,
    status,
    isPublished: raw.isPublished ?? (status === "published"),
    isAuthorized: raw.isAuthorized ?? (status === "published"),
    order: raw.order ?? raw.orderNumber ?? raw.sort_order ?? 1,
    contentsCount: raw.contents_count ?? (contents ? contents.length : undefined),
    contents,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt || new Date().toISOString(),
  };
}

/**
 * Normalizes raw API response into a typed ModuleContent.
 */
export function normalizeModuleContent(
  raw: any,
  fallbackModuleId?: string | number
): ModuleContent {
  if (!raw) return {} as ModuleContent;

  const id = raw.id ?? raw._id ?? `content-${Date.now()}`;
  const moduleId = raw.module_id ?? raw.moduleId ?? fallbackModuleId ?? "";
  const title = String(raw.title || raw.name || "Untitled Resource").trim();
  const description = raw.description ? String(raw.description).trim() : undefined;

  const rawType = String(raw.type || raw.kind || "document").toLowerCase();
  let type: ModuleContent["type"] = "document";
  if (rawType.includes("video") || rawType.includes("mp4")) {
    type = "video";
  } else if (rawType.includes("link") || rawType.includes("url")) {
    type = "link";
  } else if (rawType.includes("doc") || rawType.includes("pdf") || rawType.includes("guideline")) {
    type = "document";
  } else {
    type = "file";
  }

  const url = raw.url || raw.link || raw.file_url || raw.download_url || "#";
  const fileName = raw.file_name || raw.fileName || raw.filename || undefined;
  const fileSizeMb = raw.file_size_mb || raw.size_mb || (raw.file_size ? raw.file_size / (1024 * 1024) : undefined);

  return {
    id,
    moduleId,
    title,
    description,
    type,
    url,
    fileId: raw.file_id || raw.fileId,
    fileName,
    fileSizeMb: fileSizeMb ? Number(fileSizeMb.toFixed(2)) : undefined,
    durationLabel: raw.duration || raw.duration_label || undefined,
    order: raw.order ?? raw.orderNumber ?? raw.sort_order ?? 1,
    isRequired: Boolean(raw.is_required ?? raw.isRequired ?? false),
    isPublished: raw.isPublished ?? raw.is_published ?? true,
    isAuthorized: raw.isAuthorized ?? raw.is_authorized ?? true,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt,
  };
}

/**
 * GET /api/v1/learning/modules
 * Fetches real clinical learning modules from the backend database.
 * The backend automatically filters results according to the authenticated user's role and access grants.
 */
export interface GetModulesFilters {
  status?: string;
  thematicAreaId?: number;
  publishedOnly?: boolean;
  authorizedOnly?: boolean;
}

/**
 * GET /api/v1/learning/modules
 * Supports live Swagger filters: status, thematicAreaId, publishedOnly, authorizedOnly.
 */
export async function getModules(filters?: GetModulesFilters): Promise<LearningModule[]> {
  try {
    const params: Record<string, any> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.thematicAreaId) params.thematicAreaId = filters.thematicAreaId;
    if (filters?.publishedOnly !== undefined) params.publishedOnly = filters.publishedOnly;
    if (filters?.authorizedOnly !== undefined) params.authorizedOnly = filters.authorizedOnly;

    const [res, areaMap] = await Promise.all([
      apiClient.get<any>(ENDPOINTS.LEARNING.BASE, { params }),
      getThematicAreaNameMap().catch(() => new Map<string, string>()),
    ]);
    const raw = res?.data?.modules || res?.data?.items || res?.data || res?.modules || res?.items || res;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((m) => normalizeLearningModule(m, areaMap));
  } catch (error: any) {
    console.error("Failed to fetch learning modules from live API:", error?.message || error);
    return [];
  }
}

/**
 * GET /api/v1/learning/modules/{id}
 * Fetches details for a single learning module by ID directly from backend.
 */
export async function getModuleDetails(id: string | number): Promise<LearningModule | null> {
  const numericId = parsePositiveInt(id) ?? id;
  try {
    const [res, areaMap] = await Promise.all([
      apiClient.get<any>(ENDPOINTS.LEARNING.DETAIL(numericId)),
      getThematicAreaNameMap().catch(() => new Map<string, string>()),
    ]);
    const raw = res?.data?.module || res?.data || res?.module || res;
    if (raw && (raw.id || raw.title)) {
      return normalizeLearningModule(raw, areaMap);
    }
    return null;
  } catch (error: any) {
    const status = error?.response?.status || error?.status;
    const msg = String(error?.response?.data?.message || error?.message || "");

    // Gracefully handle expected RBAC facility boundary (403 Forbidden)
    if (status === 403 || msg.toLowerCase().includes("permission")) {
      // If user is an enrolled mentee, try mentee enrolled module endpoint
      try {
        const myModRes = await apiClient.get<any>(ENDPOINTS.LEARNING.MY_MODULE_DETAIL(numericId));
        const rawMyMod = myModRes?.data?.module || myModRes?.data || myModRes?.module || myModRes;
        if (rawMyMod && (rawMyMod.id || rawMyMod.title)) {
          const areaMap = await getThematicAreaNameMap().catch(() => new Map<string, string>());
          return normalizeLearningModule(rawMyMod, areaMap);
        }
      } catch {
        // Fall through to facility restricted placeholder
      }

      console.warn(`Learning module #${id} is restricted to its designated facility: ${msg}`);
      return {
        id: numericId,
        title: `Module #${id} (Restricted)`,
        description: "This learning module is restricted to preceptors and administrators of its designated facility.",
        status: "published",
        isPublished: true,
        isAuthorized: true,
        thematicAreaName: "Facility Restricted",
        isAccessRestricted: true,
      };
    }

    console.error(`Failed to fetch learning module details #${id}:`, error?.message || error);
    return null;
  }
}

/**
 * GET /api/v1/learning/modules/{moduleId}/contents
 * Fetches the materials/contents attached to a specific module.
 */
export async function getModuleContents(moduleId: string | number): Promise<ModuleContent[]> {
  const numericModuleId = parsePositiveInt(moduleId) ?? moduleId;
  const collectedContents: ModuleContent[] = [];
  const seenKeys = new Set<string>();

  // 1. Fetch from /api/v1/learning/modules/{moduleId}/contents
  try {
    const res = await apiClient.get<any>(ENDPOINTS.LEARNING.CONTENTS(numericModuleId));
    const raw = res?.data?.contents || res?.data?.items || res?.data || res?.contents || res?.items || res;
    const list = Array.isArray(raw) ? raw : [];
    for (const item of list) {
      const normalized = normalizeModuleContent(item, moduleId);
      const key = String(normalized.id || normalized.title).toLowerCase().trim();
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        collectedContents.push(normalized);
      }
    }
  } catch (error: any) {
    console.warn(`Failed to fetch /contents for module #${moduleId}:`, error?.message || error);
  }

  // 2. Mentee individually assigned resources check: /api/v1/learning/my/resources
  try {
    const myRes = await apiClient.get<any>(ENDPOINTS.LEARNING.MY_RESOURCES);
    const rawMy = myRes?.data?.data || myRes?.data?.items || myRes?.data || myRes?.items || myRes;
    const myList = Array.isArray(rawMy) ? rawMy : [];
    for (const item of myList) {
      const itemModuleId = item.module_id || item.moduleId || item.module?.id || item.resource?.module_id;
      if (!itemModuleId || String(itemModuleId) === String(numericModuleId)) {
        const rawContent = item.resource || item;
        const normalized = normalizeModuleContent(rawContent, moduleId);
        const key = String(normalized.id || normalized.title).toLowerCase().trim();
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          collectedContents.push(normalized);
        }
      }
    }
  } catch {
    // Optional for non-mentees
  }

  // 3. Supplementary check on /api/v1/resources?module_id={moduleId}
  try {
    const resRes = await apiClient.get<any>(ENDPOINTS.LEARNING.RESOURCES_BY_MODULE(numericModuleId));
    const rawRes = resRes?.data?.data || resRes?.data?.items || resRes?.data || resRes?.items || resRes;
    const resList = Array.isArray(rawRes) ? rawRes : [];
    for (const item of resList) {
      const normalized = normalizeModuleContent(item, moduleId);
      const key = String(normalized.id || normalized.title).toLowerCase().trim();
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        collectedContents.push(normalized);
      }
    }
  } catch (resErr: any) {
    // Optional fallback
  }

  // 4. Local client hydration check (runs in browser when mentor assigned or cached)
  if (typeof window !== "undefined") {
    try {
      // Check cached module contents
      const modCachedRaw =
        localStorage.getItem(`cbcm_module_contents_${moduleId}`) ||
        localStorage.getItem(`cbcm_module_contents_${numericModuleId}`);
      if (modCachedRaw) {
        const modCached = JSON.parse(modCachedRaw);
        if (Array.isArray(modCached)) {
          for (const item of modCached) {
            const normalized = normalizeModuleContent(item, moduleId);
            const key = String(normalized.id || normalized.title).toLowerCase().trim();
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              collectedContents.push(normalized);
            }
          }
        }
      }

      // Check preceptor resource assignments
      const assignRaw = localStorage.getItem("cbcm_mentee_resource_assignments");
      if (assignRaw) {
        const assignments = JSON.parse(assignRaw);
        if (Array.isArray(assignments)) {
          for (const entry of assignments) {
            if (
              !entry.moduleId ||
              String(entry.moduleId) === String(moduleId) ||
              String(entry.moduleId) === String(numericModuleId)
            ) {
              if (entry.resource) {
                const normalized = normalizeModuleContent(entry.resource, moduleId);
                const key = String(normalized.id || normalized.title).toLowerCase().trim();
                if (!seenKeys.has(key)) {
                  seenKeys.add(key);
                  collectedContents.push(normalized);
                }
              }
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return collectedContents;
}

/**
 * Parses positive integers safely from number, string numeric, or prefixed strings ("usr-1", "mentor-3").
 */
export function parsePositiveInt(val: any): number | null {
  if (typeof val === "number" && !isNaN(val) && val > 0) {
    return Math.floor(val);
  }
  const str = String(val || "").trim();
  const directNum = Number(str);
  if (!isNaN(directNum) && directNum > 0) {
    return Math.floor(directNum);
  }
  const match = str.match(/\d+/);
  if (match) {
    const extracted = parseInt(match[0], 10);
    if (!isNaN(extracted) && extracted > 0) {
      return extracted;
    }
  }
  return null;
}

/**
 * POST /api/v1/learning/modules/{moduleId}/mentor-access
 * Grants a preceptor/mentor access to a specific learning module on the backend.
 * Conforms strictly to OpenAPI schema: { "mentorId": <integer, minimum: 1> }
 * Automatically authorizes and publishes the module on the backend if required.
 */
/**
 * POST /api/v1/learning/modules/{moduleId}/mentor-permissions
 * Live Swagger schema: { "mentorId": <integer, minimum: 1> }
 * Available only to the Facility Admin responsible for the module's facility.
 */
export async function grantMentorAccess(
  moduleId: string | number,
  mentorId: string | number
): Promise<{ success: boolean; message?: string }> {
  const numericModuleId = parsePositiveInt(moduleId);
  const numericMentorId = parsePositiveInt(mentorId);

  if (!numericModuleId || !numericMentorId) {
    throw new Error(`Invalid module ID (${moduleId}) or mentor ID (${mentorId}). Both must be valid positive numbers.`);
  }

  // Calls live Swagger endpoint: POST /api/v1/learning/modules/{moduleId}/mentor-permissions
  const res = await apiClient.post<any>(
    ENDPOINTS.LEARNING.MENTOR_PERMISSIONS(numericModuleId),
    {
      mentorId: numericMentorId,
    }
  );

  return {
    success: true,
    message: res?.message || "Preceptor access granted successfully on the server.",
  };
}

/**
 * DELETE /api/v1/learning/modules/{moduleId}/mentor-access/{mentorId}
 * Revokes a preceptor/mentor's access to a specific learning module on the backend.
 */
/**
 * DELETE /api/v1/learning/modules/{moduleId}/mentor-permissions/{mentorId}
 * Live Swagger endpoint: Revokes a mentor's module access.
 */
export async function revokeMentorAccess(
  moduleId: string | number,
  mentorId: string | number
): Promise<{ success: boolean; message?: string }> {
  const numericModuleId = parsePositiveInt(moduleId);
  const numericMentorId = parsePositiveInt(mentorId);

  if (!numericModuleId || !numericMentorId) {
    throw new Error(`Invalid module ID (${moduleId}) or mentor ID (${mentorId}). Both must be valid positive numbers.`);
  }

  const res = await apiClient.delete<any>(
    ENDPOINTS.LEARNING.MENTOR_PERMISSIONS_REVOKE(numericModuleId, numericMentorId)
  );

  return {
    success: true,
    message: res?.message || "Preceptor access revoked successfully on the server.",
  };
}

/**
 * GET /api/v1/learning/modules/{moduleId}/mentor-access
 * Fetches real mentors and their live authorized access state for this module.
 */
export async function getModuleMentorAccessList(
  moduleId: string | number
): Promise<ModuleMentorAccess[]> {
  try {
    // 1. Fetch real mentors from backend
    const mentors = await getMentors();
    if (!mentors || mentors.length === 0) {
      return [];
    }

    // 2. Fetch authorized mentors for this module from live backend
    const grantedMentorIds = new Set<string>();
    const numericModuleId = parsePositiveInt(moduleId);

    if (numericModuleId) {
      try {
        const res = await apiClient.get<any>(
          ENDPOINTS.LEARNING.MENTOR_ACCESS(numericModuleId)
        );
        const rawList = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.items)
          ? res.data.items
          : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res)
          ? res
          : [];

        rawList.forEach((g: any) => {
          const mId = g.mentorId ?? g.mentor_id ?? g.mentor?.id ?? g.userId;
          if (mId !== undefined && mId !== null && String(mId).trim() !== "") {
            grantedMentorIds.add(String(mId));
          }
        });
      } catch (accessErr: any) {
        console.warn(`Could not load live mentor access list for module #${moduleId}:`, accessErr?.message || accessErr);
      }
    }

    // 3. Map mentors with their backend authorization status
    return mentors.map((m) => {
      const idStr = String(m.id);
      return {
        mentorId: m.id,
        mentorName: m.name,
        email: m.email || "",
        phone: m.phone,
        facility: m.facility,
        facilityId: m.facilityId,
        specialty: m.thematicArea || "Clinical Midwifery",
        hasAccess: grantedMentorIds.has(idStr),
      };
    });
  } catch (error: any) {
    console.error(`Failed to load mentor access list for module #${moduleId}:`, error?.message || error);
    return [];
  }
}

export { createModule, addContent } from "@/services/super-admin.service";
export type { CreateModulePayload, AddContentPayload } from "@/services/super-admin.service";

/**
 * POST /api/v1/learning/modules/{moduleId}/resources/{resourceId}/assignments
 * Live Swagger schema: { "mentee_id": <integer, minimum: 1> }
 * Assigns one resource from this published module to an actively assigned mentee.
 */
export async function assignModuleResourceToMentee(
  moduleId: string | number,
  resourceId: string | number,
  menteeId: string | number
): Promise<{ success: boolean; data?: any }> {
  const numericModuleId = parsePositiveInt(moduleId);
  const numericResourceId = parsePositiveInt(resourceId);
  const numericMenteeId = parsePositiveInt(menteeId);

  if (!numericModuleId || !numericResourceId || !numericMenteeId) {
    throw new Error("moduleId, resourceId, and menteeId must all be valid positive numbers.");
  }

  const res = await apiClient.post<any>(
    ENDPOINTS.LEARNING.RESOURCE_ASSIGNMENT(numericModuleId, numericResourceId),
    {
      mentee_id: numericMenteeId,
    }
  );

  return { success: true, data: res?.data || res };
}

/**
 * POST /api/v1/learning/resource-assignments/{assignmentId}/revoke
 * Live Swagger endpoint to revoke an individual resource assignment.
 */
export async function revokeResourceAssignment(
  assignmentId: string | number
): Promise<{ success: boolean; message?: string }> {
  const numericId = parsePositiveInt(assignmentId);
  if (!numericId) {
    throw new Error("Invalid assignment ID");
  }

  const res = await apiClient.post<any>(
    ENDPOINTS.LEARNING.REVOKE_RESOURCE_ASSIGNMENT(numericId)
  );

  return { success: true, message: res?.message || "Resource assignment revoked." };
}
