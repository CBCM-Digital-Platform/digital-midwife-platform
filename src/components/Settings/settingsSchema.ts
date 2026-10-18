import { z } from "zod";

export const REGIONS = [
    "Addis Ababa",
    "Afar",
    "Amhara",
    "Benishangul-Gumuz",
    "Central Ethiopia",
    "Dire Dawa",
    "Gambela",
    "Harari",
    "Oromia",
    "Sidama",
    "Somali",
    "South Ethiopia",
    "South West Ethiopia",
    "Tigray",
] as const;

export const profileSchema = z.object({
    fullName: z.string().trim().min(3, "Full name is required"),
    position: z.string().trim().min(2, "Position is required"),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
    phone: z
        .string()
        .trim()
        .min(1, "Phone number is required")
        .regex(/^\+?[\d\s-]{7,18}$/, "Enter a valid phone number"),
    facilityName: z.string().trim().min(2, "Facility name is required"),
    region: z.string().min(1, "Select a region"),
    zone: z.string().trim().min(1, "Zone / sub-county is required"),
    woreda: z.string().trim().min(1, "Woreda / ward is required"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
            .string()
            .min(8, "Use at least 8 characters")
            .regex(/[A-Za-z]/, "Include at least one letter")
            .regex(/\d/, "Include at least one number"),
        confirmPassword: z.string().min(1, "Please confirm your new password"),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    })
    .refine((d) => d.newPassword !== d.currentPassword, {
        message: "New password must be different from the current one",
        path: ["newPassword"],
    });

export type PasswordFormValues = z.infer<typeof passwordSchema>;