import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";

export interface PracticalChecklistItem {
  id?: number;
  item_text: string;
  is_required?: boolean;
  is_critical?: boolean;
  weight?: number;
}

export interface CreatePracticalChecklistPayload {
  thematic_area_id: number;
  procedure: string;
  title: string;
  description?: string;
  reference_file_id?: number | null;
  items: PracticalChecklistItem[];
}

export interface PracticalChecklist {
  id: number;
  thematic_area_id: number;
  procedure: string;
  title: string;
  description?: string;
  version?: number;
  status?: string;
  reference_file_id?: number | null;
  items?: PracticalChecklistItem[];
  created_at?: string;
  updated_at?: string;
}

type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown): ApiRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as ApiRecord)
    : {};
}

function unwrap(value: unknown): unknown {
  let current = value;
  for (let i = 0; i < 5; i++) {
    if (current && typeof current === "object" && !Array.isArray(current)) {
      const rec = current as Record<string, unknown>;
      if (rec.data !== undefined) {
        current = rec.data;
        continue;
      }
      if (rec.result !== undefined) {
        current = rec.result;
        continue;
      }
      if (rec.payload !== undefined) {
        current = rec.payload;
        continue;
      }
    }
    break;
  }
  return current;
}

/**
 * POST /api/v1/practical-checklists
 * Creates a versioned practical assessment checklist template.
 */
export async function createPracticalChecklist(
  payload: CreatePracticalChecklistPayload
): Promise<PracticalChecklist> {
  if (!payload.thematic_area_id || payload.thematic_area_id < 1) {
    throw new Error("A valid clinical thematic area is required for the practical checklist.");
  }
  if (!payload.procedure || !payload.procedure.trim()) {
    throw new Error("Clinical procedure name is required.");
  }
  if (!payload.title || !payload.title.trim()) {
    throw new Error("Checklist title is required.");
  }
  if (!payload.items || payload.items.length === 0) {
    throw new Error("At least one checklist step / item is required.");
  }

  const requestBody = {
    thematic_area_id: Number(payload.thematic_area_id),
    procedure: payload.procedure.trim(),
    title: payload.title.trim(),
    ...(payload.description && payload.description.trim()
      ? { description: payload.description.trim() }
      : {}),
    ...(payload.reference_file_id ? { reference_file_id: Number(payload.reference_file_id) } : {}),
    items: payload.items.map((item) => ({
      item_text: item.item_text.trim(),
      is_required: item.is_required !== undefined ? Boolean(item.is_required) : true,
      is_critical: Boolean(item.is_critical),
    })),
  };

  const response = await apiClient.post<unknown>(ENDPOINTS.PRACTICAL_CHECKLISTS.BASE, requestBody);
  const data = asRecord(unwrap(response));
  return {
    id: Number(data.id ?? Date.now()),
    thematic_area_id: Number(data.thematic_area_id ?? payload.thematic_area_id),
    procedure: String(data.procedure ?? payload.procedure),
    title: String(data.title ?? payload.title),
    description: data.description ? String(data.description) : payload.description,
    version: Number(data.version ?? 1),
    status: String(data.status ?? "draft"),
    items: payload.items,
  };
}

/**
 * GET /api/v1/practical-checklists
 * Lists practical checklists filtered optionally by thematic area or procedure.
 */
export async function getPracticalChecklists(params?: {
  thematic_area_id?: number;
  procedure?: string;
  status?: string;
}): Promise<PracticalChecklist[]> {
  const query = new URLSearchParams();
  if (params?.thematic_area_id) query.set("thematic_area_id", String(params.thematic_area_id));
  if (params?.procedure) query.set("procedure", params.procedure);
  if (params?.status) query.set("status", params.status);

  const endpoint = `${ENDPOINTS.PRACTICAL_CHECKLISTS.BASE}${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await apiClient.get<unknown>(endpoint);
  const unwrapped = unwrap(response);
  const list = Array.isArray(unwrapped) ? unwrapped : [];
  return list.map((item: any) => ({
    id: Number(item.id),
    thematic_area_id: Number(item.thematic_area_id),
    procedure: String(item.procedure ?? ""),
    title: String(item.title ?? ""),
    description: item.description ? String(item.description) : undefined,
    version: item.version ? Number(item.version) : 1,
    status: String(item.status ?? "published"),
    items: Array.isArray(item.items) ? item.items : [],
  }));
}
