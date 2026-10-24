import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Save, Loader2, PlugZap, Eraser, Undo2 } from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "../utils/apiCall";
import ManagementHub from "../components/common/ManagementHub";
import ManagementButton from "../components/common/ManagementButton";
import { DetailPageSkeleton } from "../components/SkeletonComponent";

const SOURCE_LABEL = {
  database: { text: "Saved in database", tone: "text-emerald-700 dark:text-emerald-300" },
  env: { text: "From server .env (legacy)", tone: "text-amber-700 dark:text-amber-300" },
  default: { text: "Built-in default", tone: "text-admin-muted" },
  unset: { text: "Not set", tone: "text-rose-700 dark:text-rose-300" },
};

function SourceBadge({ source }) {
  const meta = SOURCE_LABEL[source] || SOURCE_LABEL.unset;
  return <span className={`text-[11px] font-medium ${meta.tone}`}>{meta.text}</span>;
}

export default function PlatformSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingB2, setTestingB2] = useState(false);
  const [groups, setGroups] = useState([]);
  const [serverSecretStatus, setServerSecretStatus] = useState(null);
  const [form, setForm] = useState({});
  const [clearKeys, setClearKeys] = useState([]);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiCall("/platform-settings", "GET");
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to load platform settings");
      }
      const nextGroups = data.data?.groups || [];
      const nextForm = {};
      nextGroups.forEach((g) =>
        g.fields.forEach((f) => {
          nextForm[f.key] = f.type === "secret" ? "" : f.value || "";
        })
      );
      setGroups(nextGroups);
      setServerSecretStatus(data.data?.server_secret_status || null);
      setForm(nextForm);
      setClearKeys([]);
    } catch (err) {
      toast.error(err.message || "Failed to load platform settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const fieldByKey = useMemo(() => {
    const map = {};
    groups.forEach((g) => g.fields.forEach((f) => (map[f.key] = f)));
    return map;
  }, [groups]);

  const dirty = useMemo(() => {
    if (clearKeys.length) return true;
    return Object.entries(form).some(([key, value]) => {
      const field = fieldByKey[key];
      if (!field) return false;
      if (field.type === "secret") return String(value || "").trim() !== "";
      return String(value ?? "") !== String(field.value ?? "");
    });
  }, [form, fieldByKey, clearKeys]);

  const setValue = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (clearKeys.includes(key)) setClearKeys((prev) => prev.filter((k) => k !== key));
  };

  const toggleClear = (key) => {
    setClearKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    setForm((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSave = async () => {
    const values = {};
    Object.entries(form).forEach(([key, value]) => {
      const field = fieldByKey[key];
      if (!field || clearKeys.includes(key)) return;
      if (field.type === "secret") {
        if (String(value || "").trim()) values[key] = String(value).trim();
      } else if (String(value ?? "") !== String(field.value ?? "")) {
        values[key] = value;
      }
    });
    if (!Object.keys(values).length && !clearKeys.length) {
      toast.info("Nothing to save");
      return;
    }
    setSaving(true);
    try {
      const res = await apiCall("/platform-settings", "PUT", { values, clear: clearKeys });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Save failed");
      }
      toast.success("Platform settings saved");
      await fetchSettings();
    } catch (err) {
      toast.error(err.message || "Failed to save platform settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestB2 = async () => {
    if (dirty) {
      toast.info("Save your changes first, then test the connection.");
      return;
    }
    setTestingB2(true);
    try {
      const res = await apiCall("/platform-settings/test/b2", "POST", {});
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "B2 test failed");
      }
      toast.success(data.message || "B2 connection OK");
    } catch (err) {
      toast.error(err.message || "B2 test failed");
    } finally {
      setTestingB2(false);
    }
  };

  const renderField = (field) => {
    const value = form[field.key] ?? "";
    const clearing = clearKeys.includes(field.key);
    const isSecret = field.type === "secret";
    const inputType = isSecret ? "password" : field.type === "number" ? "number" : field.type === "url" ? "url" : "text";

    return (
      <div key={field.key} className={clearing ? "opacity-70" : ""}>
        <div className="flex items-center justify-between gap-2">
          <label className="admin-label" htmlFor={`ps-${field.key}`}>
            {field.label}
          </label>
          <SourceBadge source={clearing ? "unset" : field.source} />
        </div>
        <div className="flex items-stretch gap-2">
          {field.type === "select" ? (
            <select
              id={`ps-${field.key}`}
              value={value || field.default || ""}
              onChange={(e) => setValue(field.key, e.target.value)}
              className="admin-input flex-1"
              disabled={loading || saving}
            >
              {(field.options || []).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label || opt.value}
                </option>
              ))}
            </select>
          ) : (
          <input
            id={`ps-${field.key}`}
            type={inputType}
            value={value}
            onChange={(e) => setValue(field.key, e.target.value)}
            placeholder={
              isSecret
                ? field.has_value
                  ? `Current: ${field.masked} (leave blank to keep)`
                  : "Not set"
                : field.default
                ? `Default: ${field.default}`
                : ""
            }
            min={field.type === "number" && field.min != null ? field.min : undefined}
            max={field.type === "number" && field.max != null ? field.max : undefined}
            step={field.type === "number" ? "any" : undefined}
            autoComplete="off"
            className="admin-input flex-1"
            disabled={loading || saving || clearing}
          />
          )}
          {isSecret && field.has_value && (
            <button
              type="button"
              onClick={() => toggleClear(field.key)}
              title={clearing ? "Keep current value" : "Clear this secret on save"}
              className="inline-flex items-center gap-1 rounded-lg border border-admin-border px-2.5 text-xs text-admin-text-sub hover:bg-admin-raised"
            >
              {clearing ? <Undo2 className="h-3.5 w-3.5" /> : <Eraser className="h-3.5 w-3.5" />}
              {clearing ? "Keep" : "Clear"}
            </button>
          )}
        </div>
        {field.description && <p className="mt-1 text-xs text-admin-muted">{field.description}</p>}
        {field.modify_date && (
          <p className="mt-0.5 text-[11px] text-admin-muted">
            Last changed {field.modify_date}
            {field.modify_by ? ` by ${field.modify_by}` : ""}
          </p>
        )}
      </div>
    );
  };

  return (
    <ManagementHub
      eyebrow="Configuration"
      title="Platform Settings"
      description="Integration URLs, API keys and app-wide values used by the server. These replace the old SERVER/.env entries; changes apply within a minute without a restart."
      accent="slate"
      onRefresh={fetchSettings}
      refreshing={loading}
      actions={
        <ManagementButton
          onClick={handleSave}
          leftIcon={saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          disabled={saving || loading || !dirty}
        >
          {saving ? "Saving…" : "Save changes"}
        </ManagementButton>
      }
    >
      {loading ? (
        <DetailPageSkeleton />
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <section key={group.key} className="admin-panel p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-admin-text">{group.label}</h2>
                  {group.description && (
                    <p className="mt-0.5 text-xs text-admin-text-sub">{group.description}</p>
                  )}
                </div>
                {group.key === "storage" && (
                  <ManagementButton
                    variant="outline"
                    size="sm"
                    onClick={handleTestB2}
                    disabled={testingB2 || saving}
                    leftIcon={testingB2 ? <Loader2 size={14} className="animate-spin" /> : <PlugZap size={14} />}
                  >
                    {testingB2 ? "Testing…" : "Test connection"}
                  </ManagementButton>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {group.fields.map(renderField)}
              </div>
            </section>
          ))}

          <section className="admin-panel space-y-3 p-5">
            <div>
              <h2 className="text-sm font-bold text-admin-text">Server encryption keys</h2>
              <p className="mt-0.5 text-xs text-admin-text-sub">
                These master keys must be set in the server deployment environment or secret manager, not in this database-backed form.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["APP_ENCRYPTION_KEY", serverSecretStatus?.app_encryption_key_configured],
                ["SMTP_ENCRYPTION_KEY", serverSecretStatus?.smtp_encryption_key_configured],
              ].map(([key, configured]) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-lg border border-admin-border px-3 py-2">
                  <code className="text-xs text-admin-text">{key}</code>
                  <span className={`text-xs font-semibold ${configured ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
                    {serverSecretStatus ? (configured ? "Configured" : "Not configured") : "Status unavailable"}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-admin-muted">
              APP_ENCRYPTION_KEY protects platform and company credentials. SMTP_ENCRYPTION_KEY is used by legacy SMTP credential encryption. Keep configured keys stable and backed up; changing them can make existing saved credentials unreadable. This page only reports whether they are present and never reads or displays their values.
            </p>
          </section>

          <div className="admin-panel px-4 py-3 text-xs text-admin-text-sub">
            Secrets are encrypted before they are stored and are never sent back to the browser. A value marked
            "From server .env (legacy)" still comes from the server's environment file; save it here to move it
            into the database, then remove it from .env.
          </div>
        </div>
      )}
    </ManagementHub>
  );
}
