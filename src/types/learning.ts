/**
 * Type definitions for the CBCM Hierarchical Learning Modules Architecture
 */

export type ModuleStatus = "published" | "draft" | "archived" | string;

export type ModuleContentType = "document" | "video" | "link" | "file";

export interface ModuleContent {
  id: string | number;
  moduleId: string | number;
  title: string;
  description?: string;
  type: ModuleContentType | string;
  url?: string;
  fileId?: string | number;
  fileName?: string;
  fileSize?: string | number;
  fileSizeMb?: number;
  durationLabel?: string;
  order?: number;
  isRequired?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LearningModule {
  id: string | number;
  title: string;
  description: string;
  thematicAreaId?: string | number;
  thematicAreaName?: string;
  thematicArea?: { id?: string | number; name?: string; code?: string } | string;
  status: ModuleStatus;
  order?: number;
  contentsCount?: number;
  contents?: ModuleContent[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ModuleMentorAccess {
  mentorId: string | number;
  mentorName: string;
  email: string;
  phone?: string;
  facility?: string;
  facilityId?: string | number;
  specialty?: string;
  hasAccess: boolean;
  grantedAt?: string;
}
