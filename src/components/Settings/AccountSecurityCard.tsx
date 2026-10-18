"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, User } from "lucide-react";
import { changePassword } from "@/services/settings-data.service";
import { passwordSchema, type PasswordFormValues } from "./settingsSchema";
import { Field, inputClass } from "./FormField";

export default function AccountSecurityCard({ username }: { username: string }) {
    const [success, setSuccess] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    });

    const onSubmit = async (values: PasswordFormValues) => {
        setServerError(null);
        setSuccess(false);
        try {
            await changePassword({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            });
            reset();
            setSuccess(true);
        } catch (err) {
            setServerError(
                err instanceof Error ? err.message : "Couldn't update your password. Please try again."
            );
        }
    };

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <ShieldCheck className="h-5 w-5 text-[#0B5D3B]" />
                Account & Security
            </h2>

            <div>
                <p className="mb-1.5 text-sm font-medium text-gray-700">Username</p>
                <div className="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2.5">
                    <span className="flex items-center gap-2 text-sm text-gray-700">
                        <User className="h-4 w-4 text-gray-500" />
                        {username}
                    </span>
                    <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[9px] font-semibold leading-tight text-gray-500">
                        READ ONLY
                    </span>
                </div>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="mt-5 space-y-3 border-t border-gray-200 pt-5"
            >
                <p className="text-sm font-medium text-gray-700">Change Password</p>

                <Field label="" htmlFor="currentPassword" error={errors.currentPassword?.message}>
                    <input
                        id="currentPassword"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Current Password"
                        {...register("currentPassword")}
                        className={inputClass}
                    />
                </Field>
                <Field label="" htmlFor="newPassword" error={errors.newPassword?.message}>
                    <input
                        id="newPassword"
                        type="password"
                        autoComplete="new-password"
                        placeholder="New Password"
                        {...register("newPassword")}
                        className={inputClass}
                    />
                </Field>
                <Field label="" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
                    <input
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Confirm New Password"
                        {...register("confirmPassword")}
                        className={inputClass}
                    />
                </Field>

                {serverError && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {serverError}
                    </p>
                )}
                {success && (
                    <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                        Password updated.
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-[#0B5D3B] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#094d31] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? "Updating..." : "Update Password"}
                </button>
            </form>
        </section>
    );
}