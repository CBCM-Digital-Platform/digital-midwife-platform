import { z } from "zod";

export const assessmentSchema = z
    .object({
        menteeId: z.string().min(1, "Select a mentee"),
        type: z.string().min(1, "Select a prepared clinical assessment"),
        dueDate: z.string().min(1, "Due date is required"),
        instructions: z.string().trim().min(5, "Clinical task instructions required"),
        referenceLink: z
            .string()
            .trim()
            .url("Enter a valid link, starting with https://")
            .optional()
            .or(z.literal("")),
        feedback: z.string().optional(),
        notifyMentee: z.boolean(),
    })
    .refine((d) => !d.dueDate || d.dueDate >= new Date().toISOString().slice(0, 10), {
        message: "The due date can't be in the past",
        path: ["dueDate"],
    });

export type AssessmentFormValues = z.infer<typeof assessmentSchema>;
