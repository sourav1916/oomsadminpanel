import React, { useCallback, useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "../utils/apiCall";
import ManagementHub from "../components/common/ManagementHub";
import ManagementButton from "../components/common/ManagementButton";
import { DetailPageSkeleton } from "../components/SkeletonComponent";

const ROUTE_OPTIONS = [
  { value: "dlt", label: "DLT" },
  { value: "dlt_manual", label: "DLT Manual" },
  { value: "otp", label: "OTP" },
  { value: "q", label: "Quick SMS (no DLT template)" },
];

/**
 * Company / platform Fast2SMS used for login, register, portal and contact OTPs.
 * Separate from "System SMS Config" (notification channel) and from branch SMS configs.
 */
export default function SmsOtpConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    auth_token: "",
    sender_id: "",
    entity_id: "",
    route: "dlt",
    otp_dlt_message_id: "",
    status: "active",
  });
  const [meta, setMeta] = useState({
    configured: false,
    has_auth_token: false,
    auth_token_masked: "",
  });

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiCall("/sms-company/config", "GET");
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to load config");
      }
      const row = data.data || {};
      setMeta({
        configured: Boolean(row.configured),
        has_auth_token: Boolean(row.has_auth_token),
        auth_token_masked: row.auth_token_masked || "",
      });
      setForm({
        auth_token: "",
        sender_id: row.sender_id || "",
        entity_id: row.entity_id || "",
        route: row.route || "dlt",
        otp_dlt_message_id: row.otp_dlt_message_id || "",
        status: row.status || "active",
      });
    } catch (err) {
      toast.error(err.message || "Failed to load OTP SMS config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const needsDlt = form.route !== "q";

  const handleSave = async () => {
    if (!meta.has_auth_token && !String(form.auth_token || "").trim()) {
      toast.error("Auth token is required");
      return;
    }
    if (needsDlt && !String(form.otp_dlt_message_id || "").trim()) {
      toast.error("OTP DLT message ID is required for DLT routes");
      return;
    }
    if (needsDlt && !String(form.sender_id || "").trim()) {
      toast.error("Sender ID is required for DLT routes");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        sender_id: form.sender_id,
        entity_id: form.entity_id,
        route: form.route,
        otp_dlt_message_id: form.otp_dlt_message_id,
        status: form.status,
      };
      if (String(form.auth_token || "").trim()) {
        payload.auth_token = String(form.auth_token).trim();
      }
      const res = await apiCall("/sms-company/config", "PUT", payload);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Save failed");
      }
      toast.success("OTP SMS config saved");
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
      title="OTP SMS Config"
      description="Platform Fast2SMS account used for login, registration, portal and contact-change OTPs on every panel. Branch notification SMS is configured per office."
      accent="slate"
      onRefresh={fetchConfig}
      refreshing={loading}
      actions={
        <ManagementButton
          onClick={handleSave}
          leftIcon={saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          disabled={saving || loading}
        >
          {saving ? "Saving…" : "Save config"}
        </ManagementButton>
      }
    >
      {loading ? (
        <DetailPageSkeleton />
      ) : (
        <div className="admin-panel p-5">
          <div className="space-y-4">
            <div>
              <label className="admin-label">Auth token</label>
              <input
                type="password"
                value={form.auth_token}
                onChange={(e) => setForm((prev) => ({ ...prev, auth_token: e.target.value }))}
                placeholder={
                  meta.has_auth_token
                    ? `Current: ${meta.auth_token_masked} (leave blank to keep)`
                    : "Fast2SMS authorization token"
                }
                autoComplete="off"
                className="admin-input"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="admin-label">Route</label>
                <select
                  value={form.route}
                  onChange={(e) => setForm((prev) => ({ ...prev, route: e.target.value }))}
                  className="admin-input"
                >
                  {ROUTE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="admin-label">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="admin-input"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="admin-label">Sender ID {needsDlt && <span className="text-rose-600">*</span>}</label>
                <input
                  type="text"
                  value={form.sender_id}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, sender_id: e.target.value.toUpperCase() }))
                  }
                  placeholder="6-character DLT header, e.g. ONESAS"
                  className="admin-input"
                />
              </div>
              <div>
                <label className="admin-label">Entity ID</label>
                <input
                  type="text"
                  value={form.entity_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, entity_id: e.target.value }))}
                  placeholder="DLT principal entity ID (optional)"
                  className="admin-input"
                />
              </div>
            </div>

            <div>
              <label className="admin-label">
                OTP DLT message ID {needsDlt && <span className="text-rose-600">*</span>}
              </label>
              <input
                type="text"
                value={form.otp_dlt_message_id}
                onChange={(e) => setForm((prev) => ({ ...prev, otp_dlt_message_id: e.target.value }))}
                placeholder="Fast2SMS message ID of the approved OTP template"
                className="admin-input"
                disabled={!needsDlt}
              />
              <p className="mt-1 text-xs text-admin-muted">
                The approved template must contain exactly one variable, which receives the OTP. Not used on the Quick SMS route.
              </p>
            </div>

            {meta.configured ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-300">OTP SMS is configured and will be used for all OTP sends.</p>
            ) : (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Not fully configured — users cannot receive login OTPs until the token, sender ID and OTP template are saved.
              </p>
            )}
          </div>
        </div>
      )}
    </ManagementHub>
  );
}
