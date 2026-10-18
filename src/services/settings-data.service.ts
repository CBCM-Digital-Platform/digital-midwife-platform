import type {
    AdminProfile,
    ChangePasswordInput,
    ProfileData,
    UpdateProfileInput,
} from "@/types/settings";

const MOCK_PROFILE: AdminProfile = {
    id: "u1",
    fullName: "Dr. Elizabeth Mesay",
    position: "Mentoring Facility Administrator",
    email: "e.mesay@Tirunesh-beijing.org",
    phone: "+251 712 345 678",
    facilityName: "Tirunesh Beijing Hospital",
    region: "Addis Ababa",
    zone: "Akakai",
    woreda: "03",
    username: "admin_elizabeth",
    status: "ACTIVE",
    memberSince: "2022-01-01",
    avatarUrl: null,
};

const MOCK_DATA: ProfileData = {
    profile: MOCK_PROFILE,
    lastLogin: "2023-10-24T09:45:00Z",
    sessions: [
        {
            id: "s1",
            label: "Current Device",
            os: "Mac OS",
            browser: "Chrome",
            location: "Nairobi, Kenya",
            current: true,
        },
    ],
};

// TODO: replace with a fetch to the backend profile and sessions endpoints
export async function getProfileData(): Promise<ProfileData> {
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