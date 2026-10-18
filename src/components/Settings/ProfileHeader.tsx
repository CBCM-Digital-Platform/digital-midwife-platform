"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Briefcase, Building2, Camera } from "lucide-react";
import type { AdminProfile } from "@/types/settings";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

function initials(name: string) {
    return name
        .replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

function formatMemberSince(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });
}

export default function ProfileHeader({ profile }: { profile: AdminProfile }) {
    const [preview, setPreview] = useState<string | null>(profile.avatarUrl);
    const [error, setError] = useState<string | null>(null);
    const objectUrl = useRef<string | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
        };
    }, []);

    const onPick = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // allow picking the same file again
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please choose an image file.");
            return;
        }
        if (file.size > MAX_AVATAR_BYTES) {
            setError("Image must be 2 MB or smaller.");
            return;
        }

        if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
        const url = URL.createObjectURL(file);
        objectUrl.current = url;
        setPreview(url);
        setError(null);
        // TODO: upload the file to the backend and store the returned avatar URL
    };

    const active = profile.status === "ACTIVE";

    return (
        <section className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* decorative shape */}
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-green-50" />

            <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-5">
                    <div className="relative h-24 w-24 shrink-0">
                        {preview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={preview}
                                alt={`${profile.fullName} profile photo`}
                                className="h-24 w-24 rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#0B5D3B] text-3xl font-semibold text-white">
                                {initials(profile.fullName)}
                            </div>
                        )}
                        <button
                            type="button"
                            aria-label="Change profile photo"
                            onClick={() => fileInput.current?.click()}
                            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#0B5D3B] text-white hover:bg-[#094d31]"
                        >
                            <Camera className="h-4 w-4" />
                        </button>
                        <input
                            ref={fileInput}
                            type="file"
                            accept="image/*"
                            onChange={onPick}
                            className="hidden"
                        />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{profile.fullName}</h2>
                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                            <Building2 className="h-4 w-4 text-[#0B5D3B]" />
                            {profile.facilityName}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                            <Briefcase className="h-4 w-4" />
                            {profile.position}
                        </p>
                        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                            }`}
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${active ? "bg-green-600" : "bg-gray-400"}`}
                        />
                        {active ? "Active" : "Inactive"}
                    </span>
                    <p className="text-xs text-gray-500">
                        Member since {formatMemberSince(profile.memberSince)}
                    </p>
                </div>
            </div>
        </section>
    );
}