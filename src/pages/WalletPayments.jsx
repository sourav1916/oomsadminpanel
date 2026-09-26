import React, { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Landmark,
  Inbox,
} from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "../utils/apiCall";
import ManagementHub from "../components/common/ManagementHub";
import ManagementButton from "../components/common/ManagementButton";
import ModalScrollLock from "../components/common/ModalScrollLock";
import { ListPageSkeleton, TableSkeleton } from "../components/SkeletonComponent";
import ActionMenu from "../components/common/ActionMenu";

const emptyBank = {
  bank_id: "",
  account_name: "",
  bank_name: "",
  account_number: "",
  ifsc: "",
  branch_name: "",
  upi_id: "",
  status: "active",
  sort_order: 0,
};

export default function WalletPayments() {
  const [tab, setTab] = useState("requests");
  const [banks, setBanks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [bankModal, setBankModal] = useState(false);
  const [bankForm, setBankForm] = useState(emptyBank);
  const [savingBank, setSavingBank] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [adminRemark, setAdminRemark] = useState({});

  const fetchBanks = useCallback(async () => {
    const res = await apiCall("/wallet/banks", "GET");
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || "Failed to load banks");
    }
    setBanks(data.data || []);
  }, []);

  const fetchRequests = useCallback(async () => {
    const qs = new URLSearchParams({
      status: statusFilter,
      page_no: "1",
      limit: "50",
    });
    const res = await apiCall(`/wallet/payment-requests?${qs}`, "GET");
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || "Failed to load payment requests");
    }
    setRequests(data.data || []);
  }, [statusFilter]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchBanks(), fetchRequests()]);
    } catch (err) {
      toast.error(err.message || "Failed to load wallet payments");
    } finally {
      setLoading(false);
    }
  }, [fetchBanks, fetchRequests]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openNewBank = () => {
    setBankForm(emptyBank);
    setBankModal(true);
  };

  const openEditBank = (row) => {
    setBankForm({
      bank_id: row.bank_id || "",
      account_name: row.account_name || "",
      bank_name: row.bank_name || "",
      account_number: row.account_number || "",
      ifsc: row.ifsc || "",
      branch_name: row.branch_name || "",
      upi_id: row.upi_id || "",
      status: row.status || "active",
      sort_order: row.sort_order || 0,
    });
    setBankModal(true);
  };

  const saveBank = async () => {
    if (
      !bankForm.account_name.trim() ||
      !bankForm.bank_name.trim() ||
      !bankForm.account_number.trim() ||
      !bankForm.ifsc.trim()
    ) {
      toast.error("Account name, bank name, account number and IFSC are required");
      return;
    }
    setSavingBank(true);
    try {
      const method = bankForm.bank_id ? "PUT" : "POST";
      const path = bankForm.bank_id
        ? `/wallet/banks/${encodeURIComponent(bankForm.bank_id)}`
        : "/wallet/banks";
      const res = await apiCall(path, method, {
        account_name: bankForm.account_name.trim(),
        bank_name: bankForm.bank_name.trim(),
        account_number: bankForm.account_number.trim(),
        ifsc: bankForm.ifsc.trim(),
        branch_name: bankForm.branch_name.trim() || null,
        upi_id: bankForm.upi_id.trim() || null,
        status: bankForm.status,
        sort_order: Number(bankForm.sort_order) || 0,
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to save bank");
      }
      toast.success(bankForm.bank_id ? "Bank updated" : "Bank added");
      setBankModal(false);
      await fetchBanks();
    } catch (err) {
      toast.error(err.message || "Failed to save bank");
    } finally {
      setSavingBank(false);
    }
  };

  const removeBank = async (row) => {
    if (!window.confirm(`Delete bank “${row.bank_name} / ${row.account_number}”?`)) {
      return;
    }
    try {
      const res = await apiCall(
        `/wallet/banks/${encodeURIComponent(row.bank_id)}`,
        "DELETE"
      );
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to delete bank");
      }
      toast.success("Bank deleted");
      await fetchBanks();
    } catch (err) {
      toast.error(err.message || "Failed to delete bank");
    }
  };

  const reviewRequest = async (row, action) => {
    setReviewingId(`${row.request_id}:${action}`);
    try {
      const res = await apiCall(
        `/wallet/payment-requests/${encodeURIComponent(row.request_id)}/review`,
        "POST",
        {
          action,
          admin_remark: adminRemark[row.request_id] || "",
        }
      );
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Review failed");
      }
      toast.success(data.message || `Request ${action}`);
      await fetchRequests();
    } catch (err) {
      toast.error(err.message || "Failed to review request");
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <ManagementHub
      eyebrow="Wallet"
      title="Payment Requests & Banks"
      description="Manage bank accounts for manual transfers and approve or reject user payment requests. No gateway fee on these credits."
      accent="slate"
      onRefresh={refresh}
      refreshing={loading}
      actions={
        tab === "banks" ? (
          <ManagementButton
            type="button"
            onClick={openNewBank}
            className="inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add bank
          </ManagementButton>
        ) : null
      }
    >
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("requests")}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            tab === "requests"
              ? "bg-admin-accent-soft text-admin-accent-text"
              : "text-admin-text-sub hover:bg-admin-raised hover:text-admin-text"
          }`}
        >
          <Inbox className="h-3.5 w-3.5" />
          Requests
        </button>
        <button
          type="button"
          onClick={() => setTab("banks")}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            tab === "banks"
              ? "bg-admin-accent-soft text-admin-accent-text"
              : "text-admin-text-sub hover:bg-admin-raised hover:text-admin-text"
          }`}
        >
          <Landmark className="h-3.5 w-3.5" />
          Bank accounts
        </button>
      </div>

      {tab === "banks" ? (
        <div className="overflow-hidden admin-panel">
          {loading ? (
            <TableSkeleton columns={5} rows={6} />
          ) : banks.length === 0 ? (
            <p className="p-6 text-sm text-admin-muted">
              No bank accounts yet. Add one for users to transfer funds.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-admin-border bg-admin-raised text-[11px] uppercase tracking-wide text-admin-muted">
                  <tr>
                    <th className="px-4 py-3 w-12">S.No</th>
                    <th className="px-4 py-3">Account</th>
                    <th className="px-4 py-3">Bank / IFSC</th>
                    <th className="px-4 py-3">UPI</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {banks.map((row, index) => (
                    <tr key={row.bank_id}>
                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-admin-text">
                          {row.account_name}
                        </p>
                        <p className="font-mono text-xs text-slate-500">
                          {row.account_number}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p>{row.bank_name}</p>
                        <p className="text-xs text-slate-500">
                          {row.ifsc}
                          {row.branch_name ? ` · ${row.branch_name}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {row.upi_id || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            row.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ActionMenu
                          actions={[
                            {
                              label: "Edit",
                              icon: <Pencil className="h-3.5 w-3.5" />,
                              onClick: () => openEditBank(row),
                            },
                            {
                              label: "Delete",
                              icon: <Trash2 className="h-3.5 w-3.5" />,
                              danger: true,
                              onClick: () => removeBank(row),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {["pending", "approved", "rejected", "all"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-admin-accent-soft text-admin-accent-text"
                    : "bg-admin-raised text-admin-text-sub hover:bg-admin-accent-soft/50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="overflow-hidden admin-panel">
            {loading ? (
              <ListPageSkeleton columns={4} rows={6} />
            ) : requests.length === 0 ? (
              <p className="p-6 text-sm text-admin-muted">No payment requests.</p>
            ) : (
              <div className="divide-y divide-admin-border">
                {requests.map((row) => (
                  <div key={row.request_id} className="space-y-2 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-admin-text">
                          ₹
                          {Number(row.amount || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          <span className="text-xs font-normal text-slate-500">
                            · {row.branch_id} · {row.username}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {row.request_id}
                          {row.transfer_ref ? ` · UTR ${row.transfer_ref}` : ""}
                          {row.transfer_date
                            ? ` · ${String(row.transfer_date).slice(0, 10)}`
                            : ""}
                        </p>
                        {row.bank ? (
                          <p className="mt-1 text-xs text-slate-600">
                            To: {row.bank.bank_name} · {row.bank.account_number} ·{" "}
                            {row.bank.ifsc}
                          </p>
                        ) : null}
                        {row.remark ? (
                          <p className="mt-1 text-xs text-slate-500">
                            Remark: {row.remark}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${
                          row.status === "approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : row.status === "rejected"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>

                    {row.status === "pending" ? (
                      <div className="flex flex-wrap items-end gap-2">
                        <input
                          type="text"
                          placeholder="Admin remark (optional)"
                          value={adminRemark[row.request_id] || ""}
                          onChange={(e) =>
                            setAdminRemark((prev) => ({
                              ...prev,
                              [row.request_id]: e.target.value,
                            }))
                          }
                          className="admin-input h-9 min-w-[200px] flex-1"
                        />
                        <ManagementButton
                          type="button"
                          onClick={() => reviewRequest(row, "approved")}
                          disabled={Boolean(reviewingId)}
                          className="inline-flex items-center gap-1.5"
                        >
                          {reviewingId === `${row.request_id}:approved` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Approve
                        </ManagementButton>
                        <ManagementButton
                          type="button"
                          tone="slate"
                          onClick={() => reviewRequest(row, "rejected")}
                          disabled={Boolean(reviewingId)}
                          className="inline-flex items-center gap-1.5"
                        >
                          {reviewingId === `${row.request_id}:rejected` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                          Reject
                        </ManagementButton>
                      </div>
                    ) : row.admin_remark ? (
                      <p className="text-xs text-slate-500">
                        Admin: {row.admin_remark}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {bankModal ? (
        <>
          <ModalScrollLock />
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="admin-panel w-full max-w-lg p-5">
              <h3 className="text-base font-bold text-admin-text">
                {bankForm.bank_id ? "Edit bank account" : "Add bank account"}
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ["account_name", "Account name"],
                  ["bank_name", "Bank name"],
                  ["account_number", "Account number"],
                  ["ifsc", "IFSC"],
                  ["branch_name", "Branch (optional)"],
                  ["upi_id", "UPI ID (optional)"],
                ].map(([key, label]) => (
                  <div key={key} className={key === "account_name" ? "sm:col-span-2" : ""}>
                    <label className="admin-label">{label}</label>
                    <input
                      type="text"
                      value={bankForm[key] || ""}
                      onChange={(e) =>
                        setBankForm((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="admin-input"
                    />
                  </div>
                ))}
                <div>
                  <label className="admin-label">Status</label>
                  <select
                    value={bankForm.status}
                    onChange={(e) =>
                      setBankForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="admin-input"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="admin-label">Sort order</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={bankForm.sort_order}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d]/g, "");
                      setBankForm((prev) => ({
                        ...prev,
                        sort_order: v,
                      }));
                    }}
                    className="admin-input"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <ManagementButton
                  type="button"
                  tone="slate"
                  onClick={() => setBankModal(false)}
                  disabled={savingBank}
                >
                  Cancel
                </ManagementButton>
                <ManagementButton
                  type="button"
                  onClick={saveBank}
                  disabled={savingBank}
                  className="inline-flex items-center gap-2"
                >
                  {savingBank ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save
                </ManagementButton>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </ManagementHub>
  );
}
