import React, { useCallback, useEffect, useState } from "react";
import { Save, Loader2, Plus, Trash2, Globe } from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "../utils/apiCall";
import ManagementHub from "../components/common/ManagementHub";
import ManagementButton from "../components/common/ManagementButton";
import { DetailPageSkeleton } from "../components/SkeletonComponent";

const EMPTY_FORM = {
  company_name: "",
  short_name: "",
  website_url: "",
  whatsapp_message: "",
  google_maps_embed_url: "",
  email: [{ type: "sale", email: "" }],
  phone: [{ type: "sale", phone: "" }],
  whatsapp: [{ type: "sale", whatsapp: "" }],
  address: [{ type: "head office", address: "" }],
  business_hours: {
    weekdays: "",
    saturday: "",
    sunday: "",
  },
  social_links: {
    linkedin: "",
    twitter: "",
    facebook: "",
    youtube: "",
  },
  status: "active",
};

function TypedListEditor({
  title,
  items,
  valueKey,
  typePlaceholder,
  valuePlaceholder,
  disabled,
  onChange,
}) {
  const updateRow = (index, field, value) => {
    const next = items.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    onChange(next);
  };

  const addRow = () => {
    onChange([...items, { type: "", [valueKey]: "" }]);
  };

  const removeRow = (index) => {
    if (items.length <= 1) {
      onChange([{ type: "", [valueKey]: "" }]);
      return;
    }
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="admin-label">{title}</span>
        <button
          type="button"
          onClick={addRow}
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((row, index) => (
          <div key={`${valueKey}-${index}`} className="flex gap-2">
            <input
              type="text"
              value={row.type || ""}
              onChange={(e) => updateRow(index, "type", e.target.value)}
              placeholder={typePlaceholder}
              className="admin-input w-32 shrink-0"
              disabled={disabled}
            />
            <input
              type="text"
              value={row[valueKey] || ""}
              onChange={(e) => updateRow(index, valueKey, e.target.value)}
              placeholder={valuePlaceholder}
              className="admin-input min-w-0 flex-1"
              disabled={disabled}
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              disabled={disabled}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              title="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WebsiteContactConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [configured, setConfigured] = useState(false);

  const fetchConfig = useCallback(async () => {
    const res = await apiCall("/website-contact/config", "GET");
    const data = await res.json();
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || "Failed to load website contact config");
    }
    const d = data.data || {};
    setConfigured(Boolean(d.configured));
    setForm({
      company_name: d.company_name || "",
      short_name: d.short_name || "",
      website_url: d.website_url || "",
      whatsapp_message: d.whatsapp_message || "",
      google_maps_embed_url: d.google_maps_embed_url || "",
      email:
        Array.isArray(d.email) && d.email.length
          ? d.email
          : EMPTY_FORM.email,
      phone:
        Array.isArray(d.phone) && d.phone.length
          ? d.phone
          : EMPTY_FORM.phone,
      whatsapp:
        Array.isArray(d.whatsapp) && d.whatsapp.length
          ? d.whatsapp
          : EMPTY_FORM.whatsapp,
      address:
        Array.isArray(d.address) && d.address.length
          ? d.address
          : EMPTY_FORM.address,
      business_hours: {
        weekdays: d.business_hours?.weekdays || "",
        saturday: d.business_hours?.saturday || "",
        sunday: d.business_hours?.sunday || "",
      },
      social_links: {
        linkedin: d.social_links?.linkedin || "",
        twitter: d.social_links?.twitter || "",
        facebook: d.social_links?.facebook || "",
        youtube: d.social_links?.youtube || "",
      },
      status: d.status === "inactive" ? "inactive" : "active",
    });
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await fetchConfig();
    } catch (err) {
      toast.error(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [fetchConfig]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setHours = (key, value) => {
    setForm((prev) => ({
      ...prev,
      business_hours: { ...prev.business_hours, [key]: value },
    }));
  };

  const setSocial = (key, value) => {
    setForm((prev) => ({
      ...prev,
      social_links: { ...prev.social_links, [key]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiCall("/website-contact/config", "PUT", form);
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to save");
      }
      toast.success("Website contact details saved");
      setConfigured(Boolean(data.data?.configured));
      await fetchConfig();
    } catch (err) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ManagementHub
      eyebrow="Configuration"
      title="Website Contact"
      description="Emails, phones, WhatsApp, addresses, and hours shown on the public OOMS website."
      accent="slate"
      onRefresh={refresh}
      refreshing={loading}
      actions={
        <ManagementButton
          type="button"
          onClick={handleSave}
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
      }
    >
      {loading ? (
        <DetailPageSkeleton />
      ) : (
      <div className="admin-panel space-y-5 p-5">
          <>
            <p className="flex items-center gap-2 text-xs text-admin-muted">
              <Globe className="h-3.5 w-3.5" />
              {configured
                ? "Published via /public/contact for the marketing website."
                : "Defaults are shown until you save. Edit and save to publish."}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="admin-label">Company name</label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => setField("company_name", e.target.value)}
                  className="admin-input"
                  disabled={loading || saving}
                />
              </div>
              <div>
                <label className="admin-label">Short name</label>
                <input
                  type="text"
                  value={form.short_name}
                  onChange={(e) => setField("short_name", e.target.value)}
                  className="admin-input"
                  disabled={loading || saving}
                />
              </div>
            </div>

            <div>
              <label className="admin-label">Website URL</label>
              <input
                type="url"
                value={form.website_url}
                onChange={(e) => setField("website_url", e.target.value)}
                className="admin-input"
                disabled={loading || saving}
              />
            </div>

            <TypedListEditor
              title="Emails"
              items={form.email}
              valueKey="email"
              typePlaceholder="sale / technical"
              valuePlaceholder="email@ooms.in"
              disabled={loading || saving}
              onChange={(next) => setField("email", next)}
            />

            <TypedListEditor
              title="Phone numbers"
              items={form.phone}
              valueKey="phone"
              typePlaceholder="sale / general"
              valuePlaceholder="+91 …"
              disabled={loading || saving}
              onChange={(next) => setField("phone", next)}
            />

            <TypedListEditor
              title="WhatsApp numbers"
              items={form.whatsapp}
              valueKey="whatsapp"
              typePlaceholder="sale / technical"
              valuePlaceholder="+91 …"
              disabled={loading || saving}
              onChange={(next) => setField("whatsapp", next)}
            />

            <div>
              <label className="admin-label">Default WhatsApp message</label>
              <textarea
                value={form.whatsapp_message}
                onChange={(e) => setField("whatsapp_message", e.target.value)}
                rows={2}
                className="admin-textarea"
                disabled={loading || saving}
              />
            </div>

            <TypedListEditor
              title="Addresses"
              items={form.address}
              valueKey="address"
              typePlaceholder="head office"
              valuePlaceholder="Full address"
              disabled={loading || saving}
              onChange={(next) => setField("address", next)}
            />

            <div>
              <label className="admin-label">Google Maps embed URL</label>
              <textarea
                value={form.google_maps_embed_url}
                onChange={(e) =>
                  setField("google_maps_embed_url", e.target.value)
                }
                rows={2}
                placeholder="https://www.google.com/maps/embed?…"
                className="admin-textarea"
                disabled={loading || saving}
              />
            </div>

            <div className="space-y-2">
              <label className="admin-label">Business hours</label>
              {["weekdays", "saturday", "sunday"].map((key) => (
                <input
                  key={key}
                  type="text"
                  value={form.business_hours[key]}
                  onChange={(e) => setHours(key, e.target.value)}
                  placeholder={key}
                  className="admin-input"
                  disabled={loading || saving}
                />
              ))}
            </div>

            <div className="space-y-2">
              <label className="admin-label">Social links</label>
              {["linkedin", "twitter", "facebook", "youtube"].map((key) => (
                <input
                  key={key}
                  type="url"
                  value={form.social_links[key]}
                  onChange={(e) => setSocial(key, e.target.value)}
                  placeholder={key}
                  className="admin-input"
                  disabled={loading || saving}
                />
              ))}
            </div>

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
      )}
    </ManagementHub>
  );
}
