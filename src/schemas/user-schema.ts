import { z } from "zod";

export const thematicAreasList = [
  "Pediatrics & Neo",
  "Emergency Care",
  "Maternal & Child",
  "Surgery & Critical",
  "Internal Medicine",
  "Infectious Diseases",
  "Oncology",
  "Cardiovascular",
  "Critical Care",
] as const;

export const userFormSchema = z
  .object({
    name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().optional(),
    role: z.enum(["mentor", "mentee"]),
    facility: z.string().min(2, "Please specify a clinical facility"),
    thematicArea: z.enum(thematicAreasList),
    profession: z.string().min(2, "Profession / Clinical specialization is required"),
    // Mentor specific
    department: z.string().optional(),
    yearsOfExperience: z.coerce.number().min(0).optional(),
    // Mentee specific
    cadreLevel: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "mentor") {
      if (!data.department || data.department.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Department or Clinical Unit is required for mentors",
          path: ["department"],
        });
      }
      if (data.yearsOfExperience === undefined || data.yearsOfExperience < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Experience must be at least 1 year for mentors",
          path: ["yearsOfExperience"],
        });
      }
    }
  });

export type UserFormData = z.infer<typeof userFormSchema>;

