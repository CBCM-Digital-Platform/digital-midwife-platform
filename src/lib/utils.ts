export { cn } from "cn";

/**
 * Formats a user display name for welcome greetings by removing email domains
 * (e.g. @gmail.com or @company.com), role parentheses, and extracting the clean first name.
 *
 * @example
 * formatWelcomeName("burte@gmail.com") // "Burte"
 * formatWelcomeName("birtukan.kussa@gmail.com") // "Birtukan"
 * formatWelcomeName("Birtukan (Facility Admin)") // "Birtukan"
 * formatWelcomeName("admin@test.com") // "Admin"
 */
export function formatWelcomeName(rawName?: string | null): string {
  if (!rawName) return "Administrator";
  let str = rawName.trim();

  // 1. Remove email domain if present (anything after and including @)
  if (str.includes("@")) {
    str = str.split("@")[0].trim();
  }

  // 2. Remove parenthetical descriptions (e.g. "(Facility Admin)", "(Mentor)")
  str = str.replace(/\s*\([^)]*\)/g, "").trim();

  // 3. If username has dots, hyphens, or underscores (e.g. first.last), extract first part
  if (str.includes(".") || str.includes("_") || str.includes("-")) {
    str = str.split(/[._-]/)[0].trim();
  }

  // 4. Extract first name
  const parts = str.split(/\s+/).filter(Boolean);
  let firstName = parts[0] || "User";

  // Skip common titles if followed by a name (e.g. "Sister Almaz" -> "Almaz")
  if (
    ["sister", "dr", "dr.", "nurse", "midwife", "ato", "w/ro"].includes(
      firstName.toLowerCase()
    ) &&
    parts.length > 1
  ) {
    firstName = parts[1];
  }

  // 5. Capitalize first letter cleanly
  if (firstName.length > 0) {
    firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  }

  return firstName || "Administrator";
}
