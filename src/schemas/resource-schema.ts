import { z } from "zod";

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
      if (!data.url || data.url.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["url"],
          message: "A destination URL is required for Link resources.",
        });
      } else {
        const trimmed = data.url.trim();
        // Allow http://, https://, or standard url format
        const isValidUrl =
          trimmed.startsWith("http://") ||
          trimmed.startsWith("https://") ||
          trimmed.startsWith("/") ||
          trimmed.includes(".");
        if (!isValidUrl) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["url"],
            message: "Please enter a valid web URL (e.g. https://who.int/...)",
          });
        }
      }
    }
  });

export type ResourceFormData = z.infer<typeof resourceFormSchema>;
