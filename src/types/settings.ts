export type AccountStatus = "ACTIVE" | "INACTIVE";

export interface AdminProfile {
    id: string;
    fullName: string;
    position: string;
    email: string;
    phone: string;
    facilityName: string;
    region: string;
    zone: string;
    woreda: string;
    username: string; // read-only
    status: AccountStatus;
    memberSince: string; // ISO date
    avatarUrl: string | null;
}

export interface UpdateProfileInput {
    fullName: string;
    position: string;
    email: string;
    phone: string;
    facilityName: string;
    region: string;
    zone: string;
    woreda: string;
}

export interface ChangePasswordInput {
    currentPassword: string;
    newPassword: string;
}

export interface SessionInfo {
    id: string;
    label: string;
    os: string;
    browser: string;
    location: string;
    current: boolean;
}

export interface ProfileData {
    profile: AdminProfile;
    lastLogin: string; // ISO date-time
    sessions: SessionInfo[];
}