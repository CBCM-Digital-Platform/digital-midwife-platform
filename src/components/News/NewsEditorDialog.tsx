"use client";

import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import newsManagement from "@/lib/news-management";
import type {
  NewsArticle,
  NewsFormValues,
} from "@/services/news.service";

interface NewsEditorDialogProps {
  article: NewsArticle | null;
  onClose: () => void;
  onSave: (values: NewsFormValues, articleId?: number) => Promise<void>;
}

type FieldErrors = Partial<Record<keyof NewsFormValues, string>>;

function toLocalDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function NewsEditorDialog({
  article,
  onClose,
  onSave,
}: NewsEditorDialogProps) {
  const [values, setValues] = useState<NewsFormValues>({
    title: article?.title || "",
    summary: article?.summary || "",
    content: article?.content || "",
    cover_image_url: article?.cover_image_url || "",
    category: article?.category || "",
    status: article?.status || "draft",
    published_at: toLocalDateTime(article?.published_at || null),
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const updateField = <K extends keyof NewsFormValues>(
    key: K,
    value: NewsFormValues[K]
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);
    const errors = newsManagement.validateNewsInput(values) as FieldErrors;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    try {
      await onSave(values, article?.id);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unable to save the article.");
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClassName =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#194611]";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{article ? "Edit news article" : "Create news article"}</DialogTitle>
          <DialogDescription>
            Use plain text or Markdown for content. HTML markup is not supported.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {apiError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {apiError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="news-title">Title <span aria-hidden="true">*</span></Label>
            <Input
              id="news-title"
              value={values.title}
              onChange={(event) => updateField("title", event.target.value)}
              minLength={3}
              maxLength={200}
              required
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? "news-title-error" : undefined}
            />
            {fieldErrors.title && <p id="news-title-error" className="text-sm text-red-700">{fieldErrors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="news-summary">Summary</Label>
            <Textarea
              id="news-summary"
              value={values.summary}
              onChange={(event) => updateField("summary", event.target.value)}
              maxLength={300}
              rows={2}
              aria-invalid={Boolean(fieldErrors.summary)}
              aria-describedby={fieldErrors.summary ? "news-summary-error" : undefined}
            />
            {fieldErrors.summary && <p id="news-summary-error" className="text-sm text-red-700">{fieldErrors.summary}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="news-content">Content</Label>
            <Textarea
              id="news-content"
              value={values.content}
              onChange={(event) => updateField("content", event.target.value)}
              rows={8}
              className="font-mono"
              aria-invalid={Boolean(fieldErrors.content)}
              aria-describedby={fieldErrors.content ? "news-content-error" : "news-content-help"}
            />
            <p id="news-content-help" className="text-xs text-gray-500">
              Markdown is stored as text and is never rendered as HTML. Content is required to publish.
            </p>
            {fieldErrors.content && <p id="news-content-error" className="text-sm text-red-700">{fieldErrors.content}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="news-cover-image">Cover image URL</Label>
              <Input
                id="news-cover-image"
                type="url"
                value={values.cover_image_url}
                onChange={(event) => updateField("cover_image_url", event.target.value)}
                placeholder="https://example.com/image.jpg"
                aria-invalid={Boolean(fieldErrors.cover_image_url)}
                aria-describedby={fieldErrors.cover_image_url ? "news-cover-image-error" : undefined}
              />
              {fieldErrors.cover_image_url && <p id="news-cover-image-error" className="text-sm text-red-700">{fieldErrors.cover_image_url}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="news-category">Category</Label>
              <Input
                id="news-category"
                value={values.category}
                onChange={(event) => updateField("category", event.target.value)}
                maxLength={50}
                aria-invalid={Boolean(fieldErrors.category)}
                aria-describedby={fieldErrors.category ? "news-category-error" : undefined}
              />
              {fieldErrors.category && <p id="news-category-error" className="text-sm text-red-700">{fieldErrors.category}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="news-status">Status</Label>
              <select
                id="news-status"
                value={values.status}
                onChange={(event) => updateField("status", event.target.value as NewsFormValues["status"])}
                className={fieldClassName}
                aria-invalid={Boolean(fieldErrors.status)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              {fieldErrors.status && <p className="text-sm text-red-700">{fieldErrors.status}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="news-published-at">Publication date (optional)</Label>
              <Input
                id="news-published-at"
                type="datetime-local"
                value={values.published_at}
                onChange={(event) => updateField("published_at", event.target.value)}
                aria-invalid={Boolean(fieldErrors.published_at)}
                aria-describedby={fieldErrors.published_at ? "news-published-at-error" : undefined}
              />
              {fieldErrors.published_at && <p id="news-published-at-error" className="text-sm text-red-700">{fieldErrors.published_at}</p>}
              <p className="text-xs text-gray-500">A future publication date schedules the article.</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : article ? "Save changes" : "Create article"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
