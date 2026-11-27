const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildNewsListParams,
  buildNewsPayload,
  buildNewsStatusPayload,
  canGoToNextNewsPage,
  canGoToPreviousNewsPage,
  isNewsAdminRole,
  validateNewsInput,
} = require("../src/lib/news-management");

const validDraft = {
  title: "Community update",
  summary: "",
  content: "A Markdown **update**.",
  cover_image_url: "",
  category: "",
  status: "draft",
  published_at: "",
};

test("News navigation access is limited to admin and Super Admin roles", () => {
  assert.equal(isNewsAdminRole("admin"), true);
  assert.equal(isNewsAdminRole("super_admin"), true);
  assert.equal(isNewsAdminRole("Super Admin"), true);
  assert.equal(isNewsAdminRole("facility_admin"), false);
  assert.equal(isNewsAdminRole("mentor"), false);
});

test("admin list filters send page and limit and omit empty optional filters", () => {
  assert.deepEqual(buildNewsListParams({ page: 1, limit: 10, status: "all", search: "  " }), {
    page: 1,
    limit: 10,
  });
  assert.deepEqual(buildNewsListParams({ page: 3, limit: 10, status: "published", search: " clinic " }), {
    page: 3,
    limit: 10,
    status: "published",
    search: "clinic",
  });
});

test("pagination controls respect the current and final page", () => {
  assert.equal(canGoToPreviousNewsPage(1), false);
  assert.equal(canGoToPreviousNewsPage(2), true);
  assert.equal(canGoToNextNewsPage(1, 3), true);
  assert.equal(canGoToNextNewsPage(3, 3), false);
});

test("form validation enforces title, optional field limits, URL protocol, and publish content", () => {
  assert.deepEqual(validateNewsInput(validDraft), {});
  assert.equal(validateNewsInput({ ...validDraft, title: "ab" }).title, "Title must be between 3 and 200 characters.");
  assert.equal(validateNewsInput({ ...validDraft, summary: "x".repeat(301) }).summary, "Summary must be at most 300 characters.");
  assert.ok(validateNewsInput({ ...validDraft, category: "x".repeat(51) }).category);
  assert.ok(validateNewsInput({ ...validDraft, cover_image_url: "ftp://example.com/image.png" }).cover_image_url);
  assert.ok(validateNewsInput({ ...validDraft, status: "published", content: "  " }).content);
  assert.ok(validateNewsInput({ ...validDraft, content: "<script>alert(1)</script>" }).content);
});

test("create and edit payloads use the news API fields without author_id", () => {
  const created = buildNewsPayload(validDraft, true);
  assert.equal(created.title, "Community update");
  assert.equal(created.status, "draft");
  assert.equal(created.summary, null);
  assert.equal("author_id" in created, false);
  assert.equal("published_at" in created, false);

  const edited = buildNewsPayload({ ...validDraft, published_at: "2026-11-20T09:30" }, false);
  assert.equal(edited.published_at, new Date("2026-11-20T09:30").toISOString());
  assert.equal(edited.status, "draft");
});

test("status actions map to published, draft (unpublish), and archived patches", () => {
  assert.deepEqual(buildNewsStatusPayload("published"), { status: "published" });
  assert.deepEqual(buildNewsStatusPayload("draft"), { status: "draft" });
  assert.deepEqual(buildNewsStatusPayload("archived"), { status: "archived" });
  assert.throws(() => buildNewsStatusPayload("invalid"), /Unsupported news status/);
});
