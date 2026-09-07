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
import RefreshButton from "../components/common/RefreshButton";
import Pagination, { usePagination } from "../components/common/PaginationComponent";
import ManagementTable from "../components/common/ManagementTable";

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
    monthly: { icon: Calendar, text: 'Monthly', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
    quarterly: { icon: Calendar, text: 'Quarterly', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
    yearly: { icon: Calendar, text: 'Yearly', className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
    one_time: { icon: Clock, text: 'One Time', className: 'bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-300' },
  };
  const badge = badges[frequency?.toLowerCase()] || badges.monthly;
  const Icon = badge.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${badge.className}`}>
      <Icon size={10} /> {badge.text}
    </span>
  );
};

const getTypeBadge = (type, isCompliance) => {
  if (isCompliance || type === 'compliance') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-emerald-900/40 dark:text-emerald-300">
        <CheckCircle size={10} /> Compliance
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-300">
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
        <p className="font-semibold text-slate-800 dark:text-slate-100">{service.name}</p>
        <p className="text-xs font-mono text-slate-500">{service.service_id}</p>
      </div>
    ),
  },
  {
    key: 'sac_code',
    label: 'SAC',
    render: (service) => (
      <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{service.sac_code || 'N/A'}</span>
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
      <span className="font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(service.fees)}</span>
    ),
  },
  {
    key: 'gst_value',
    label: 'GST',
    render: (service) => (
      <span className="text-slate-600 dark:text-slate-300">
        {formatCurrency(service.gst_value)}
        {service.gst_rate ? ` (${service.gst_rate}%)` : ''}
      </span>
    ),
  },
  {
    key: 'create_date',
    label: 'Created',
    render: (service) => (
      <span className="text-sm text-slate-600 dark:text-slate-400">{formatDate(service.create_date)}</span>
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
    return <ListPageSkeleton columns={4} />;
  }

  return (
    <div className="min-h-screen mx-auto">
      {/* Header Section */}
      <div className="mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-2 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors dark:hover:bg-slate-800"
              >
                <ArrowLeft size={18} className="text-gray-600 dark:text-slate-300" />
              </button>
              <div className="flex items-center gap-2">
                <Building size={16} className="text-purple-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Branch Services</span>
                <span className="text-xs text-gray-400">/</span>
                <span className="text-sm text-gray-900 dark:text-white">{branchInfo?.name || 'Services'}</span>
              </div>
            </div>
            <RefreshButton onClick={handleRefresh} loading={refreshing}  className="justify-center px-3 sm:px-4">
              <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
            </RefreshButton>
          </div>

          {/* Branch Info */}
          {branchInfo && (
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                  {branchInfo.logo ? (
                    <img src={branchInfo.logo} alt={branchInfo.name} className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    <Building size={24} className="text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{branchInfo.name}</h1>
                  <p className="text-sm text-gray-600">Branch ID: {branchInfo.branch_id}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search services by name, SAC code, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X size={16} className="text-gray-400 hover:text-gray-600" />
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
          className="text-center py-16 bg-white rounded-xl shadow-xl dark:bg-slate-900"
        >
          <Ban className="text-6xl text-red-400 mx-auto mb-4" size={48} />
          <p className="text-xl text-gray-600 dark:text-slate-300">Error loading services</p>
          <p className="text-gray-400 mt-2">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
          className="text-center py-16 bg-white rounded-xl shadow-xl dark:bg-slate-900"
        >
          <BookOpen className="text-8xl text-gray-300 mx-auto mb-4" size={64} />
          <p className="text-xl text-gray-500 dark:text-slate-400">No Services Found</p>
          <p className="text-gray-400 mt-2">
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
            accent="slate"
          />

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="mt-8">
              <Pagination
                currentPage={pagination.page}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                showInfo={true}
              />
            </div>
          )}

          {/* Results summary */}
          <div className="text-center text-sm text-gray-500 mt-4">
            Showing {services.length} of {pagination.total} services
            {searchTerm && <span className="ml-2 text-purple-600">· Search: "{searchTerm}"</span>}
          </div>
        </>
      )}
    </div>
  );
}