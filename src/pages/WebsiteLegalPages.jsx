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
import { ListPageSkeleton } from "../components/SkeletonComponent";
import ActionMenu from "../components/common/ActionMenu";

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
    () => (
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-md border border-admin-border bg-admin-surface px-3 py-1.5 text-xs text-admin-text-sub">
          Total:{" "}
          <span className="font-semibold text-admin-text">{pages.length}</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          Active:{" "}
          <span className="font-semibold">
            {pages.filter((p) => p.status === "active").length}
          </span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-admin-border bg-admin-surface px-3 py-1.5 text-xs text-admin-text-sub">
          Inactive:{" "}
          <span className="font-semibold text-admin-text">
            {pages.filter((p) => p.status !== "active").length}
          </span>
        </div>
      </div>
    ),
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
        <div className="admin-panel overflow-hidden">
          {loading ? (
            <ListPageSkeleton columns={4} rows={6} />
          ) : pages.length === 0 ? (
            <div className="py-16 text-center text-sm text-admin-muted">
              No legal pages yet. Create Privacy Policy, Terms, and more.
            </div>
          ) : (
            <div className="divide-y divide-admin-border">
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
                        <h3 className="truncate text-sm font-bold text-admin-text">
                          {page.title}
                        </h3>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            page.status === "active"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400"
                          }`}
                        >
                          {page.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-admin-muted">
                        /{page.slug}
                        {page.updated_at
                          ? ` · Updated ${new Date(
                              page.updated_at
                            ).toLocaleString()}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <ActionMenu
                      actions={[
                        {
                          label: "Edit",
                          icon: <Pencil className="h-3.5 w-3.5" />,
                          onClick: () => openEdit(page),
                        },
                        {
                          label: "Delete",
                          icon: <Trash2 className="h-3.5 w-3.5" />,
                          danger: true,
                          onClick: () => handleDelete(page),
                        },
                      ]}
                    />
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
            <div className="admin-panel relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-admin-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-admin-muted" />
                  <h2 className="text-sm font-bold text-admin-text">
                    {isNew ? "Add legal page" : "Edit legal page"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => !saving && setModalOpen(false)}
                  className="text-xs font-semibold text-admin-muted hover:text-admin-text"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto px-5 py-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="admin-label">Title</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setField("title", e.target.value)}
                      className="admin-input"
                      placeholder="Privacy Policy"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Slug (URL)</label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-admin-muted">/</span>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => setField("slug", slugify(e.target.value))}
                        className="admin-input min-w-0 flex-1"
                        placeholder="privacy-policy"
                        disabled={saving}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="admin-label">Sort order</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={form.sort_order}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^\d]/g, "");
                        setField("sort_order", v === "" ? 0 : Number(v));
                      }}
                      className="admin-input"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setField("status", e.target.value)}
                      className="admin-input"
                      disabled={saving}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="admin-label">Content (HTML supported)</label>
                  <textarea
                    value={form.content_html}
                    onChange={(e) => setField("content_html", e.target.value)}
                    rows={16}
                    className="admin-textarea font-mono text-xs leading-relaxed"
                    placeholder="<p>Write policy content here…</p>"
                    disabled={saving}
                  />
                  <p className="mt-1 text-[11px] text-admin-muted">
                    Use simple HTML tags like &lt;p&gt;, &lt;h3&gt;, &lt;ul&gt;,
                    &lt;li&gt;, &lt;a&gt;. Inactive pages are hidden on the public
                    website.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-admin-border px-5 py-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-admin-muted hover:bg-admin-raised"
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
