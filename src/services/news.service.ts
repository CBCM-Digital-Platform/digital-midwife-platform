import { apiClient } from "@/lib/api-client";
import newsManagement from "@/lib/news-management";

export type NewsStatus = "draft" | "published" | "archived";

export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  cover_image_url: string | null;
  category: string | null;
  status: NewsStatus;
  published_at: string | null;
  author_id: number;
  created_at: string;
  updated_at: string;
}

export interface NewsPage {
  items: NewsArticle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PublicNewsArticle {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  cover_image_url: string | null;
  category: string | null;
  published_at: string;
}

export interface PublicNewsPage {
  items: PublicNewsArticle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NewsListFilters {
  page: number;
  limit: number;
  status?: NewsStatus | "all";
  search?: string;
}

export interface NewsFormValues {
  title: string;
  summary: string;
  content: string;
  cover_image_url: string;
  category: string;
  status: NewsStatus;
  published_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  error?: {
    message?: string;
  };
}

function requireData<T>(response: ApiResponse<T>): T {
  if (!response?.success || response.data === undefined || response.data === null) {
    throw new Error(response?.error?.message || "The news API returned an invalid response.");
  }
  return response.data;
}

export async function getPublicNews(page = 1, limit = 3): Promise<PublicNewsPage> {
  const data = requireData(
    await apiClient.get<ApiResponse<PublicNewsPage>>("/api/v1/news", {
      params: { page, limit },
    })
  );

  if (!Array.isArray(data.items) || !Number.isFinite(data.page) || !Number.isFinite(data.totalPages)) {
    throw new Error("The news API returned an invalid paginated response.");
  }

  return data;
}

export async function getAdminNews(filters: NewsListFilters): Promise<NewsPage> {
  const params = newsManagement.buildNewsListParams(filters);
  const data = requireData(
    await apiClient.get<ApiResponse<NewsPage>>("/api/v1/news/admin", { params })
  );

  if (!Array.isArray(data.items) || !Number.isFinite(data.page) || !Number.isFinite(data.totalPages)) {
    throw new Error("The news API returned an invalid paginated response.");
  }

  return data;
}

export async function createNews(values: NewsFormValues): Promise<NewsArticle> {
  const payload = newsManagement.buildNewsPayload(values, true);
  return requireData(
    await apiClient.post<ApiResponse<NewsArticle>>("/api/v1/news", payload)
  );
}

export async function updateNews(
  id: number,
  values: NewsFormValues
): Promise<NewsArticle> {
  const payload = newsManagement.buildNewsPayload(values, false);
  return requireData(
    await apiClient.patch<ApiResponse<NewsArticle>>(`/api/v1/news/${id}`, payload)
  );
}

export async function updateNewsStatus(
  id: number,
  status: NewsStatus
): Promise<NewsArticle> {
  const payload = newsManagement.buildNewsStatusPayload(status);
  return requireData(
    await apiClient.patch<ApiResponse<NewsArticle>>(`/api/v1/news/${id}`, payload)
  );
}

export async function deleteNews(id: number): Promise<void> {
  const data = requireData(
    await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/api/v1/news/${id}`)
  );

  if (!data.deleted) {
    throw new Error("The news article was not deleted.");
  }
}
