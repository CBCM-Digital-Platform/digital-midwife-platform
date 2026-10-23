export type ThematicAreaStatus = "active" | "inactive" | "under_review";

export interface ThematicArea {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  targetCadres?: string[];
  competenciesCount?: number;
  modulesCount?: number;
  status: ThematicAreaStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateThematicAreaInput {
  code: string;
  name: string;
  category: string;
  description?: string;
  targetCadres?: string[];
  status?: ThematicAreaStatus;
}

export interface UpdateThematicAreaInput {
  code?: string;
  name?: string;
  category?: string;
  description?: string;
  targetCadres?: string[];
  status?: ThematicAreaStatus;
}

export interface ThematicAreaStats {
  totalAreas: number;
  activeAreas: number;
  totalCompetencies: number;
  categoriesCount: number;
}
