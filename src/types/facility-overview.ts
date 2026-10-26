export type FacilityStatusBadge = "ACTIVE" | "UNDER_REVIEW" | "INACTIVE";

export interface FacilityCardItem {
    id: string;
    name: string;
    district: string;
    distance: string; // e.g. "12m", "25m", "40m"
    status: FacilityStatusBadge;
    menteesCount: number;
    menteesTrend: "up" | "flat" | "down";
    complianceScore: number; // 0 - 100
    imageUrl: string;
    type?: string;
    region?: string;
    address?: string;
    contactPerson?: string;
    contactPhone?: string;
    contactEmail?: string;
    activeMentorsCount?: number;
    departments?: string[];
    accreditationDate?: string;
}

export interface FacilityOverviewStats {
    activeFacilities: number;
    totalMenteesPlaced: number;
    avgComplianceScore: number;
}

export interface AvailableMenteeOption {
    id: string;
    name: string;
    title: string;
    code: string;
    facilityId?: string;
    facilityName?: string;
}
