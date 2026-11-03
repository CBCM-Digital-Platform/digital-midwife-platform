import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import type { LearningModule, ModuleContent } from "@/types/learning";
import {
  normalizeLearningModule,
  normalizeModuleContent,
} from "@/services/learning.service";

export interface CreateModulePayload {
  title: string;
  description: string;
  thematicAreaId?: string | number;
  status?: "published" | "draft" | "archived" | string;
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

  let fileId = payload.fileId;
  let fileName = payload.file?.name;
  let fileSizeMb = payload.file ? payload.file.size / (1024 * 1024) : undefined;

  // 1. If a file was uploaded, try to upload to /api/v1/uploads first
  if (payload.file && !fileId) {
    try {
      const formData = new FormData();
      formData.append("file", payload.file);
      formData.append("context", "learning_module_content");

      const uploadRes = await apiClient.post<any>(ENDPOINTS.UPLOADS.BASE, formData);
      const uploaded = uploadRes?.data ?? uploadRes;
      if (uploaded?.id) {
        fileId = uploaded.id;
      }
    } catch (uploadErr) {
      console.warn("Upload service upload failed, proceeding with content creation:", uploadErr);
    }
  }

  // Determine standard OpenAPI content type: "pdf", "video", "article", or "quiz"
  const rawType = (payload.type || "document").toLowerCase();
  const openApiType =
    rawType.includes("vid") || rawType.includes("mp4")
      ? "video"
      : rawType.includes("aud") || rawType.includes("pod")
      ? "audio"
      : rawType.includes("link") || rawType.includes("url")
      ? "article"
      : "pdf";

  // 2. Format content payload with isPublished and isAuthorized to ensure mentor visibility
  const contentBody = {
    title: payload.title.trim(),
    type: openApiType,
    description: payload.description?.trim() || null,
    contentText: payload.description?.trim() || payload.title.trim(),
    url: payload.url?.trim() || (payload.type === "link" ? "" : null),
    contentUrl: payload.url?.trim() || null,
    file_id: fileId || null,
    fileId: fileId || null,
    file_name: fileName,
    fileSizeMb: fileSizeMb,
    order: payload.order ?? 1,
    orderNumber: payload.order ?? 1,
    is_required: payload.isRequired ?? false,
    isRequired: payload.isRequired ?? false,
    isPublished: true,
    is_published: true,
    isAuthorized: true,
    is_authorized: true,
  };

  try {
    const res = await apiClient.post<any>(
      ENDPOINTS.LEARNING.CONTENTS(moduleId),
      contentBody
    );
    const rawData = res?.data ?? res;
    const contentId = rawData?.id ?? rawData?.contentId ?? Date.now();

    const normalized = normalizeModuleContent(
      {
        ...rawData,
        id: contentId,
        module_id: moduleId,
        title: payload.title.trim(),
        type: payload.type.toLowerCase(),
        description: payload.description?.trim(),
        url: payload.url || (fileName ? `#file-${fileName}` : undefined),
        fileName,
        fileSizeMb,
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
    console.error("Live API addContent failed:", error?.message || error);
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
