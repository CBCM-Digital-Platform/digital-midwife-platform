export type ResourceKind = "GUIDELINE" | "MANUAL" | "TIP" | "VIDEO";

export type ResourceCategory =
  | "CLINICAL_GUIDELINES"
  | "MENTOR_TIPS"
  | "ADOLESCENT_HEALTH"
  | "TRAINING_VIDEOS";

export interface Resource {
  id: string;
  title: string;
  description: string;
  kind: ResourceKind;
  category: ResourceCategory;
  updatedAt: string; // ISO date
  sizeMb?: number; // documents
  durationLabel?: string; // videos, e.g. "12:45"
  tag?: string; // videos, e.g. "Training"
  starred: boolean;
  url: string; // "#" until the backend provides a file or video link
}

export type AdminResourceType = "document" | "video" | "link";

export interface AdminResource {
  id: string;
  title: string;
  description: string;
  type: AdminResourceType;
  url?: string;
  fileId?: number | string;
  fileName?: string;
  fileSizeMb?: number;
  thematicAreaId?: number | string;
  thematicAreaName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceInput {
  title: string;
  description?: string;
  type: AdminResourceType;
  url?: string;
  file?: File;
  fileId?: number | string;
}

export interface UpdateResourceInput {
  title?: string;
  description?: string;
  type?: AdminResourceType;
  url?: string;
  file?: File;
  fileId?: number | string;
}
