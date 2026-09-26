import React, { useCallback, useEffect, useState } from "react";
import {
  Save,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Phone,
  HelpCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "../utils/apiCall";
import ManagementHub from "../components/common/ManagementHub";
import ManagementButton from "../components/common/ManagementButton";
import ModalScrollLock from "../components/common/ModalScrollLock";
import { DetailPageSkeleton, TableSkeleton } from "../components/SkeletonComponent";
import ActionMenu from "../components/common/ActionMenu";

const EMPTY_CONTACT = {
  page_title: "Help & Support",
  intro_text: "",
  support_email: "",
  support_phone: "",
  support_whatsapp: "",
  support_hours: "",
  support_address: "",
  website_url: "",
  status: "active",
};

const EMPTY_FAQ = {
  faq_id: "",
  question: "",
  answer: "",
  sort_order: 0,
  status: "active",
};

export default function HelpSupportConfig() {
  const [tab, setTab] = useState("contact");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_CONTACT);
  const [meta, setMeta] = useState({ configured: false });
  const [faqs, setFaqs] = useState([]);
  const [faqModal, setFaqModal] = useState(false);
  const [faqForm, setFaqForm] = useState(EMPTY_FAQ);
  const [savingFaq, setSavingFaq] = useState(false);

  const fetchConfig = useCallback(async () => {
    const res = await apiCall("/help-support/config", "GET");
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || "Failed to load config");
    }
    const row = data.data || {};
    setMeta({ configured: Boolean(row.configured) });
    setForm({
      page_title: row.page_title || "Help & Support",
      intro_text: row.intro_text || "",
      support_email: row.support_email || "",
      support_phone: row.support_phone || "",
      support_whatsapp: row.support_whatsapp || "",
      support_hours: row.support_hours || "",
      support_address: row.support_address || "",
      website_url: row.website_url || "",
      status: row.status || "active",
    });
  }, []);

  const fetchFaqs = useCallback(async () => {
    const res = await apiCall("/help-support/faqs", "GET");
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || "Failed to load FAQs");
    }
    setFaqs(data.data || []);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchConfig(), fetchFaqs()]);
    } catch (err) {
      toast.error(err.message || "Failed to load Help & Support");
    } finally {
      setLoading(false);
    }
  }, [fetchConfig, fetchFaqs]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveContact = async () => {
    if (!String(form.page_title || "").trim()) {
      toast.error("Page title is required");
      return;
    }
    setSaving(true);
    try {
      const res = await apiCall("/help-support/config", "PUT", {
        page_title: String(form.page_title).trim(),
        intro_text: String(form.intro_text || "").trim(),
        support_email: String(form.support_email || "").trim(),
        support_phone: String(form.support_phone || "").trim(),
        support_whatsapp: String(form.support_whatsapp || "").trim(),
        support_hours: String(form.support_hours || "").trim(),
        support_address: String(form.support_address || "").trim(),
        website_url: String(form.website_url || "").trim(),
        status: form.status,
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Save failed");
      }
      toast.success("Contact details saved");
      await fetchConfig();
    } catch (err) {
      toast.error(err.message || "Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  const openNewFaq = () => {
    setFaqForm({
      ...EMPTY_FAQ,
      sort_order: faqs.length ? Math.max(...faqs.map((f) => f.sort_order || 0)) + 1 : 1,
    });
    setFaqModal(true);
  };

  const openEditFaq = (row) => {
    setFaqForm({
      faq_id: row.faq_id || "",
      question: row.question || "",
      answer: row.answer || "",
      sort_order: row.sort_order || 0,
      status: row.status || "active",
    });
    setFaqModal(true);
  };

  const saveFaq = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }
    setSavingFaq(true);
    try {
      const method = faqForm.faq_id ? "PUT" : "POST";
      const path = faqForm.faq_id
        ? `/help-support/faqs/${encodeURIComponent(faqForm.faq_id)}`
        : "/help-support/faqs";
      const res = await apiCall(path, method, {
        question: faqForm.question.trim(),
        answer: faqForm.answer.trim(),
        sort_order: Number(faqForm.sort_order) || 0,
        status: faqForm.status,
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Save failed");
      }
      toast.success(faqForm.faq_id ? "FAQ updated" : "FAQ created");
      setFaqModal(false);
      await fetchFaqs();
    } catch (err) {
      toast.error(err.message || "Failed to save FAQ");
    } finally {
      setSavingFaq(false);
    }
  };

  const removeFaq = async (faqId) => {
    if (!window.confirm("Delete this FAQ?")) return;
    try {
      const res = await apiCall(
        `/help-support/faqs/${encodeURIComponent(faqId)}`,
        "DELETE"
      );
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Delete failed");
      }
      toast.success("FAQ deleted");
      await fetchFaqs();
    } catch (err) {
      toast.error(err.message || "Failed to delete FAQ");
    }
  };

  const contactFields = [
    ["support_email", "Support email", "email"],
    ["support_phone", "Support phone", "text"],
    ["support_whatsapp", "WhatsApp number", "text"],
    ["support_hours", "Support hours", "text"],
    ["support_address", "Address", "textarea"],
    ["website_url", "Website URL", "url"],
  ];

  return (
    <ManagementHub
      eyebrow="Configuration"
      title="Help & Support"
      description="Contact details and FAQs shown on the CLIENT Help & Support page."
      accent="slate"
      onRefresh={refresh}
      refreshing={loading}
      actions={
        tab === "contact" ? (
          <ManagementButton
            type="button"
            onClick={handleSaveContact}
            disabled={loading || saving}
            className="inline-flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </ManagementButton>
        ) : (
          <ManagementButton
            type="button"
            onClick={openNewFaq}
            className="inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add FAQ
          </ManagementButton>
        )
      }
    >
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("contact")}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            tab === "contact"
              ? "bg-admin-accent-soft text-admin-accent-text"
              : "text-admin-text-sub hover:bg-admin-raised hover:text-admin-text"
          }`}
        >
          <Phone className="h-3.5 w-3.5" />
          Contact details
        </button>
        <button
          type="button"
          onClick={() => setTab("faqs")}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            tab === "faqs"
              ? "bg-admin-accent-soft text-admin-accent-text"
              : "text-admin-text-sub hover:bg-admin-raised hover:text-admin-text"
          }`}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          FAQs ({faqs.length})
        </button>
      </div>

      {tab === "contact" ? (
        loading ? (
          <DetailPageSkeleton />
        ) : (
        <div className="admin-panel space-y-4 p-5">
            <>
              <p className="text-xs text-admin-muted">
                {meta.configured
                  ? "Contact details are configured for CLIENT users."
                  : "Not configured yet — add at least one contact method."}
              </p>

              <div>
                <label className="admin-label">Page title</label>
                <input
                  type="text"
                  value={form.page_title}
                  onChange={(e) => setField("page_title", e.target.value)}
                  className="admin-input"
                  disabled={loading || saving}
                />
              </div>

              <div>
                <label className="admin-label">Intro text</label>
                <p className="mb-1.5 text-[11px] text-admin-muted">
                  Shown above the contact cards on the CLIENT help page.
                </p>
                <textarea
                  value={form.intro_text}
                  onChange={(e) => setField("intro_text", e.target.value)}
                  rows={4}
                  placeholder="e.g. Need help? Reach our support team using the options below."
                  className="admin-textarea"
                  disabled={loading || saving}
                />
              </div>

              {contactFields.map(([key, label, type]) => (
                <div key={key}>
                  <label className="admin-label">{label}</label>
                  {type === "textarea" ? (
                    <textarea
                      value={form[key]}
                      onChange={(e) => setField(key, e.target.value)}
                      rows={2}
                      className="admin-textarea"
                      disabled={loading || saving}
                    />
                  ) : (
                    <input
                      type={type}
                      value={form[key]}
                      onChange={(e) => setField(key, e.target.value)}
                      className="admin-input"
                      disabled={loading || saving}
                    />
                  )}
                </div>
              ))}

              <div>
                <label className="admin-label">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                  className="admin-input"
                  disabled={loading || saving}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </>
        </div>
        )
      ) : (
        <div className="overflow-hidden admin-panel">
          {loading ? (
            <TableSkeleton columns={4} rows={6} />
          ) : faqs.length === 0 ? (
            <p className="p-6 text-sm text-admin-muted">
              No FAQs yet. Add questions users commonly ask.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-admin-border bg-admin-raised text-[11px] uppercase tracking-wide text-admin-muted">
                  <tr>
                    <th className="px-4 py-3 w-12">S.No</th>
                    <th className="px-4 py-3 w-16">Order</th>
                    <th className="px-4 py-3">Question</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {faqs.map((row, index) => (
                    <tr key={row.faq_id}>
                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3 text-slate-500">{row.sort_order}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-admin-text">
                          {row.question}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                          {row.answer}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            row.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ActionMenu
                          actions={[
                            {
                              label: "Edit",
                              icon: <Pencil className="h-3.5 w-3.5" />,
                              onClick: () => openEditFaq(row),
                            },
                            {
                              label: "Delete",
                              icon: <Trash2 className="h-3.5 w-3.5" />,
                              danger: true,
                              onClick: () => removeFaq(row.faq_id),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {faqModal ? (
        <>
          <ModalScrollLock />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => !savingFaq && setFaqModal(false)}
              aria-label="Close"
            />
            <div className="admin-panel relative w-full max-w-lg p-5">
              <h3 className="text-base font-semibold text-admin-text">
                {faqForm.faq_id ? "Edit FAQ" : "Add FAQ"}
              </h3>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="admin-label">Question</label>
                  <input
                    type="text"
                    value={faqForm.question}
                    onChange={(e) =>
                      setFaqForm((p) => ({ ...p, question: e.target.value }))
                    }
                    className="admin-input"
                    disabled={savingFaq}
                  />
                </div>
                <div>
                  <label className="admin-label">Answer</label>
                  <textarea
                    value={faqForm.answer}
                    onChange={(e) =>
                      setFaqForm((p) => ({ ...p, answer: e.target.value }))
                    }
                    rows={5}
                    className="admin-textarea"
                    disabled={savingFaq}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="admin-label">Sort order</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={faqForm.sort_order}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^\d]/g, "");
                        setFaqForm((p) => ({
                          ...p,
                          sort_order: v,
                        }));
                      }}
                      className="admin-input"
                      disabled={savingFaq}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Status</label>
                    <select
                      value={faqForm.status}
                      onChange={(e) =>
                        setFaqForm((p) => ({ ...p, status: e.target.value }))
                      }
                      className="admin-input"
                      disabled={savingFaq}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={savingFaq}
                  onClick={() => setFaqModal(false)}
                  className="rounded-lg border border-admin-border px-3.5 py-2 text-sm font-medium text-admin-muted hover:bg-admin-raised disabled:opacity-50"
                >
                  Cancel
                </button>
                <ManagementButton
                  type="button"
                  onClick={saveFaq}
                  disabled={savingFaq}
                  className="inline-flex items-center gap-2"
                >
                  {savingFaq ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save FAQ
                </ManagementButton>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </ManagementHub>
  );
}
