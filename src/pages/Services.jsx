import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  ConciergeBell,
  IndianRupee,
  Calendar,
  Eye,
  Plus,
  Pencil,
  Layers,
  ShieldCheck,
  Briefcase,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "../utils/apiCall";
import Skeleton from "../components/SkeletonComponent";
import Pagination, { usePagination } from "../components/common/PaginationComponent";
import ManagementGrid from "../components/common/ManagementGrid";
import ManagementViewSwitcher from "../components/common/ManagementViewSwitcher";
import ManagementTable from "../components/common/ManagementTable";
import ManagementCard from "../components/common/ManagementCard";
import ManagementHub from "../components/common/ManagementHub";
import ManagementButton from "../components/common/ManagementButton";
import ModalScrollLock from "../components/common/ModalScrollLock";

const TYPE_TABS = [
  { id: "all", label: "All Services", icon: Layers },
  { id: "general", label: "General", icon: Briefcase },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
];

const FREQUENCY_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "half-yearly", label: "Half Yearly" },
  { value: "yearly", label: "Yearly" },
];

const EMPTY_FIELD = { label: "", is_required: false };

const EMPTY_FORM = {
  service_id: "",
  name: "",
  sac_code: "",
  type: "general",
  frequency: "",
  default_amount: "",
  remark: "",
  due_day: "10",
  fields: [],
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", duration: 0.5 } },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.3 } },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const formatAmount = (value) => {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const normalizeServiceFields = (fields) => {
  if (!fields) return [];
  if (Array.isArray(fields)) return fields;
  if (typeof fields === "string") {
    try {
      const parsed = JSON.parse(fields);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const formatFieldsSummary = (fields) => {
  const items = normalizeServiceFields(fields);
  if (!items.length) return "—";
  return items
    .map((item) => `${item.label}${item.is_required ? " *" : ""}`)
    .join(", ");
};

const TypeBadge = ({ type }) => {
  const isCompliance = type === "compliance";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        isCompliance
          ? "border-violet-200 bg-violet-100 text-violet-800"
          : "border-blue-200 bg-blue-100 text-blue-800"
      }`}
    >
      {isCompliance ? "Compliance" : "General"}
    </span>
  );
};

const ServiceCard = ({ service, index, onView }) => (
  <ManagementCard
    delay={index * 0.05}
    accent="emerald"
    eyebrow={service.service_id}
    title={service.name || "Unnamed Service"}
    subtitle={service.sac_code ? `SAC: ${service.sac_code}` : "No SAC code"}
    icon={
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <ConciergeBell size={18} />
      </div>
    }
    badge={<TypeBadge type={service.type} />}
    onClick={() => onView(service)}
    hoverable
    actions={[
      {
        label: "View Details",
        icon: <Eye size={12} />,
        onClick: () => onView(service),
        className: "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700",
      },
    ]}
    menuId={`service-card-${service.service_id}`}
    footer={
      <div className="flex w-full items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <IndianRupee size={10} className="text-emerald-500" />
          {formatAmount(service.default_amount)}
        </span>
        <span className="flex items-center gap-1 capitalize">
          <Calendar size={10} className="text-gray-400" />
          {service.frequency || "monthly"}
        </span>
      </div>
    }
  >
    {service.remark && (
      <p className="mt-1 line-clamp-2 text-xs text-gray-500">{service.remark}</p>
    )}
  </ManagementCard>
);

const ViewServiceModal = ({ service, onClose }) => (
  <motion.div
    variants={backdropVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    onClick={onClose}
  >
    <ModalScrollLock />
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="m-auto flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex shrink-0 items-center justify-between border-b p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
          <ConciergeBell className="text-emerald-500" size={20} />
          Service Details
        </h2>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white/50 text-slate-500 shadow-sm transition-all hover:shadow-md"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        <div className="flex items-start justify-between gap-4 border-b pb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{service.name}</h3>
            <p className="mt-1 text-sm text-gray-500">{service.service_id}</p>
          </div>
          <TypeBadge type={service.type} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">SAC Code</div>
            <div className="mt-1 text-sm font-medium text-gray-800">{service.sac_code || "N/A"}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Default Amount</div>
            <div className="mt-1 text-sm font-medium text-gray-800">{formatAmount(service.default_amount)}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Frequency</div>
            <div className="mt-1 text-sm font-medium capitalize text-gray-800">
              {service.type === "general" && !service.frequency ? "N/A" : service.frequency || "monthly"}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Due Day</div>
            <div className="mt-1 text-sm font-medium text-gray-800">{service.due_day ?? "N/A"}</div>
          </div>
        </div>

        {service.remark && (
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Remark</div>
            <p className="mt-1 text-sm text-gray-700">{service.remark}</p>
          </div>
        )}

        {service.type === "compliance" && normalizeServiceFields(service.fields).length > 0 && (
          <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-violet-700">Custom Fields</div>
            <ul className="mt-2 space-y-1">
              {normalizeServiceFields(service.fields).map((field, index) => (
                <li key={`${field.label}-${index}`} className="flex items-center justify-between text-sm text-gray-700">
                  <span>{field.label}</span>
                  <span className={`text-xs font-semibold ${field.is_required ? "text-violet-700" : "text-gray-400"}`}>
                    {field.is_required ? "Required" : "Optional"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
        <button
          onClick={onClose}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500";

const ComplianceFieldsEditor = ({ fields, onFieldChange, onAddField, onRemoveField }) => (
  <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <div className={labelClass}>Custom Fields</div>
        <p className="text-xs text-gray-500">Add labels for compliance data collection.</p>
      </div>
      <ManagementButton
        type="button"
        tone="violet"
        variant="soft"
        size="sm"
        leftIcon={<Plus size={12} />}
        onClick={onAddField}
      >
        Add Field
      </ManagementButton>
    </div>

    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={`field-${index}`} className="grid grid-cols-1 gap-3 rounded-xl border border-violet-100 bg-white p-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div>
            <label className={labelClass}>Field Label</label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => onFieldChange(index, "label", e.target.value)}
              placeholder="e.g. GST User ID"
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={Boolean(field.is_required)}
              onChange={(e) => onFieldChange(index, "is_required", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            Required
          </label>
          <ManagementButton
            type="button"
            tone="rose"
            variant="outline"
            size="sm"
            leftIcon={<Trash2 size={12} />}
            onClick={() => onRemoveField(index)}
            disabled={fields.length === 1}
          >
            Remove
          </ManagementButton>
        </div>
      ))}
    </div>
  </div>
);

const AddServiceModal = ({
  form,
  onChange,
  onFieldChange,
  onAddField,
  onRemoveField,
  onClose,
  onSubmit,
  submitting,
}) => (
  <motion.div
    variants={backdropVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    onClick={onClose}
  >
    <ModalScrollLock />
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="m-auto flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex shrink-0 items-center justify-between border-b p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
          <Plus className="text-emerald-500" size={20} />
          Add Service
        </h2>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white/50 text-slate-500 shadow-sm transition-all hover:shadow-md"
        >
          <X size={18} />
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="flex-1 space-y-4 overflow-y-auto p-5 custom-scrollbar">
          <div>
            <label className={labelClass}>Service ID *</label>
            <input
              type="text"
              value={form.service_id}
              onChange={(e) => onChange("service_id", e.target.value.replace(/\s/g, ""))}
              placeholder="Unique ID without spaces"
              className={inputClass}
              required
            />
            <p className="mt-1 text-xs text-gray-500">Spaces are not allowed in service ID.</p>
          </div>

          <div>
            <label className={labelClass}>Service Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Enter service name"
              className={inputClass}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={form.type === "general" ? "sm:col-span-2" : ""}>
              <label className={labelClass}>Type *</label>
              <select
                value={form.type}
                onChange={(e) => onChange("type", e.target.value)}
                className={inputClass}
              >
                <option value="general">General</option>
                <option value="compliance">Compliance</option>
              </select>
            </div>
            {form.type === "compliance" && (
              <div>
                <label className={labelClass}>Frequency *</label>
                <select
                  value={form.frequency || "monthly"}
                  onChange={(e) => onChange("frequency", e.target.value)}
                  className={inputClass}
                  required
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>SAC Code</label>
              <input
                type="text"
                value={form.sac_code}
                onChange={(e) => onChange("sac_code", e.target.value)}
                placeholder="SAC code"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Default Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.default_amount}
                onChange={(e) => onChange("default_amount", e.target.value)}
                placeholder="0.00"
                className={inputClass}
              />
            </div>
          </div>

          {form.type === "compliance" && (
            <>
              <div>
                <label className={labelClass}>Due Day (of month)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={form.due_day}
                  onChange={(e) => onChange("due_day", e.target.value)}
                  className={inputClass}
                />
              </div>

              <ComplianceFieldsEditor
                fields={form.fields}
                onFieldChange={onFieldChange}
                onAddField={onAddField}
                onRemoveField={onRemoveField}
              />
            </>
          )}

          <div>
            <label className={labelClass}>Remark</label>
            <textarea
              value={form.remark}
              onChange={(e) => onChange("remark", e.target.value)}
              placeholder="Optional remark"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <ManagementButton tone="slate" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </ManagementButton>
          <ManagementButton
            type="submit"
            tone="emerald"
            leftIcon={<Plus size={14} />}
            loading={submitting}
          >
            Create Service
          </ManagementButton>
        </div>
      </form>
    </motion.div>
  </motion.div>
);

const EditServiceModal = ({ service, name, sacCode, onNameChange, onSacCodeChange, onClose, onSubmit, submitting }) => (
  <motion.div
    variants={backdropVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    onClick={onClose}
  >
    <ModalScrollLock />
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="m-auto w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
          <Pencil className="text-emerald-500" size={20} />
          Edit Service
        </h2>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white/50 text-slate-500 shadow-sm transition-all hover:shadow-md"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={onSubmit} className="p-5">
        <div className="mb-2 text-sm text-gray-500">
          Service ID: <span className="font-medium text-gray-700">{service.service_id}</span>
        </div>
        <div>
          <label className={labelClass}>Service Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter service name"
            className={inputClass}
            required
          />
        </div>

        <div className="mt-4">
          <label className={labelClass}>SAC Code</label>
          <input
            type="text"
            value={sacCode}
            onChange={(e) => onSacCodeChange(e.target.value)}
            placeholder="SAC code"
            className={inputClass}
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <ManagementButton tone="slate" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </ManagementButton>
          <ManagementButton type="submit" tone="emerald" loading={submitting}>
            Save Changes
          </ManagementButton>
        </div>
      </form>
    </motion.div>
  </motion.div>
);

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSacCode, setEditSacCode] = useState("");
  const [updating, setUpdating] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");

  const fetchInProgress = useRef(false);
  const initialFetchDone = useRef(false);
  const currentRequestId = useRef(0);

  const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 20);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchServices = useCallback(
    async (page = pagination.page, resetLoading = true) => {
      if (fetchInProgress.current) return;

      fetchInProgress.current = true;
      if (resetLoading) setLoading(true);

      const requestId = ++currentRequestId.current;

      try {
        const params = new URLSearchParams({
          page_no: page.toString(),
          limit: pagination.limit.toString(),
        });
        if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
        if (typeFilter !== "all") params.append("type", typeFilter);

        const response = await apiCall(`/service/list?${params.toString()}`, "GET");

        if (requestId !== currentRequestId.current) return;

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to fetch services");
        }

        setServices(result.data || []);
        updatePagination({
          page: result.pagination.page_no,
          limit: result.pagination.limit,
          total: result.pagination.total,
          total_pages: result.pagination.total_pages,
          has_more: result.pagination.has_more,
        });
        setError(null);
      } catch (err) {
        setError(err.message);
        toast.error(err.message || "Failed to load services.");
      } finally {
        if (requestId === currentRequestId.current) {
          setLoading(false);
          fetchInProgress.current = false;
        }
      }
    },
    [pagination.limit, pagination.page, debouncedSearchTerm, typeFilter, updatePagination]
  );

  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchServices(1, true);
    }
  }, [fetchServices]);

  useEffect(() => {
    if (initialFetchDone.current && !fetchInProgress.current) {
      fetchServices(pagination.page, true);
    }
  }, [pagination.page, pagination.limit, debouncedSearchTerm, typeFilter, fetchServices]);

  const handleTypeFilterChange = useCallback(
    (nextType) => {
      if (nextType === typeFilter) return;
      setTypeFilter(nextType);
      if (pagination.page !== 1) goToPage(1);
    },
    [typeFilter, pagination.page, goToPage]
  );

  const handleOpenCreateModal = () => {
    const defaultType = typeFilter === "compliance" ? "compliance" : "general";
    setCreateForm({
      ...EMPTY_FORM,
      type: defaultType,
      frequency: defaultType === "compliance" ? "monthly" : "",
      fields: defaultType === "compliance" ? [{ ...EMPTY_FIELD }] : [],
    });
    setCreateModalOpen(true);
  };

  const handleCreateFormChange = (field, value) => {
    setCreateForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "type") {
        if (value === "compliance") {
          next.fields = prev.fields?.length ? prev.fields : [{ ...EMPTY_FIELD }];
          next.frequency = prev.frequency || "monthly";
        } else {
          next.fields = [];
          next.frequency = "";
        }
      }

      return next;
    });
  };

  const handleFieldChange = (index, key, value) => {
    setCreateForm((prev) => ({
      ...prev,
      fields: prev.fields.map((field, i) =>
        i === index ? { ...field, [key]: value } : field
      ),
    }));
  };

  const handleAddField = () => {
    setCreateForm((prev) => ({
      ...prev,
      fields: [...(prev.fields || []), { ...EMPTY_FIELD }],
    }));
  };

  const handleRemoveField = (index) => {
    setCreateForm((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const buildComplianceFieldsPayload = (fields) => {
    const normalized = (fields || [])
      .map((field) => ({
        label: String(field.label || "").trim(),
        is_required: Boolean(field.is_required),
      }))
      .filter((field) => field.label);

    return normalized.length ? normalized : null;
  };

  const handleCreateService = async (e) => {
    e.preventDefault();

    const serviceId = createForm.service_id.trim();
    if (!serviceId) {
      toast.error("Service ID is required.");
      return;
    }
    if (/\s/.test(serviceId)) {
      toast.error("Service ID must not contain spaces.");
      return;
    }

    if (!createForm.name.trim()) {
      toast.error("Service name is required.");
      return;
    }

    setCreating(true);
    try {
      const payload = {
        service_id: serviceId,
        name: createForm.name.trim(),
        sac_code: createForm.sac_code.trim() || null,
        type: createForm.type,
        default_amount: createForm.default_amount === "" ? 0 : Number(createForm.default_amount),
        remark: createForm.remark.trim() || null,
      };

      if (createForm.type === "compliance") {
        payload.frequency = createForm.frequency || "monthly";
        payload.due_day = Number(createForm.due_day) || 10;
        payload.fields = buildComplianceFieldsPayload(createForm.fields);
      }

      const response = await apiCall("/service/create", "POST", payload);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create service");
      }

      toast.success(result.message || "Service created successfully");
      setCreateModalOpen(false);
      setCreateForm(EMPTY_FORM);
      if (pagination.page !== 1) goToPage(1);
      else fetchServices(1, true);
    } catch (err) {
      toast.error(err.message || "Failed to create service.");
    } finally {
      setCreating(false);
    }
  };

  const handleViewService = (service) => {
    setSelectedService(service);
    setModalOpen(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setEditName(service.name || "");
    setEditSacCode(service.sac_code || "");
    setEditModalOpen(true);
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();

    if (!editingService) return;

    const name = editName.trim();
    if (!name) {
      toast.error("Service name is required.");
      return;
    }

    setUpdating(true);
    try {
      const response = await apiCall("/service/edit", "PUT", {
        service_id: editingService.service_id,
        name,
        sac_code: editSacCode.trim() || null,
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update service");
      }

      toast.success(result.message || "Service updated successfully");
      setEditModalOpen(false);
      setEditingService(null);
      setEditName("");
      setEditSacCode("");
      fetchServices(pagination.page, false);
    } catch (err) {
      toast.error(err.message || "Failed to update service.");
    } finally {
      setUpdating(false);
    }
  };

  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage !== pagination.page && !fetchInProgress.current) {
        goToPage(newPage);
      }
    },
    [pagination.page, goToPage]
  );

  const handleLimitChange = useCallback(
    (newLimit) => {
      if (newLimit !== pagination.limit && !fetchInProgress.current) {
        changeLimit(newLimit);
        if (pagination.page !== 1) goToPage(1);
      }
    },
    [pagination.limit, changeLimit, goToPage, pagination.page]
  );

  const handleRefresh = useCallback(() => {
    if (!fetchInProgress.current) {
      if (pagination.page !== 1) goToPage(1);
      else fetchServices(1, true);
    }
  }, [fetchServices, pagination.page, goToPage]);

  const tableColumns = useMemo(
    () => [
      {
        key: "serial",
        label: "S.No",
        headerClassName: "w-16",
        className: "text-gray-500 font-medium",
        render: (_service, index) => (pagination.page - 1) * pagination.limit + index + 1,
      },
      {
        key: "name",
        label: "Service",
        headerClassName: "text-left",
        className: "text-left",
        render: (service) => (
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800">{service.name}</p>
            <p className="text-xs text-gray-500">{service.service_id}</p>
          </div>
        ),
      },
      {
        key: "type",
        label: "Type",
        render: (service) => <TypeBadge type={service.type} />,
      },
      {
        key: "sac_code",
        label: "SAC Code",
        render: (service) => (
          <span className="text-sm text-gray-700">{service.sac_code || "—"}</span>
        ),
      },
      {
        key: "frequency",
        label: "Frequency",
        render: (service) => (
          <span className="text-sm capitalize text-gray-700">
            {service.type === "general" && !service.frequency ? "—" : service.frequency || "monthly"}
          </span>
        ),
      },
      {
        key: "default_amount",
        label: "Default Amount",
        render: (service) => (
          <span className="text-sm font-medium text-gray-800">{formatAmount(service.default_amount)}</span>
        ),
      },
      {
        key: "fields",
        label: "Fields",
        render: (service) => (
          <span className="line-clamp-2 max-w-xs text-sm text-gray-600">
            {service.type === "compliance" ? formatFieldsSummary(service.fields) : "—"}
          </span>
        ),
      },
      {
        key: "remark",
        label: "Remark",
        render: (service) => (
          <span className="line-clamp-2 max-w-xs text-sm text-gray-600">{service.remark || "—"}</span>
        ),
      },
    ],
    [pagination.page, pagination.limit]
  );

  if (loading && services.length === 0) {
    return <Skeleton />;
  }

  return (
    <ManagementHub
      eyebrow={
        <>
          <ConciergeBell size={11} /> Services
        </>
      }
      title="Service Management"
      description="View all global services available across branches."
      accent="emerald"
      onRefresh={handleRefresh}
      tabs={TYPE_TABS}
      activeTab={typeFilter}
      onTabChange={handleTypeFilterChange}
      actions={
        <ManagementButton
          tone="emerald"
          leftIcon={<Plus size={14} />}
          onClick={handleOpenCreateModal}
        >
          Add Service
        </ManagementButton>
      }
      summary={
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
          Total: <span className="font-semibold text-slate-900">{pagination.total}</span> services
        </div>
      }
    >
      <div className="space-y-6 p-2 lg:p-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center"
        >
          <div className="relative flex flex-1 items-center gap-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, ID, SAC code, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-h-[42px] w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-11 pr-10 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex w-full justify-end lg:w-auto">
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="emerald" />
          </div>
        </motion.div>

        {loading && services.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl bg-white py-16 text-center shadow-xl"
          >
            <X className="mx-auto mb-4 text-red-400" size={48} />
            <p className="text-xl text-gray-600">Error loading services</p>
            <p className="mt-2 text-gray-400">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {!loading && !error && services.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl bg-white py-16 text-center shadow-xl"
          >
            <ConciergeBell className="mx-auto mb-4 text-gray-300" size={64} />
            <p className="text-xl text-gray-500">No services found</p>
            <p className="mt-2 text-gray-400">
              {searchTerm || typeFilter !== "all"
                ? "Try adjusting your search or filters"
                : "No services have been created yet"}
            </p>
            {!searchTerm && typeFilter === "all" && (
              <ManagementButton
                tone="emerald"
                className="mt-4"
                leftIcon={<Plus size={14} />}
                onClick={handleOpenCreateModal}
              >
                Add Service
              </ManagementButton>
            )}
          </motion.div>
        )}

        {!loading && !error && services.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl bg-white shadow-xl"
            >
              {viewMode === "table" && (
                <ManagementTable
                  rows={services}
                  columns={tableColumns}
                  rowKey={(row) => row.service_id}
                  onRowClick={handleViewService}
                  getActions={(service) => [
                    {
                      label: "View Details",
                      icon: <Eye size={12} />,
                      onClick: () => handleViewService(service),
                      className: "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700",
                    },
                    {
                      label: "Edit",
                      icon: <Pencil size={12} />,
                      onClick: () => handleEditService(service),
                      className: "text-blue-600 hover:bg-blue-50 hover:text-blue-700",
                    },
                  ]}
                  accent="emerald"
                />
              )}

              {viewMode === "card" && (
                <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
                  <AnimatePresence>
                    {services.map((service, index) => (
                      <ServiceCard
                        key={service.service_id}
                        service={service}
                        index={index}
                        onView={handleViewService}
                      />
                    ))}
                  </AnimatePresence>
                </ManagementGrid>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6"
            >
              <Pagination
                currentPage={pagination.page}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={handlePageChange}
                showInfo={viewMode !== "card"}
                onLimitChange={handleLimitChange}
              />
            </motion.div>
          </>
        )}
      </div>

      <AnimatePresence>
        {editModalOpen && editingService && (
          <EditServiceModal
            service={editingService}
            name={editName}
            sacCode={editSacCode}
            onNameChange={setEditName}
            onSacCodeChange={setEditSacCode}
            onClose={() => {
              if (!updating) {
                setEditModalOpen(false);
                setEditingService(null);
                setEditName("");
                setEditSacCode("");
              }
            }}
            onSubmit={handleUpdateService}
            submitting={updating}
          />
        )}
        {createModalOpen && (
          <AddServiceModal
            form={createForm}
            onChange={handleCreateFormChange}
            onFieldChange={handleFieldChange}
            onAddField={handleAddField}
            onRemoveField={handleRemoveField}
            onClose={() => {
              if (!creating) setCreateModalOpen(false);
            }}
            onSubmit={handleCreateService}
            submitting={creating}
          />
        )}
        {modalOpen && selectedService && (
          <ViewServiceModal
            service={selectedService}
            onClose={() => {
              setModalOpen(false);
              setSelectedService(null);
            }}
          />
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}
