import { apiClient } from "@/lib/api-client";

export interface PasswordResetResponse {
  success?: boolean;
  message?: string;
  data?: any;
}

/**
 * Initiates the password reset flow by calling POST /api/v1/auth/forgot-password
 *
 * @param email - The user's account email address
 */
export async function requestPasswordReset(email: string): Promise<PasswordResetResponse> {
  return await apiClient.post<PasswordResetResponse>("/api/v1/auth/forgot-password", {
    email: email.trim().toLowerCase(),
  });
}

/**
 * Completes the password reset flow by calling POST /api/v1/auth/reset-password
 *
 * @param token - The one-time reset token from the reset link
 * @param newPassword - The new password selected by the user
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<PasswordResetResponse> {
  return await apiClient.post<PasswordResetResponse>("/api/v1/auth/reset-password", {
    token: token.trim(),
    resetToken: token.trim(),
    newPassword,
    new_password: newPassword,
  });
}
