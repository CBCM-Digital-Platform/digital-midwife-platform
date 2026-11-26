import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import type { LearningModule, ModuleContent } from "@/types/learning";
import type {
  LearningExaminationStage,
  LearningMaterialCategory,
} from "@/types/resource";
import {
  createResource,
  detectBackendResourceType,
} from "@/services/resources.service";
import {
  normalizeLearningModule,
  normalizeModuleContent,
} from "@/services/learning.service";

export interface CreateModulePayload {
  title: string;
  description: string;
  thematicAreaId?: string | number;
  status?: "published" | "draft" | "archived" | string;
  isPublished?: boolean;
  isAuthorized?: boolean;
  order?: number;
}

export interface AddContentPayload {
  title: string;
  type: "pdf" | "video" | "audio" | "link" | "document" | "file" | string;
  description?: string;
  url?: string;
  file?: File;
  fileId?: number | string;
  order?: number;
  isRequired?: boolean;
  isPublished?: boolean;
  isAuthorized?: boolean;
  category?: LearningMaterialCategory;
  examinationStage?: LearningExaminationStage;
  thematicAreaId?: string | number;
}

export interface CreateModuleResult {
  success: boolean;
  moduleId: string | number;
  module: LearningModule;
  message?: string;
}

export interface AddContentResult {
  success: boolean;
  contentId: string | number;
  content: ModuleContent;
  message?: string;
}

/**
 * POST /api/v1/learning/modules
 * Creates a new learning module in the platform database.
 * Sets isPublished: true and isAuthorized: true when status is "published" so mentors can be assigned.
 */
export async function createModule(
  payload: CreateModulePayload
): Promise<CreateModuleResult> {
  if (!payload.title || !payload.title.trim()) {
    throw new Error("Module title is required.");
  }
  if (!payload.description || !payload.description.trim()) {
    throw new Error("Module description is required.");
  }

  const numericAreaId = payload.thematicAreaId
    ? Number(payload.thematicAreaId) || payload.thematicAreaId
    : undefined;

  const targetStatus = payload.status || "published";
  const isPublished = targetStatus === "published";

  const requestBody = {
    title: payload.title.trim(),
    description: payload.description.trim(),
    thematic_area_id: numericAreaId,
    thematicAreaId: numericAreaId,
    status: targetStatus,
    isPublished,
    isAuthorized: isPublished,
    order: payload.order ?? 1,
  };

  try {
    const res = await apiClient.post<any>(ENDPOINTS.LEARNING.BASE, requestBody);
    const rawData = res?.data ?? res;
    const moduleId =
      rawData?.id ?? rawData?.moduleId ?? rawData?.module_id ?? Date.now();

    const normalized = normalizeLearningModule({
      ...rawData,
      id: moduleId,
      title: payload.title.trim(),
      description: payload.description.trim(),
      thematic_area_id: numericAreaId,
      status: targetStatus,
      isPublished,
      isAuthorized: isPublished,
    });

    return {
      success: true,
      moduleId,
      module: normalized,
      message: "Module created successfully",
    };
  } catch (error: any) {
    console.error("Live API module creation failed:", error?.message || error);
    throw error;
  }
}

/**
 * POST /api/v1/learning/modules/{moduleId}/contents
 * Attaches a learning resource (PDF, Video, Audio, Link) to an existing module.
 */
export async function addContent(
  moduleId: string | number,
  payload: AddContentPayload
): Promise<AddContentResult> {
  if (!moduleId) {
    throw new Error("moduleId is required to attach material.");
  }
  if (!payload.title || !payload.title.trim()) {
    throw new Error("Material title is required.");
  }

  if (payload.type === "link") {
    throw new Error("The backend accepts uploaded PDF, audio, video, or presentation resources; external links are not supported.");
  }
  if (!payload.category) {
    throw new Error("A learning material category is required.");
  }

  try {
    // If category is PRACTICAL_ASSESSMENT, map to FACILITATOR_GUIDE for the resources table so backend enum doesn't reject
    const backendCategory = payload.category === "PRACTICAL_ASSESSMENT"
      ? "FACILITATOR_GUIDE"
      : payload.category;

    // Detect actual file type from uploaded file to prevent MIME type mismatch errors on the backend
    const detectedType = detectBackendResourceType(payload.type, payload.file);

    const rawData = await createResource({
      title: payload.title.trim(),
      type: detectedType,
      description: payload.description,
      url: payload.url,
      file: payload.file,
      fileId: payload.fileId,
      moduleId,
      thematicAreaId: payload.thematicAreaId,
      category: backendCategory,
      examinationStage: payload.examinationStage,
      isRequired: payload.isRequired,
    });
    const contentId = rawData?.id ?? Date.now();

    const normalized = normalizeModuleContent(
      {
        ...rawData,
        id: contentId,
        module_id: moduleId,
        title: payload.title.trim(),
        type: payload.type.toLowerCase(),
        description: payload.description?.trim(),
        url: payload.url,
        fileName: payload.file?.name,
        fileSizeMb: payload.file ? payload.file.size / (1024 * 1024) : undefined,
        category: payload.category,
      },
      moduleId
    );

    return {
      success: true,
      contentId,
      content: normalized,
      message: "Learning material added successfully",
    };
  } catch (error: any) {
    console.error("Live API resource creation failed:", error?.message || error);
    throw error;
  }
}

