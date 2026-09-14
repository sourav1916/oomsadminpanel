import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  MessageSquareText,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Power,
  RefreshCw,
  Loader2,
  Upload,
  Image as ImageIcon,
  FileText,
  Film,
} from "lucide-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import apiCall from "../utils/apiCall";
import ManagementHub from "../components/common/ManagementHub";
import ManagementButton from "../components/common/ManagementButton";
import ModalScrollLock from "../components/common/ModalScrollLock";
import { TableSkeleton } from "../components/SkeletonComponent";

const EMPTY_FORM = {
  template_id: "",
  type: "payment reminder",
  onechatting_template_id: "",
  template_name: "",
  status: "active",
  variable_keys: [],
  header_media_mode: "default",
  header_media_url: "",
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
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
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

function extractExistingVariableKeys(row) {
  const body = row?.template?.components?.find((c) => c?.type === "BODY");
  const keys = body?.example?.body_text?.[0];
  return Array.isArray(keys) ? keys.map((k) => String(k || "").trim()) : [];
}

function extractHeaderMediaUrl(row) {
  const header = row?.template?.components?.find((c) => c?.type === "HEADER");
  const handle = header?.example?.header_handle?.[0];
  return handle != null ? String(handle).trim() : "";
}

function headerMediaAccept(format) {
  const fmt = String(format || "").toUpperCase();
  if (fmt === "IMAGE") return "image/*";
  if (fmt === "VIDEO") return "video/*";
  if (fmt === "DOCUMENT") {
    return ".pdf,application/pdf,.doc,.docx,.xls,.xlsx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return "image/*,video/*,.pdf,application/pdf";
}

function buildMappedBodyPreview(bodyText, variableKeys, availableVariables) {
  const text = String(bodyText || "");
  if (!text) return "";
  return text.replace(/\{\{(\d+)\}\}/g, (match, num) => {
    const index = Number(num) - 1;
    const key = variableKeys?.[index];
    if (!key) return match;
    const meta = availableVariables.find((item) => item.key === key);
    return meta?.label ? `[${meta.label}]` : key;
  });
}

export default function WpSystemTemplates() {
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

  const [ocLoading, setOcLoading] = useState(false);
  const [ocTemplates, setOcTemplates] = useState([]);
  const [ocSearch, setOcSearch] = useState("");
  const [ocError, setOcError] = useState("");
  const [headerUploading, setHeaderUploading] = useState(false);
  const headerFileInputRef = React.useRef(null);

  const isEdit = Boolean(form.template_id);

  const typeOptions = useMemo(() => {
    if (types.length) return types;
    return [];
  }, [types]);

  const selectedTypeMeta = useMemo(
    () => typeOptions.find((t) => t.name === form.type) || null,
    [typeOptions, form.type]
  );

  const availableVariables = useMemo(
    () => selectedTypeMeta?.available_variables || [],
    [selectedTypeMeta]
  );

  const selectedOcTemplate = useMemo(
    () =>
      ocTemplates.find(
        (item) =>
          item.template_id === form.onechatting_template_id ||
          item.template_name === form.template_name
      ) || null,
    [ocTemplates, form.onechatting_template_id, form.template_name]
  );

  const placeholderCount = Number(selectedOcTemplate?.placeholder_count) || 0;
  const headerFormat = String(selectedOcTemplate?.header_format || "").toUpperCase();
  const hasMediaHeader = Boolean(
    selectedOcTemplate?.has_media_header ||
      ["IMAGE", "VIDEO", "DOCUMENT"].includes(headerFormat)
  );
  const defaultHeaderMedia =
    selectedOcTemplate?.header_media || selectedOcTemplate?.header_image || "";
  const activeHeaderMedia =
    form.header_media_mode === "custom" && form.header_media_url
      ? form.header_media_url
      : defaultHeaderMedia;

  const mappedBodyPreview = useMemo(
    () =>
      buildMappedBodyPreview(
        selectedOcTemplate?.body_text,
        form.variable_keys,
        availableVariables
      ),
    [selectedOcTemplate?.body_text, form.variable_keys, availableVariables]
  );

  const filteredOcTemplates = useMemo(() => {
    const term = ocSearch.trim().toLowerCase();
    if (!term) return ocTemplates;
    return ocTemplates.filter((item) =>
      [item.template_name, item.category, item.body_text]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [ocTemplates, ocSearch]);

  const usedVariableKeys = useMemo(
    () => new Set((form.variable_keys || []).filter(Boolean)),
    [form.variable_keys]
  );

  const fetchList = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      try {
        const qs = new URLSearchParams({
          page_no: "1",
          limit: "100",
          search: search.trim(),
        });
        if (typeFilter) qs.set("type", typeFilter);

        const [listRes, typesRes] = await Promise.all([
          apiCall(`/wp-system-templates/list?${qs}`, "GET"),
          apiCall("/wp-system-templates/types", "GET"),
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
          toast.error(listData.message || "Failed to load system templates");
        }
      } catch {
        toast.error("Failed to load system templates");
        setRows([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, typeFilter]
  );

  const fetchOneChattingTemplates = useCallback(async () => {
    setOcLoading(true);
    setOcError("");
    try {
      const qs = new URLSearchParams({
        status: "APPROVED",
        fetch_all: "true",
        limit: "100",
      });
      const res = await apiCall(`/wp-system-templates/onechatting-list?${qs}`, "GET");
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to load OneChatting templates");
      }
      setOcTemplates(data.data || []);
    } catch (err) {
      setOcTemplates([]);
      setOcError(err.message || "Failed to load OneChatting templates");
    } finally {
      setOcLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchList(false), 250);
    return () => clearTimeout(t);
  }, [fetchList]);

  const openCreate = async () => {
    if (!types.length) {
      try {
        const typesRes = await apiCall("/wp-system-templates/types", "GET");
        const typesData = await typesRes.json();
        if (typesRes.ok && typesData.success !== false) {
          setTypes(typesData.data || []);
        }
      } catch {
        /* list fetch will retry */
      }
    }
    const defaultType =
      (types[0] && types[0].name) ||
      "payment reminder";
    setForm({ ...EMPTY_FORM, type: defaultType });
    setActiveSlot(0);
    setOcSearch("");
    setModalOpen(true);
    fetchOneChattingTemplates();
  };

  const openEdit = async (row) => {
    if (!types.length) {
      try {
        const typesRes = await apiCall("/wp-system-templates/types", "GET");
        const typesData = await typesRes.json();
        if (typesRes.ok && typesData.success !== false) {
          setTypes(typesData.data || []);
        }
      } catch {
        /* ignore */
      }
    }
    const keys = extractExistingVariableKeys(row);
    const storedHeader = extractHeaderMediaUrl(row);
    setForm({
      template_id: row.template_id || "",
      type: row.type || "",
      onechatting_template_id: "",
      template_name: row.template_name || "",
      status: row.status || "active",
      variable_keys: keys,
      header_media_mode: storedHeader ? "custom" : "default",
      header_media_url: storedHeader || "",
    });
    setActiveSlot(0);
    setOcSearch(row.template_name || "");
    setModalOpen(true);
    fetchOneChattingTemplates();
  };

  const handleTypeChange = (nextType) => {
    const meta = typeOptions.find((item) => item.name === nextType);
    const allowed = new Set(
      (meta?.available_variables || []).map((item) => item.key)
    );
    setForm((prev) => ({
      ...prev,
      type: nextType,
      variable_keys: (prev.variable_keys || []).map((key) =>
        key && allowed.has(key) ? key : ""
      ),
    }));
    setActiveSlot(0);
  };

  const applyOneChattingSelection = (item) => {
    if (!item) return;
    const count = Number(item.placeholder_count) || 0;
    const suggested = availableVariables.slice(0, count).map((v) => v.key);
    const nextKeys = Array.from({ length: count }, (_, index) => {
      const existing = form.variable_keys[index];
      if (existing && availableVariables.some((v) => v.key === existing)) {
        return existing;
      }
      return suggested[index] || "";
    });

    setForm((prev) => ({
      ...prev,
      onechatting_template_id: item.template_id || "",
      template_name: item.template_name || "",
      variable_keys: nextKeys,
      header_media_mode: "default",
      header_media_url: "",
    }));
    setActiveSlot(0);
  };

  useEffect(() => {
    if (!modalOpen || !form.template_name || !ocTemplates.length) return;
    if (form.onechatting_template_id) return;
    const match = ocTemplates.find(
      (item) => item.template_name === form.template_name
    );
    if (match) {
      setForm((prev) => {
        const count = Number(match.placeholder_count) || 0;
        const nextKeys = Array.from({ length: count }, (_, i) => {
          const existing = prev.variable_keys?.[i];
          if (existing && availableVariables.some((v) => v.key === existing)) {
            return existing;
          }
          return availableVariables[i]?.key || "";
        });
        const defaultMedia =
          match.header_media || match.header_image || "";
        const stored = String(prev.header_media_url || "").trim();
        const useCustom =
          Boolean(stored) && stored !== String(defaultMedia || "").trim();
        return {
          ...prev,
          onechatting_template_id: match.template_id || "",
          variable_keys: nextKeys,
          header_media_mode: useCustom ? "custom" : "default",
          header_media_url: useCustom ? stored : "",
        };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, ocTemplates, form.template_name, availableVariables]);

  const setVariableKey = (index, value) => {
    setForm((prev) => {
      const count = Math.max(
        Number(selectedOcTemplate?.placeholder_count) || 0,
        prev.variable_keys?.length || 0,
        index + 1
      );
      const next = Array.from({ length: count }, (_, i) => prev.variable_keys?.[i] || "");
      next[index] = value;
      return { ...prev, variable_keys: next };
    });
  };

  const assignVariableToActiveSlot = (variableKey) => {
    if (placeholderCount <= 0) return;
    const slot =
      activeSlot >= 0 && activeSlot < placeholderCount ? activeSlot : 0;
    setVariableKey(slot, variableKey);
    if (slot < placeholderCount - 1) {
      setActiveSlot(slot + 1);
    }
  };

  const handleHeaderFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setHeaderUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await apiCall("/wp-system-templates/upload-header", "POST", body);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Upload failed");
      }
      setForm((prev) => ({
        ...prev,
        header_media_mode: "custom",
        header_media_url: data.data?.url || "",
      }));
      toast.success("Header media uploaded");
    } catch (err) {
      toast.error(err.message || "Failed to upload header media");
    } finally {
      setHeaderUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.type) {
      toast.error("Select a notification type");
      return;
    }
    if (!form.template_name && !form.onechatting_template_id) {
      toast.error("Select an APPROVED OneChatting template");
      return;
    }

    const count = Number(selectedOcTemplate?.placeholder_count) || 0;
    if (count > 0) {
      const keys = form.variable_keys || [];
      if (keys.length !== count || keys.some((k) => !String(k || "").trim())) {
        toast.error(`Map all ${count} body variables before saving`);
        return;
      }
    }

    if (
      hasMediaHeader &&
      form.header_media_mode === "custom" &&
      !String(form.header_media_url || "").trim()
    ) {
      toast.error("Upload header media or keep the template default");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: form.type,
        template_name: form.template_name,
        onechatting_template_id: form.onechatting_template_id || undefined,
        variable_keys: form.variable_keys || [],
        status: form.status || "active",
      };
      if (isEdit) payload.template_id = form.template_id;
      if (hasMediaHeader && form.header_media_mode === "custom") {
        payload.header_media_url = form.header_media_url;
      }

      const res = await apiCall("/wp-system-templates/import", "POST", payload);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Save failed");
      }
      toast.success(isEdit ? "Template updated" : "Template imported");
      setModalOpen(false);
      fetchList(true);
    } catch (err) {
      toast.error(err.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (row) => {
    const next = String(row.status).toLowerCase() === "active" ? "inactive" : "active";
    setStatusBusyId(row.template_id);
    try {
      const res = await apiCall("/wp-system-templates/status", "PUT", {
        template_id: row.template_id,
        status: next,
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to update status");
      }
      toast.success(next === "active" ? "Template activated" : "Template deactivated");
      fetchList(true);
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setStatusBusyId(null);
    }
  };

  const handleDelete = async (row) => {
    if (
      !window.confirm(
        `Delete template "${row.template_name}" (${row.type})? Branches mapped to it will stop sending until remapped.`
      )
    ) {
      return;
    }
    setDeleteBusyId(row.template_id);
    try {
      const res = await apiCall("/wp-system-templates/delete", "DELETE", {
        template_id: row.template_id,
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Delete failed");
      }
      toast.success("Template deleted");
      fetchList(true);
    } catch (err) {
      toast.error(err.message || "Failed to delete template");
    } finally {
      setDeleteBusyId(null);
    }
  };

  return (
    <ManagementHub
      eyebrow="Configuration"
      title="OOMS System WhatsApp Templates"
      description="Import APPROVED OneChatting templates (project token) and map body variables to OOMS notification fields."
      accent="slate"
      onRefresh={() => fetchList(true)}
      refreshing={refreshing}
      actions={
        <ManagementButton onClick={openCreate} leftIcon={<Plus size={14} />} tone="indigo">
          Import template
        </ManagementButton>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="w-full max-w-md rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">All types</option>
              {typeOptions.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {loading ? (
            <TableSkeleton columns={5} rows={8} />
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-16 text-center">
              <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                <MessageSquareText className="h-8 w-8 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                No system templates yet
              </p>
              <p className="text-sm text-slate-500">
                Import an APPROVED template from OneChatting and map its variables.
              </p>
              <ManagementButton onClick={openCreate} leftIcon={<Plus size={14} />} tone="indigo">
                Import template
              </ManagementButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Template</th>
                    <th className="px-4 py-3">Preview</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((row) => (
                    <tr key={row.template_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/70">
                      <td className="px-4 py-3">
                        <p className="font-semibold capitalize text-slate-900 dark:text-white">
                          {row.type}
                        </p>
                        <p className="text-xs text-slate-400">{row.category}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {row.template_name}
                        </p>
                        <p className="text-xs text-slate-400">{row.template_id}</p>
                      </td>
                      <td className="max-w-xs px-4 py-3">
                        <p className="line-clamp-2 text-xs text-slate-500">
                          {row.content_preview || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => toggleStatus(row)}
                            disabled={statusBusyId === row.template_id}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <Power size={12} />
                            {String(row.status).toLowerCase() === "active"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            disabled={deleteBusyId === row.template_id}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
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
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-2 sm:p-4"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="wp-system-import-title"
                className="flex h-[min(96vh,980px)] w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                variants={modalVariants}
              >
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      OOMS System WhatsApp
                    </p>
                    <h3
                      id="wp-system-import-title"
                      className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white"
                    >
                      {isEdit ? "Update template" : "Import template"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800"
                    onClick={() => setModalOpen(false)}
                    aria-label="Close"
                  >
                    <span className="block text-2xl leading-none">×</span>
                  </button>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(320px,42%)_minmax(0,58%)]">
                  <aside className="flex min-h-0 flex-col border-b border-slate-200 lg:border-b-0 lg:border-r dark:border-slate-800">
                    <div className="shrink-0 space-y-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Notification type
                          <select
                            value={form.type}
                            onChange={(e) => handleTypeChange(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          >
                            {typeOptions.map((item) => (
                              <option key={item.name} value={item.name}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Status
                          <select
                            value={form.status}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, status: e.target.value }))
                            }
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="search"
                          value={ocSearch}
                          onChange={(e) => setOcSearch(e.target.value)}
                          placeholder="Search OneChatting templates…"
                          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={fetchOneChattingTemplates}
                          disabled={ocLoading}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          title="Refresh templates"
                        >
                          {ocLoading ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <RefreshCw size={15} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                      {ocLoading ? (
                        <div className="flex h-full min-h-[220px] items-center justify-center gap-2 text-sm text-slate-500">
                          <Loader2 size={16} className="animate-spin" />
                          Loading templates…
                        </div>
                      ) : ocError ? (
                        <div className="px-5 py-10 text-center">
                          <p className="text-sm font-medium text-red-600">{ocError}</p>
                          <button
                            type="button"
                            onClick={fetchOneChattingTemplates}
                            className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
                          >
                            Try again
                          </button>
                        </div>
                      ) : filteredOcTemplates.length === 0 ? (
                        <div className="px-5 py-12 text-center text-sm text-slate-500">
                          No APPROVED templates found.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredOcTemplates.map((item) => {
                            const selected =
                              item.template_id === form.onechatting_template_id ||
                              item.template_name === form.template_name;
                            return (
                              <button
                                key={item.template_id || item.template_name}
                                type="button"
                                onClick={() => applyOneChattingSelection(item)}
                                className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors ${
                                  selected
                                    ? "bg-indigo-50 dark:bg-indigo-950/35"
                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                }`}
                              >
                                <span
                                  className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                    selected
                                      ? "border-indigo-600 bg-indigo-600 text-white"
                                      : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
                                  }`}
                                >
                                  {selected ? <CheckCircle2 size={12} /> : null}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                      {item.template_name}
                                    </span>
                                    {item.category ? (
                                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        {item.category}
                                      </span>
                                    ) : null}
                                    <span className="text-[10px] font-medium text-slate-400">
                                      {item.placeholder_count || 0} vars
                                    </span>
                                  </div>
                                  {item.body_text ? (
                                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                                      {item.body_text}
                                    </p>
                                  ) : null}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </aside>

                  <section className="flex min-h-0 flex-col bg-slate-50/80 dark:bg-slate-950/40">
                    {!selectedOcTemplate ? (
                      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                          <MessageSquareText className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          Select a template
                        </p>
                      </div>
                    ) : (
                      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                          <div className="space-y-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                    Message preview
                                  </p>
                                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {selectedOcTemplate.template_name}
                                  </p>
                                </div>
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800">
                                  {selectedOcTemplate.status || "APPROVED"}
                                </span>
                              </div>

                              {headerFormat === "IMAGE" && activeHeaderMedia ? (
                                <img
                                  src={activeHeaderMedia}
                                  alt=""
                                  className="mb-3 h-40 w-full rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                                />
                              ) : null}
                              {headerFormat === "VIDEO" && activeHeaderMedia ? (
                                <video
                                  src={activeHeaderMedia}
                                  controls
                                  className="mb-3 h-40 w-full rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                                />
                              ) : null}
                              {headerFormat === "DOCUMENT" && activeHeaderMedia ? (
                                <a
                                  href={activeHeaderMedia}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-indigo-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-indigo-300"
                                >
                                  <FileText size={14} />
                                  Open document
                                </a>
                              ) : null}
                              {!hasMediaHeader && selectedOcTemplate.header_image ? (
                                <img
                                  src={selectedOcTemplate.header_image}
                                  alt=""
                                  className="mb-3 h-40 w-full rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                                />
                              ) : null}

                              <div className="rounded-lg bg-slate-50 px-3.5 py-3 dark:bg-slate-950">
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                                  {mappedBodyPreview ||
                                    selectedOcTemplate.body_text ||
                                    "No body text"}
                                </p>
                              </div>
                            </div>

                            {hasMediaHeader ? (
                              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                                <div className="mb-3 flex items-center gap-2">
                                  {headerFormat === "VIDEO" ? (
                                    <Film size={15} className="text-slate-500" />
                                  ) : headerFormat === "DOCUMENT" ? (
                                    <FileText size={15} className="text-slate-500" />
                                  ) : (
                                    <ImageIcon size={15} className="text-slate-500" />
                                  )}
                                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    Header {headerFormat || "media"}
                                  </p>
                                </div>

                                <div className="mb-3 grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setForm((prev) => ({
                                        ...prev,
                                        header_media_mode: "default",
                                        header_media_url: "",
                                      }))
                                    }
                                    className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                                      form.header_media_mode !== "custom"
                                        ? "border-indigo-400 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:ring-indigo-800"
                                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                                    }`}
                                  >
                                    Keep template default
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setForm((prev) => ({
                                        ...prev,
                                        header_media_mode: "custom",
                                      }))
                                    }
                                    className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                                      form.header_media_mode === "custom"
                                        ? "border-indigo-400 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:ring-indigo-800"
                                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                                    }`}
                                  >
                                    Upload custom media
                                  </button>
                                </div>

                                {form.header_media_mode === "custom" ? (
                                  <div className="space-y-2">
                                    <input
                                      ref={headerFileInputRef}
                                      type="file"
                                      accept={headerMediaAccept(headerFormat)}
                                      className="hidden"
                                      onChange={handleHeaderFileChange}
                                    />
                                    <button
                                      type="button"
                                      disabled={headerUploading}
                                      onClick={() => headerFileInputRef.current?.click()}
                                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-indigo-600"
                                    >
                                      {headerUploading ? (
                                        <Loader2 size={15} className="animate-spin" />
                                      ) : (
                                        <Upload size={15} />
                                      )}
                                      {headerUploading
                                        ? "Uploading…"
                                        : form.header_media_url
                                          ? "Replace media"
                                          : "Choose file"}
                                    </button>
                                    {form.header_media_url ? (
                                      <p className="truncate font-mono text-[10px] text-slate-400">
                                        {form.header_media_url}
                                      </p>
                                    ) : null}
                                  </div>
                                ) : defaultHeaderMedia ? (
                                  <p className="truncate font-mono text-[10px] text-slate-400">
                                    {defaultHeaderMedia}
                                  </p>
                                ) : null}
                              </div>
                            ) : null}

                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                              <div className="mb-3">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                  Variable placement
                                </p>
                              </div>

                              {placeholderCount === 0 ? (
                                <p className="text-xs text-slate-500">No body variables.</p>
                              ) : (
                                <div className="space-y-2">
                                  {Array.from({ length: placeholderCount }).map((_, index) => {
                                    const sample =
                                      selectedOcTemplate.sample_values?.[index] ?? "";
                                    const isActive = activeSlot === index;
                                    const mappedKey = form.variable_keys[index] || "";
                                    const mappedMeta = availableVariables.find(
                                      (v) => v.key === mappedKey
                                    );
                                    return (
                                      <div
                                        key={`slot-${index}`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setActiveSlot(index)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setActiveSlot(index);
                                          }
                                        }}
                                        className={`rounded-xl border p-3 transition-all ${
                                          isActive
                                            ? "border-indigo-400 bg-indigo-50/70 ring-2 ring-indigo-200 dark:bg-indigo-950/30 dark:ring-indigo-800"
                                            : "border-slate-200 bg-slate-50/80 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950/50"
                                        }`}
                                      >
                                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                          <div className="flex items-center gap-2">
                                            <span className="inline-flex h-6 min-w-[2.25rem] items-center justify-center rounded-md bg-slate-900 px-1.5 text-[11px] font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                                              {`{{${index + 1}}}`}
                                            </span>
                                            {mappedMeta ? (
                                              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                                {mappedMeta.label}
                                              </span>
                                            ) : (
                                              <span className="text-xs text-slate-400">
                                                Unmapped
                                              </span>
                                            )}
                                          </div>
                                          {sample ? (
                                            <span className="text-[10px] text-slate-400">
                                              sample: {String(sample)}
                                            </span>
                                          ) : null}
                                        </div>
                                        <select
                                          value={mappedKey}
                                          onChange={(e) => {
                                            setVariableKey(index, e.target.value);
                                            setActiveSlot(index);
                                          }}
                                          onFocus={() => setActiveSlot(index)}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                        >
                                          <option value="">
                                            Select variable for “{form.type}”…
                                          </option>
                                          {availableVariables.map((variable) => (
                                            <option key={variable.key} value={variable.key}>
                                              {variable.label || variable.key} — {variable.key}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3 xl:sticky xl:top-0 xl:self-start">
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                  Type variables
                                </p>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                  {availableVariables.length}
                                </span>
                              </div>
                              {availableVariables.length === 0 ? (
                                <p className="text-xs text-amber-700">
                                  No variables for this type.
                                </p>
                              ) : (
                                <div className="flex max-h-[420px] flex-col gap-1.5 overflow-y-auto pr-1">
                                  {availableVariables.map((variable) => {
                                    const used = usedVariableKeys.has(variable.key);
                                    return (
                                      <button
                                        key={variable.key}
                                        type="button"
                                        onClick={() =>
                                          assignVariableToActiveSlot(variable.key)
                                        }
                                        disabled={placeholderCount <= 0}
                                        className={`rounded-lg border px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                          used
                                            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
                                            : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-indigo-700"
                                        }`}
                                      >
                                        <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">
                                          {variable.label}
                                        </span>
                                        <span className="mt-0.5 block font-mono text-[10px] text-slate-500">
                                          {variable.key}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                </div>

                <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      disabled={saving}
                      className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving || ocLoading || !form.template_name || headerUploading}
                      className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {saving ? "Saving…" : isEdit ? "Save changes" : "Import & save"}
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
