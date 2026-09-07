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
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-green-100 text-green-800 border border-green-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800">
                <CheckCircle size={10} className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Active
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-red-100 text-red-800 border border-red-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800">
            <Ban size={10} className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Inactive
        </span>
    );
};

const InfoCard = ({ icon: Icon, title, children, className = "" }) => (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden dark:border-slate-800 dark:bg-slate-900 ${className}`}>
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 dark:border-slate-800 dark:from-slate-800 dark:to-slate-900">
            <div className="flex items-center gap-2">
                <Icon size={16} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{title}</h3>
            </div>
        </div>
        <div className="p-4">{children}</div>
    </div>
);

const InfoRow = ({ icon: Icon, label, value, className = "" }) => (
    <div className={`flex items-center gap-1 sm:gap-2 ${className}`}>
        <Icon size={12} className="text-gray-400 shrink-0 w-3 h-3 sm:w-3.5 sm:h-3.5" />
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
            <span className="text-[10px] sm:text-xs text-gray-500 shrink-0">{label}:</span>
            <span className="text-[11px] sm:text-sm text-gray-800 font-medium truncate dark:text-slate-200">{value || "N/A"}</span>
        </div>
    </div>
);

const VerificationBadge = ({ isVerified }) => (
    <span className={`inline-flex items-center gap-1 text-xs ${isVerified ? 'text-green-600' : 'text-red-500'}`}>
        {isVerified ? <CheckCircle size={12} /> : <Ban size={12} />}
        {isVerified ? 'Verified' : 'Not Verified'}
    </span>
);

const PaymentStatusBadge = ({ status }) => {
    const s = String(status || "pending").toLowerCase();
    const styles = {
        paid: "bg-green-100 text-green-800 border-green-200",
        pending: "bg-amber-100 text-amber-800 border-amber-200",
        failed: "bg-red-100 text-red-800 border-red-200",
    };
    return (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${styles[s] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
            {s}
        </span>
    );
};

const PlanStatusBadge = ({ isActive }) => (
    isActive ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800 border border-green-200">
            <CheckCircle size={10} /> Active
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
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
            <div className="flex items-center justify-center py-16 text-gray-500 gap-2">
                <Loader2 size={18} className="animate-spin" />
                Loading subscriptions…
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-sm text-red-600 mb-3">{error}</p>
                <button
                    type="button"
                    onClick={loadSubscriptions}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <p className="text-sm font-semibold text-gray-900">
                        {summary.is_subscribed === "yes" ? "Subscribed" : "Not subscribed"}
                    </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-gray-500 mb-1">Highest plan</p>
                    <p className="text-sm font-semibold text-gray-900">
                        {summary.subscription_plan || "None"}
                    </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-gray-500 mb-1">Latest expiry</p>
                    <p className="text-sm font-semibold text-gray-900">
                        {formatDateTime(summary.subscription_expires_at)}
                    </p>
                </div>
            </div>

            {/* Active plans */}
            <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-blue-600" />
                        <h3 className="text-sm font-semibold text-gray-800">Active subscriptions</h3>
                    </div>
                    <button
                        type="button"
                        onClick={openAddPlan}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                        <Plus size={14} />
                        Add plan
                    </button>
                </div>
                {activePlans.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                        No active plans for this branch
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase text-gray-600">Plan</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase text-gray-600">Cycle</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase text-gray-600">Expires</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase text-gray-600">Days left</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase text-gray-600">Payment</th>
                                    <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase text-gray-600">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {activePlans.map((row) => (
                                    <tr key={row.subscription_id} className="hover:bg-gray-50">
                                        <td className="px-3 py-3">
                                            <div className="font-medium text-gray-900">{row.plan_name}</div>
                                            <div className="text-[11px] text-gray-400">{row.subscription_id}</div>
                                        </td>
                                        <td className="px-3 py-3 capitalize text-gray-700">{row.billing_cycle}</td>
                                        <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{formatDateTime(row.expires_at)}</td>
                                        <td className="px-3 py-3 text-gray-700">{row.days_remaining}</td>
                                        <td className="px-3 py-3">
                                            <div className="text-gray-700">{row.payment_method || "—"}</div>
                                            <div className="text-[11px] text-gray-400 truncate max-w-[140px]" title={row.payment_ref || ""}>
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
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg"
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
                <div className="flex items-center gap-2 mb-3">
                    <History size={16} className="text-slate-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Subscription history</h3>
                </div>
                {historyPlans.length === 0 && subscriptions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                        No subscription history
                    </div>
                ) : historyPlans.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
                        No expired plans yet
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase text-gray-600">Plan</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase text-gray-600">Status</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase text-gray-600">Expired at</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase text-gray-600">Last payment</th>
                                    <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase text-gray-600">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {historyPlans.map((row) => (
                                    <tr key={row.subscription_id} className="hover:bg-gray-50">
                                        <td className="px-3 py-3">
                                            <div className="font-medium text-gray-900">{row.plan_name}</div>
                                            <div className="text-[11px] text-gray-400 capitalize">{row.billing_cycle}</div>
                                        </td>
                                        <td className="px-3 py-3"><PlanStatusBadge isActive={false} /></td>
                                        <td className="px-3 py-3 whitespace-nowrap text-gray-700">{formatDateTime(row.expires_at)}</td>
                                        <td className="px-3 py-3 text-gray-700">{row.payment_method || "—"}</td>
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
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg"
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
                <div className="flex items-center gap-2 mb-3">
                    <FileText size={16} className="text-indigo-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Payment history</h3>
                </div>
                {payments.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                        No payment records found
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase text-gray-600">Order</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase text-gray-600">Plan</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase text-gray-600">Amount</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase text-gray-600">Status</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase text-gray-600">Payment ID</th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase text-gray-600">By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {payments.map((row) => (
                                    <tr key={row.order_id} className="hover:bg-gray-50">
                                        <td className="px-3 py-3">
                                            <div className="font-mono text-xs text-gray-800 truncate max-w-[160px]" title={row.order_id}>
                                                {row.order_id}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="text-gray-800">{row.plan_name || "—"}</div>
                                            <div className="text-[11px] text-gray-400 capitalize">{row.billing_cycle || "—"}</div>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-gray-800">
                                            ₹{Number(row.amount_rupees || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-3 py-3">
                                            <PaymentStatusBadge status={row.status} />
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="font-mono text-xs text-gray-600 truncate max-w-[140px]" title={row.payment_id || ""}>
                                                {row.payment_id || "—"}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-gray-700">{row.username || "—"}</td>
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
                    <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl p-5 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 m-0">Add plan manually</h3>
                                <p className="text-xs text-gray-500 mt-1 m-0">
                                    Assign without payment. Does not stack remaining days.
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => setAdding(null)}
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Plan</label>
                        <select
                            value={adding.plan_name}
                            onChange={(e) =>
                                setAdding((prev) => ({ ...prev, plan_name: e.target.value }))
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-3"
                        >
                            {(data?.plans?.length ? data.plans : PLAN_OPTIONS).map((plan) => (
                                <option key={plan} value={plan}>{plan}</option>
                            ))}
                        </select>

                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Billing cycle</label>
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
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-3"
                        >
                            <option value="monthly">Monthly (30 days)</option>
                            <option value="yearly">Yearly (365 days)</option>
                        </select>

                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Expiry date & time
                        </label>
                        <input
                            type="datetime-local"
                            value={adding.expires_at}
                            onChange={(e) =>
                                setAdding((prev) => ({ ...prev, expires_at: e.target.value }))
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <p className="text-[11px] text-gray-400 mt-2 m-0">
                            If this plan already exists for the branch, it is replaced (not extended).
                        </p>

                        <div className="flex justify-end gap-2 mt-5">
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => setAdding(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={handleAssignPlan}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
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
                    <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl p-5 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 m-0">Update expiry</h3>
                                <p className="text-xs text-gray-500 mt-1 m-0">
                                    Plan: <strong>{editing.plan_name}</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => setEditing(null)}
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Expiry date & time
                        </label>
                        <input
                            type="datetime-local"
                            value={editing.expires_at}
                            onChange={(e) =>
                                setEditing((prev) => ({ ...prev, expires_at: e.target.value }))
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <p className="text-[11px] text-gray-400 mt-2 m-0">
                            Setting a future date marks the plan active; a past date marks it expired.
                        </p>
                        <div className="flex justify-end gap-2 mt-5">
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => setEditing(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={handleSaveExpiry}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-4 gap-2">
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
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-blue-600" />
                        Task Overview
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded-xl">
                            <p className="text-2xl font-bold text-green-600">{statistics.tasks.complete || 0}</p>
                            <p className="text-xs text-gray-600">Completed</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-xl">
                            <p className="text-2xl font-bold text-red-600">{statistics.tasks.cancel || 0}</p>
                            <p className="text-xs text-gray-600">Cancelled</p>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded-xl">
                            <p className="text-2xl font-bold text-yellow-600">{statistics.tasks.pending_from_department || 0}</p>
                            <p className="text-xs text-gray-600">Pending (Dept)</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-xl">
                            <p className="text-2xl font-bold text-orange-600">{statistics.tasks.pending_from_client || 0}</p>
                            <p className="text-xs text-gray-600">Pending (Client)</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-xl">
                            <p className="text-2xl font-bold text-blue-600">{statistics.tasks.in_process || 0}</p>
                            <p className="text-xs text-gray-600">In Process</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.keys(address).length > 0 && (
                    <InfoCard icon={MapPin} title="Address Information">
                        <div className="space-y-2">
                            {address.address_line_1 && (
                                <p className="text-sm text-gray-700">{address.address_line_1}</p>
                            )}
                            {address.address_line_2 && (
                                <p className="text-sm text-gray-700">{address.address_line_2}</p>
                            )}
                            <p className="text-sm text-gray-700">
                                {[address.city, address.state, address.country].filter(Boolean).join(', ')}
                                {address.pincode && ` - ${address.pincode}`}
                            </p>
                            {address.invoice_address && (
                                <p className="text-sm text-gray-500 mt-2 pt-2 border-t">
                                    <span className="font-medium">Invoice Address:</span> {address.invoice_address}
                                </p>
                            )}
                        </div>
                    </InfoCard>
                )}

                {Object.keys(taxInfo).length > 0 && (taxInfo.pan || taxInfo.gst) && (
                    <InfoCard icon={IdCard} title="Tax Information">
                        <div className="space-y-3">
                            {taxInfo.pan && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">PAN Number:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-mono font-medium">{taxInfo.pan}</span>
                                        <VerificationBadge isVerified={taxInfo.is_pan_verified} />
                                    </div>
                                </div>
                            )}
                            {taxInfo.gst && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">GST Number:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-mono font-medium">{taxInfo.gst}</span>
                                        <VerificationBadge isVerified={taxInfo.is_gst_verified} />
                                    </div>
                                </div>
                            )}
                            {taxInfo.gst_rate && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">GST Rate:</span>
                                    <span className="text-sm font-medium text-green-600">{taxInfo.gst_rate}%</span>
                                </div>
                            )}
                        </div>
                    </InfoCard>
                )}

                {Object.keys(owner).length > 0 && (
                    <InfoCard icon={User} title="Owner Information" className="lg:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {branch?.logo && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4 dark:border-slate-800 dark:bg-slate-900">
                            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Building size={16} className="text-blue-600" />
                                Branch Logo
                            </h3>
                            <img src={branch.logo} alt="Branch Logo" className="max-h-32 object-contain" />
                        </div>
                    )}
                    {branch?.sign && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4 dark:border-slate-800 dark:bg-slate-900">
                            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <FileText size={16} className="text-blue-600" />
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
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">😕</div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2 dark:text-white">Branch Not Found</h2>
                    <p className="text-gray-600 mb-6 dark:text-slate-400">{error || "Unable to load branch details"}</p>
                    <button
                        onClick={handleBack}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="min-h-screen mx-auto">
            {/* Header Section */}
            <div className="lg:mb-6 mb-2">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-3 px-2 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
                        <div className="flex items-center gap-2 min-w-0">
                            <button
                                onClick={handleBack}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0 dark:hover:bg-slate-800"
                            >
                                <ArrowLeft size={18} className="text-gray-600 dark:text-slate-300" />
                            </button>
                            <StoreIcon size={16} className="text-purple-500 shrink-0" />
                            <span className="text-sm font-medium text-gray-600 shrink-0 hidden sm:inline dark:text-slate-400">Branch</span>
                            <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">/</span>
                            <span className="text-sm text-gray-900 font-semibold truncate dark:text-white">{branch?.name || 'Branch Details'}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={handleViewServices}
                                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                            >
                                <Settings size={16} />
                                <span className="text-sm font-semibold hidden sm:inline">Services</span>
                            </button>
                            <RefreshButton onClick={handleRefresh} loading={refreshing} className="justify-center px-3 sm:px-4">
                                <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
                            </RefreshButton>
                        </div>
                    </div>

                    <div className="px-3 sm:px-6 py-3 sm:py-5">
                        <div className="flex flex-row items-start gap-3 sm:gap-5">
                            <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-sm sm:shadow-lg ring-2 sm:ring-4 ring-purple-50 shrink-0 overflow-hidden">
                                {branch?.logo ? (
                                    <img
                                        src={branch.logo}
                                        alt={branch.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Building size={20} className="text-white sm:w-8 sm:h-8" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 sm:gap-3 mb-1 sm:mb-2">
                                    <h1 className="text-base sm:text-2xl font-bold text-gray-900 truncate leading-tight">
                                        {branch?.name || 'N/A'}
                                    </h1>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={branch?.status} />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-x-3 sm:gap-x-6 gap-y-1 sm:gap-y-2 w-full">
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
                        <div className="xl:hidden px-4 py-3 border-t border-slate-100 bg-gray-50/50">
                            <button
                                onClick={() => setShowMobileContacts(!showMobileContacts)}
                                className="w-full flex items-center justify-between text-sm text-gray-700 font-medium"
                            >
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-gray-500" />
                                    <span>Contact Information</span>
                                </div>
                                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${showMobileContacts ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    )}

                    <div className={`${showMobileContacts ? 'grid' : 'hidden'} xl:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-4 sm:px-6 pb-4 pt-2 xl:pt-4 border-t-0 xl:border-t border-slate-100 items-center bg-gray-50/50`}>
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
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-gray-200">
                    <nav className="flex overflow-x-auto scrollbar-hide">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative whitespace-nowrap
                                        ${activeTab === tab.id
                                            ? "text-blue-600"
                                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                        }
                                    `}
                                >
                                    <Icon size={18} />
                                    <span>{tab.label}</span>
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="branchDetailsTab"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
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
