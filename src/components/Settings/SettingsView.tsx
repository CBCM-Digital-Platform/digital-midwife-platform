"use client";

import { useState } from "react";
import type { AdminProfile, ProfileData } from "@/types/settings";
import ProfileHeader from "./ProfileHeader";
import PersonalInfoForm from "./PersonalInfoForm";
import AccountSecurityCard from "./AccountSecurityCard";
import SessionActivityCard from "./SessionActivityCard";

export default function SettingsView({ data }: { data: ProfileData }) {
    const [profile, setProfile] = useState<AdminProfile>(data.profile);

    return (
        <div className="space-y-6 p-6">
            <ProfileHeader profile={profile} />

            <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
                <PersonalInfoForm profile={profile} onSaved={setProfile} />

                <div className="space-y-6">
                    <AccountSecurityCard username={profile.username} />
                    <SessionActivityCard lastLogin={data.lastLogin} sessions={data.sessions} />
                </div>
            </div>
        </div>
    );
}