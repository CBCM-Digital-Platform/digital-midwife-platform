import { z } from "zod";

/**
 * Validation Result interface for all manual validator functions.
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates an email address according to RFC 5322 specifications.
 * Enforces proper local-part, single @, domain, and a top-level domain (TLD) of at least 2 characters.
 */
export function validateEmail(
  val: string | null | undefined,
  required = true
): ValidationResult {
  const trimmed = (val ?? "").trim();

  if (!trimmed) {
    if (required) {
      return { valid: false, error: "Email address is required." };
    }
    return { valid: true };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: "Email address cannot exceed 254 characters." };
  }

  if (/\s/.test(trimmed)) {
    return { valid: false, error: "Email address cannot contain spaces." };
  }

  if (!trimmed.includes("@")) {
    return { valid: false, error: "Email must include an '@' symbol." };
  }

  const parts = trimmed.split("@");
  if (parts.length !== 2) {
    return { valid: false, error: "Email address cannot contain multiple '@' symbols." };
  }

  const [local, domain] = parts;
  if (!local) {
    return { valid: false, error: "Email must have a username before '@'." };
  }
  if (!domain) {
    return { valid: false, error: "Email must have a domain name after '@'." };
  }
  if (!domain.includes(".")) {
    return {
      valid: false,
      error: "Email domain must include a top-level domain (e.g., .org or .com).",
    };
  }

  // RFC-compliant email regex ensuring a valid 2+ char TLD
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return {
      valid: false,
      error: "Please enter a valid email address (e.g., user@facility.org).",
    };
  }

  return { valid: true };
}

/**
 * Validates a telephone number against ITU-T E.164 and Ethiopian national telecom standards.
 * Supports national formats (e.g., 0911234567, 0712345678) and international (+251..., +1...).
 */
export function validatePhone(
  val: string | null | undefined,
  required = false
): ValidationResult {
  const trimmed = (val ?? "").trim();

  if (!trimmed) {
    if (required) {
      return { valid: false, error: "Phone number is required." };
    }
    return { valid: true };
  }

  // Check for disallowed characters (only digits, spaces, dashes, parentheses, leading plus allowed)
  if (!/^\+?[0-9\s\-()]+$/.test(trimmed)) {
    return {
      valid: false,
      error: "Phone number can only contain digits, spaces, hyphens, and an optional '+' country code.",
    };
  }

  // Extract pure digits
  const pureDigits = trimmed.replace(/\D/g, "");

  if (pureDigits.length < 7) {
    return {
      valid: false,
      error: "Phone number is too short (minimum 7 digits).",
    };
  }

  if (pureDigits.length > 15) {
    return {
      valid: false,
      error: "Phone number cannot exceed 15 digits (ITU-T E.164 standard).",
    };
  }

  // Specific Ethiopian telecom validation when prefixed with +251 or 09 / 07
  if (trimmed.startsWith("+251")) {
    if (pureDigits.length !== 12) {
      return {
        valid: false,
        error: "Ethiopian international numbers (+251) must have 9 digits after country code (e.g., +251911234567).",
      };
    }
  } else if (/^0[97]/.test(pureDigits)) {
    if (pureDigits.length !== 10) {
      return {
        valid: false,
        error: "National mobile numbers starting with 09 or 07 must be exactly 10 digits (e.g., 0911234567).",
      };
    }
  }

  return { valid: true };
}

/**
 * Validates human names (e.g. First Name, Last Name, Full Name).
 * Checks minimum character lengths and prevents invalid numeric/symbol injection.
 */
