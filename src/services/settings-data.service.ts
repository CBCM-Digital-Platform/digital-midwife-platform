import type {
    AdminProfile,
    ChangePasswordInput,
    ProfileData,
    UpdateProfileInput,
} from "@/types/settings";
import { FACILITY_ID_MAP } from "@/services/users.service";

const MOCK_PROFILE: AdminProfile = {
    id: "u1",
    fullName: "Facility Administrator",
    position: "Mentoring Facility Administrator",
    email: "admin@facility.org",
    phone: "+251 911 234 567",
    facilityName: "Assigned Facility",
    region: "Addis Ababa",
    zone: "Central",
    woreda: "01",
    username: "facility_admin",
    status: "ACTIVE",
    memberSince: "2024-01-01",
    avatarUrl: null,
};

const MOCK_DATA: ProfileData = {
    profile: MOCK_PROFILE,
    lastLogin: new Date().toISOString(),
    sessions: [
        {
            id: "s1",
            label: "Current Device",
            os: "Web Browser",
            browser: "Active Session",
            location: "Regional Medical Center",
            current: true,
        },
    ],
};

export async function getProfileData(): Promise<ProfileData> {
    if (typeof window === "undefined") {
        try {
            const { getServerSession } = await import("next-auth/next");
            const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
            const session = await getServerSession(authOptions);
            if (session?.user) {
                const user = session.user as any;
                const userFacilityId = user.facility_id ?? user.facilityId;
                const facilityName =
                    (userFacilityId && FACILITY_ID_MAP[Number(userFacilityId)]) ||
                    (userFacilityId ? `Facility #${userFacilityId}` : "Assigned Facility");

                return {
                    profile: {
                        id: String(user.id || "u1"),
                        fullName: user.name || "Facility Administrator",
                        position: user.role === "facility_admin" ? "Facility Administrator" : "System Administrator",
                        email: user.email || "",
                        phone: user.phone || "+251 911 234 567",
                        facilityName,
                        region: user.region || "Regional Center",
                        zone: "Central Zone",
                        woreda: "01",
                        username: user.email?.split("@")[0] || "admin",
                        status: "ACTIVE",
                        memberSince: "2024-01-01",
                        avatarUrl: null,
                    },
                    lastLogin: new Date().toISOString(),
                    sessions: [
                        {
                            id: "s1",
                            label: "Current Device",
                            os: "Web Browser",
                            browser: "Active Session",
                            location: "Regional Medical Center",
                            current: true,
                        },
                    ],
                };
            }
        } catch {
            // Ignore session resolution failure
        }
    }
    return MOCK_DATA;
}

// TODO: replace with a PATCH/PUT to the backend profile endpoint
export async function updateProfile(input: UpdateProfileInput): Promise<AdminProfile> {
    await new Promise((resolve) => setTimeout(resolve, 600)); // fake network delay
    console.log("Update profile (mock):", input);
    return { ...MOCK_PROFILE, ...input };
}

// TODO: replace with a POST to the backend change-password endpoint
export async function changePassword(input: ChangePasswordInput): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 600)); // fake network delay
    console.log("Change password (mock) for user:", input.currentPassword ? "ok" : "missing");
}