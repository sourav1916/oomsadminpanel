import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Building,
  Mail,
  Calendar,
  MapPin,
  CheckCircle,
  Ban,
  Eye,
  Phone,
  IdCard,
  Globe,
  ChevronDown,
  ChevronUp,
  User,
  CreditCard,
  FileText,
  DollarSign,
} from "lucide-react";
import { toast } from 'react-toastify';
import apiCall from '../utils/apiCall'; 
import Skeleton from "../components/SkeletonComponent";
import Pagination, { usePagination } from "../components/common/PaginationComponent";
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementHub from '../components/common/ManagementHub';
import ModalScrollLock from "../components/common/ModalScrollLock";

// ─── Constants & Helpers ─────────────────────────────────────────────────────

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

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatDateSimple = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

const getStatusBadge = (status) => {
  if (status) {
    return { icon: CheckCircle, text: 'Active', className: 'bg-green-100 text-green-800 border border-green-200' };
  }
  return { icon: Ban, text: 'Inactive', className: 'bg-red-100 text-red-800 border border-red-200' };
};

const StatusBadge = ({ status }) => {
  const badge = getStatusBadge(status);
  const Icon = badge.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.className}`}>
      <Icon size={10} /> {badge.text}
    </span>
  );
};

// ─── Branch Avatar Component ─────────────────────────────────────────────────

const BranchAvatar = ({ branch, name }) => {
  const getInitials = () => {
    if (!name) return 'B';
    return name.charAt(0).toUpperCase();
  };

  const logo = branch?.logo || null;

  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        className="object-cover w-10 h-10 rounded-xl"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = getInitials();
        }}
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold shrink-0">
      {getInitials()}
    </div>
  );
};

// ─── Info Item Component ─────────────────────────────────────────────────────

const InfoItem = ({ icon: Icon, label, value, className = "" }) => (
  <div className={`flex items-start gap-2 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 px-3 py-2 ${className}`}>
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 border border-gray-200">
      <Icon size={14} />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 leading-none mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-800 leading-snug break-words">{value || 'N/A'}</div>
    </div>
  </div>
);

// ─── Branch Card Component ───────────────────────────────────────────────────

const BranchCard = ({ branch, index, onView }) => {
  const hasTaxInfo = branch.tax_info?.pan || branch.tax_info?.gst;

  return (
    <ManagementCard
      delay={index * 0.05}
      accent="purple"
      eyebrow={`Branch ID: ${branch.branch_id}`}
      title={branch.name}
      subtitle={branch.owner?.login_id || 'No owner email'}
      icon={<BranchAvatar branch={branch} name={branch.name} />}
      badge={<StatusBadge status={branch.status} />}
      onClick={() => onView(branch)}
      hoverable
      actions={[
        {
          label: 'View Details',
          icon: <Eye size={12} />,
          onClick: () => onView(branch),
          className: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50',
        },
      ]}
      menuId={`branch-card-${branch.branch_id}`}
      footer={
        <div className="flex items-center justify-between w-full text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <CreditCard size={10} className="text-green-400" />
            {branch.tax_info?.gst ? 'GST Registered' : 'No GST'}
          </span>
          <span className="flex items-center gap-1">
            <User size={10} className="text-blue-400" />
            {branch.owner?.name || 'No Owner Name'}
          </span>
        </div>
      }
    >
      <div className="space-y-2 mt-1">
        <div className="flex flex-wrap gap-1.5">
          {branch.contact?.mobile_1 && (
            <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Phone size={8} /> {branch.contact.mobile_1}
            </span>
          )}
          {hasTaxInfo && (
            <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
              Tax Info Available
            </span>
          )}
        </div>
        {branch.address?.city && (
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <MapPin size={10} className="text-gray-400 shrink-0" />
            <span className="truncate">{branch.address.city}, {branch.address.state || ''}</span>
          </p>
        )}
      </div>
    </ManagementCard>
  );
};

// ─── View Branch Modal ───────────────────────────────────────────────────────

const ViewBranchModal = ({ branch, onClose }) => {
  const [showOwnerInfo, setShowOwnerInfo] = useState(false);

  return (
    <motion.div
      variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <ModalScrollLock />
      <motion.div
        variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden m-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex justify-between items-center p-5 border-b bg-white rounded-t-xl">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <Building className="text-purple-500" size={20} /> Branch Details
          </h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all shadow-sm hover:shadow-md bg-white/50 border border-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Branch Header */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <BranchAvatar branch={branch} name={branch.name} />
            <div>
              <h3 className="text-xl font-bold text-gray-800">{branch.name}</h3>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <Building className="text-purple-500" size={14} />
                Branch ID: {branch.branch_id}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={branch.status} />
                <span className="text-xs text-gray-400">Created: {formatDateSimple(branch.create_date)}</span>
              </div>
            </div>
          </div>

          {/* Logo & Sign Section */}
          {(branch.logo || branch.sign) && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {branch.logo && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Logo</p>
                  <img src={branch.logo} alt="Branch Logo" className="max-h-24 object-contain rounded-lg" />
                </div>
              )}
              {branch.sign && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Signature</p>
                  <img src={branch.sign} alt="Branch Signature" className="max-h-24 object-contain rounded-lg" />
                </div>
              )}
            </div>
          )}

          {/* Address Information */}
          {branch.address && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin className="text-purple-500" size={16} /> Address Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <InfoItem icon={MapPin} label="Address Line 1" value={branch.address.address_line_1} />
                <InfoItem icon={MapPin} label="Address Line 2" value={branch.address.address_line_2} />
                <InfoItem icon={MapPin} label="City" value={branch.address.city} />
                <InfoItem icon={Globe} label="State" value={branch.address.state} />
                <InfoItem icon={Globe} label="Country" value={branch.address.country} />
                <InfoItem icon={MapPin} label="Pincode" value={branch.address.pincode} />
                <InfoItem icon={FileText} label="Invoice Address" value={branch.address.invoice_address} />
              </div>
            </div>
          )}

          {/* Contact Information */}
          {branch.contact && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Phone className="text-purple-500" size={16} /> Contact Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <InfoItem icon={Phone} label="Mobile 1" value={branch.contact.mobile_1} />
                <InfoItem icon={Phone} label="Mobile 2" value={branch.contact.mobile_2} />
                <InfoItem icon={Mail} label="Email 1" value={branch.contact.email_1} />
                <InfoItem icon={Mail} label="Email 2" value={branch.contact.email_2} />
              </div>
            </div>
          )}

          {/* Tax Information */}
          {branch.tax_info && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CreditCard className="text-purple-500" size={16} /> Tax Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <InfoItem icon={IdCard} label="PAN Number" value={branch.tax_info.pan} />
                <InfoItem 
                  icon={CheckCircle} 
                  label="PAN Verified" 
                  value={branch.tax_info.is_pan_verified ? 'Yes' : 'No'} 
                />
                <InfoItem icon={FileText} label="GST Number" value={branch.tax_info.gst} />
                <InfoItem 
                  icon={CheckCircle} 
                  label="GST Verified" 
                  value={branch.tax_info.is_gst_verified ? 'Yes' : 'No'} 
                />
                <InfoItem icon={DollarSign} label="GST Rate" value={branch.tax_info.gst_rate ? `${branch.tax_info.gst_rate}%` : 'N/A'} />
              </div>
            </div>
          )}

          {/* Owner Information - Collapsible */}
          {branch.owner && (
            <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setShowOwnerInfo(!showOwnerInfo)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                type="button"
              >
                <div className="flex items-center gap-2">
                  <User className="text-blue-500" size={16} />
                  <span className="text-sm font-semibold text-gray-700">Owner Information</span>
                </div>
                <motion.div animate={{ rotate: showOwnerInfo ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  {showOwnerInfo ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </motion.div>
              </button>
              <AnimatePresence>
                {showOwnerInfo && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="p-4 bg-white space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <InfoItem icon={User} label="Owner Name" value={branch.owner.name} />
                        <InfoItem icon={Mail} label="Login ID" value={branch.owner.login_id} />
                        <InfoItem icon={Phone} label="Mobile" value={branch.owner.mobile} />
                        <InfoItem icon={Globe} label="Country Code" value={branch.owner.country_code} />
                        <InfoItem icon={Mail} label="Email" value={branch.owner.email} />
                        <InfoItem icon={CheckCircle} label="Owner Status" value={branch.owner.status ? 'Active' : 'Inactive'} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Metadata */}
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Created By</p>
                <p className="text-sm font-medium text-gray-700">{branch.create_by || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Modified By</p>
                <p className="text-sm font-medium text-gray-700">{branch.modify_by || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Last Modified</p>
                <p className="text-sm font-medium text-gray-700">{formatDate(branch.modify_date)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BranchManagement() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");

  // Refs to prevent duplicate API calls
  const fetchInProgress = useRef(false);
  const initialFetchDone = useRef(false);
  const currentRequestId = useRef(0);
  const lastFetchParams = useRef({ page: 1, limit: 20, search: "" });

  const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 20);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch branches function with duplicate prevention
  const fetchBranches = useCallback(async (page, resetLoading = true) => {
    // Prevent multiple simultaneous requests
    if (fetchInProgress.current) {
      console.log("Fetch already in progress, skipping...");
      return;
    }

    // Check if we're fetching the same parameters
    const currentParams = {
      page,
      limit: pagination.limit,
      search: debouncedSearchTerm
    };
    
    if (
      lastFetchParams.current.page === currentParams.page &&
      lastFetchParams.current.limit === currentParams.limit &&
      lastFetchParams.current.search === currentParams.search &&
      !resetLoading
    ) {
      console.log("Same parameters, skipping duplicate fetch");
      return;
    }

    fetchInProgress.current = true;
    if (resetLoading) setLoading(true);
    
    // Generate unique request ID
    const requestId = ++currentRequestId.current;
    
    try {
      const params = new URLSearchParams({ 
        page_no: page.toString(), 
        limit: pagination.limit.toString() 
      });
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      console.log(`Fetching branches with params:`, params.toString());
      
      const response = await apiCall(`/branch/list?${params.toString()}`, 'GET');
      
      // Check if this request is still the latest
      if (requestId !== currentRequestId.current) {
        console.log("Stale request ignored");
        return;
      }
      
      if (!response.ok) throw new Error('Failed to fetch branches');

      const result = await response.json();
      
      if (result.success) {
        setBranches(result.data || []);
        updatePagination({
          page: result.pagination.page_no,
          limit: result.pagination.limit,
          total: result.pagination.total,
          total_pages: result.pagination.total_pages,
          has_more: result.pagination.has_more,
        });
        setError(null);
        
        // Update last fetch params
        lastFetchParams.current = currentParams;
      } else {
        throw new Error(result.message || 'Failed to fetch branches');
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      toast.error(err.message || "Failed to load branches.");
    } finally {
      if (requestId === currentRequestId.current) {
        setLoading(false);
        fetchInProgress.current = false;
      }
    }
  }, [pagination.limit, debouncedSearchTerm, updatePagination]);

  // Initial load - runs only once on mount
  useEffect(() => {
    if (!initialFetchDone.current) {
      console.log("Initial fetch triggered");
      initialFetchDone.current = true;
      fetchBranches(1, true);
    }
  }, [fetchBranches]);

  // Handle page changes
  useEffect(() => {
    if (initialFetchDone.current && !fetchInProgress.current) {
      console.log("Page/limit/search changed, fetching...");
      fetchBranches(pagination.page, true);
    }
  }, [pagination.page, pagination.limit, debouncedSearchTerm, fetchBranches]);

  const handleViewBranch = (branch) => {
    setSelectedBranch(branch);
    setModalOpen(true);
  };

  const handlePageChange = useCallback((newPage) => {
    if (newPage !== pagination.page && !fetchInProgress.current) {
      goToPage(newPage);
    }
  }, [pagination.page, goToPage]);

  const handleLimitChange = useCallback((newLimit) => {
    if (newLimit !== pagination.limit && !fetchInProgress.current) {
      changeLimit(newLimit);
      // Reset to page 1 when changing limit
      if (pagination.page !== 1) {
        goToPage(1);
      }
    }
  }, [pagination.limit, pagination.page, changeLimit, goToPage]);

  const handleRefresh = useCallback(() => {
    if (!fetchInProgress.current) {
      // Reset to page 1 on refresh
      if (pagination.page !== 1) {
        goToPage(1);
      } else {
        fetchBranches(1, true);
      }
    }
  }, [fetchBranches, pagination.page, goToPage]);

  // Table columns config
  const tableColumns = useMemo(() => [
    {
      key: 'branch',
      label: 'Branch',
      render: (branch) => (
        <div className="flex items-center gap-3">
          <BranchAvatar branch={branch} name={branch.name} />
          <div>
            <p className="font-semibold text-gray-800 text-sm">{branch.name}</p>
            <p className="text-xs text-gray-500">ID: {branch.branch_id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (branch) => (
        <div>
          {branch.owner?.name ? (
            <>
              <p className="text-sm text-gray-700 flex items-center gap-1">
                <User size={10} className="text-gray-400" /> {branch.owner.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">{branch.owner.login_id}</p>
            </>
          ) : (
            <p className="text-sm text-gray-500">No owner info</p>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (branch) => (
        <div>
          {branch.contact?.mobile_1 && (
            <p className="text-sm text-gray-700 flex items-center gap-1">
              <Phone size={10} className="text-gray-400" /> {branch.contact.mobile_1}
            </p>
          )}
          {branch.contact?.email_1 && branch.contact.email_1 !== branch.owner?.login_id && (
            <p className="text-xs text-gray-500 mt-1">{branch.contact.email_1}</p>
          )}
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (branch) => (
        <div>
          {branch.address?.city && (
            <p className="text-sm text-gray-700">{branch.address.city}</p>
          )}
          {branch.address?.state && (
            <p className="text-xs text-gray-500">{branch.address.state}</p>
          )}
        </div>
      ),
    },
    {
      key: 'tax',
      label: 'Tax Info',
      render: (branch) => (
        <div>
          {branch.tax_info?.gst && (
            <p className="text-xs font-mono text-gray-600">{branch.tax_info.gst}</p>
          )}
          {branch.tax_info?.pan && (
            <p className="text-xs text-gray-400 mt-0.5">PAN: {branch.tax_info.pan}</p>
          )}
          {!branch.tax_info?.gst && !branch.tax_info?.pan && (
            <p className="text-xs text-gray-400">No tax info</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (branch) => <StatusBadge status={branch.status} />,
    },
    {
      key: 'created',
      label: 'Created',
      render: (branch) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Calendar className="text-gray-400 text-xs shrink-0" size={12} />
          {formatDateSimple(branch.create_date)}
        </div>
      ),
    },
  ], []);

  // Show loading skeleton only on initial load
  if (loading && branches.length === 0) {
    return <Skeleton />;
  }

  return (
    <ManagementHub
      eyebrow={<><Building size={11} /> Branches</>}
      title="Branch Management"
      description="View and manage all registered branches from a single workspace."
      accent="purple"
      onRefresh={handleRefresh}
      
    >
      <div className="space-y-6 p-2 lg:p-0">

        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by branch name, branch ID, owner name, email, or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all text-sm min-h-[42px]"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {!loading && branches.length > 0 && (
              <p className="text-sm text-gray-500 hidden xl:block">
                <span className="font-semibold text-gray-800">{branches.length}</span> of{' '}
                <span className="font-semibold text-gray-800">{pagination.total}</span> branches
                {searchTerm && <span className="ml-1 text-purple-600">· "{searchTerm}"</span>}
              </p>
            )}
          </div>

          <div className="flex w-full lg:w-auto justify-end">
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="purple" />
          </div>
        </motion.div>

        {/* Loading indicator for subsequent loads */}
        {loading && branches.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white rounded-xl shadow-xl">
            <X className="text-6xl text-red-400 mx-auto mb-4" size={48} />
            <p className="text-xl text-gray-600">Error loading branches</p>
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
        {!loading && !error && branches.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white rounded-xl shadow-xl">
            <Building className="text-8xl text-gray-300 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500">No branches found</p>
            <p className="text-gray-400 mt-2">{searchTerm ? 'Try adjusting your search' : 'No branches registered yet'}</p>
          </motion.div>
        )}

        {/* Content */}
        {!loading && !error && branches.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl bg-white shadow-xl"
            >
              {/* Table View */}
              {viewMode === 'table' && (
                <ManagementTable
                  rows={branches}
                  columns={tableColumns}
                  rowKey={(row) => row.branch_id}
                  onRowClick={(row) => handleViewBranch(row)}
                  getActions={(branch) => [
                    {
                      label: 'View Details',
                      icon: <Eye size={12} />,
                      onClick: () => handleViewBranch(branch),
                      className: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50',
                    },
                  ]}
                  accent="purple"
                />
              )}

              {/* Card View */}
              {viewMode === 'card' && (
                <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
                  <AnimatePresence>
                    {branches.map((branch, index) => (
                      <BranchCard
                        key={branch.branch_id}
                        branch={branch}
                        index={index}
                        onView={handleViewBranch}
                      />
                    ))}
                  </AnimatePresence>
                </ManagementGrid>
              )}
            </motion.div>

            {/* Pagination */}
            {(branches.length > 0 || pagination.total > 0) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-6">
                <Pagination
                  currentPage={pagination.page}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                  onPageChange={handlePageChange}
                  showInfo={viewMode !== 'card'}
                  onLimitChange={handleLimitChange}
                />
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* View Branch Modal */}
      <AnimatePresence>
        {modalOpen && selectedBranch && (
          <ViewBranchModal
            branch={selectedBranch}
            onClose={() => {
              setModalOpen(false);
              setSelectedBranch(null);
            }}
          />
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}
