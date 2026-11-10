import { z } from "zod";

export const MAX_FILES = 5;
export const MAX_FILE_MB = 10;
export const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx", "png", "jpg", "jpeg", "mp4"];

export function fileExtension(name: string) {
    return name.split(".").pop()?.toLowerCase() ?? "";
}

export const assessmentSchema = z
    .object({
        menteeId: z.string().min(1, "Select a mentee"),
        type: z.string().min(1, "Select an assessment type"),
        dueDate: z.string().min(1, "Due date is required"),
        instructions: z.string().trim().min(10, "Describe the task (at least 10 characters)"),
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