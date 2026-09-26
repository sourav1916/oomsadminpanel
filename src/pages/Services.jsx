import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  ConciergeBell,
  Eye,
  Plus,
  Pencil,
  Layers,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "../utils/apiCall";
import { ListPageSkeleton, TableSkeleton } from "../components/SkeletonComponent";
import { usePagination } from "../components/common/PaginationComponent";
import TablePagination from "../components/common/TablePagination";
import ManagementTable from "../components/common/ManagementTable";
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

const EMPTY_FORM = {
  service_id: "",
  name: "",
  sac_code: "",
  type: "general",
  frequency: "",
  default_amount: "",
  remark: "",
  due_day: "10",
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

const TypeBadge = ({ type }) => {
  const isCompliance = type === "compliance";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        isCompliance
          ? "bg-admin-accent-soft text-admin-accent-text"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {isCompliance ? "Compliance" : "General"}
    </span>
  );
};

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
      className="admin-panel m-auto flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-admin-border p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-admin-text">
          <ConciergeBell className="text-admin-accent-text" size={20} />
          Service Details
        </h2>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-admin-border bg-admin-raised text-admin-muted transition-colors hover:text-admin-text"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        <div className="flex items-start justify-between gap-4 border-b border-admin-border pb-4">
          <div>
            <h3 className="text-xl font-bold text-admin-text">{service.name}</h3>
            <p className="mt-1 text-sm text-admin-muted">{service.service_id}</p>
          </div>
          <TypeBadge type={service.type} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-admin-border bg-admin-raised px-3 py-2">
            <div className="admin-label mb-0">SAC Code</div>
            <div className="mt-1 text-sm font-medium text-admin-text">{service.sac_code || "N/A"}</div>
          </div>
          <div className="rounded-lg border border-admin-border bg-admin-raised px-3 py-2">
            <div className="admin-label mb-0">Default Amount</div>
            <div className="mt-1 text-sm font-medium text-admin-text">{formatAmount(service.default_amount)}</div>
          </div>
          <div className="rounded-lg border border-admin-border bg-admin-raised px-3 py-2">
            <div className="admin-label mb-0">Frequency</div>
            <div className="mt-1 text-sm font-medium capitalize text-admin-text">
              {service.type === "general" && !service.frequency ? "N/A" : service.frequency || "monthly"}
            </div>
          </div>
          <div className="rounded-lg border border-admin-border bg-admin-raised px-3 py-2">
            <div className="admin-label mb-0">Due Day</div>
            <div className="mt-1 text-sm font-medium text-admin-text">{service.due_day ?? "N/A"}</div>
          </div>
        </div>

        {service.remark && (
          <div className="mt-4 rounded-lg border border-admin-border bg-admin-raised p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-admin-accent-text">Remark</div>
            <p className="mt-1 text-sm text-admin-text-sub">{service.remark}</p>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-end border-t border-admin-border bg-admin-raised px-6 py-4">
        <button
          onClick={onClose}
          className="rounded-lg border border-admin-border bg-admin-surface px-5 py-2.5 text-sm font-semibold text-admin-text-sub transition-colors hover:bg-admin-raised"
        >
          Close
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const inputClass = "admin-input";

const labelClass = "admin-label";

const AddServiceModal = ({
  form,
  onChange,
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
      className="admin-panel m-auto flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-admin-border p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-admin-text">
          <Plus className="text-admin-accent-text" size={20} />
          Add Service
        </h2>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-admin-border bg-admin-raised text-admin-muted transition-colors hover:text-admin-text"
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
            <p className="mt-1 text-xs text-admin-muted">Spaces are not allowed in service ID.</p>
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
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={form.default_amount}
                onChange={(e) => {
                  const v = e.target.value
                    .replace(/[^\d.]/g, "")
                    .replace(/(\..*)\./g, "$1");
                  onChange("default_amount", v);
                }}
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
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={form.due_day}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d]/g, "");
                    onChange("due_day", v);
                  }}
                  className={inputClass}
                />
              </div>
            </>
          )}

          <div>
            <label className={labelClass}>Remark</label>
            <textarea
              value={form.remark}
              onChange={(e) => onChange("remark", e.target.value)}
              placeholder="Optional remark"
              rows={3}
              className="admin-textarea resize-none"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-admin-border bg-admin-raised px-6 py-4">
          <ManagementButton tone="slate" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </ManagementButton>
          <ManagementButton
            type="submit"
            tone="teal"
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
      className="admin-panel m-auto w-full max-w-md overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-admin-border p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-admin-text">
          <Pencil className="text-admin-accent-text" size={20} />
          Edit Service
        </h2>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-admin-border bg-admin-raised text-admin-muted transition-colors hover:text-admin-text"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={onSubmit} className="p-5">
        <div className="mb-2 text-sm text-admin-muted">
          Service ID: <span className="font-medium text-admin-text">{service.service_id}</span>
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
          <ManagementButton type="submit" tone="teal" loading={submitting}>
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
    });
    setCreateModalOpen(true);
  };

  const handleCreateFormChange = (field, value) => {
    setCreateForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "type") {
        if (value === "compliance") {
          next.frequency = prev.frequency || "monthly";
        } else {
          next.frequency = "";
        }
      }

      return next;
    });
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
        key: "name",
        label: "Service",
        headerClassName: "text-left",
        className: "text-left",
        render: (service) => (
          <div className="text-left">
            <p className="text-sm font-semibold text-admin-text">{service.name}</p>
            <p className="text-xs text-admin-muted">{service.service_id}</p>
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
          <span className="text-sm text-admin-text-sub">{service.sac_code || "—"}</span>
        ),
      },
      {
        key: "frequency",
        label: "Frequency",
        render: (service) => (
          <span className="text-sm capitalize text-admin-text-sub">
            {service.type === "general" && !service.frequency ? "—" : service.frequency || "monthly"}
          </span>
        ),
      },
      {
        key: "default_amount",
        label: "Default Amount",
        render: (service) => (
          <span className="text-sm font-medium text-admin-text">{formatAmount(service.default_amount)}</span>
        ),
      },
      {
        key: "remark",
        label: "Remark",
        render: (service) => (
          <span className="line-clamp-2 max-w-xs text-sm text-admin-text-sub">{service.remark || "—"}</span>
        ),
      },
    ],
    []
  );

  if (loading && services.length === 0) {
    return (
      <ManagementHub
        eyebrow="Directory"
        title="Services"
        description="Global catalog of general and compliance services available to branches."
        accent="slate"
        tabs={TYPE_TABS}
        activeTab={typeFilter}
        onTabChange={handleTypeFilterChange}
      >
        <ListPageSkeleton columns={6} />
      </ManagementHub>
    );
  }

  return (
    <ManagementHub
      eyebrow="Directory"
      title="Services"
      description="Global catalog of general and compliance services available to branches."
      accent="slate"
      onRefresh={handleRefresh}
      tabs={TYPE_TABS}
      activeTab={typeFilter}
      onTabChange={handleTypeFilterChange}
      actions={
        <ManagementButton
          tone="teal"
          leftIcon={<Plus size={14} />}
          onClick={handleOpenCreateModal}
        >
          Add Service
        </ManagementButton>
      }
      summary={
        <div className="inline-flex items-center gap-2 rounded-md border border-admin-border bg-admin-surface px-4 py-2 text-sm text-admin-text-sub">
          Total: <span className="font-semibold text-admin-text">{pagination.total}</span> services
        </div>
      }
    >
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="admin-panel flex flex-col justify-between gap-4 p-4 lg:flex-row lg:items-center"
        >
          <div className="relative flex flex-1 items-center gap-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" size={18} />
            <input
              type="text"
              placeholder="Search by name, ID, SAC code, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-admin-muted hover:text-admin-text"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </motion.div>

        {loading && services.length > 0 && (
          <TableSkeleton columns={6} rows={6} />
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="admin-panel py-16 text-center"
          >
            <X className="mx-auto mb-4 text-rose-400" size={48} />
            <p className="text-xl text-admin-text-sub">Error loading services</p>
            <p className="mt-2 text-admin-muted">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {!loading && !error && services.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="admin-panel py-16 text-center"
          >
            <ConciergeBell className="mx-auto mb-4 text-admin-muted" size={64} />
            <p className="text-xl text-admin-text-sub">No services found</p>
            <p className="mt-2 text-admin-muted">
              {searchTerm || typeFilter !== "all"
                ? "Try adjusting your search or filters"
                : "No services have been created yet"}
            </p>
            {!searchTerm && typeFilter === "all" && (
              <ManagementButton
                tone="teal"
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
            >
              <ManagementTable
                  rows={services}
                  columns={tableColumns}
                  rowKey={(row) => row.service_id}
                  onRowClick={handleViewService}
                  showSerial
                  serialStart={(pagination.page - 1) * pagination.limit + 1}
                  getActions={(service) => [
                    {
                      label: "View Details",
                      icon: <Eye size={12} />,
                      onClick: () => handleViewService(service),
                      className: "text-admin-accent-text hover:bg-admin-accent-soft",
                    },
                    {
                      label: "Edit",
                      icon: <Pencil size={12} />,
                      onClick: () => handleEditService(service),
                      className: "text-admin-text-sub hover:bg-admin-raised hover:text-admin-text",
                    },
                  ]}
                  accent="slate"
                  footer={
                    <TablePagination
                      page={pagination.page}
                      limit={pagination.limit}
                      total={pagination.total}
                      totalPages={pagination.total_pages}
                      onPageChange={handlePageChange}
                      onLimitChange={handleLimitChange}
                    />
                  }
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
