// pages/BranchDetails.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    Building, MapPin, Phone,
    Mail,
    Calendar,
    CheckCircle,
    Ban,
    IdCard,
    User,
    ArrowLeft,
    FileText,
    Users,
    Briefcase,
    Clock,
    Store,
    Store as StoreIcon,
    Settings,
    ChevronDown,
    CreditCard,
    History,
    Pencil,
    X,
    Save,
    Loader2,
    Plus,
} from "lucide-react";
import { toast } from 'react-toastify';
import apiCall from '../utils/apiCall';
import { DetailPageSkeleton } from "../components/SkeletonComponent";
import RefreshButton from "../components/common/RefreshButton";
import StatisticsCard from "../components/user/StatisticsCard";

// ─── Helper Components ─────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
    if (status) {
        return (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 sm:text-xs">
                <CheckCircle size={10} className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Active
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 sm:text-xs">
            <Ban size={10} className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Inactive
        </span>
    );
};

const InfoCard = ({ icon: Icon, title, children, className = "" }) => (
    <div className={`admin-panel overflow-hidden ${className}`}>
        <div className="border-b border-admin-border bg-admin-raised px-4 py-3">
            <div className="flex items-center gap-2">
                <Icon size={16} className="text-admin-accent-text" />
                <h3 className="text-sm font-semibold text-admin-text">{title}</h3>
            </div>
        </div>
        <div className="p-4">{children}</div>
    </div>
);

const InfoRow = ({ icon: Icon, label, value, className = "" }) => (
    <div className={`flex items-center gap-1 sm:gap-2 ${className}`}>
        <Icon size={12} className="h-3 w-3 shrink-0 text-admin-muted sm:h-3.5 sm:w-3.5" />
        <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
            <span className="shrink-0 text-[10px] text-admin-muted sm:text-xs">{label}:</span>
            <span className="truncate text-[11px] font-medium text-admin-text sm:text-sm">{value || "N/A"}</span>
        </div>
    </div>
);

