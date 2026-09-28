import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { UserX } from "lucide-react";
import apiCall from "../utils/apiCall";
import ManagementHub from "../components/common/ManagementHub";
import ManagementTable from "../components/common/ManagementTable";
import TablePagination from "../components/common/TablePagination";
import ModalScrollLock from "../components/common/ModalScrollLock";
import { ListPageSkeleton } from "../components/SkeletonComponent";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In review" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

const statusTone = {
  pending: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  in_review: "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
  completed: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  rejected: "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
};

export default function AccountDeletionRequests() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [active, setActive] = useState(null);
  const [remark, setRemark] = useState("");
  const [nextStatus, setNextStatus] = useState("in_review");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status,
        search: query,
        page_no: String(page),
        limit: String(limit),
      });
      const res = await apiCall(`/account-deletion?${params}`, "GET");
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to load requests");
      }
      setRows(data.data || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch (err) {
      toast.error(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [status, query, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const openReview = (row, preset) => {
    setActive(row);
    setRemark(row.admin_remark || "");
    setNextStatus(preset || row.status || "in_review");
  };

  const saveReview = async () => {
    if (!active) return;
    setSaving(true);
    try {
      const res = await apiCall(
        `/account-deletion/${encodeURIComponent(active.request_id)}`,
        "PUT",
        { status: nextStatus, admin_remark: remark }
      );
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Update failed");
      }
      toast.success("Request updated");
      setActive(null);
      await load();
    } catch (err) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ManagementHub
      eyebrow="Website"
      title="Account deletion"
      description="Requests submitted from the public account deletion page."
      onRefresh={load}
      refreshing={loading}
    >
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, mobile, username, or request id"
          className="admin-input sm:max-w-md"
        />
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setStatus(item.value);
                setPage(1);
              }}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                status === item.value
                  ? "bg-admin-accent-soft text-admin-accent-text"
                  : "bg-admin-raised text-admin-text-sub"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <ListPageSkeleton columns={5} />
      ) : rows.length === 0 ? (
        <div className="admin-panel py-16 text-center">
          <UserX className="mx-auto mb-3 text-admin-muted" />
          <p className="text-sm font-semibold text-admin-text-sub">No deletion requests</p>
        </div>
      ) : (
        <ManagementTable
          rows={rows}
          rowKey="request_id"
          showSerial
          serialStart={(page - 1) * limit + 1}
          columns={[
            {
              key: "person",
              label: "Request",
              render: (row) => (
                <div>
                  <p className="font-semibold text-admin-text">{row.name}</p>
                  <p className="text-xs text-admin-muted">{row.request_id}</p>
                </div>
              ),
            },
            {
              key: "contact",
              label: "Contact",
              render: (row) => (
                <div className="text-xs">
                  <p>{row.email}</p>
                  <p className="text-admin-muted">{row.mobile}</p>
                </div>
              ),
            },
            {
              key: "username",
              label: "Username",
              render: (row) => row.username || "—",
            },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${statusTone[row.status] || ""}`}>
                  {String(row.status || "").replace("_", " ")}
                </span>
              ),
            },
            {
              key: "create_date",
              label: "Submitted",
              render: (row) => row.create_date || "—",
            },
          ]}
          getActions={(row) => [
            { label: "Review", onClick: () => openReview(row) },
            { label: "Mark in review", onClick: () => openReview(row, "in_review") },
            { label: "Mark completed", onClick: () => openReview(row, "completed") },
            { label: "Reject", danger: true, onClick: () => openReview(row, "rejected") },
          ]}
          footer={
            <TablePagination
              page={page}
              limit={limit}
              total={total}
              totalPages={totalPages}
              onPageChange={setPage}
              onLimitChange={(next) => {
                setLimit(next);
                setPage(1);
              }}
            />
          }
        />
      )}

      {active && (
        <>
          <ModalScrollLock />
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="admin-panel w-full max-w-lg space-y-4 p-5">
              <div>
                <h2 className="text-lg font-bold text-admin-text">{active.name}</h2>
                <p className="text-xs text-admin-muted">
                  {active.request_id} · {active.email} · {active.mobile}
                  {active.username ? ` · ${active.username}` : ""}
                </p>
              </div>
              {active.reason && (
                <p className="rounded-lg bg-admin-raised px-3 py-2 text-sm text-admin-text-sub">
                  {active.reason}
                </p>
              )}
              <label className="block space-y-1">
                <span className="admin-label">Status</span>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className="admin-input"
                >
                  {STATUS_OPTIONS.filter((item) => item.value !== "all").map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="admin-label">Admin note</span>
                <textarea
                  rows={4}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="admin-input"
                  placeholder="Internal note about this request"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="rounded-lg border border-admin-border px-4 py-2 text-sm font-semibold text-admin-text-sub"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveReview}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </ManagementHub>
  );
}
