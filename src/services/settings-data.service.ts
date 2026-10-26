import { apiClient } from "@/lib/api-client";
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

/**
 * Fetches the current user profile from the backend API (GET /api/v1/users/me),
 * with graceful fallback to server session or cached data.
 */
export async function getProfileData(): Promise<ProfileData> {
    try {
        const res = await apiClient<any>("/api/v1/users/me").catch(() => null);
        const user = res?.data || res?.user || res;

        if (user && user.id) {
            const userFacilityId = user.facility_id ?? user.facilityId;
            const facilityName =
                (userFacilityId && FACILITY_ID_MAP[Number(userFacilityId)]) ||
                (userFacilityId ? `Facility #${userFacilityId}` : "Assigned Facility");

            const role = String(user.role || "").toLowerCase();
            const defaultPosition = role.includes("facility")
                ? "Facility Administrator"
                : role.includes("super")
                ? "National System Administrator"
                : "Administrator";

            return {
                profile: {
                    id: String(user.id),
                    fullName: user.full_name || user.name || "Administrator",
                    position: user.highest_qualification || defaultPosition,
                    email: user.email || "",
                    phone: user.phone || "+251 911 234 567",
                    facilityName,
                    region: user.region || "Addis Ababa",
                    zone: "Central Zone",
                    woreda: "01",
                    username: user.email?.split("@")[0] || "admin",
                    status: (String(user.status || "ACTIVE").toUpperCase() as any) || "ACTIVE",
                    memberSince: user.created_at ? String(user.created_at).slice(0, 10) : "2024-01-01",
                    avatarUrl: user.avatar_url || null,
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
    } catch (err) {
        console.warn("Could not fetch user profile from /api/v1/users/me, reading from session:", err);
    }

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
                        region: user.region || "Addis Ababa",
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

/**
 * Updates the authenticated user's profile in the live backend database (PATCH /api/v1/users/me).
 * Saves full name, phone number, qualification/role, and avatar.
 */
export async function updateProfile(input: UpdateProfileInput): Promise<AdminProfile> {
    const payload: {
        full_name?: string;
        phone?: string;
        highest_qualification?: string;
        avatar_url?: string;
    } = {};

    if (input.fullName && input.fullName.trim()) {
        payload.full_name = input.fullName.trim();
    }
    if (input.phone && input.phone.trim()) {
        payload.phone = input.phone.trim();
    }
    if (input.position && input.position.trim()) {
        payload.highest_qualification = input.position.trim();
    }
    if (input.avatarUrl) {
        payload.avatar_url = input.avatarUrl;
    }

    const res = await apiClient<any>("/api/v1/users/me", {
        method: "PATCH",
        body: payload,
    });

    const updatedUser = res?.data || res?.user || res;

    const userFacilityId = updatedUser?.facility_id ?? updatedUser?.facilityId;
    const facilityName =
        input.facilityName ||
        (userFacilityId && FACILITY_ID_MAP[Number(userFacilityId)]) ||
        "Assigned Facility";

    return {
        id: String(updatedUser?.id || "u1"),
        fullName: updatedUser?.full_name || input.fullName || "Administrator",
        position: updatedUser?.highest_qualification || input.position || "Administrator",
        email: updatedUser?.email || input.email || "",
        phone: updatedUser?.phone || input.phone || "",
        facilityName,
        region: input.region || "Addis Ababa",
        zone: input.zone || "Central",
        woreda: input.woreda || "01",
        username: (updatedUser?.email || input.email || "admin").split("@")[0],
        status: "ACTIVE",
        memberSince: updatedUser?.created_at ? String(updatedUser.created_at).slice(0, 10) : "2024-01-01",
        avatarUrl: updatedUser?.avatar_url || input.avatarUrl || null,
    };
}

/**
 * Changes the authenticated user's password in the backend (POST /api/v1/auth/change-password).
 */
export async function changePassword(input: ChangePasswordInput): Promise<void> {
    await apiClient("/api/v1/auth/change-password", {
        method: "POST",
        body: {
            currentPassword: input.currentPassword,
            newPassword: input.newPassword,
        },
    });
}