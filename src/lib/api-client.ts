/**
 * src/lib/api-client.ts
 *
 * Reusable, isomorphic API Client for the Digital Midwife Platform.
 * Compatible with Next.js App Router (Server Components & Client Components).
 *
 * Features:
 * 1. Base URL resolution using process.env.NEXT_PUBLIC_API_URL.
 * 2. Automatic NextAuth session retrieval & Bearer token attachment.
 * 3. Query parameter serialization.
 * 4. Automatic JSON serialization & error parsing.
 * 5. Full support for Next.js caching options (revalidate, tags, cache).
 */

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: any;
  token?: string; // Optional manual override
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

/**
 * Safely resolves the active access token across both Server and Client environments.
 */
async function resolveAccessToken(): Promise<string | null> {
  try {
    if (typeof window === "undefined") {
      // SERVER-SIDE: Read cookies via NextAuth getServerSession
      const { getServerSession } = await import("next-auth/next");
      const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
      const session = await getServerSession(authOptions);
      return session?.accessToken || (session as any)?.user?.accessToken || null;
    } else {
      // CLIENT-SIDE: Read session from NextAuth client provider
      const { getSession } = await import("next-auth/react");
      const session = await getSession();
      return session?.accessToken || (session as any)?.user?.accessToken || null;
    }
  } catch (err) {
    // If running in an unauthenticated or public context, proceed without token
    return null;
  }
}

/**
 * Builds the complete URL by combining NEXT_PUBLIC_API_URL and the endpoint path.
 */
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): string {
  // If endpoint is already an absolute URL (e.g. starts with http:// or https://), use it directly
  let fullUrl: string;
  if (/^https?:\/\//i.test(endpoint)) {
    fullUrl = endpoint;
  } else {
    const rawBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    fullUrl = `${rawBase}${cleanEndpoint}`;
  }

  // Append query parameters if provided
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      fullUrl += fullUrl.includes("?") ? `&${queryString}` : `?${queryString}`;
    }
  }

  return fullUrl;
}

/**
 * Primary fetch wrapper.
 *
 * @example
 * // GET request with auto-attached token
 * const mentees = await apiClient<MenteeUser[]>("/api/v1/users?role=mentee");
 *
 * @example
 * // POST request with JSON body
 * const newMentor = await apiClient.post<MentorUser>("/api/v1/users", {
 *   name: "Sister Almaz",
 *   role: "mentor"
 * });
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { params, body, token: explicitToken, headers: customHeaders, ...fetchOptions } = options;

  const url = buildUrl(endpoint, params);
  const headers = new Headers(customHeaders);

  // 1. Attach Bearer token if not already explicitly provided in headers
  if (!headers.has("Authorization")) {
    const token = explicitToken || (await resolveAccessToken());
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // 2. Handle Body and Content-Type
  let resolvedBody: BodyInit | undefined = undefined;
  if (body !== undefined && body !== null) {
    if (typeof body === "string" || body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob) {
      resolvedBody = body;
    } else {
      // Plain JavaScript object or array
      resolvedBody = JSON.stringify(body);
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    }
  }

  // 3. Ensure Accept header defaults to application/json
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  // 4. Execute fetch
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    body: resolvedBody,
  });

  // 5. Handle HTTP errors
  if (!response.ok) {
    let errorData: any = null;
    let errorMessage = `API request failed with status ${response.status}: ${response.statusText}`;

    try {
      errorData = await response.json();
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.error?.message) {
        errorMessage = errorData.error.message;
      } else if (errorData?.error) {
        errorMessage = typeof errorData.error === "string" ? errorData.error : JSON.stringify(errorData.error);
      }
    } catch {
      // Response was not JSON
    }

    throw new ApiError(errorMessage, response.status, errorData);
  }

  // 6. Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  // 7. Parse and return JSON response
  try {
    const json = await response.json();
    return json as T;
  } catch {
    return {} as T;
  }
}

// Convenience helper methods
apiClient.get = <T = any>(endpoint: string, options?: Omit<ApiRequestOptions, "method" | "body">) => {
  return apiClient<T>(endpoint, { ...options, method: "GET" });
};

apiClient.post = <T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, "method" | "body">) => {
  return apiClient<T>(endpoint, { ...options, method: "POST", body });
};

apiClient.put = <T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, "method" | "body">) => {
  return apiClient<T>(endpoint, { ...options, method: "PUT", body });
};

apiClient.patch = <T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, "method" | "body">) => {
  return apiClient<T>(endpoint, { ...options, method: "PATCH", body });
};

apiClient.delete = <T = any>(endpoint: string, options?: Omit<ApiRequestOptions, "method" | "body">) => {
  return apiClient<T>(endpoint, { ...options, method: "DELETE" });
};

export default apiClient;
