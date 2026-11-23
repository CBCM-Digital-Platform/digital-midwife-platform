const NEWS_STATUSES = ["draft", "published", "archived"];

/**
 * @param {string | null | undefined} role
 */
function isNewsAdminRole(role) {
  const normalized = String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[-_\s]/g, "");

  return normalized === "admin" || normalized === "superadmin";
}

/**
 * @param {{ page?: number, limit?: number, status?: string, search?: string }} filters
 */
function buildNewsListParams({ page = 1, limit = 10, status, search } = {}) {
  const params = {
    page: Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1,
    limit: Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10,
  };
  const trimmedSearch = String(search || "").trim();

  if (status && status !== "all") params.status = status;
  if (trimmedSearch) params.search = trimmedSearch;

  return params;
}

/**
 * @param {{ title: string, summary: string, content: string, cover_image_url: string, category: string, status: string, published_at: string }} input
 */
function validateNewsInput(input) {
  const errors = {};
  const title = String(input.title || "").trim();
  const summary = String(input.summary || "").trim();
  const content = String(input.content || "");
  const coverImageUrl = String(input.cover_image_url || "").trim();
  const category = String(input.category || "").trim();

  if (title.length < 3 || title.length > 200) {
    errors.title = "Title must be between 3 and 200 characters.";
  } else if (/<[^>]*>/.test(title)) {
    errors.title = "Title must not contain HTML markup.";
  }

  if (summary.length > 300) {
    errors.summary = "Summary must be at most 300 characters.";
  } else if (/<[^>]*>/.test(summary)) {
    errors.summary = "Summary must not contain HTML markup.";
  }

  if (/<[^>]*>/.test(content)) {
    errors.content = "Content must be plain text or Markdown, not HTML.";
  } else if (input.status === "published" && !content.trim()) {
    errors.content = "Content is required before publishing.";
  }

  if (coverImageUrl) {
    try {
      const url = new URL(coverImageUrl);
      if (!["http:", "https:"].includes(url.protocol) || !url.hostname) {
        errors.cover_image_url = "Cover image URL must use HTTP or HTTPS.";
      }
    } catch {
      errors.cover_image_url = "Enter a valid HTTP or HTTPS URL.";
    }
  }

  if (category.length > 50) {
    errors.category = "Category must be at most 50 characters.";
  }

  if (!NEWS_STATUSES.includes(input.status)) {
    errors.status = "Choose draft, published, or archived.";
  }

  if (input.published_at && !Number.isFinite(Date.parse(input.published_at))) {
    errors.published_at = "Enter a valid publication date.";
  }

  return errors;
}

/**
 * @param {{ title: string, summary: string, content: string, cover_image_url: string, category: string, status: string, published_at: string }} input
 * @param {boolean} isCreate
 */
function buildNewsPayload(input, isCreate) {
  const payload = {
    title: input.title.trim(),
    summary: input.summary.trim() || null,
    content: input.content,
    cover_image_url: input.cover_image_url.trim() || null,
    category: input.category.trim() || null,
    status: input.status || "draft",
  };

  if (input.published_at) {
    payload.published_at = new Date(input.published_at).toISOString();
  } else if (!isCreate) {
    payload.published_at = null;
  }

  return payload;
}

/**
 * @param {string} status
 */
function buildNewsStatusPayload(status) {
  if (!NEWS_STATUSES.includes(status)) {
    throw new Error("Unsupported news status.");
  }

  return { status };
}

/**
 * @param {number} page
 */
function canGoToPreviousNewsPage(page) {
  return page > 1;
}

/**
 * @param {number} page
 * @param {number} totalPages
 */
function canGoToNextNewsPage(page, totalPages) {
  return page < totalPages;
}

module.exports = {
  NEWS_STATUSES,
  isNewsAdminRole,
  buildNewsListParams,
  validateNewsInput,
  buildNewsPayload,
  buildNewsStatusPayload,
  canGoToPreviousNewsPage,
  canGoToNextNewsPage,
};
