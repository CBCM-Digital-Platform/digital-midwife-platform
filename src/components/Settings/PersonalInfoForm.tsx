"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, Save, User } from "lucide-react";
import { useSession } from "next-auth/react";
import type { AdminProfile } from "@/types/settings";
import { updateProfile } from "@/services/settings-data.service";
import { REGIONS, profileSchema, type ProfileFormValues } from "./settingsSchema";
import { Field, inputClass } from "./FormField";

interface Props {
    profile: AdminProfile;
    onSaved: (profile: AdminProfile) => void;
}

function SectionLabel({ children }: { children: string }) {
    return (
        <p className="border-b border-gray-200 pb-2 text-xs font-semibold tracking-wide text-gray-500">
            {children}
        </p>
    );
}

export default function PersonalInfoForm({ profile, onSaved }: Props) {
    const { update: updateSession } = useSession();
    const [saved, setSaved] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: profile.fullName,
            position: profile.position,
            email: profile.email,
            phone: profile.phone,
            facilityName: profile.facilityName,
            region: profile.region,
            zone: profile.zone,
            woreda: profile.woreda,
        },
    });

    const onSubmit = async (values: ProfileFormValues) => {
        setServerError(null);
        try {
            const updated = await updateProfile(values);
            onSaved(updated);
            reset(values); // new baseline, so the form is "clean" again
            setSaved(true);
            if (updateSession) {
                await updateSession({ name: updated.fullName }).catch(() => {});
            }
        } catch (err) {
            setSaved(false);
            setServerError(
                err instanceof Error ? err.message : "Couldn't save your changes. Please try again."
            );
        }
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <User className="h-5 w-5 text-[#0B5D3B]" />
                Personal & Facility Information
            </h2>

            <div className="space-y-4">
                <SectionLabel>PERSONAL DETAILS</SectionLabel>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full Name" htmlFor="fullName" error={errors.fullName?.message}>
                        <input id="fullName" {...register("fullName")} className={inputClass} />
                    </Field>
                    <Field label="Position / Role" htmlFor="position" error={errors.position?.message}>
                        <input id="position" {...register("position")} className={inputClass} />
                    </Field>
                    <Field label="Email Address" htmlFor="email" error={errors.email?.message}>
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                id="email"
                                type="email"
                                {...register("email")}
                                className={`${inputClass} pl-9`}
                            />
                        </div>
                    </Field>
                    <Field label="Phone Number" htmlFor="phone" error={errors.phone?.message}>
                        <div className="relative">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                id="phone"
                                type="tel"
                                {...register("phone")}
                                className={`${inputClass} pl-9`}
                            />
                        </div>
                    </Field>
                </div>

                <div className="pt-2">
                    <SectionLabel>FACILITY DETAILS</SectionLabel>
                </div>
                <Field label="Facility Name" htmlFor="facilityName" error={errors.facilityName?.message}>
                    <input id="facilityName" {...register("facilityName")} className={inputClass} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Region" htmlFor="region" error={errors.region?.message}>
                        <select id="region" {...register("region")} className={inputClass}>
                            {REGIONS.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Zone / Sub-County" htmlFor="zone" error={errors.zone?.message}>
                        <input id="zone" {...register("zone")} className={inputClass} />
                    </Field>
                    <Field label="Woreda / Ward" htmlFor="woreda" error={errors.woreda?.message}>
                        <input id="woreda" {...register("woreda")} className={inputClass} />
                    </Field>
                </div>
            </div>

            {serverError && (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {serverError}
                </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-4">
                {saved && !isDirty && <p className="text-sm font-medium text-green-700">Changes saved.</p>}
                <button
                    type="submit"
                    disabled={!isDirty || isSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-[#0B5D3B] px-5 py-2 text-sm font-medium text-white hover:bg-[#094d31] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Save className="h-4 w-4" />
                    {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </form>
    );
}