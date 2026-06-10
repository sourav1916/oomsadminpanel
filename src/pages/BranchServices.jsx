// pages/BranchServices.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building,
  ArrowLeft,
  Search,
  X,
  Eye,
  Calendar,
  Tag,
  Clock,
  CheckCircle,
  Ban,
  BookOpen,
  TrendingUp,
  Hash,
} from "lucide-react";
import { toast } from 'react-toastify';
import apiCall from '../utils/apiCall';
import Skeleton from "../components/SkeletonComponent";
import RefreshButton from "../components/common/RefreshButton";
import Pagination, { usePagination } from "../components/common/PaginationComponent";

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
    monthly: { icon: Calendar, text: 'Monthly', className: 'bg-blue-100 text-blue-800' },
    quarterly: { icon: Calendar, text: 'Quarterly', className: 'bg-purple-100 text-purple-800' },
    yearly: { icon: Calendar, text: 'Yearly', className: 'bg-green-100 text-green-800' },
    one_time: { icon: Clock, text: 'One Time', className: 'bg-gray-100 text-gray-800' },
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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
        <CheckCircle size={10} /> Compliance
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
      <Tag size={10} /> General
    </span>
  );
};

const StatusBadge = ({ status }) => {
  if (status) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
        <CheckCircle size={10} /> Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
      <Ban size={10} /> Inactive
    </span>
  );
};

// ─── Service Card Component ─────────────────────────────────────────────────

const ServiceCard = ({ service, index }) => {
  const [showDetails, setShowDetails] = useState(false);
  const totalAmount = parseFloat(service.fees) + parseFloat(service.gst_value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all overflow-hidden"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-800">
              {service.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Hash size={12} className="text-gray-400" />
              <span className="text-xs text-gray-500 font-mono">
                SAC: {service.sac_code || 'N/A'}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {getTypeBadge(service.type, service.compliance)}
              {getFrequencyBadge(service.frequency)}
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Base Fees</span>
            <span className="text-lg font-bold text-gray-800">{formatCurrency(service.fees)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">GST ({service.gst_rate}%)</span>
            <span className="text-lg font-bold text-gray-800">{formatCurrency(service.gst_value)}</span>
          </div>
          <div className="border-t border-blue-200 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">Total Amount</span>
              <span className="text-xl font-bold text-green-600">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-2 mb-3">
          {service.due_day && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-orange-500" />
              <span className="text-gray-600">Due Day:</span>
              <span className="font-medium text-gray-800">Day {service.due_day} of month/period</span>
            </div>
          )}
          {service.default_amount && parseFloat(service.default_amount) > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp size={14} className="text-purple-500" />
              <span className="text-gray-600">Default Amount:</span>
              <span className="font-medium text-gray-800">{formatCurrency(service.default_amount)}</span>
            </div>
          )}
        </div>

        {/* Remark */}
        {service.service_remark && (
          <div className="bg-yellow-50 rounded-lg p-2 mb-3">
            <p className="text-xs text-yellow-800">{service.service_remark}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock size={12} />
            <span>Created: {formatDate(service.create_date)}</span>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
          >
            <Eye size={14} />
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200 space-y-2"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Service ID</p>
                <p className="text-xs font-mono text-gray-700 break-all">{service.service_id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created By</p>
                <p className="text-sm font-medium text-gray-800">{service.create_by}</p>
              </div>
              {service.modify_by && service.modify_date !== service.create_date && (
                <>
                  <div>
                    <p className="text-xs text-gray-500">Modified By</p>
                    <p className="text-sm font-medium text-gray-800">{service.modify_by}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Modified Date</p>
                    <p className="text-sm text-gray-800">{formatDate(service.modify_date)}</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

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
    return <Skeleton />;
  }

  return (
    <div className="min-h-screen mx-auto">
      {/* Header Section */}
      <div className="mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-2 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={18} className="text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <Building size={16} className="text-purple-500" />
                <span className="text-sm font-medium text-gray-600">Branch Services</span>
                <span className="text-xs text-gray-400">/</span>
                <span className="text-sm text-gray-900">{branchInfo?.name || 'Services'}</span>
              </div>
            </div>
            <RefreshButton onClick={handleRefresh} loading={refreshing}  className="justify-center px-3 sm:px-4">
              <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
            </RefreshButton>
          </div>

          {/* Branch Info */}
          {branchInfo && (
            <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50">
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
            className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all text-sm"
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
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-white rounded-xl shadow-xl"
        >
          <Ban className="text-6xl text-red-400 mx-auto mb-4" size={48} />
          <p className="text-xl text-gray-600">Error loading services</p>
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
          className="text-center py-16 bg-white rounded-xl shadow-xl"
        >
          <BookOpen className="text-8xl text-gray-300 mx-auto mb-4" size={64} />
          <p className="text-xl text-gray-500">No Services Found</p>
          <p className="text-gray-400 mt-2">
            {searchTerm ? 'Try adjusting your search' : 'No services available for this branch'}
          </p>
        </motion.div>
      )}

      {/* Services Grid */}
      {!loading && !error && services.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {services.map((service, index) => (
              <ServiceCard key={service.service_id} service={service} index={index} />
            ))}
          </div>

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