import { apiClient } from "@/lib/api-client";
import type { LandingPageContent } from "@/types/landing-page";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message?: string;
  };
}

interface LandingPageResponse {
  content: LandingPageContent;
  updated_at: string;
}

function requireLandingPage(response: ApiResponse<LandingPageResponse>): LandingPageContent {
  if (!response?.success || !response.data?.content || typeof response.data.content !== "object") {
    throw new Error(response?.error?.message || "The landing page API returned invalid content.");
  }
  return response.data.content;
}

export async function getPublicLandingPageContent(): Promise<LandingPageContent> {
  return requireLandingPage(
    await apiClient.get<ApiResponse<LandingPageResponse>>("/api/v1/landing-page")
  );
}

export async function getAdminLandingPageContent(): Promise<LandingPageContent> {
  return requireLandingPage(
    await apiClient.get<ApiResponse<LandingPageResponse>>("/api/v1/landing-page/admin")
  );
}

export async function updateLandingPageContent(content: LandingPageContent): Promise<LandingPageContent> {
  return requireLandingPage(
    await apiClient.patch<ApiResponse<LandingPageResponse>>(
      "/api/v1/landing-page/admin",
      { content }
    )
  );
}
