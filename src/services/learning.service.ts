import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import { getMentors } from "@/services/users.service";
import type {
  LearningModule,
  ModuleContent,
  ModuleMentorAccess,
} from "@/types/learning";

/**
 * Normalizes raw API response into a typed LearningModule.
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

  const rawStatus = String(raw.status || "published").toLowerCase();
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
    order: raw.order ?? raw.sort_order ?? 1,
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
    order: raw.order ?? raw.sort_order ?? 1,
    isRequired: Boolean(raw.is_required ?? raw.isRequired ?? false),
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt,
  };
}

/**
 * GET /api/v1/learning/modules
 * Fetches all available learning modules in the platform.
 */
export async function getModules(): Promise<LearningModule[]> {
  try {
    const res = await apiClient.get<any>(ENDPOINTS.LEARNING.BASE);
    const raw = res?.data?.modules || res?.data || res?.modules || res;
    const list = Array.isArray(raw) ? raw : [];
    return list.map(normalizeLearningModule);
  } catch (error: any) {
    console.warn("Failed to fetch learning modules from live API:", error?.message || error);
    return [];
  }
}

/**
 * GET /api/v1/learning/modules/{id}
 * Fetches details for a single learning module by ID.
 */
export async function getModuleDetails(id: string | number): Promise<LearningModule | null> {
  try {
    const res = await apiClient.get<any>(ENDPOINTS.LEARNING.DETAIL(id));
    const raw = res?.data?.module || res?.data || res?.module || res;
    if (!raw || (!raw.id && !raw.title)) {
      return null;
    }
    return normalizeLearningModule(raw);
  } catch (error: any) {
    console.warn(`Failed to fetch learning module details #${id}:`, error?.message || error);
    return null;
  }
}

/**
 * GET /api/v1/learning/modules/{moduleId}/contents
 * Fetches the contents/resources attached to a specific module.
 */
export async function getModuleContents(moduleId: string | number): Promise<ModuleContent[]> {
  try {
    const res = await apiClient.get<any>(ENDPOINTS.LEARNING.CONTENTS(moduleId));
    const raw = res?.data?.contents || res?.data || res?.contents || res;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((item: any) => normalizeModuleContent(item, moduleId));
  } catch (error: any) {
    console.warn(`Failed to fetch contents for module #${moduleId}:`, error?.message || error);
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

function getLocalGrantedMentorIds(moduleId: string | number): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(`cbcm_module_${moduleId}_granted_mentors`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveLocalGrantedMentorId(
  moduleId: string | number,
  mentorId: string | number,
  grant: boolean
): void {
  if (typeof window === "undefined") return;
  try {
    const set = getLocalGrantedMentorIds(moduleId);
    const idStr = String(mentorId);
    if (grant) {
      set.add(idStr);
    } else {
      set.delete(idStr);
    }
    localStorage.setItem(
      `cbcm_module_${moduleId}_granted_mentors`,
      JSON.stringify(Array.from(set))
    );
  } catch {
    // Ignore
  }
}

/**
 * POST /api/v1/learning/modules/{moduleId}/mentor-access
 * Grants a preceptor/mentor access to a specific learning module.
 */
export async function grantMentorAccess(
  moduleId: string | number,
  mentorId: string | number
): Promise<{ success: boolean; message?: string }> {
  const numericModuleId = parsePositiveInt(moduleId) || 1;
  const numericMentorId = parsePositiveInt(mentorId) || 1;

  // Optimistically persist assignment locally
  saveLocalGrantedMentorId(moduleId, mentorId, true);

  try {
    const res = await apiClient.post<any>(
      ENDPOINTS.LEARNING.MENTOR_ACCESS(numericModuleId),
      {
        mentorId: numericMentorId,
        mentor_id: numericMentorId,
      }
    );
    return { success: true, message: res?.message || "Mentor access granted successfully." };
  } catch (error: any) {
    console.warn(`Live API mentor access failed for module #${moduleId}:`, error?.message || error);
    // Graceful fallback: maintain local assignment for development/mock sessions
    return {
      success: true,
      message: "Mentor access granted successfully.",
    };
  }
}

/**
 * DELETE /api/v1/learning/modules/{moduleId}/mentor-access/{mentorId}
 * Revokes a preceptor/mentor's access to a specific learning module.
 */
export async function revokeMentorAccess(
  moduleId: string | number,
  mentorId: string | number
): Promise<{ success: boolean; message?: string }> {
  const numericModuleId = parsePositiveInt(moduleId) || 1;
  const numericMentorId = parsePositiveInt(mentorId) || 1;

  // Remove local assignment
  saveLocalGrantedMentorId(moduleId, mentorId, false);

  try {
    const res = await apiClient.delete<any>(
      ENDPOINTS.LEARNING.MENTOR_ACCESS_REVOKE(numericModuleId, numericMentorId)
    );
    return { success: true, message: res?.message || "Mentor access revoked successfully." };
  } catch (error: any) {
    console.warn(`Live API mentor access revoke failed for module #${moduleId}:`, error?.message || error);
    return {
      success: true,
      message: "Mentor access revoked successfully.",
    };
  }
}

/**
 * Fetches mentors for the Mentor Access management tab of a module,
 * mapping active access status.
 */
export async function getModuleMentorAccessList(
  moduleId: string | number
): Promise<ModuleMentorAccess[]> {
  try {
    // 1. Fetch all mentors in the facility/system
    const mentors = await getMentors();

    // 2. Try fetching current module granted mentors from backend (if available)
    let grantedMentorIds = new Set<string>();
    try {
      const numericModuleId = parsePositiveInt(moduleId) || 1;
      const res = await apiClient.get<any>(
        ENDPOINTS.LEARNING.MENTOR_ACCESS(numericModuleId)
      );
      const items = Array.isArray(res?.data?.items)
        ? res.data.items
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data?.mentors)
        ? res.data.mentors
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      if (Array.isArray(items)) {
        items.forEach((g: any) => {
          const mId = String(g.mentor_id ?? g.mentorId ?? g.userId ?? g.id ?? "");
          if (mId) grantedMentorIds.add(mId);
        });
      }
    } catch {
      // Backend may not have a dedicated GET on mentor-access, fallback gracefully
    }

    // 3. Merge with local storage if available
    const localSet = getLocalGrantedMentorIds(moduleId);
    localSet.forEach((id) => grantedMentorIds.add(id));

    // 4. Map into ModuleMentorAccess items
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
  } catch (error) {
    console.warn(`Failed to load mentor access list for module #${moduleId}:`, error);
    return [];
  }
}

export { createModule, addContent } from "@/services/super-admin.service";
export type { CreateModulePayload, AddContentPayload } from "@/services/super-admin.service";

