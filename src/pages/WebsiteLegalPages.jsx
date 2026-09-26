import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Save,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Scale,
  FileText,
} from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "../utils/apiCall";
import ManagementHub from "../components/common/ManagementHub";
import ManagementButton from "../components/common/ManagementButton";
import ModalScrollLock from "../components/common/ModalScrollLock";

const EMPTY_FORM = {
  page_id: "",
  slug: "",
  title: "",
  content_html: "",
  sort_order: 0,
  status: "active",
};

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export default function WebsiteLegalPages() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isNew, setIsNew] = useState(false);

  const fetchPages = useCallback(async () => {
    const res = await apiCall("/website-legal/pages", "GET");
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || "Failed to load legal pages");
    }
    setPages(Array.isArray(data.data) ? data.data : []);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await fetchPages();
    } catch (err) {
      toast.error(err.message || "Failed to load legal pages");
    } finally {
      setLoading(false);
    }
  }, [fetchPages]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openCreate = () => {
    setIsNew(true);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (page) => {
    setIsNew(false);
    setForm({
      page_id: page.page_id || "",
      slug: page.slug || "",
      title: page.title || "",
      content_html: page.content_html || "",
      sort_order: Number(page.sort_order) || 0,
      status: page.status === "inactive" ? "inactive" : "active",
    });
    setModalOpen(true);
  };

  const setField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && isNew && !prev.slug) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!String(form.title || "").trim()) {
      toast.error("Title is required");
      return;
    }
    const slug = slugify(form.slug || form.title);
    if (!slug) {
      toast.error("Slug is required");
      return;
    }

    setSaving(true);
    try {
      const res = await apiCall("/website-legal/pages", "PUT", {
        page_id: form.page_id || undefined,
        title: String(form.title).trim(),
        slug,
        content_html: form.content_html || "",
        sort_order: Number(form.sort_order) || 0,
        status: form.status,
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Save failed");
      }
      toast.success(isNew ? "Legal page created" : "Legal page updated");
      setModalOpen(false);
      await fetchPages();
    } catch (err) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (page) => {
    if (!page?.page_id) return;
    const ok = window.confirm(
      `Delete "${page.title}"? This removes it from the website.`
    );
    if (!ok) return;
    try {
      const res = await apiCall(
        `/website-legal/pages/${encodeURIComponent(page.page_id)}`,
        "DELETE"
      );
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Delete failed");
      }
      toast.success("Legal page deleted");
      await fetchPages();
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const summary = useMemo(
    () => [
      { label: "Total pages", value: String(pages.length) },
      {
        label: "Active",
        value: String(pages.filter((p) => p.status === "active").length),
      },
      {
        label: "Inactive",
        value: String(pages.filter((p) => p.status !== "active").length),
      },
    ],
    [pages]
  );

  return (
    <>
      <ManagementHub
        eyebrow="Configuration"
        title="Website Legal Pages"
        description="Privacy, terms, refunds, and other legal content shown on the public OOMS website."
        accent="slate"
        summary={summary}
        onRefresh={refresh}
        refreshing={loading}
        actions={
          <ManagementButton
            type="button"
            onClick={openCreate}
            disabled={loading}
            className="inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add page
          </ManagementButton>
        }
      >
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading legal pages…
            </div>
          ) : pages.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500">
              No legal pages yet. Create Privacy Policy, Terms, and more.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pages.map((page) => (
                <div
                  key={page.page_id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      <Scale className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {page.title}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            page.status === "active"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400"
                          }`}
                        >
                          {page.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        /{page.slug}
                        {page.updated_at
                          ? ` · Updated ${new Date(
                              page.updated_at
                            ).toLocaleString()}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(page)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(page)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ManagementHub>

      {modalOpen && (
        <>
          <ModalScrollLock />
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/50"
              aria-label="Close"
              onClick={() => !saving && setModalOpen(false)}
            />
            <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isNew ? "Add legal page" : "Edit legal page"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => !saving && setModalOpen(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto px-5 py-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Title
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setField("title", e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-950"
                      placeholder="Privacy Policy"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Slug (URL)
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">/</span>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => setField("slug", slugify(e.target.value))}
                        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-950"
                        placeholder="privacy-policy"
                        disabled={saving}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Sort order
                    </label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) =>
                        setField("sort_order", Number(e.target.value) || 0)
                      }
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-950"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setField("status", e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-950"
                      disabled={saving}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Content (HTML supported)
                  </label>
                  <textarea
                    value={form.content_html}
                    onChange={(e) => setField("content_html", e.target.value)}
                    rows={16}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs leading-relaxed outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-950"
                    placeholder="<p>Write policy content here…</p>"
                    disabled={saving}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Use simple HTML tags like &lt;p&gt;, &lt;h3&gt;, &lt;ul&gt;,
                    &lt;li&gt;, &lt;a&gt;. Inactive pages are hidden on the public
                    website.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <ManagementButton
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save page
                </ManagementButton>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