/**
 * PATCH or PUT /api/v1/learning/modules/{id}
 * Updates an existing learning module.
 * Sets isPublished: true and isAuthorized: true when status is "published".
 */
export async function updateModule(
  id: string | number,
  payload: Partial<CreateModulePayload>
): Promise<{ success: boolean; module?: LearningModule; message?: string }> {
  const numericId = Number(id) || id;
  const body: Record<string, any> = {};
  if (payload.title !== undefined) body.title = payload.title.trim();
  if (payload.description !== undefined) body.description = payload.description.trim();
  if (payload.status !== undefined) {
    body.status = payload.status;
    if (payload.status === "published") {
      body.isPublished = true;
      body.isAuthorized = true;
    } else if (payload.status === "draft") {
      body.isPublished = false;
    }
  }
  if (payload.thematicAreaId !== undefined) {
    const areaId = Number(payload.thematicAreaId) || payload.thematicAreaId;
    body.thematic_area_id = areaId;
    body.thematicAreaId = areaId;
  }

  try {
    const res = await apiClient
      .patch<any>(ENDPOINTS.LEARNING.DETAIL(numericId), body)
      .catch(() => apiClient.put<any>(ENDPOINTS.LEARNING.DETAIL(numericId), body));
    const raw = res?.data ?? res;
    const updatedMod = normalizeLearningModule(raw);
    return {
      success: true,
      module: updatedMod,
      message: "Module updated successfully.",
    };
  } catch (error: any) {
    console.error(`Update module #${id} failed:`, error?.message);
    throw error;
  }
}

/**
 * DELETE /api/v1/learning/modules/{id}
 * Deletes a learning module.
 */
export async function deleteModule(
  id: string | number
): Promise<{ success: boolean; message?: string }> {
  const numericId = Number(id) || id;
  try {
    const res = await apiClient.delete<any>(ENDPOINTS.LEARNING.DETAIL(numericId));
    return {
      success: true,
      message: res?.message || "Module deleted successfully.",
    };
  } catch (error: any) {
    console.error(`Delete module #${id} failed:`, error?.message);
    throw error;
  }
}


/**
 * PATCH or PUT /api/v1/learning/modules/{moduleId}/contents/{contentId}
 * Updates an individual resource item inside a module.
 */
export async function updateContent(
  moduleId: string | number,
  contentId: string | number,
  payload: Partial<AddContentPayload>
): Promise<{ success: boolean; content?: ModuleContent; message?: string }> {
  const rawType = payload.type ? payload.type.toLowerCase() : undefined;
  const openApiType = rawType
    ? rawType.includes("vid") || rawType.includes("mp4")
      ? "video"
      : rawType.includes("link")
      ? "article"
      : "pdf"
    : undefined;

  const body: Record<string, any> = {};
  if (payload.title !== undefined) body.title = payload.title.trim();
  if (payload.description !== undefined) {
    body.description = payload.description.trim();
    body.contentText = payload.description.trim();
  }
  if (openApiType !== undefined) body.type = openApiType;
  if (payload.url !== undefined) {
    body.url = payload.url.trim();
    body.contentUrl = payload.url.trim();
  }
  body.isPublished = true;
  body.is_published = true;
  body.isAuthorized = true;
  body.is_authorized = true;

  try {
    const res = await apiClient
      .patch<any>(ENDPOINTS.LEARNING.CONTENT_DETAIL(moduleId, contentId), body)
      .catch(() =>
        apiClient.put<any>(ENDPOINTS.LEARNING.CONTENT_DETAIL(moduleId, contentId), body)
      );
    const raw = res?.data ?? res;
    return {
      success: true,
      content: normalizeModuleContent(raw, moduleId),
      message: "Resource updated successfully.",
    };
  } catch (error: any) {
    console.error(`Update content #${contentId} failed:`, error?.message);
    throw error;
  }
}

/**
 * DELETE /api/v1/learning/modules/{moduleId}/contents/{contentId}
 * Deletes an individual resource item from a module.
 */
export async function deleteContent(
  moduleId: string | number,
  contentId: string | number
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await apiClient.delete<any>(
      ENDPOINTS.LEARNING.CONTENT_DETAIL(moduleId, contentId)
    );
    return {
      success: true,
      message: res?.message || "Resource deleted successfully.",
    };
  } catch (error: any) {
    console.error(`Delete content #${contentId} failed:`, error?.message);
    throw error;
  }
}
