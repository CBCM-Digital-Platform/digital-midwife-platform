import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import { getMentors } from "@/services/users.service";
import type {
  LearningModule,
  ModuleContent,
  ModuleMentorAccess,
} from "@/types/learning";

/**
 * Normalizes raw API response into a typed LearningModule domain model.
 */
export function normalizeLearningModule(raw: any): LearningModule {
  if (!raw) return {} as LearningModule;

  const id = raw.id ?? raw._id ?? "";
  const title = String(raw.title || raw.name || "Untitled Module").trim();
  const description = String(raw.description || raw.summary || "").trim();

  // Resolve thematic area info
  let thematicAreaName = "General Midwifery";
  let thematicAreaId: string | number | undefined;

  if (raw.thematic_area) {
    if (typeof raw.thematic_area === "string") {
      thematicAreaName = raw.thematic_area;
    } else if (raw.thematic_area.name) {
      thematicAreaName = raw.thematic_area.name;
      thematicAreaId = raw.thematic_area.id;
    }
  } else if (raw.thematicArea) {
    if (typeof raw.thematicArea === "string") {
      thematicAreaName = raw.thematicArea;
    } else if (raw.thematicArea.name) {
      thematicAreaName = raw.thematicArea.name;
      thematicAreaId = raw.thematicArea.id;
    }
  } else if (raw.thematic_area_id || raw.thematicAreaId) {
    thematicAreaId = raw.thematic_area_id ?? raw.thematicAreaId;
    thematicAreaName = `Thematic Area #${thematicAreaId}`;
  }

  const rawStatus = String(raw.status || (raw.isPublished ? "published" : "draft")).toLowerCase();
  const status =
    rawStatus === "draft"
      ? "draft"
      : rawStatus === "archived"
      ? "archived"
      : "published";

  return {
    id,
    title,
    description,
    thematicAreaId,
    thematicAreaName,
    thematicArea: raw.thematic_area || raw.thematicArea || thematicAreaName,
    status,
    order: raw.order ?? raw.orderNumber ?? raw.sort_order ?? 1,
    contentsCount: raw.contents_count ?? (Array.isArray(raw.contents) ? raw.contents.length : undefined),
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
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt,
  };
}

/**
 * GET /api/v1/learning/modules
 * Fetches real clinical learning modules from the backend database.
 * The backend automatically filters results according to the authenticated user's role and access grants.
 */
export async function getModules(): Promise<LearningModule[]> {
  try {
    const res = await apiClient.get<any>(ENDPOINTS.LEARNING.BASE);
    const raw = res?.data?.modules || res?.data?.items || res?.data || res?.modules || res?.items || res;
    const list = Array.isArray(raw) ? raw : [];
    return list.map(normalizeLearningModule);
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
    const res = await apiClient.get<any>(ENDPOINTS.LEARNING.DETAIL(numericId));
    const raw = res?.data?.module || res?.data || res?.module || res;
    if (raw && (raw.id || raw.title)) {
      return normalizeLearningModule(raw);
    }
    return null;
  } catch (error: any) {
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
  try {
    const res = await apiClient.get<any>(ENDPOINTS.LEARNING.CONTENTS(numericModuleId));
    const raw = res?.data?.contents || res?.data?.items || res?.data || res?.contents || res?.items || res;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((item: any) => normalizeModuleContent(item, moduleId));
  } catch (error: any) {
    console.error(`Failed to fetch contents for module #${moduleId}:`, error?.message || error);
    return [];
  }
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

  // Exact OpenAPI Swagger schema: { "mentorId": <integer> }
  const res = await apiClient.post<any>(
    ENDPOINTS.LEARNING.MENTOR_ACCESS(numericModuleId),
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
    ENDPOINTS.LEARNING.MENTOR_ACCESS_REVOKE(numericModuleId, numericMentorId)
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
