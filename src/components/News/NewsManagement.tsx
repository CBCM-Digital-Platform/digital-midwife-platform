"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AlertCircle, Loader2, Newspaper, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsEditorDialog } from "@/components/News/NewsEditorDialog";
import newsManagement from "@/lib/news-management";
import {
  createNews,
  deleteNews,
  getAdminNews,
  updateNews,
  updateNewsStatus,
  type NewsArticle,
  type NewsFormValues,
  type NewsPage,
  type NewsStatus,
} from "@/services/news.service";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "The request could not be completed.";
}

function statusClass(status: NewsStatus): string {
  if (status === "published") return "border-green-200 bg-green-50 text-green-800";
  if (status === "archived") return "border-gray-200 bg-gray-100 text-gray-700";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

export function NewsManagement() {
  const [news, setNews] = useState<NewsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("all");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [editorArticle, setEditorArticle] = useState<NewsArticle | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [busyArticleId, setBusyArticleId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    getAdminNews({
      page,
      limit: 10,
      status: appliedStatus as NewsStatus | "all",
      search: appliedSearch,
    })
      .then((result) => {
        if (active) {
          setNews(result);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) setLoadError(errorText(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, appliedStatus, appliedSearch, reloadKey]);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setLoadError(null);
    setPage(1);
    setAppliedStatus(filterStatus);
    setAppliedSearch(searchInput.trim());
    setReloadKey((current) => current + 1);
  };

  const openCreateForm = () => {
    setEditorArticle(null);
    setIsEditorOpen(true);
  };

  const openEditForm = (article: NewsArticle) => {
    setEditorArticle(article);
    setIsEditorOpen(true);
  };

  const saveArticle = async (values: NewsFormValues, articleId?: number) => {
    if (articleId === undefined) {
      await createNews(values);
      setNotice({ type: "success", message: "News article created." });
    } else {
      await updateNews(articleId, values);
      setNotice({ type: "success", message: "News article updated." });
    }
    setIsEditorOpen(false);
    setEditorArticle(null);
    setLoading(true);
    setLoadError(null);
    setReloadKey((current) => current + 1);
  };

  const changeStatus = async (article: NewsArticle, status: NewsStatus) => {
    if (status === "published" && !article.content?.trim()) {
      setActionError(`“${article.title}” needs content before it can be published. Edit the article to add content.`);
      return;
    }

    setBusyArticleId(article.id);
    setActionError(null);
    setNotice(null);
    try {
      await updateNewsStatus(article.id, status);
      const message =
        status === "draft"
          ? "Article unpublished and returned to draft."
          : status === "published"
            ? "Article published or scheduled."
            : "Article archived.";
      setNotice({ type: "success", message });
      setLoading(true);
      setLoadError(null);
      setReloadKey((current) => current + 1);
    } catch (error) {
      setActionError(errorText(error));
    } finally {
      setBusyArticleId(null);
    }
  };

  const removeArticle = async (article: NewsArticle) => {
    if (!window.confirm(`Permanently delete “${article.title}”? This cannot be undone.`)) return;

    setBusyArticleId(article.id);
    setActionError(null);
    setNotice(null);
    try {
      await deleteNews(article.id);
      setNotice({ type: "success", message: "News article deleted." });
      setLoading(true);
      setLoadError(null);
      setReloadKey((current) => current + 1);
    } catch (error) {
      setActionError(errorText(error));
    } finally {
      setBusyArticleId(null);
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[#194611]">
            <Newspaper className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-semibold">Content management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">News</h1>
          <p className="mt-1 text-sm text-gray-600">Create, publish, schedule, and manage news articles.</p>
        </div>
        <Button type="button" onClick={openCreateForm}>
          <Plus aria-hidden="true" />
          Add News
        </Button>
      </header>

      <form
        className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row"
        onSubmit={applyFilters}
      >
        <label className="flex-1">
          <span className="sr-only">Search news titles</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              maxLength={200}
              placeholder="Search titles..."
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#194611]"
            />
          </span>
        </label>
        <label className="sm:w-44">
          <span className="sr-only">Filter by status</span>
          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#194611]"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <Button type="submit">Apply filters</Button>
      </form>

      {notice && (
        <div
          role={notice.type === "success" ? "status" : "alert"}
          className={`rounded-lg border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {notice.message}
        </div>
      )}
      {actionError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-gray-600" role="status">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Loading news...
          </div>
        ) : loadError ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-red-700" role="alert">{loadError}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLoading(true);
                setLoadError(null);
                setReloadKey((current) => current + 1);
              }}
            >
              Try again
            </Button>
          </div>
        ) : news && news.items.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Title</th>
                    <th scope="col" className="px-4 py-3">Category</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Publication date</th>
                    <th scope="col" className="px-4 py-3">Updated</th>
                    <th scope="col" className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {news.items.map((article) => {
                    const isBusy = busyArticleId === article.id;
                    const nextStatus: NewsStatus =
                      article.status === "published" ? "draft" : "published";
                    const statusAction = article.status === "published" ? "Unpublish" : "Publish";

                    return (
                      <tr key={article.id} className="align-top">
                        <td className="max-w-sm px-4 py-4">
                          <p className="font-semibold text-gray-900">{article.title}</p>
                          {article.summary && (
                            <p className="mt-1 line-clamp-2 text-xs text-gray-500">{article.summary}</p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-gray-700">{article.category || "—"}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusClass(article.status)}`}>
                            {article.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-700">{formatDate(article.published_at)}</td>
                        <td className="px-4 py-4 text-gray-700">{formatDate(article.updated_at)}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="font-medium text-[#194611] underline-offset-2 hover:underline disabled:opacity-50"
                              onClick={() => openEditForm(article)}
                              disabled={isBusy}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="font-medium text-[#194611] underline-offset-2 hover:underline disabled:opacity-50"
                              onClick={() => changeStatus(article, nextStatus)}
                              disabled={isBusy}
                            >
                              {isBusy ? "Saving..." : statusAction}
                            </button>
                            {article.status !== "archived" && (
                              <button
                                type="button"
                                className="font-medium text-gray-700 underline-offset-2 hover:underline disabled:opacity-50"
                                onClick={() => changeStatus(article, "archived")}
                                disabled={isBusy}
                              >
                                Archive
                              </button>
                            )}
                            <button
                              type="button"
                              className="font-medium text-red-700 underline-offset-2 hover:underline disabled:opacity-50"
                              onClick={() => removeArticle(article)}
                              disabled={isBusy}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                {news.total} {news.total === 1 ? "article" : "articles"} · Page {news.page} of {news.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPage((current) => current - 1)}
                  disabled={!newsManagement.canGoToPreviousNewsPage(news.page)}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={!newsManagement.canGoToNextNewsPage(news.page, news.totalPages)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
            <Newspaper className="mb-3 h-8 w-8 text-gray-300" aria-hidden="true" />
            <p className="font-medium text-gray-800">No news articles found</p>
            <p className="mt-1 text-sm text-gray-500">Try another search or create a new article.</p>
          </div>
        )}
      </div>

      {isEditorOpen && (
        <NewsEditorDialog
          article={editorArticle}
          onClose={() => {
            setIsEditorOpen(false);
            setEditorArticle(null);
          }}
          onSave={saveArticle}
        />
      )}
    </section>
  );
}
