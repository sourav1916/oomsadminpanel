// pages/BranchServices.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building,
  ArrowLeft,
  Search,
  X,
  Calendar,
  Tag,
  Clock,
  CheckCircle,
  Ban,
  BookOpen,
} from "lucide-react";
import { toast } from 'react-toastify';
import apiCall from '../utils/apiCall';
import { ListPageSkeleton, TableSkeleton } from "../components/SkeletonComponent";
import { usePagination } from "../components/common/PaginationComponent";
import TablePagination from "../components/common/TablePagination";
import ManagementTable from "../components/common/ManagementTable";
import ManagementHub from "../components/common/ManagementHub";
import ManagementButton from "../components/common/ManagementButton";

// ─── Helper Components ─────────────────────────────────────────────────────

const formatCurrency = (amount) => {
  if (!amount || amount === '0.00') return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getFrequencyBadge = (frequency) => {
  const badges = {
    monthly: { icon: Calendar, text: 'Monthly', className: 'bg-admin-accent-soft text-admin-accent-text' },
    quarterly: { icon: Calendar, text: 'Quarterly', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
    yearly: { icon: Calendar, text: 'Yearly', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
    one_time: { icon: Clock, text: 'One Time', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  };
  const badge = badges[frequency?.toLowerCase()] || badges.monthly;
  const Icon = badge.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}>
      <Icon size={10} /> {badge.text}
    </span>
  );
};

const getTypeBadge = (type, isCompliance) => {
  if (isCompliance || type === 'compliance') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        <CheckCircle size={10} /> Compliance
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      <Tag size={10} /> General
    </span>
  );
};

const tableColumns = [
  {
    key: 'name',
    label: 'Service',
    render: (service) => (
      <div>
        <p className="font-semibold text-admin-text">{service.name}</p>
        <p className="font-mono text-xs text-admin-muted">{service.service_id}</p>
      </div>
    ),
  },
  {
    key: 'sac_code',
    label: 'SAC',
    render: (service) => (
      <span className="font-mono text-xs text-admin-text-sub">{service.sac_code || 'N/A'}</span>
    ),
  },
  {
    key: 'type',
    label: 'Type',
    render: (service) => getTypeBadge(service.type, service.compliance),
  },
  {
    key: 'frequency',
    label: 'Frequency',
    render: (service) => getFrequencyBadge(service.frequency),
  },
  {
    key: 'fees',
    label: 'Fees',
    render: (service) => (
      <span className="font-semibold text-admin-text">{formatCurrency(service.fees)}</span>
    ),
  },
  {
    key: 'gst_value',
    label: 'GST',
    render: (service) => (
      <span className="text-admin-text-sub">
        {formatCurrency(service.gst_value)}
        {service.gst_rate ? ` (${service.gst_rate}%)` : ''}
      </span>
    ),
  },
  {
    key: 'create_date',
    label: 'Created',
    render: (service) => (
      <span className="text-sm text-admin-muted">{formatDate(service.create_date)}</span>
    ),
  },
];

// ─── Main Component ─────────────────────────────────────────────────────────

export default function BranchServices() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [branchInfo, setBranchInfo] = useState(null);

  // Refs to prevent duplicate API calls
  const fetchInProgress = useRef(false);
  const initialFetchDone = useRef(false);
  const currentRequestId = useRef(0);

  const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 20);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch branch info
  const fetchBranchInfo = useCallback(async () => {
    try {
      const response = await apiCall(`/branch/details/${branchId}`, 'GET');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBranchInfo(result.data);
        }
      }
    } catch (err) {
      console.error("Error fetching branch info:", err);
    }
  }, [branchId]);

  // Fetch services
  const fetchServices = useCallback(async (page = 1, showRefresh = false) => {
    if (fetchInProgress.current) {
      console.log("Fetch already in progress, skipping...");
      return;
    }

    fetchInProgress.current = true;

    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const requestId = ++currentRequestId.current;

    try {
      const params = new URLSearchParams({
        branch_id: branchId,
        page_no: page.toString(),
        limit: pagination.limit.toString(),
      });
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      const response = await apiCall(`/branch/services?${params.toString()}`, 'GET');

      if (requestId !== currentRequestId.current) {
        console.log("Stale request ignored");
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch services');

      const result = await response.json();

      if (result.success) {
        setServices(result.data || []);
        updatePagination({
          page: result.pagination.page_no,
          limit: result.pagination.limit,
          total: result.pagination.total,
          total_pages: result.pagination.total_pages,
          has_more: result.pagination.has_more,
        });
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to fetch services');
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      toast.error(err.message || "Failed to load services.");
    } finally {
      if (requestId === currentRequestId.current) {
        setLoading(false);
        setRefreshing(false);
        fetchInProgress.current = false;
      }
    }
  }, [branchId, pagination.limit, debouncedSearchTerm, updatePagination]);

  // Initial load
  useEffect(() => {
    if (branchId && !initialFetchDone.current) {
      console.log("Initial fetch triggered for branch services");
      initialFetchDone.current = true;
      fetchBranchInfo();
      fetchServices(1);
    }
  }, [branchId, fetchBranchInfo, fetchServices]);

  // Handle page/limit/search changes
  useEffect(() => {
    if (initialFetchDone.current && !fetchInProgress.current) {
      fetchServices(pagination.page);
    }
  }, [pagination.page, pagination.limit, debouncedSearchTerm, fetchServices]);

  const handlePageChange = (newPage) => {
    if (newPage !== pagination.page) {
      goToPage(newPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    if (newLimit !== pagination.limit) {
      changeLimit(newLimit);
      if (pagination.page !== 1) {
        goToPage(1);
      }
    }
  };

  const handleRefresh = () => {
    fetchServices(pagination.page, true);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading && services.length === 0) {
    return (
      <ManagementHub
        eyebrow="Directory"
        title={branchInfo?.name || "Branch Services"}
        description="Services assigned to this branch."
        accent="slate"
      >
        <ListPageSkeleton columns={4} />
      </ManagementHub>
    );
  }

  return (
    <ManagementHub
      eyebrow="Directory"
      title={branchInfo?.name || "Branch Services"}
      description={branchInfo ? `Branch ID: ${branchInfo.branch_id}` : "Services assigned to this branch."}
      accent="slate"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      actions={
        <ManagementButton tone="slate" variant="outline" leftIcon={<ArrowLeft size={14} />} onClick={handleBack}>
          Back
        </ManagementButton>
      }
      summary={
        branchInfo ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-teal-600 text-white">
              {branchInfo.logo ? (
                <img src={branchInfo.logo} alt={branchInfo.name} className="h-full w-full object-cover" />
              ) : (
                <Building size={18} />
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-admin-text">{branchInfo.name}</p>
              <p className="text-xs text-admin-muted">ID: {branchInfo.branch_id}</p>
            </div>
          </div>
        ) : null
      }
    >
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="admin-panel p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" size={18} />
            <input
              type="text"
              placeholder="Search services by name, SAC code, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-admin-muted hover:text-admin-text"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Loading indicator for subsequent loads */}
        {refreshing && services.length > 0 && (
          <TableSkeleton columns={6} rows={6} showActions={false} />
        )}

        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="admin-panel py-16 text-center"
          >
            <Ban className="mx-auto mb-4 text-rose-400" size={48} />
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

        {/* Empty state */}
        {!loading && !error && services.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="admin-panel py-16 text-center"
          >
            <BookOpen className="mx-auto mb-4 text-admin-muted" size={64} />
            <p className="text-xl text-admin-text-sub">No Services Found</p>
            <p className="mt-2 text-admin-muted">
              {searchTerm ? 'Try adjusting your search' : 'No services available for this branch'}
            </p>
          </motion.div>
        )}

        {!loading && !error && services.length > 0 && !refreshing && (
          <>
            <ManagementTable
              rows={services}
              columns={tableColumns}
              rowKey={(row) => row.service_id}
              showActionsColumn={false}
              showSerial
              serialStart={(pagination.page - 1) * pagination.limit + 1}
              accent="slate"
              footer={
                pagination.total > 0 ? (
                  <TablePagination
                    page={pagination.page}
                    limit={pagination.limit}
                    total={pagination.total}
                    totalPages={pagination.total_pages}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                  />
                ) : null
              }
            />

            {/* Results summary */}
            <div className="mt-2 text-center text-sm text-admin-muted">
              Showing {services.length} of {pagination.total} services
              {searchTerm && <span className="ml-2 text-admin-accent-text">· Search: "{searchTerm}"</span>}
            </div>
          </>
        )}
      </div>
    </ManagementHub>
  );
}
