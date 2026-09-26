import React, { useCallback, useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "../utils/apiCall";
import ManagementHub from "../components/common/ManagementHub";
import ManagementButton from "../components/common/ManagementButton";
import { DetailPageSkeleton } from "../components/SkeletonComponent";

export default function CallSystemConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    api_base_url: "",
    status: "active",
  });
  const [meta, setMeta] = useState({ configured: false });

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiCall("/call-system/config", "GET");
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to load config");
      }
      const row = data.data || {};
      setMeta({ configured: Boolean(row.configured) });
      setForm({
        api_base_url: row.api_base_url || "",
        status: row.status || "active",
      });
    } catch (err) {
      toast.error(err.message || "Failed to load Call system config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    if (!String(form.api_base_url || "").trim()) {
      toast.error("API URL is required");
      return;
    }
    setSaving(true);
    try {
      const res = await apiCall("/call-system/config", "PUT", {
        api_base_url: String(form.api_base_url).trim(),
        status: form.status,
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Save failed");
      }
      toast.success("Call system config saved");
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
      title="OOMS System Call Config"
      description="Platform PBX initiate URL used by the OOMS System Call channel (branch tokens are configured per office)."
      accent="slate"
      onRefresh={fetchConfig}
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
        <div className="admin-panel space-y-4 p-5">
          <div>
            <label className="admin-label">PBX API URL</label>
            <input
              type="url"
              value={form.api_base_url}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, api_base_url: e.target.value }))
              }
              placeholder="https://ipbx.example.com/api/pbx/calls"
              className="admin-input"
              disabled={loading || saving}
            />
            <p className="mt-1 text-xs text-admin-muted">
              Full endpoint for call initiate (POST). Do not hardcode in the client apps.
            </p>
          </div>

          <div>
            <label className="admin-label">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, status: e.target.value }))
              }
              className="admin-input"
              disabled={loading || saving}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {meta.configured ? (
            <p className="text-xs text-emerald-700">API URL is configured.</p>
          ) : (
            <p className="text-xs text-amber-700">
              Not configured yet — branches cannot place calls until this URL is saved.
            </p>
          )}
        </div>
      )}
    </ManagementHub>
  );
}
