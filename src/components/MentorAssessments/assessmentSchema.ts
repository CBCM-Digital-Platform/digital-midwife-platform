import { z } from "zod";

export const MAX_FILES = 5;
export const MAX_FILE_MB = 10;
export const ALLOWED_EXTENSIONS = ["pdf", "mp3", "wav", "mp4", "mov", "webm"];

export function fileExtension(name: string) {
    return name.split(".").pop()?.toLowerCase() ?? "";
}

export const assessmentSchema = z
    .object({
        menteeId: z.string().min(1, "Select a mentee"),
        thematicAreaId: z.string().min(1, "Select a thematic area"),
        feedback: z.string().optional(),
    });

export type AssessmentFormValues = z.infer<typeof assessmentSchema>;