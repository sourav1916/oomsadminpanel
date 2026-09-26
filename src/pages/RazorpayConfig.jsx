import React, { useCallback, useEffect, useState } from "react";
import { Save, Loader2, FlaskConical, Copy, Check } from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "../utils/apiCall";
import ManagementHub from "../components/common/ManagementHub";
import ManagementButton from "../components/common/ManagementButton";
import { DetailPageSkeleton } from "../components/SkeletonComponent";

export default function RazorpayConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    key_id: "",
    key_secret: "",
    webhook_secret: "",
    webhook_url: "",
    status: "active",
  });
  const [feeForm, setFeeForm] = useState({
    gateway_fee_percent: "0",
    gateway_fee_flat: "0",
  });
  const [savingFee, setSavingFee] = useState(false);
  const [meta, setMeta] = useState({
    configured: false,
    environment: "test",
    key_secret_masked: "",
    webhook_secret_masked: "",
    has_key_secret: false,
    has_webhook_secret: false,
    default_webhook_url: "",
  });

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, feeRes] = await Promise.all([
        apiCall("/razorpay/config", "GET"),
        apiCall("/wallet/gateway-fee", "GET"),
      ]);
      const data = await configRes.json();
      if (!configRes.ok || data.success === false) {
        throw new Error(data.message || "Failed to load config");
      }
      const row = data.data || {};
      setMeta({
        configured: Boolean(row.configured),
        environment: row.environment || "test",
        key_secret_masked: row.key_secret_masked || "",
        webhook_secret_masked: row.webhook_secret_masked || "",
        has_key_secret: Boolean(row.has_key_secret),
        has_webhook_secret: Boolean(row.has_webhook_secret),
        default_webhook_url: row.default_webhook_url || row.webhook_url || "",
      });
      setForm({
        key_id: row.key_id || "",
        key_secret: "",
        webhook_secret: "",
        webhook_url: row.webhook_url || row.default_webhook_url || "",
        status: row.status || "active",
      });

      const feeData = await feeRes.json();
      if (feeRes.ok && feeData.success !== false) {
        const fee = feeData.data || {};
        setFeeForm({
          gateway_fee_percent: String(fee.gateway_fee_percent ?? 0),
          gateway_fee_flat: String(fee.gateway_fee_flat ?? 0),
        });
      } else if (row.gateway_fee_percent != null || row.gateway_fee_flat != null) {
        setFeeForm({
          gateway_fee_percent: String(row.gateway_fee_percent ?? 0),
          gateway_fee_flat: String(row.gateway_fee_flat ?? 0),
        });
      }
    } catch (err) {
      toast.error(err.message || "Failed to load Razorpay config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    if (!String(form.key_id || "").trim()) {
      toast.error("Key ID is required");
      return;
    }
    if (!meta.has_key_secret && !String(form.key_secret || "").trim()) {
      toast.error("Key Secret is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        key_id: String(form.key_id).trim(),
        webhook_url: String(form.webhook_url || "").trim(),
        status: form.status,
      };
      if (String(form.key_secret || "").trim()) {
        payload.key_secret = String(form.key_secret).trim();
      }
      if (String(form.webhook_secret || "").trim()) {
        payload.webhook_secret = String(form.webhook_secret).trim();
      }
      const res = await apiCall("/razorpay/config", "PUT", payload);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Save failed");
      }
      toast.success("Razorpay config saved");
      setForm((prev) => ({ ...prev, key_secret: "", webhook_secret: "" }));
      fetchConfig();
    } catch (err) {
      toast.error(err.message || "Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFee = async () => {
    setSavingFee(true);
    try {
      const res = await apiCall("/wallet/gateway-fee", "PUT", {
        gateway_fee_percent: Number(feeForm.gateway_fee_percent) || 0,
        gateway_fee_flat: Number(feeForm.gateway_fee_flat) || 0,
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to save gateway fee");
      }
      toast.success("Gateway charges saved");
      fetchConfig();
    } catch (err) {
      toast.error(err.message || "Failed to save gateway fee");
    } finally {
      setSavingFee(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await apiCall("/razorpay/test", "POST", {});
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Credential test failed");
      }
      toast.success(data.message || "Credentials are valid");
    } catch (err) {
      toast.error(err.message || "Credential test failed");
    } finally {
      setTesting(false);
    }
  };

  const copyWebhookUrl = async () => {
    const url = form.webhook_url || meta.default_webhook_url;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Webhook URL copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy URL");
    }
  };

  return (
    <ManagementHub
      eyebrow="Configuration"
      title="Razorpay Payment Gateway"
      description="Platform Razorpay Key ID, Key Secret, and webhook secret used for subscriptions and wallet top-ups."
      accent="slate"
      onRefresh={fetchConfig}
      refreshing={loading}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <ManagementButton
            type="button"
            onClick={handleTest}
            disabled={loading || saving || testing || !meta.configured}
            className="inline-flex items-center gap-2"
            tone="slate"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FlaskConical className="h-4 w-4" />
            )}
            Test keys
          </ManagementButton>
          <ManagementButton
            type="button"
            onClick={handleSave}
            disabled={loading || saving || testing}
            className="inline-flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </ManagementButton>
        </div>
      }
    >
      {loading ? (
        <DetailPageSkeleton />
      ) : (
      <div className="admin-panel space-y-4 p-5">
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-md px-2 py-0.5 font-semibold ${
                  meta.environment === "live"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {String(meta.environment || "test").toUpperCase()}
              </span>
              {meta.configured ? (
                <span className="text-emerald-700">Credentials configured</span>
              ) : (
                <span className="text-amber-700">Not configured yet</span>
              )}
            </div>

            <div>
              <label className="admin-label">Key ID</label>
              <input
                type="text"
                value={form.key_id}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, key_id: e.target.value }))
                }
                placeholder="rzp_live_… or rzp_test_…"
                className="admin-input"
                disabled={loading || saving}
                autoComplete="off"
              />
            </div>

            <div>
              <label className="admin-label">Key Secret</label>
              <input
                type="password"
                value={form.key_secret}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, key_secret: e.target.value }))
                }
                placeholder={
                  meta.has_key_secret
                    ? `Saved ${meta.key_secret_masked} — leave blank to keep`
                    : "Enter Key Secret"
                }
                className="admin-input"
                disabled={loading || saving}
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs text-admin-muted">
                API Key Secret from Razorpay Dashboard → Settings → API Keys (not the webhook secret).
              </p>
            </div>

            <div>
              <label className="admin-label">Webhook Secret</label>
              <input
                type="password"
                value={form.webhook_secret}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, webhook_secret: e.target.value }))
                }
                placeholder={
                  meta.has_webhook_secret
                    ? `Saved ${meta.webhook_secret_masked} — leave blank to keep`
                    : "Webhook signing secret"
                }
                className="admin-input"
                disabled={loading || saving}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="admin-label">Webhook URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={form.webhook_url}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, webhook_url: e.target.value }))
                  }
                  placeholder="https://server.ooms.in/api/v1/webhook/razorpay"
                  className="admin-input min-w-0 flex-1"
                  disabled={loading || saving}
                />
                <button
                  type="button"
                  onClick={copyWebhookUrl}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-admin-border text-admin-muted hover:bg-admin-raised"
                  title="Copy webhook URL"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-admin-muted">
                Paste this URL in Razorpay Dashboard → Settings → Webhooks. Enable{" "}
                <code className="rounded bg-admin-raised px-1">payment.captured</code>,{" "}
                <code className="rounded bg-admin-raised px-1">order.paid</code>, and{" "}
                <code className="rounded bg-admin-raised px-1">payment.failed</code>.
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

            <div className="border-t border-admin-border pt-4">
              <h3 className="text-sm font-bold text-admin-text">
                Wallet gateway charges
              </h3>
              <p className="mt-1 text-xs text-admin-muted">
                Applied only on Razorpay wallet top-ups. User pays net + fee; wallet is credited the net amount. Manual payment requests have no fee.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="admin-label">Fee percent (%)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={feeForm.gateway_fee_percent}
                    onChange={(e) => {
                      const v = e.target.value
                        .replace(/[^\d.]/g, "")
                        .replace(/(\..*)\./g, "$1");
                      setFeeForm((prev) => ({
                        ...prev,
                        gateway_fee_percent: v,
                      }));
                    }}
                    className="admin-input"
                    disabled={loading || savingFee}
                  />
                </div>
                <div>
                  <label className="admin-label">Flat fee (₹)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={feeForm.gateway_fee_flat}
                    onChange={(e) => {
                      const v = e.target.value
                        .replace(/[^\d.]/g, "")
                        .replace(/(\..*)\./g, "$1");
                      setFeeForm((prev) => ({
                        ...prev,
                        gateway_fee_flat: v,
                      }));
                    }}
                    className="admin-input"
                    disabled={loading || savingFee}
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <ManagementButton
                  type="button"
                  onClick={handleSaveFee}
                  disabled={loading || savingFee}
                  className="inline-flex items-center gap-2"
                  tone="slate"
                >
                  {savingFee ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save charges
                </ManagementButton>
              </div>
            </div>
          </>
      </div>
      )}
    </ManagementHub>
  );
}
