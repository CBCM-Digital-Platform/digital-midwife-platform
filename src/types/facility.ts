export type FacilityType =
  | "Referral Hospital"
  | "General Hospital"
  | "Primary Hospital"
  | "Health Center"
  | "Specialized Hospital"
  | string;

export type FacilityStatus = "active" | "inactive" | "pending";

export interface Facility {
  id: string;
  name: string;
  code?: string;
  type?: FacilityType;
  region?: string;
  zone?: string;
  woreda?: string;
  address?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: FacilityStatus;
  activeMentorsCount?: number;
  activeMenteesCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFacilityInput {
  name: string;
  code?: string;
  type?: string;
  region?: string;
  zone?: string;
  woreda?: string;
  address?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  status?: FacilityStatus;
}

export interface UpdateFacilityInput extends Partial<CreateFacilityInput> {}
