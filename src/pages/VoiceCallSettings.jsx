import React, { useCallback, useEffect, useState } from "react";
import { AudioLines, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "../utils/apiCall";
import ManagementHub from "../components/common/ManagementHub";
import ManagementButton from "../components/common/ManagementButton";
import { DetailPageSkeleton } from "../components/SkeletonComponent";

const SETTINGS_URL = `${(process.env.REACT_APP_API_BASE_URL || "http://localhost:8877")
  .replace(/\/$/, "")}/api/v1/voice-calls/admin/settings`;

const EMPTY_SETTINGS = {
  configured: false,
  enabled: false,
  server_url: "",
  has_api_key: false,
  has_api_secret: false,
  updated_at: null,
};

export default function VoiceCallSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [form, setForm] = useState({
    server_url: "",
    api_key: "",
    api_secret: "",
    enabled: false,
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiCall(SETTINGS_URL, "GET");
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to load LiveKit settings");
      }
      const row = data.data || EMPTY_SETTINGS;
      setSettings(row);
      setForm({
        server_url: row.server_url || "",
        api_key: "",
        api_secret: "",
        enabled: Boolean(row.enabled),
      });
    } catch (error) {
      toast.error(error.message || "Failed to load LiveKit settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!settings.has_api_key && !form.api_key.trim()) {
      toast.error("LiveKit API key is required");
      return;
    }
    if (!settings.has_api_secret && !form.api_secret.trim()) {
      toast.error("LiveKit API secret is required");
      return;
    }

    setSaving(true);
    try {
      const response = await apiCall(SETTINGS_URL, "PUT", {
        server_url: form.server_url.trim(),
        api_key: form.api_key.trim(),
        api_secret: form.api_secret.trim(),
        enabled: form.enabled,
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to save LiveKit settings");
      }
      toast.success("LiveKit settings saved");
      await fetchSettings();
    } catch (error) {
      toast.error(error.message || "Failed to save LiveKit settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete the LiveKit configuration and disable app-to-app calling?")) {
      return;
    }
    setSaving(true);
    try {
      const response = await apiCall(SETTINGS_URL, "DELETE");
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to delete LiveKit settings");
      }
      setSettings(EMPTY_SETTINGS);
      setForm({
        server_url: "",
        api_key: "",
        api_secret: "",
        enabled: false,
      });
      toast.success("LiveKit settings deleted");
    } catch (error) {
      toast.error(error.message || "Failed to delete LiveKit settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ManagementHub
      eyebrow="Configuration"
      title="App-to-app Voice Calls"
      description="Configure the LiveKit provider used for secure browser-to-mobile audio calls."
      onRefresh={fetchSettings}
      refreshing={loading}
      actions={
        <ManagementButton
          type="submit"
          form="voice-call-settings-form"
          disabled={loading || saving}
          leftIcon={saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        >
          {saving ? "Saving…" : "Save configuration"}
        </ManagementButton>
      }
    >
      {loading ? (
        <DetailPageSkeleton />
      ) : (
        <form
          id="voice-call-settings-form"
          onSubmit={handleSave}
          className="admin-panel space-y-5 p-5"
        >
          <div className="flex items-start gap-3 rounded-xl border border-admin-border bg-admin-raised p-4">
            <AudioLines className="mt-0.5 h-5 w-5 shrink-0 text-admin-accent-text" />
            <div>
              <h2 className="text-sm font-semibold text-admin-text">LiveKit provider</h2>
              <p className="mt-1 text-xs leading-relaxed text-admin-text-sub">
                Credentials are encrypted by the API before storage and are never returned to this panel. Leave saved credential fields blank to keep the current values.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="voice-call-server-url" className="admin-label">LiveKit server URL</label>
            <input
              id="voice-call-server-url"
              type="url"
              required
              value={form.server_url}
              onChange={(event) => setForm((current) => ({ ...current, server_url: event.target.value }))}
              placeholder="wss://your-project.livekit.cloud"
              autoComplete="url"
              className="admin-input"
              disabled={saving}
            />
            <p className="mt-1 text-xs text-admin-muted">Use the secure WebSocket URL (wss://) from your LiveKit project.</p>
          </div>

          <div>
            <label htmlFor="voice-call-api-key" className="admin-label">LiveKit API key</label>
            <input
              id="voice-call-api-key"
              type="password"
              value={form.api_key}
              onChange={(event) => setForm((current) => ({ ...current, api_key: event.target.value }))}
              placeholder={settings.has_api_key ? "••••••••••••••••" : "Enter API key"}
              autoComplete="new-password"
              required={!settings.has_api_key}
              className="admin-input"
              disabled={saving}
            />
            {settings.has_api_key && (
              <p className="mt-1 text-xs text-admin-muted">API key is saved. Leave blank to keep it, or enter a replacement.</p>
            )}
          </div>

          <div>
            <label htmlFor="voice-call-api-secret" className="admin-label">LiveKit API secret</label>
            <input
              id="voice-call-api-secret"
              type="password"
              value={form.api_secret}
              onChange={(event) => setForm((current) => ({ ...current, api_secret: event.target.value }))}
              placeholder={settings.has_api_secret ? "••••••••••••••••" : "Enter API secret"}
              autoComplete="new-password"
              required={!settings.has_api_secret}
              className="admin-input"
              disabled={saving}
            />
            {settings.has_api_secret && (
              <p className="mt-1 text-xs text-admin-muted">API secret is saved. Leave blank to keep it, or enter a replacement.</p>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-admin-border p-4">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
              className="mt-0.5 h-4 w-4 accent-teal-600"
              disabled={saving}
            />
            <span>
              <span className="block text-sm font-semibold text-admin-text">Enable app-to-app calling</span>
              <span className="mt-1 block text-xs text-admin-text-sub">
                Save valid provider credentials before enabling calls for admins and staff.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-admin-border pt-4">
            <div className="text-xs text-admin-muted">
              {settings.configured ? (
                <>
                  <span className="font-semibold text-emerald-700">
                    {settings.enabled ? "Calling enabled" : "Calling disabled"}
                  </span>
                  {settings.updated_at ? ` · Updated ${new Date(settings.updated_at).toLocaleString()}` : ""}
                </>
              ) : (
                <span className="font-semibold text-amber-700">Not configured</span>
              )}
            </div>
            {settings.configured && (
              <ManagementButton
                type="button"
                tone="rose"
                variant="outline"
                leftIcon={<Trash2 size={14} />}
                disabled={saving}
                onClick={handleDelete}
              >
                Delete configuration
              </ManagementButton>
            )}
          </div>
        </form>
      )}
    </ManagementHub>
  );
}
