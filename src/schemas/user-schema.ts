import { z } from "zod";
import { zodEmail, zodPhone, zodName } from "@/lib/validators";

export const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

export const highestQualificationsList = [
  "BSc Midwifery",
  "MSc Midwifery",
  "Doctor of Medicine (MD)",
  "Specialist in OB/GYN",
  "MPH (Master of Public Health)",
  "Diploma in Clinical Midwifery",
  "PhD / Post-Doctorate",
] as const;

export const thematicAreasList = [
  "Maternal & Child Health",
  "Emergency Obstetric & Newborn Care (EmONC)",
  "Pediatrics & Neonatal Care",
  "Adolescent & Youth Sexual Reproductive Health (AYSRH)",
  "Family Planning & Comprehensive Abortion Care",
  "Infectious Diseases & PMTCT",
  "Surgery & Critical Care",
  "Internal Medicine",
] as const;

export const userFormSchema = z.object({
  // Personal Information
  first_name: zodName("First name", 2),
  last_name: zodName("Last name", 2),
  gender: z
    .string()
    .min(1, "Please select gender")
    .refine((val) => ["male", "female", "other"].includes(val), {
      message: "Please select gender",
    }),
  phone: zodPhone,
  email: zodEmail,

  // Professional Information
  profession: z.string().trim().min(2, "Profession is required (at least 2 characters)"),
  highest_qualification: z.string().min(1, "Please select highest qualification"),
  thematic_area: z.string().optional(),
  primary_facility: z.string().optional(),

  // Account Creation
  username: z.string().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/\d/, "Password must contain at least one number"),
  force_password_change: z.boolean(),
});

export type UserFormData = z.infer<typeof userFormSchema>;
