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
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, auth_token: e.target.value }))
                }
                placeholder={
                  meta.configured
                    ? `Current: ${meta.auth_token_masked} (leave blank to keep)`
                    : "Fast2SMS authorization token"
                }
                className="admin-input"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="admin-label">Sender ID</label>
                <input
                  type="text"
                  value={form.sender_id}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sender_id: e.target.value.toUpperCase(),
                    }))
                  }
                  className="admin-input"
                />
              </div>
              <div>
                <label className="admin-label">Entity ID</label>
                <input
                  type="text"
                  value={form.entity_id}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, entity_id: e.target.value }))
                  }
                  className="admin-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="admin-label">Route</label>
                <select
                  value={form.route}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, route: e.target.value }))
                  }
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
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="admin-input"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
      </div>
      )}
    </ManagementHub>
  );
}
