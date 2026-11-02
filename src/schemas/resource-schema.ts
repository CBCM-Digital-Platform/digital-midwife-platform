import { z } from "zod";
import { validateUrl } from "@/lib/validators";

export const resourceTypeOptions = [
  { value: "document", label: "Document (PDF, Manual, Guideline)" },
  { value: "video", label: "Video (Training, Demonstration)" },
  { value: "link", label: "Link (External Portal, Guideline Registry)" },
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
    type: z.enum(["document", "video", "link"], {
      errorMap: () => ({ message: "Please select a valid resource type." }),
    }),
    url: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    // If resource type is "link", a valid URL or web reference is required
    if (data.type === "link") {
      const urlResult = validateUrl(data.url, true);
      if (!urlResult.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["url"],
          message: urlResult.error || "Please enter a valid web URL (e.g. https://who.int/guideline).",
        });
      }
    } else if (data.url && data.url.trim().length > 0) {
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
