import { z } from "zod";

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
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  gender: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Please select gender" }),
  }),
  phone: z.string().min(9, "Phone number must be at least 9 characters"),
  email: z.string().email("Please enter a valid email address"),

  // Professional Information
  profession: z.string().min(2, "Profession is required"),
  highest_qualification: z.string().min(1, "Please select highest qualification"),
  years_of_experience: z.coerce.number().min(0, "Years of experience is required"),
  thematic_area: z.string().min(1, "Please select primary thematic area"),
  primary_facility: z.string().optional(),

  // Account Creation
  username: z.string().min(3, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  force_password_change: z.boolean(),
});

export type UserFormData = z.infer<typeof userFormSchema>;
