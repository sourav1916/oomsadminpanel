import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Power,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import apiCall from "../utils/apiCall";
import ManagementHub from "../components/common/ManagementHub";
import ManagementButton from "../components/common/ManagementButton";
import ModalScrollLock from "../components/common/ModalScrollLock";
import { TableSkeleton } from "../components/SkeletonComponent";
import ActionMenu from "../components/common/ActionMenu";

const EMPTY_FORM = {
  template_id: "",
  type: "payment reminder",
  name: "",
  dlt_message_id: "",
  message_body: "",
  variable_keys: [],
  sender_id: "",
  route: "dlt",
  status: "active",
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", duration: 0.45 } },
  exit: { opacity: 0, scale: 0.95, y: 12, transition: { duration: 0.2 } },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function countDltSlots(body) {
  return (String(body || "").match(/\{#\s*var\s*#\}/gi) || []).length;
}

function StatusBadge({ status }) {
  const active = String(status).toLowerCase() === "active";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
      }`}
    >
      {active ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function SmsSystemTemplates() {
  const [rows, setRows] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState(null);
  const [deleteBusyId, setDeleteBusyId] = useState(null);
  const [activeSlot, setActiveSlot] = useState(0);

  const isEdit = Boolean(form.template_id);
  const slotCount = countDltSlots(form.message_body);

  const selectedTypeMeta = useMemo(
    () => types.find((t) => t.name === form.type) || null,
    [types, form.type]
  );
  const availableVariables = selectedTypeMeta?.available_variables || [];

  const fetchList = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      try {
        const qs = new URLSearchParams({
          page_no: 1,
          limit: 100,
          search: search.trim(),
        });
        if (typeFilter) qs.set("type", typeFilter);
        const [listRes, typesRes] = await Promise.all([
          apiCall(`/sms-system/templates?${qs}`, "GET"),
          apiCall("/sms-system/types", "GET"),
        ]);
        const listData = await listRes.json();
        const typesData = await typesRes.json();
        if (typesRes.ok && typesData.success !== false) {
          setTypes(typesData.data || []);
        }
        if (listRes.ok && listData.success !== false) {
          setRows(listData.data || []);
        } else {
          setRows([]);
          toast.error(listData.message || "Failed to load templates");
        }
      } catch {
        toast.error("Failed to load templates");
        setRows([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, typeFilter]
  );

  useEffect(() => {
    const t = setTimeout(() => fetchList(false), 250);
    return () => clearTimeout(t);
  }, [fetchList]);

  const openCreate = () => {
    const defaultType = types[0]?.name || "payment reminder";
    setForm({ ...EMPTY_FORM, type: defaultType, variable_keys: [] });
    setActiveSlot(0);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    const keys = Array.isArray(row.variable_keys) ? [...row.variable_keys] : [];
    setForm({
      template_id: row.template_id || "",
      type: row.type || "",
      name: row.name || "",
      dlt_message_id: row.dlt_message_id || "",
      message_body: row.message_body || "",
      variable_keys: keys,
      sender_id: row.sender_id || "",
      route: row.route || "dlt",
      status: row.status || "active",
    });
    setActiveSlot(0);
    setModalOpen(true);
  };

  useEffect(() => {
    if (!modalOpen) return;
    const count = countDltSlots(form.message_body);
    setForm((prev) => {
      const next = Array.from({ length: count }, (_, i) => prev.variable_keys?.[i] || "");
      if (
        next.length === (prev.variable_keys || []).length &&
        next.every((v, i) => v === (prev.variable_keys || [])[i])
      ) {
        return prev;
      }
      return { ...prev, variable_keys: next };
    });
  }, [modalOpen, form.message_body]);

  const setVariableKey = (index, value) => {
    setForm((prev) => {
      const count = Math.max(countDltSlots(prev.message_body), index + 1);
      const next = Array.from({ length: count }, (_, i) => prev.variable_keys?.[i] || "");
      next[index] = value;
      return { ...prev, variable_keys: next };
    });
  };

  const handleSave = async () => {
    if (!form.type || !form.name.trim()) {
      toast.error("Type and name are required");
      return;
    }
    if (slotCount > 0) {
      const keys = form.variable_keys || [];
      if (keys.length !== slotCount || keys.some((k) => !String(k || "").trim())) {
        toast.error(`Map all ${slotCount} DLT variables`);
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        name: form.name.trim(),
        dlt_message_id: form.dlt_message_id,
        message_body: form.message_body,
        variable_keys: form.variable_keys || [],
        sender_id: form.sender_id,
        route: form.route,
        status: form.status,
      };
      const res = isEdit
        ? await apiCall(`/sms-system/templates/${form.template_id}`, "PUT", payload)
        : await apiCall("/sms-system/templates", "POST", payload);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Save failed");
      }
      toast.success(isEdit ? "Template updated" : "Template created");
      setModalOpen(false);
      fetchList(true);
    } catch (err) {
      toast.error(err.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (row) => {
    setStatusBusyId(row.template_id);
    try {
      const next = String(row.status).toLowerCase() === "active" ? "inactive" : "active";
      const res = await apiCall(`/sms-system/templates/${row.template_id}/status`, "PUT", {
        status: next,
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Status update failed");
      }
      toast.success(`Template ${next}`);
      fetchList(true);
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setStatusBusyId(null);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete template “${row.name}”?`)) return;
    setDeleteBusyId(row.template_id);
    try {
      const res = await apiCall(`/sms-system/templates/${row.template_id}`, "DELETE");
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Delete failed");
      }
      toast.success("Template deleted");
      fetchList(true);
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeleteBusyId(null);
    }
  };

  return (
    <ManagementHub
      eyebrow="Configuration"
      title="OOMS System SMS Templates"
      description="Global Fast2SMS / DLT templates for the OOMS System SMS channel."
      accent="slate"
      onRefresh={() => fetchList(true)}
      refreshing={refreshing}
      actions={
        <ManagementButton onClick={openCreate} leftIcon={<Plus size={14} />}>
          Add template
        </ManagementButton>
      }
    >
      <div className="space-y-4">
        <div className="admin-panel p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="admin-input w-full max-w-md"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="admin-input w-full sm:w-auto"
            >
              <option value="">All types</option>
              {types.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-panel overflow-hidden">
          {loading ? (
            <TableSkeleton columns={5} rows={8} />
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-16 text-center">
              <MessageSquare className="h-8 w-8 text-slate-400" />
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                No system SMS templates yet
              </p>
              <ManagementButton onClick={openCreate} leftIcon={<Plus size={14} />}>
                Add template
              </ManagementButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                    <th className="px-4 py-3 w-12">S.No</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Template</th>
                    <th className="px-4 py-3">Preview</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {rows.map((row, index) => (
                    <tr key={row.template_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/70">
                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold capitalize text-admin-text">
                        {row.type}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-admin-text">{row.name}</p>
                        <p className="text-xs text-slate-400">{row.dlt_message_id || "—"}</p>
                      </td>
                      <td className="max-w-xs px-4 py-3">
                        <p className="line-clamp-2 text-xs text-slate-500">
                          {row.content_preview || row.message_body || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ActionMenu
                          actions={[
                            {
                              label:
                                String(row.status).toLowerCase() === "active"
                                  ? "Deactivate"
                                  : "Activate",
                              icon: <Power size={12} />,
                              disabled: statusBusyId === row.template_id,
                              onClick: () => toggleStatus(row),
                            },
                            {
                              label: "Edit",
                              icon: <Pencil size={12} />,
                              onClick: () => openEdit(row),
                            },
                            {
                              label: "Delete",
                              icon: <Trash2 size={12} />,
                              danger: true,
                              disabled: deleteBusyId === row.template_id,
                              onClick: () => handleDelete(row),
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
      </div>

      <AnimatePresence>
        {modalOpen && (
          <>
            <ModalScrollLock />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 sm:p-4"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                className="admin-panel flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden"
                variants={modalVariants}
              >
                <div className="flex items-center justify-between border-b border-admin-border px-5 py-4">
                  <h3 className="text-lg font-bold text-admin-text">
                    {isEdit ? "Edit template" : "Add template"}
                  </h3>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => setModalOpen(false)}
                  >
                    ×
                  </button>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="admin-label">Type</label>
                      <select
                        value={form.type}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            type: e.target.value,
                            variable_keys: [],
                          }))
                        }
                        className="admin-input"
                      >
                        {types.map((item) => (
                          <option key={item.name} value={item.name}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="admin-label">Name</label>
                      <input
                        value={form.name}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="admin-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="admin-label">DLT message ID</label>
                      <input
                        value={form.dlt_message_id}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            dlt_message_id: e.target.value,
                          }))
                        }
                        className="admin-input"
                      />
                    </div>
                    <div>
                      <label className="admin-label">Route</label>
                      <select
                        value={form.route}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, route: e.target.value }))
                        }
                        className="admin-input"
                      >
                        <option value="dlt">DLT</option>
                        <option value="dlt_manual">DLT Manual</option>
                        <option value="otp">OTP</option>
                        <option value="q">Quick SMS</option>
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

                  <div>
                    <label className="admin-label">Sender ID (optional override)</label>
                    <input
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
                    <label className="admin-label">Message body</label>
                    <textarea
                      rows={5}
                      value={form.message_body}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          message_body: e.target.value,
                        }))
                      }
                      placeholder="Approved DLT text with {#var#} placeholders"
                      className="admin-textarea"
                    />
                  </div>

                  {slotCount > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-admin-text">
                        Variable placement ({slotCount})
                      </p>
                      {Array.from({ length: slotCount }).map((_, index) => (
                        <div
                          key={`slot-${index}`}
                          className={`rounded-xl border p-3 ${
                            activeSlot === index
                              ? "border-teal-400 bg-admin-accent-soft ring-2 ring-teal-200 dark:bg-teal-950/30 dark:ring-teal-800"
                              : "border-admin-border"
                          }`}
                          onClick={() => setActiveSlot(index)}
                        >
                          <div className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                            {`{#var#} ${index + 1}`}
                          </div>
                          <select
                            value={form.variable_keys[index] || ""}
                            onChange={(e) => setVariableKey(index, e.target.value)}
                            className="admin-input w-full"
                          >
                            <option value="">Select variable…</option>
                            {availableVariables.map((variable) => (
                              <option key={variable.key} value={variable.key}>
                                {variable.label || variable.key} — {variable.key}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-end gap-2 border-t border-admin-border bg-admin-surface px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-lg border border-admin-border px-4 py-2.5 text-sm font-semibold text-admin-text-sub hover:bg-admin-raised"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                    {saving ? "Saving…" : isEdit ? "Save changes" : "Create"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}
