import React, { useCallback, useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "../utils/apiCall";
import ManagementHub from "../components/common/ManagementHub";
import ManagementButton from "../components/common/ManagementButton";

const ROUTE_OPTIONS = [
  { value: "dlt", label: "DLT" },
  { value: "dlt_manual", label: "DLT Manual" },
  { value: "otp", label: "OTP" },
  { value: "q", label: "Quick SMS" },
];

export default function SmsSystemConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    auth_token: "",
    sender_id: "",
    entity_id: "",
    route: "dlt",
    status: "active",
  });
  const [meta, setMeta] = useState({
    configured: false,
    auth_token_masked: "",
  });

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiCall("/sms-system/config", "GET");
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to load config");
      }
      const row = data.data || {};
      setMeta({
        configured: Boolean(row.configured),
        auth_token_masked: row.auth_token_masked || "",
      });
      setForm({
        auth_token: "",
        sender_id: row.sender_id || "",
        entity_id: row.entity_id || "",
        route: row.route || "dlt",
        status: row.status || "active",
      });
    } catch (err) {
      toast.error(err.message || "Failed to load System SMS config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    if (!meta.configured && !String(form.auth_token || "").trim()) {
      toast.error("Auth token is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        sender_id: form.sender_id,
        entity_id: form.entity_id,
        route: form.route,
        status: form.status,
      };
      if (String(form.auth_token || "").trim()) {
        payload.auth_token = String(form.auth_token).trim();
      }
      const res = await apiCall("/sms-system/config", "PUT", payload);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Save failed");
      }
      toast.success("System SMS config saved");
      setForm((prev) => ({ ...prev, auth_token: "" }));
      fetchConfig();
    } catch (err) {
      toast.error(err.message || "Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ManagementHub
      eyebrow="Configuration"
      title="OOMS System SMS Config"
      description="Platform Fast2SMS credentials for the OOMS System SMS channel (separate from OTP)."
      accent="slate"
      onRefresh={fetchConfig}
      refreshing={loading}
      actions={
        <ManagementButton
          onClick={handleSave}
          leftIcon={saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          tone="indigo"
          disabled={saving || loading}
        >
          {saving ? "Saving…" : "Save config"}
        </ManagementButton>
      }
    >
      <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <div className="space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Auth token
              <input
                type="password"
                value={form.auth_token}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, auth_token: e.target.value }))
                }
                placeholder={
                  meta.configured
                    ? `Current: ${meta.auth_token_masked} (leave blank to keep)`
                    : "Fast2SMS authorization token"
                }
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sender ID
                <input
                  type="text"
                  value={form.sender_id}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sender_id: e.target.value.toUpperCase(),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Entity ID
                <input
                  type="text"
                  value={form.entity_id}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, entity_id: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Route
                <select
                  value={form.route}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, route: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {ROUTE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
          </div>
        )}
      </div>
    </ManagementHub>
  );
}