export function validateName(
  val: string | null | undefined,
  fieldLabel = "Name",
  minLength = 2,
  required = true
): ValidationResult {
  const trimmed = (val ?? "").trim();

  if (!trimmed) {
    if (required) {
      return { valid: false, error: `${fieldLabel} is required.` };
    }
    return { valid: true };
  }

  if (trimmed.length < minLength) {
    return {
      valid: false,
      error: `${fieldLabel} must be at least ${minLength} characters long.`,
    };
  }

  if (trimmed.length > 100) {
    return {
      valid: false,
      error: `${fieldLabel} cannot exceed 100 characters.`,
    };
  }

  // Allows letters (Unicode support for multi-language names), spaces, hyphens, periods, and apostrophes
  const nameRegex = /^[\p{L}\s.'\-]+$/u;
  if (!nameRegex.test(trimmed)) {
    return {
      valid: false,
      error: `${fieldLabel} can only contain letters, spaces, hyphens, and apostrophes.`,
    };
  }

  return { valid: true };
}

/**
 * Validates a required text field.
 */
export function validateRequired(
  val: string | number | null | undefined,
  fieldLabel: string,
  minLength = 1
): ValidationResult {
  const str = String(val ?? "").trim();
  if (!str) {
    return { valid: false, error: `${fieldLabel} is required.` };
  }
  if (str.length < minLength) {
    return {
      valid: false,
      error: `${fieldLabel} must be at least ${minLength} characters.`,
    };
  }
  return { valid: true };
}

/**
 * Validates a URL / Web link.
 */
export function validateUrl(
  val: string | null | undefined,
  required = false
): ValidationResult {
  const trimmed = (val ?? "").trim();

  if (!trimmed) {
    if (required) {
      return { valid: false, error: "A destination URL is required." };
    }
    return { valid: true };
  }

  try {
    const url = new URL(trimmed);
    if (!["http:", "https:"].includes(url.protocol)) {
      return {
        valid: false,
        error: "URL must begin with http:// or https://",
      };
    }
    if (!url.hostname.includes(".")) {
      return {
        valid: false,
        error: "URL must contain a valid domain (e.g., https://who.int).",
      };
    }
    return { valid: true };
  } catch {
    // If user provided a domain without protocol, prompt clearly
    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed)) {
      return {
        valid: false,
        error: "Please include https:// at the beginning of the URL.",
      };
    }
    return {
      valid: false,
      error: "Please enter a valid web URL (e.g., https://who.int/guideline).",
    };
  }
}

/**
 * Validates a password against clinical platform security requirements.
 */
export function validatePassword(
  val: string | null | undefined,
  options: {
    minLength?: number;
    requireNumber?: boolean;
    requireSpecial?: boolean;
    requireLetter?: boolean;
  } = {}
): ValidationResult {
  const {
    minLength = 8,
    requireNumber = true,
    requireSpecial = false,
    requireLetter = true,
  } = options;

  const str = val ?? "";

  if (!str) {
    return { valid: false, error: "Password is required." };
  }

  if (str.length < minLength) {
    return {
      valid: false,
      error: `Password must be at least ${minLength} characters long.`,
    };
  }

  if (requireLetter && !/[A-Za-z]/.test(str)) {
    return {
      valid: false,
      error: "Password must include at least one letter.",
    };
  }

  if (requireNumber && !/\d/.test(str)) {
    return {
      valid: false,
      error: "Password must include at least one number.",
    };
  }

  if (requireSpecial && !/[^A-Za-z0-9]/.test(str)) {
    return {
      valid: false,
      error: "Password must include at least one special symbol.",
    };
  }

  return { valid: true };
}

/**
 * Validates a start and end date range.
 */
export function validateDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  startLabel = "Start date",
  endLabel = "End date"
): ValidationResult {
  if (!startDate) {
    return { valid: false, error: `${startLabel} is required.` };
  }
  if (!endDate) {
    return { valid: false, error: `${endLabel} is required.` };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return { valid: false, error: `Invalid ${startLabel.toLowerCase()}.` };
  }
  if (isNaN(end.getTime())) {
    return { valid: false, error: `Invalid ${endLabel.toLowerCase()}.` };
  }

  if (end < start) {
    return {
      valid: false,
      error: `${endLabel} cannot be earlier than ${startLabel.toLowerCase()}.`,
    };
  }

  return { valid: true };
}

// ============================================================================
// ZOD REUSABLE SCHEMA PRIMITIVES
// ============================================================================

export const zodEmail = z
  .string()
  .trim()
  .min(1, "Email address is required.")
  .superRefine((val, ctx) => {
    const res = validateEmail(val, true);
    if (!res.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: res.error || "Please enter a valid email address.",
      });
    }
  });

export const zodOptionalEmail = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .superRefine((val, ctx) => {
    if (val && val.trim().length > 0) {
      const res = validateEmail(val, false);
      if (!res.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: res.error || "Please enter a valid email address.",
        });
      }
    }
  });

export const zodPhone = z
  .string()
  .trim()
  .min(1, "Phone number is required.")
  .superRefine((val, ctx) => {
    const res = validatePhone(val, true);
    if (!res.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: res.error || "Please enter a valid phone number.",
      });
    }
  });

export const zodOptionalPhone = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .superRefine((val, ctx) => {
    if (val && val.trim().length > 0) {
      const res = validatePhone(val, false);
      if (!res.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: res.error || "Please enter a valid phone number.",
        });
      }
    }
  });

export const zodName = (label = "Name", minLength = 2) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .superRefine((val, ctx) => {
      const res = validateName(val, label, minLength, true);
      if (!res.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: res.error || `${label} contains invalid characters.`,
        });
      }
    });
