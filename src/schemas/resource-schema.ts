import { z } from "zod";
import { validateUrl } from "@/lib/validators";

export const resourceTypeOptions = [
  { value: "document", label: "Document (PDF, Manual, Guideline)" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video (Training, Demonstration)" },
  { value: "presentation", label: "PowerPoint Presentation" },
] as const;

export const resourceFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Title must be at least 2 characters.")
      .max(150, "Title cannot exceed 150 characters."),
    description: z
      .string()
      .trim()
      .max(1000, "Description cannot exceed 1000 characters.")
      .optional()
      .or(z.literal("")),
    type: z.enum(["document", "audio", "video", "presentation", "link"], {
      errorMap: () => ({ message: "Please select a valid resource type." }),
    }),
    url: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),
    moduleId: z.string().min(1, "A learning module is required."),
  })
  .superRefine((data, ctx) => {
    if (data.url && data.url.trim().length > 0) {
      const urlResult = validateUrl(data.url, false);
      if (!urlResult.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["url"],
          message: urlResult.error || "Please enter a valid web URL.",
        });
      }
    }
  });

export type ResourceFormData = z.infer<typeof resourceFormSchema>;
