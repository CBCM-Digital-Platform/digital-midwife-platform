import { z } from "zod";

export const THEMATIC_AREAS = [
    "Pediatrics",
    "Reproductive Health",
    "Assessment & Youth Health",
] as const;

export const ASSESSMENT_FREQUENCIES = [
    { value: "WEEKLY", label: "Weekly" },
    { value: "BI_WEEKLY", label: "Bi-weekly" },
    { value: "MONTHLY", label: "Monthly" },
] as const;

const positiveInt = (label: string) =>
    z
        .number({
            required_error: `${label} is required`,
            invalid_type_error: `${label} is required`,
        })
        .int("Must be a whole number")
        .min(1, "Must be at least 1");

export const cycleSchema = z
    .object({
        name: z.string().trim().min(3, "Cycle name is required (min 3 characters)"),
        code: z.string().trim().min(2, "Cycle code is required"),
        description: z.string().optional(),
        startDate: z.string().min(1, "Start date is required"),
        endDate: z.string().min(1, "End date is required"),
        facilityIds: z.array(z.string()).min(1, "Select at least one facility"),
        thematicAreas: z.array(z.string()).min(1, "Select at least one thematic area"),
        targetMentors: positiveInt("Target mentors"),
        targetMentees: positiveInt("Target mentees"),
        maxMenteesPerMentor: positiveInt("Max mentees per mentor"),
        maxFacilitiesPerMentor: positiveInt("Max facilities per mentor"),
        assessmentFrequency: z.enum(["WEEKLY", "BI_WEEKLY", "MONTHLY"]),
        notes: z.string().optional(),
    })
    .refine((d) => !d.startDate || !d.endDate || d.endDate > d.startDate, {
        message: "End date must be after start date",
        path: ["endDate"],
    });

export type CycleFormValues = z.infer<typeof cycleSchema>;