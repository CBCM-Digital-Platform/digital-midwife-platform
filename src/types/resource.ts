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

export type AdminResourceType = "document" | "video" | "link" | "audio" | "presentation";

export type LearningMaterialCategory =
  | "PARTICIPANT_MANUAL"
  | "POWERPOINT_PRESENTATION"
  | "FACILITATOR_GUIDE"
  | "EXAMINATION"
  | "ANSWER_KEY"
  | "PRACTICAL_ASSESSMENT";

export type LearningExaminationStage = "PRETEST" | "POST_TEST";

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
  moduleId?: number | string;
  isLearningModule?: boolean;
  category?: LearningMaterialCategory;
  examinationStage?: LearningExaminationStage;
  isRequired?: boolean;
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
  thematicAreaId?: number | string;
  moduleId?: number | string;
  category?: LearningMaterialCategory;
  examinationStage?: LearningExaminationStage;
  isRequired?: boolean;
}

export interface UpdateResourceInput {
  title?: string;
  description?: string;
  type?: AdminResourceType;
  url?: string;
  file?: File;
  fileId?: number | string;
  thematicAreaId?: number | string;
  moduleId?: number | string;
  category?: LearningMaterialCategory;
  examinationStage?: LearningExaminationStage;
  isRequired?: boolean;
}
