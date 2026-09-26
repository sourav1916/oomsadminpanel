import React, { useCallback, useEffect, useState } from "react";
import {
  Mail,
  Plus,
  Pencil,
  CheckCircle2,
  XCircle,
  Server,
  Send,
  Power,
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
  config_id: "",
  config_name: "",
  host: "smtp.gmail.com",
  port: "587",
  secure: false,
  username: "",
  password: "",
  from_email: "",
  from_name: "",
  reply_to: "",
  status: "inactive",
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

export default function CompanyMail() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState(null);

  const isEdit = Boolean(form.config_id);

  const fetchList = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const qs = new URLSearchParams({
        page_no: 1,
        limit: 100,
        search: search.trim(),
      });
      const res = await apiCall(`/mail/config/list?${qs}`, "GET");
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setRows(data.data || []);
      } else {
        setRows([]);
        toast.error(data.message || "Failed to load mail configs");
      }
    } catch {
      toast.error("Failed to load mail configs");
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => fetchList(false), 250);
    return () => clearTimeout(t);
  }, [fetchList]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setForm({
      ...EMPTY_FORM,
      config_id: row.config_id,
      config_name: row.config_name || "",
      host: row.host || "",
      port: String(row.port ?? 587),
      secure: Boolean(row.secure),
      username: row.username || "",
      password: "",
      from_email: row.from_email || "",
      from_name: row.from_name || "",
      reply_to: row.reply_to || "",
      status: row.status || "inactive",
    });
    setModalOpen(true);
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    if (!form.config_name || !form.host || !form.port || !form.username || !form.from_email) {
      toast.error("Please fill all required fields");
      return false;
    }
    if (!isEdit && !form.password) {
      toast.error("Password is required for a new config");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        config_name: form.config_name.trim(),
        host: form.host.trim(),
        port: Number(form.port),
        secure: form.secure ? 1 : 0,
        username: form.username.trim(),
        from_email: form.from_email.trim(),
        from_name: form.from_name.trim() || null,
        reply_to: form.reply_to.trim() || null,
        status: form.status,
      };
      if (form.password) payload.password = form.password;

      let res;
      if (isEdit) {
        res = await apiCall("/mail/config/edit", "PUT", {
          ...payload,
          config_id: form.config_id,
        });
      } else {
        res = await apiCall("/mail/config/create", "POST", {
          ...payload,
          password: form.password,
        });
      }
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Save failed");
      }
      toast.success(isEdit ? "Mail config updated" : "Mail config created");
      setModalOpen(false);
      fetchList(true);
    } catch (err) {
      toast.error(err.message || "Failed to save mail config");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!form.host || !form.port || !form.username) {
      toast.error("Host, port, and username are required to test");
      return;
    }
    if (!isEdit && !form.password) {
      toast.error("Password is required to test a new config");
      return;
    }
    setTesting(true);
    try {
      const payload = {
        host: form.host.trim(),
        port: Number(form.port),
        secure: form.secure ? 1 : 0,
        username: form.username.trim(),
        from_email: form.from_email.trim() || undefined,
      };
      if (form.config_id) payload.config_id = form.config_id;
      if (form.password) payload.password = form.password;

      const res = await apiCall("/mail/config/test", "POST", payload);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "SMTP test failed");
      }
      toast.success(data.message || "SMTP verified");
    } catch (err) {
      toast.error(err.message || "SMTP test failed");
    } finally {
      setTesting(false);
    }
  };

  const toggleStatus = async (row) => {
    const next = String(row.status).toLowerCase() === "active" ? "inactive" : "active";
    setStatusBusyId(row.config_id);
    try {
      const res = await apiCall("/mail/config/status", "PUT", {
        config_id: row.config_id,
        status: next,
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to update status");
      }
      toast.success(
        next === "active"
          ? "This config is now active for all company mailing"
          : "Config deactivated"
      );
      fetchList(true);
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setStatusBusyId(null);
    }
  };

  return (
    <ManagementHub
      eyebrow="Configuration"
      title="Company Mail"
      description="Configure platform SMTP used for company emails (OTP, CA approval, invitations). Only the active config is used."
      accent="slate"
      onRefresh={() => fetchList(true)}
      refreshing={refreshing}
      actions={
        <ManagementButton onClick={openCreate} leftIcon={<Plus size={14} />}>
          Add mail config
        </ManagementButton>
      }
    >
      <div className="space-y-4">
        <div className="admin-panel p-3">
          <div className="relative max-w-md">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search configs…"
              className="admin-input"
            />
          </div>
        </div>

        <div className="overflow-hidden admin-panel">
          {loading ? (
            <TableSkeleton columns={4} rows={6} />
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-16 text-center">
              <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                <Mail className="h-8 w-8 text-slate-400" />
              </div>
              <p className="font-semibold text-admin-text">No company mail configs yet</p>
              <p className="text-sm text-admin-muted">Add an SMTP config and mark one as Active.</p>
              <ManagementButton onClick={openCreate} leftIcon={<Plus size={14} />}>
                Add mail config
              </ManagementButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-admin-border bg-admin-raised text-left text-xs font-bold uppercase tracking-wider text-admin-muted">
                    <th className="px-4 py-3 w-12">S.No</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Host / From</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {rows.map((row, index) => (
                    <tr key={row.config_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/70">
                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-admin-text">{row.config_name}</p>
                        <p className="text-xs text-slate-400">{row.config_id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="flex items-center gap-1.5 font-medium text-admin-text">
                          <Server size={12} className="text-slate-400" />
                          {row.host}:{row.port}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">{row.from_email}</p>
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
                              disabled: statusBusyId === row.config_id,
                              onClick: () => toggleStatus(row),
                            },
                            {
                              label: "Edit",
                              icon: <Pencil size={12} />,
                              onClick: () => openEdit(row),
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
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => !saving && setModalOpen(false)}
            >
              <motion.div
                className="admin-panel max-h-[90vh] w-full max-w-xl overflow-y-auto"
                variants={modalVariants}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-admin-border px-5 py-4">
                  <div>
                    <h3 className="text-lg font-bold text-admin-text">
                      {isEdit ? "Edit mail config" : "Add mail config"}
                    </h3>
                    <p className="text-xs text-admin-muted">
                      Only one Active config is used for all company emails.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-2xl text-slate-400 hover:text-slate-700"
                    onClick={() => setModalOpen(false)}
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
                  {[
                    { name: "config_name", label: "Config name *", placeholder: "Primary Gmail" },
                    { name: "host", label: "SMTP host *", placeholder: "smtp.gmail.com" },
                    { name: "port", label: "Port *", placeholder: "587" },
                    { name: "username", label: "Username *", placeholder: "user@domain.com" },
                    {
                      name: "password",
                      label: isEdit ? "Password (leave blank to keep)" : "Password *",
                      placeholder: "••••••••",
                      type: "password",
                    },
                    { name: "from_email", label: "From email *", placeholder: "noreply@domain.com" },
                    { name: "from_name", label: "From name", placeholder: "OOMS" },
                    { name: "reply_to", label: "Reply-to", placeholder: "support@domain.com" },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="admin-label">{field.label}</label>
                      <input
                        name={field.name}
                        type={field.type || "text"}
                        value={form[field.name]}
                        onChange={onChange}
                        placeholder={field.placeholder}
                        className="admin-input"
                      />
                    </div>
                  ))}

                  <label className="flex items-center gap-2 text-sm font-medium text-admin-text sm:col-span-2">
                    <input
                      type="checkbox"
                      name="secure"
                      checked={form.secure}
                      onChange={onChange}
                      className="rounded border-slate-300"
                    />
                    Use SSL/TLS (port 465)
                  </label>

                  <div className="sm:col-span-2">
                    <label className="admin-label">Status</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={onChange}
                      className="admin-input"
                    >
                      <option value="inactive">Inactive</option>
                      <option value="active">Active (used for company mailing)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-admin-border px-5 py-4">
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={testing || saving}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Send size={14} />
                    {testing ? "Testing…" : "Test SMTP"}
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      disabled={saving}
                      className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}