const VerificationBadge = ({ isVerified }) => (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${isVerified ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>
        {isVerified ? <CheckCircle size={12} /> : <Ban size={12} />}
        {isVerified ? 'Verified' : 'Not Verified'}
    </span>
);

const PaymentStatusBadge = ({ status }) => {
    const s = String(status || "pending").toLowerCase();
    const styles = {
        paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
        pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
        failed: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    };
    return (
        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide capitalize ${styles[s] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
            {s}
        </span>
    );
};

const PlanStatusBadge = ({ isActive }) => (
    isActive ? (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle size={10} /> Active
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Ban size={10} /> Expired
        </span>
    )
);

const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const toDatetimeLocalValue = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const TABS = [
    { id: "basic", label: "Basic", icon: Building },
    { id: "subscription", label: "Subscription", icon: CreditCard },
];

// ─── Subscription Tab ───────────────────────────────────────────────────────

const PLAN_OPTIONS = ["Business", "BusinessPlus", "BusinessPro"];

function defaultExpiryForCycle(cycle) {
    const d = new Date();
    d.setDate(d.getDate() + (cycle === "yearly" ? 365 : 30));
    return toDatetimeLocalValue(d);
}

function SubscriptionTab({ branchId }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(null); // { subscription_id, expires_at }
    const [adding, setAdding] = useState(null); // { plan_name, billing_cycle, expires_at }

    const loadSubscriptions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiCall(`/branch/${branchId}/subscriptions`, "GET");
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Failed to load subscriptions");
            }
            setData(result.data);
        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Failed to load subscriptions");
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        loadSubscriptions();
    }, [loadSubscriptions]);

    const openAddPlan = () => {
        setAdding({
            plan_name: "Business",
            billing_cycle: "monthly",
            expires_at: defaultExpiryForCycle("monthly"),
        });
    };

    const handleAssignPlan = async () => {
        if (!adding?.plan_name) {
            toast.error("Please select a plan");
            return;
        }
        if (!adding?.expires_at) {
            toast.error("Please select an expiry date/time");
            return;
        }
        setSaving(true);
        try {
            const response = await apiCall(
                `/branch/${branchId}/subscriptions`,
                "POST",
                {
                    plan_name: adding.plan_name,
                    billing_cycle: adding.billing_cycle,
                    expires_at: adding.expires_at,
                }
            );
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Failed to assign plan");
            }
            toast.success(result.message || "Plan assigned");
            setAdding(null);
            await loadSubscriptions();
        } catch (err) {
            toast.error(err.message || "Failed to assign plan");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveExpiry = async () => {
        if (!editing?.subscription_id || !editing?.expires_at) {
            toast.error("Please select an expiry date/time");
            return;
        }
        setSaving(true);
        try {
            const response = await apiCall(
                `/branch/${branchId}/subscriptions/${editing.subscription_id}/expiry`,
                "PATCH",
                { expires_at: editing.expires_at }
            );
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Failed to update expiry");
            }
            toast.success(result.message || "Expiry updated");
            setEditing(null);
            await loadSubscriptions();
        } catch (err) {
            toast.error(err.message || "Failed to update expiry");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center gap-2 py-16 text-admin-muted">
                <Loader2 size={18} className="animate-spin" />
                Loading subscriptions…
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-12 text-center">
                <p className="mb-3 text-sm text-rose-600">{error}</p>
                <button
                    type="button"
                    onClick={loadSubscriptions}
                    className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    const summary = data?.summary || {};
    const subscriptions = data?.subscriptions || [];
    const activePlans = subscriptions.filter((s) => s.is_active);
    const historyPlans = subscriptions.filter((s) => !s.is_active);
    const payments = data?.payments || [];

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-admin-border bg-admin-raised p-4">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-admin-muted">Status</p>
                    <p className="text-sm font-semibold text-admin-text">
                        {summary.is_subscribed === "yes" ? "Subscribed" : "Not subscribed"}
                    </p>
                </div>
                <div className="rounded-md border border-admin-border bg-admin-raised p-4">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-admin-muted">Highest plan</p>
                    <p className="text-sm font-semibold text-admin-text">
                        {summary.subscription_plan || "None"}
                    </p>
                </div>
                <div className="rounded-md border border-admin-border bg-admin-raised p-4">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-admin-muted">Latest expiry</p>
                    <p className="text-sm font-semibold text-admin-text">
                        {formatDateTime(summary.subscription_expires_at)}
                    </p>
                </div>
            </div>

            {/* Active plans */}
            <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-admin-accent-text" />
                        <h3 className="text-sm font-semibold text-admin-text">Active subscriptions</h3>
                    </div>
                    <button
                        type="button"
                        onClick={openAddPlan}
                        className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                    >
                        <Plus size={14} />
                        Add plan
                    </button>
                </div>
                {activePlans.length === 0 ? (
                    <div className="rounded-md border border-dashed border-admin-border px-4 py-8 text-center text-sm text-admin-muted">
                        No active plans for this branch
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-md border border-admin-border">
                        <table className="w-full text-sm">
                            <thead className="border-b border-admin-border bg-admin-raised">
                                <tr>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-admin-muted">Plan</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-admin-muted">Cycle</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-admin-muted">Expires</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-admin-muted">Days left</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-admin-muted">Payment</th>
                                    <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wide text-admin-muted">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-admin-border">
                                {activePlans.map((row) => (
                                    <tr key={row.subscription_id} className="hover:bg-admin-raised">
                                        <td className="px-3 py-3">
                                            <div className="font-medium text-admin-text">{row.plan_name}</div>
                                            <div className="text-[11px] text-admin-muted">{row.subscription_id}</div>
                                        </td>
                                        <td className="px-3 py-3 capitalize text-admin-text-sub">{row.billing_cycle}</td>
                                        <td className="whitespace-nowrap px-3 py-3 text-admin-text-sub">{formatDateTime(row.expires_at)}</td>
                                        <td className="px-3 py-3 text-admin-text-sub">{row.days_remaining}</td>
                                        <td className="px-3 py-3">
                                            <div className="text-admin-text-sub">{row.payment_method || "—"}</div>
                                            <div className="max-w-[140px] truncate text-[11px] text-admin-muted" title={row.payment_ref || ""}>
                                                {row.payment_ref || "—"}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setEditing({
                                                        subscription_id: row.subscription_id,
                                                        plan_name: row.plan_name,
                                                        expires_at: toDatetimeLocalValue(row.expires_at),
                                                    })
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-md bg-admin-accent-soft px-2.5 py-1.5 text-xs font-semibold text-admin-accent-text hover:bg-teal-100 dark:hover:bg-teal-900/40"
                                            >
                                                <Pencil size={12} />
                                                Edit expiry
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* History (expired plan rows) */}
            <div>
                <div className="mb-3 flex items-center gap-2">
                    <History size={16} className="text-admin-muted" />
                    <h3 className="text-sm font-semibold text-admin-text">Subscription history</h3>
                </div>
                {historyPlans.length === 0 && subscriptions.length === 0 ? (
                    <div className="rounded-md border border-dashed border-admin-border px-4 py-8 text-center text-sm text-admin-muted">
                        No subscription history
                    </div>
                ) : historyPlans.length === 0 ? (
                    <div className="rounded-md border border-dashed border-admin-border px-4 py-6 text-center text-sm text-admin-muted">
                        No expired plans yet
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-md border border-admin-border">
                        <table className="w-full text-sm">
                            <thead className="border-b border-admin-border bg-admin-raised">
                                <tr>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-admin-muted">Plan</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-admin-muted">Status</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-admin-muted">Expired at</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-admin-muted">Last payment</th>
                                    <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wide text-admin-muted">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-admin-border">
                                {historyPlans.map((row) => (
                                    <tr key={row.subscription_id} className="hover:bg-admin-raised">
                                        <td className="px-3 py-3">
                                            <div className="font-medium text-admin-text">{row.plan_name}</div>
                                            <div className="text-[11px] capitalize text-admin-muted">{row.billing_cycle}</div>
                                        </td>
                                        <td className="px-3 py-3"><PlanStatusBadge isActive={false} /></td>
                                        <td className="whitespace-nowrap px-3 py-3 text-admin-text-sub">{formatDateTime(row.expires_at)}</td>
                                        <td className="px-3 py-3 text-admin-text-sub">{row.payment_method || "—"}</td>
                                        <td className="px-3 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setEditing({
                                                        subscription_id: row.subscription_id,
                                                        plan_name: row.plan_name,
                                                        expires_at: toDatetimeLocalValue(row.expires_at),
                                                    })
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-md bg-admin-accent-soft px-2.5 py-1.5 text-xs font-semibold text-admin-accent-text hover:bg-teal-100 dark:hover:bg-teal-900/40"
                                            >
                                                <Pencil size={12} />
                                                Extend / set expiry
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Payments */}
            <div>
                <div className="mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-admin-accent-text" />
                    <h3 className="text-sm font-semibold text-admin-text">Payment history</h3>
                </div>
                {payments.length === 0 ? (
                    <div className="rounded-md border border-dashed border-admin-border px-4 py-8 text-center text-sm text-admin-muted">
                        No payment records found
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-md border border-admin-border">
                        <table className="w-full text-sm">
                            <thead className="border-b border-admin-border bg-admin-raised">
                                <tr>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-admin-muted">Order</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-admin-muted">Plan</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-admin-muted">Amount</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-admin-muted">Status</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-admin-muted">Payment ID</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-admin-muted">By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-admin-border">
                                {payments.map((row) => (
                                    <tr key={row.order_id} className="hover:bg-admin-raised">
                                        <td className="px-3 py-3">
                                            <div className="max-w-[160px] truncate font-mono text-xs text-admin-text" title={row.order_id}>
                                                {row.order_id}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="text-admin-text">{row.plan_name || "—"}</div>
                                            <div className="text-[11px] capitalize text-admin-muted">{row.billing_cycle || "—"}</div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 text-admin-text">
                                            ₹{Number(row.amount_rupees || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-3 py-3">
                                            <PaymentStatusBadge status={row.status} />
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="max-w-[140px] truncate font-mono text-xs text-admin-muted" title={row.payment_id || ""}>
                                                {row.payment_id || "—"}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-admin-text-sub">{row.username || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add plan modal (manual, no payment) */}
            {adding ? (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => !saving && setAdding(null)} />
                    <div className="admin-panel relative w-full max-w-md p-5">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <h3 className="m-0 text-base font-semibold text-admin-text">Add plan manually</h3>
                                <p className="m-0 mt-1 text-xs text-admin-muted">
                                    Assign without payment. Does not stack remaining days.
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => setAdding(null)}
                                className="rounded-md p-1.5 text-admin-muted hover:bg-admin-raised"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <label className="admin-label">Plan</label>
                        <select
                            value={adding.plan_name}
                            onChange={(e) =>
                                setAdding((prev) => ({ ...prev, plan_name: e.target.value }))
                            }
                            className="admin-input mb-3"
                        >
                            {(data?.plans?.length ? data.plans : PLAN_OPTIONS).map((plan) => (
                                <option key={plan} value={plan}>{plan}</option>
                            ))}
                        </select>

                        <label className="admin-label">Billing cycle</label>
                        <select
                            value={adding.billing_cycle}
                            onChange={(e) => {
                                const cycle = e.target.value;
                                setAdding((prev) => ({
                                    ...prev,
                                    billing_cycle: cycle,
                                    expires_at: defaultExpiryForCycle(cycle),
                                }));
                            }}
                            className="admin-input mb-3"
                        >
                            <option value="monthly">Monthly (30 days)</option>
                            <option value="yearly">Yearly (365 days)</option>
                        </select>

                        <label className="admin-label">
                            Expiry date & time
                        </label>
                        <input
                            type="datetime-local"
                            value={adding.expires_at}
                            onChange={(e) =>
                                setAdding((prev) => ({ ...prev, expires_at: e.target.value }))
                            }
                            className="admin-input"
                        />
                        <p className="m-0 mt-2 text-[11px] text-admin-muted">
                            If this plan already exists for the branch, it is replaced (not extended).
                        </p>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => setAdding(null)}
                                className="rounded-md border border-admin-border bg-admin-raised px-4 py-2 text-sm font-semibold text-admin-text-sub hover:bg-admin-surface disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={handleAssignPlan}
                                className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                Assign plan
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Edit expiry modal */}
            {editing ? (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => !saving && setEditing(null)} />
                    <div className="admin-panel relative w-full max-w-md p-5">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <h3 className="m-0 text-base font-semibold text-admin-text">Update expiry</h3>
                                <p className="m-0 mt-1 text-xs text-admin-muted">
                                    Plan: <strong>{editing.plan_name}</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => setEditing(null)}
                                className="rounded-md p-1.5 text-admin-muted hover:bg-admin-raised"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <label className="admin-label">
                            Expiry date & time
                        </label>
                        <input
                            type="datetime-local"
                            value={editing.expires_at}
                            onChange={(e) =>
                                setEditing((prev) => ({ ...prev, expires_at: e.target.value }))
                            }
                            className="admin-input"
                        />
                        <p className="m-0 mt-2 text-[11px] text-admin-muted">
                            Setting a future date marks the plan active; a past date marks it expired.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => setEditing(null)}
                                className="rounded-md border border-admin-border bg-admin-raised px-4 py-2 text-sm font-semibold text-admin-text-sub hover:bg-admin-surface disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={handleSaveExpiry}
                                className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

// ─── Basic Tab ──────────────────────────────────────────────────────────────

function BasicTab({ branch, statistics, address, contact, taxInfo, owner }) {
    return (
        <div className="space-y-6">
            {statistics && Object.keys(statistics).length > 0 && (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
                    {statistics.clients && (
                        <StatisticsCard
                            title="Clients"
                            total={statistics.clients?.total || 0}
                            active={statistics.clients?.active || 0}
                            icon={Users}
                            color="blue"
                        />
                    )}
                    {statistics.ca && (
                        <StatisticsCard
                            title="CA Firms"
                            total={statistics.ca?.total || 0}
                            active={statistics.ca?.active || 0}
                            icon={Briefcase}
                            color="purple"
                        />
                    )}
                    {statistics.agent && (
                        <StatisticsCard
                            title="Agents"
                            total={statistics.agent?.total || 0}
                            active={statistics.agent?.active || 0}
                            icon={Users}
                            color="orange"
                        />
                    )}
                    {statistics.employees && (
                        <StatisticsCard
                            title="Employees"
                            total={statistics.employees?.total || 0}
                            active={statistics.employees?.active || 0}
                            icon={User}
                            color="indigo"
                            extra={`${statistics.employees?.accepted || 0} accepted, ${statistics.employees?.pending || 0} pending`}
                        />
                    )}
                    {statistics.firms && (
                        <StatisticsCard
                            title="Firms"
                            total={statistics.firms?.total || 0}
                            active={statistics.firms?.active || 0}
                            icon={Store}
                            color="pink"
                        />
                    )}
                </div>
            )}

            {statistics?.tasks && (
                <div className="admin-panel p-4 sm:p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-admin-text">
                        <FileText size={20} className="text-admin-accent-text" />
                        Task Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
                        <div className="rounded-md border border-admin-border bg-emerald-50 p-3 text-center dark:bg-emerald-950/30">
                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{statistics.tasks.complete || 0}</p>
                            <p className="text-xs text-admin-muted">Completed</p>
                        </div>
                        <div className="rounded-md border border-admin-border bg-rose-50 p-3 text-center dark:bg-rose-950/30">
                            <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{statistics.tasks.cancel || 0}</p>
                            <p className="text-xs text-admin-muted">Cancelled</p>
                        </div>
                        <div className="rounded-md border border-admin-border bg-amber-50 p-3 text-center dark:bg-amber-950/30">
                            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{statistics.tasks.pending_from_department || 0}</p>
                            <p className="text-xs text-admin-muted">Pending (Dept)</p>
                        </div>
                        <div className="rounded-md border border-admin-border bg-orange-50 p-3 text-center dark:bg-orange-950/30">
                            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{statistics.tasks.pending_from_client || 0}</p>
                            <p className="text-xs text-admin-muted">Pending (Client)</p>
                        </div>
                        <div className="rounded-md border border-admin-border bg-admin-accent-soft p-3 text-center">
                            <p className="text-2xl font-bold text-admin-accent-text">{statistics.tasks.in_process || 0}</p>
                            <p className="text-xs text-admin-muted">In Process</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {Object.keys(address).length > 0 && (
                    <InfoCard icon={MapPin} title="Address Information">
                        <div className="space-y-2">
                            {address.address_line_1 && (
                                <p className="text-sm text-admin-text-sub">{address.address_line_1}</p>
                            )}
                            {address.address_line_2 && (
                                <p className="text-sm text-admin-text-sub">{address.address_line_2}</p>
                            )}
                            <p className="text-sm text-admin-text-sub">
                                {[address.city, address.state, address.country].filter(Boolean).join(', ')}
                                {address.pincode && ` - ${address.pincode}`}
                            </p>
                            {address.invoice_address && (
                                <p className="mt-2 border-t border-admin-border pt-2 text-sm text-admin-muted">
                                    <span className="font-medium text-admin-text">Invoice Address:</span> {address.invoice_address}
                                </p>
                            )}
                        </div>
                    </InfoCard>
                )}

                {Object.keys(taxInfo).length > 0 && (taxInfo.pan || taxInfo.gst) && (
                    <InfoCard icon={IdCard} title="Tax Information">
                        <div className="space-y-3">
                            {taxInfo.pan && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-admin-muted">PAN Number:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm font-medium text-admin-text">{taxInfo.pan}</span>
                                        <VerificationBadge isVerified={taxInfo.is_pan_verified} />
                                    </div>
                                </div>
                            )}
                            {taxInfo.gst && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-admin-muted">GST Number:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm font-medium text-admin-text">{taxInfo.gst}</span>
                                        <VerificationBadge isVerified={taxInfo.is_gst_verified} />
                                    </div>
                                </div>
                            )}
                            {taxInfo.gst_rate && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-admin-muted">GST Rate:</span>
                                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{taxInfo.gst_rate}%</span>
                                </div>
                            )}
                        </div>
                    </InfoCard>
                )}

                {Object.keys(owner).length > 0 && (
                    <InfoCard icon={User} title="Owner Information" className="lg:col-span-2">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <InfoRow icon={User} label="Name" value={owner.name} />
                            <InfoRow icon={Mail} label="Email" value={owner.email || owner.login_id} />
                            <InfoRow icon={Phone} label="Mobile" value={owner.mobile ? `+${owner.country_code || '91'} ${owner.mobile}` : 'N/A'} />
                            <InfoRow icon={IdCard} label="Username" value={owner.username} />
                            <InfoRow icon={Calendar} label="Status" value={<StatusBadge status={owner.status} />} />
                        </div>
                    </InfoCard>
                )}
            </div>

            {(branch?.logo || branch?.sign) && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {branch?.logo && (
                        <div className="admin-panel p-4">
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-admin-text">
                                <Building size={16} className="text-admin-accent-text" />
                                Branch Logo
                            </h3>
                            <img src={branch.logo} alt="Branch Logo" className="max-h-32 object-contain" />
                        </div>
                    )}
                    {branch?.sign && (
                        <div className="admin-panel p-4">
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-admin-text">
                                <FileText size={16} className="text-admin-accent-text" />
                                Signature
                            </h3>
                            <img src={branch.sign} alt="Branch Signature" className="max-h-20 object-contain" />
                        </div>
                    )}
                </div>
            )}

            {/* Contact info for desktop context (also shown in header) */}
            {(contact?.mobile_1 || contact?.mobile_2 || contact?.email_1 || contact?.email_2) ? null : null}
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function BranchDetails() {
    const { branchId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [branchData, setBranchData] = useState(null);
    const [showMobileContacts, setShowMobileContacts] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");

    const fetchInProgress = useRef(false);
    const initialFetchDone = useRef(false);
    const currentRequestId = useRef(0);
    const lastFetchedBranchId = useRef(null);

    const fetchBranchDetails = useCallback(async (showRefresh = false) => {
        if (fetchInProgress.current) return;

        if (!showRefresh && lastFetchedBranchId.current === branchId) {
            return;
        }

        fetchInProgress.current = true;
        const requestId = ++currentRequestId.current;

        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const response = await apiCall(`/branch/details/${branchId}`, 'GET');

            if (requestId !== currentRequestId.current) return;

            if (!response.ok) throw new Error('Failed to fetch branch details');

            const result = await response.json();

            if (result.success) {
                setBranchData(result.data);
                lastFetchedBranchId.current = branchId;
                setError(null);
            } else {
                throw new Error(result.message || 'Failed to fetch branch details');
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setError(err.message);
            toast.error(err.message || "Failed to load branch details.");
        } finally {
            if (requestId === currentRequestId.current) {
                setLoading(false);
                setRefreshing(false);
                fetchInProgress.current = false;
            }
        }
    }, [branchId]);

    useEffect(() => {
        if (branchId && !initialFetchDone.current) {
            initialFetchDone.current = true;
            fetchBranchDetails();
        }
    }, [branchId, fetchBranchDetails]);

    const handleRefresh = () => {
        lastFetchedBranchId.current = null;
        fetchBranchDetails(true);
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleViewServices = () => {
        navigate(`/branch/${branchId}/services`);
    };

    if (loading) {
        return <DetailPageSkeleton />;
    }

    if (error || !branchData) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-transparent">
                <div className="admin-panel max-w-md p-8 text-center">
                    <h2 className="mb-2 text-xl font-semibold text-admin-text">Branch Not Found</h2>
                    <p className="mb-6 text-admin-muted">{error || "Unable to load branch details"}</p>
                    <button
                        onClick={handleBack}
                        className="rounded-md bg-teal-600 px-6 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const branch = branchData;
    const statistics = branchData.statistics || {};
    const address = branch?.address || {};
    const contact = branch?.contact || {};
    const taxInfo = branch?.tax_info || {};
    const owner = branch?.owner || {};

    return (
        <div className="mx-auto min-h-screen space-y-4">
            {/* Header Section */}
            <div className="admin-panel overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-admin-border bg-admin-raised px-3 py-3 sm:px-4">
                    <div className="flex min-w-0 items-center gap-2">
                        <button
                            onClick={handleBack}
                            className="shrink-0 rounded-md p-1.5 text-admin-muted transition-colors hover:bg-admin-surface hover:text-admin-text"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <StoreIcon size={16} className="shrink-0 text-admin-accent-text" />
                        <span className="hidden shrink-0 text-sm font-medium text-admin-muted sm:inline">Branch</span>
                        <span className="hidden shrink-0 text-xs text-admin-muted sm:inline">/</span>
                        <span className="truncate text-sm font-semibold text-admin-text">{branch?.name || 'Branch Details'}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            onClick={handleViewServices}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-600 px-3 py-2 text-white transition-colors hover:bg-teal-700 sm:px-4"
                        >
                            <Settings size={16} />
                            <span className="hidden text-sm font-semibold sm:inline">Services</span>
                        </button>
                        <RefreshButton onClick={handleRefresh} loading={refreshing} className="justify-center px-3 sm:px-4">
                            <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
                        </RefreshButton>
                    </div>
                </div>

                <div className="px-3 py-3 sm:px-6 sm:py-5">
                    <div className="flex flex-row items-start gap-3 sm:gap-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-900 text-teal-300 sm:h-16 sm:w-16">
                            {branch?.logo ? (
                                <img
                                    src={branch.logo}
                                    alt={branch.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <Building size={20} className="sm:h-8 sm:w-8" />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-1 sm:mb-2 sm:gap-3">
                                <h1 className="truncate text-base font-bold leading-tight text-admin-text sm:text-2xl">
                                    {branch?.name || 'N/A'}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={branch?.status} />
                                </div>
                            </div>

                            <div className="flex w-full flex-wrap gap-x-3 gap-y-1 sm:gap-x-6 sm:gap-y-2">
                                {branch?.create_date && (
                                    <InfoRow icon={Calendar} label="Created" value={new Date(branch.create_date).toLocaleDateString()} />
                                )}
                                {branch?.create_by && (
                                    <InfoRow icon={User} label="Created By" value={branch.create_by} />
                                )}
                                {branch?.modify_date && branch?.create_date && branch.modify_date !== branch.create_date && (
                                    <InfoRow icon={Clock} label="Modified" value={new Date(branch.modify_date).toLocaleDateString()} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {(contact?.mobile_1 || contact?.mobile_2 || contact?.email_1 || contact?.email_2) && (
                    <div className="border-t border-admin-border bg-admin-raised px-4 py-3 xl:hidden">
                        <button
                            onClick={() => setShowMobileContacts(!showMobileContacts)}
                            className="flex w-full items-center justify-between text-sm font-medium text-admin-text"
                        >
                            <div className="flex items-center gap-2">
                                <Phone size={14} className="text-admin-muted" />
                                <span>Contact Information</span>
                            </div>
                            <ChevronDown size={16} className={`text-admin-muted transition-transform duration-200 ${showMobileContacts ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                )}

                <div className={`${showMobileContacts ? 'grid' : 'hidden'} grid-cols-1 items-center gap-3 border-t-0 bg-admin-raised px-4 pb-4 pt-2 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 xl:grid xl:border-t xl:border-admin-border xl:pt-4`}>
                    {contact?.mobile_1 && (
                        <InfoRow icon={Phone} label="Mobile 1" value={contact.mobile_1} />
                    )}
                    {contact?.mobile_2 && (
                        <InfoRow icon={Phone} label="Mobile 2" value={contact.mobile_2} />
                    )}
                    {contact?.email_1 && (
                        <InfoRow icon={Mail} label="Email 1" value={contact.email_1} />
                    )}
                    {contact?.email_2 && (
                        <InfoRow icon={Mail} label="Email 2" value={contact.email_2} />
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="admin-panel overflow-hidden">
                <div className="border-b border-admin-border">
                    <nav className="scrollbar-hide flex overflow-x-auto">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        relative flex items-center gap-2 whitespace-nowrap px-6 py-4 text-sm font-medium transition-all
                                        ${activeTab === tab.id
                                            ? "text-admin-accent-text"
                                            : "text-admin-muted hover:bg-admin-raised hover:text-admin-text"
                                        }
                                    `}
                                >
                                    <Icon size={18} />
                                    <span>{tab.label}</span>
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="branchDetailsTab"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"
                                            transition={{ duration: 0.2 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-4 sm:p-6">
                    <AnimatePresence mode="wait">
                        {activeTab === "basic" && (
                            <motion.div
                                key="basic"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.2 }}
                            >
                                <BasicTab
                                    branch={branch}
                                    statistics={statistics}
                                    address={address}
                                    contact={contact}
                                    taxInfo={taxInfo}
                                    owner={owner}
                                />
                            </motion.div>
                        )}
                        {activeTab === "subscription" && (
                            <motion.div
                                key="subscription"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.2 }}
                            >
                                <SubscriptionTab branchId={branchId} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
