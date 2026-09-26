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
  Settings,
} from "lucide-react";
import { toast } from 'react-toastify';
import apiCall from '../utils/apiCall'; 
import { ListPageSkeleton, TableSkeleton } from "../components/SkeletonComponent";
import { usePagination } from "../components/common/PaginationComponent";
import TablePagination from "../components/common/TablePagination";
import ManagementTable from '../components/common/ManagementTable';
import ManagementHub from '../components/common/ManagementHub';
import ModalScrollLock from "../components/common/ModalScrollLock";
import { useNavigate } from 'react-router-dom';

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

const StatusBadge = ({ status }) => {
  if (status) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        <CheckCircle size={10} /> Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
      <Ban size={10} /> Inactive
    </span>
  );
};

// ─── Branch Avatar Component ─────────────────────────────────────────────────

const BranchAvatar = ({ branch, name, onClick }) => {
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
        className="object-cover h-10 w-10 cursor-pointer rounded-md transition-opacity hover:opacity-80"
        onClick={onClick}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = getInitials();
        }}
      />
    );
  }

  return (
    <div 
      className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md bg-teal-600 font-semibold text-white transition-opacity hover:opacity-80"
      onClick={onClick}
    >
      {getInitials()}
    </div>
  );
};

// ─── Info Item Component ─────────────────────────────────────────────────────

const InfoItem = ({ icon: Icon, label, value, className = "" }) => (
  <div className={`flex items-start gap-2 rounded-lg border border-admin-border bg-admin-raised px-3 py-2 ${className}`}>
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-admin-border bg-admin-surface text-admin-muted">
      <Icon size={14} />
    </div>
    <div className="min-w-0 flex-1">
      <div className="admin-label mb-1 leading-none">{label}</div>
      <div className="text-sm font-medium leading-snug break-words text-admin-text">{value || 'N/A'}</div>
    </div>
  </div>
);

// ─── View Branch Modal ───────────────────────────────────────────────────────

const ViewBranchModal = ({ branch, onClose, onNavigateToBranch, onNavigateToServices }) => {
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
        className="admin-panel m-auto flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-admin-border bg-admin-surface p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-admin-text">
            <Building className="text-admin-accent-text" size={20} /> Branch Details
          </h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md border border-admin-border bg-admin-raised text-admin-muted transition-colors hover:text-admin-text">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Branch Header */}
          <div className="flex items-center gap-4 border-b border-admin-border pb-4">
            <BranchAvatar 
              branch={branch} 
              name={branch.name} 
              onClick={() => {
                onNavigateToBranch(branch);
                onClose();
              }}
            />
            <div>
              <h3 
                className="cursor-pointer text-xl font-bold text-admin-text transition-colors hover:text-admin-accent-text"
                onClick={() => {
                  onNavigateToBranch(branch);
                  onClose();
                }}
              >
                {branch.name}
              </h3>
              <p className="mt-1 flex items-center gap-2 text-admin-text-sub">
                <Building className="text-admin-accent-text" size={14} />
                Branch ID: {branch.branch_id}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={branch.status} />
                <span className="text-xs text-admin-muted">Created: {formatDateSimple(branch.create_date)}</span>
              </div>
            </div>
          </div>

          {/* Logo & Sign Section */}
          {(branch.logo || branch.sign) && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {branch.logo && (
                <div className="rounded-lg border border-admin-border bg-admin-raised p-3">
                  <p className="mb-2 text-xs text-admin-muted">Logo</p>
                  <img 
                    src={branch.logo} 
                    alt="Branch Logo" 
                    className="max-h-24 cursor-pointer rounded-md object-contain transition-opacity hover:opacity-80"
                    onClick={() => {
                      onNavigateToBranch(branch);
                      onClose();
                    }}
                  />
                </div>
              )}
              {branch.sign && (
                <div className="rounded-lg border border-admin-border bg-admin-raised p-3">
                  <p className="mb-2 text-xs text-admin-muted">Signature</p>
                  <img src={branch.sign} alt="Branch Signature" className="max-h-24 rounded-md object-contain" />
                </div>
              )}
            </div>
          )}

          {/* Address Information */}
          {branch.address && (
            <div className="mt-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-admin-text">
                <MapPin className="text-admin-accent-text" size={16} /> Address Information
              </h4>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-admin-text">
                <Phone className="text-admin-accent-text" size={16} /> Contact Information
              </h4>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-admin-text">
                <CreditCard className="text-admin-accent-text" size={16} /> Tax Information
              </h4>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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
            <div className="mt-4 overflow-hidden rounded-lg border border-admin-border">
              <button
                onClick={() => setShowOwnerInfo(!showOwnerInfo)}
                className="flex w-full items-center justify-between bg-admin-raised px-4 py-3 transition-colors hover:bg-admin-surface"
                type="button"
              >
                <div className="flex items-center gap-2">
                  <User className="text-admin-accent-text" size={16} />
                  <span className="text-sm font-semibold text-admin-text">Owner Information</span>
                </div>
                <motion.div animate={{ rotate: showOwnerInfo ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  {showOwnerInfo ? <ChevronUp className="h-4 w-4 text-admin-muted" /> : <ChevronDown className="h-4 w-4 text-admin-muted" />}
                </motion.div>
              </button>
              <AnimatePresence>
                {showOwnerInfo && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="space-y-2 bg-admin-surface p-4">
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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
          <div className="mt-4 rounded-lg border border-admin-border bg-admin-raised p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-admin-muted">Created By</p>
                <p className="text-sm font-medium text-admin-text">{branch.create_by || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-admin-muted">Modified By</p>
                <p className="text-sm font-medium text-admin-text">{branch.modify_by || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-admin-muted">Last Modified</p>
                <p className="text-sm font-medium text-admin-text">{formatDate(branch.modify_date)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-admin-border bg-admin-raised px-6 py-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                onNavigateToBranch(branch);
                onClose();
              }}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
            >
              <Building size={16} />
              View Full Branch Profile
            </button>
            <button
              onClick={() => {
                onNavigateToServices(branch);
                onClose();
              }}
              className="flex items-center gap-2 rounded-lg border border-admin-border bg-admin-surface px-5 py-2.5 text-sm font-semibold text-admin-text-sub transition-colors hover:bg-admin-raised"
            >
              <Settings size={16} />
              Manage Services
            </button>
          </div>
          <button onClick={onClose} className="rounded-lg border border-admin-border bg-admin-surface px-5 py-2.5 text-sm font-semibold text-admin-text-sub transition-colors hover:bg-admin-raised">
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

  // Refs to prevent duplicate API calls
  const fetchInProgress = useRef(false);
  const initialFetchDone = useRef(false);
  const currentRequestId = useRef(0);
  const lastFetchParams = useRef({ page: 1, limit: 20, search: "" });

  const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 20);
  const navigate = useNavigate();

  // Navigate to branch profile page
  const handleNavigateToBranch = useCallback((branch) => {
    navigate(`/branch/${branch.branch_id}`);
  }, [navigate]);

  // Navigate to branch services page
  const handleNavigateToServices = useCallback((branch) => {
    navigate(`/branch/${branch.branch_id}/services`);
  }, [navigate]);

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

  // Table columns config with three-dot menu
  const tableColumns = useMemo(() => [
    {
      key: 'branch',
      label: 'Branch',
      render: (branch) => (
        <div className="flex items-center gap-3">
          <BranchAvatar 
            branch={branch} 
            name={branch.name} 
            onClick={(e) => {
              e.stopPropagation();
              handleNavigateToBranch(branch);
            }}
          />
          <div>
            <p 
              className="cursor-pointer whitespace-nowrap text-sm font-semibold text-admin-text transition-colors hover:text-admin-accent-text"
              onClick={(e) => {
                e.stopPropagation();
                handleNavigateToBranch(branch);
              }}
            >
              {branch.name}
            </p>
            <p className="text-xs text-admin-muted">ID: {branch.branch_id}</p>
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
              <p className="flex items-center gap-1 text-sm text-admin-text-sub">
                <User size={10} className="text-admin-muted" /> {branch.owner.name}
              </p>
              <p className="mt-1 text-xs text-admin-muted">{branch.owner.login_id}</p>
            </>
          ) : (
            <p className="text-sm text-admin-muted">No owner info</p>
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
            <p className="flex items-center gap-1 text-sm text-admin-text-sub">
              <Phone size={10} className="text-admin-muted" /> {branch.contact.mobile_1}
            </p>
          )}
          {branch.contact?.email_1 && branch.contact.email_1 !== branch.owner?.login_id && (
            <p className="mt-1 text-xs text-admin-muted">{branch.contact.email_1}</p>
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
            <p className="text-sm text-admin-text-sub">{branch.address.city}</p>
          )}
          {branch.address?.state && (
            <p className="text-xs text-admin-muted">{branch.address.state}</p>
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
            <p className="font-mono text-xs text-admin-text-sub">{branch.tax_info.gst}</p>
          )}
          {branch.tax_info?.pan && (
            <p className="mt-0.5 text-xs text-admin-muted">PAN: {branch.tax_info.pan}</p>
          )}
          {!branch.tax_info?.gst && !branch.tax_info?.pan && (
            <p className="text-xs text-admin-muted">No tax info</p>
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
        <div className="flex items-center gap-1.5 text-sm text-admin-text-sub">
          <Calendar className="shrink-0 text-admin-muted" size={12} />
          {formatDateSimple(branch.create_date)}
        </div>
      ),
    },
  ], [handleNavigateToBranch]);

  // Show loading skeleton only on initial load
  if (loading && branches.length === 0) {
    return (
      <ManagementHub
        eyebrow="Directory"
        title="Branches"
        description="Tenant offices, owners, and subscription status."
        accent="slate"
      >
        <ListPageSkeleton columns={5} />
      </ManagementHub>
    );
  }

  return (
    <ManagementHub
      eyebrow="Directory"
      title="Branches"
      description="Tenant offices, owners, and subscription status."
      accent="slate"
      onRefresh={handleRefresh}
    >
      <div className="space-y-3">

        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="admin-panel flex flex-col justify-between gap-4 p-4 lg:flex-row lg:items-center"
        >
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" size={18} />
              <input
                type="text"
                placeholder="Search by branch name, branch ID, owner name, email, or mobile..."
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

            {!loading && branches.length > 0 && (
              <p className="hidden text-sm text-admin-muted xl:block">
                <span className="font-semibold text-admin-text">{branches.length}</span> of{' '}
                <span className="font-semibold text-admin-text">{pagination.total}</span> branches
                {searchTerm && <span className="ml-1 text-admin-accent-text">· "{searchTerm}"</span>}
              </p>
            )}
          </div>
        </motion.div>

        {loading && branches.length > 0 && (
          <TableSkeleton columns={5} rows={6} />
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-panel py-16 text-center">
            <X className="mx-auto mb-4 text-rose-400" size={48} />
            <p className="text-xl text-admin-text-sub">Error loading branches</p>
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
        {!loading && !error && branches.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="admin-panel py-16 text-center">
            <Building className="mx-auto mb-4 text-admin-muted" size={64} />
            <p className="text-xl text-admin-text-sub">No branches found</p>
            <p className="mt-2 text-admin-muted">{searchTerm ? 'Try adjusting your search' : 'No branches registered yet'}</p>
          </motion.div>
        )}

        {/* Content */}
        {!loading && !error && branches.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ManagementTable
                  rows={branches}
                  columns={tableColumns}
                  rowKey={(row) => row.branch_id}
                  onRowClick={(row) => handleViewBranch(row)}
                  showSerial
                  serialStart={(pagination.page - 1) * pagination.limit + 1}
                  getActions={(branch) => [
                    {
                      label: 'View Details',
                      icon: <Eye size={12} />,
                      onClick: () => handleViewBranch(branch),
                      className: 'text-admin-accent-text hover:bg-admin-accent-soft',
                    },
                    {
                      label: 'View Branch Profile',
                      icon: <Building size={12} />,
                      onClick: () => handleNavigateToBranch(branch),
                      className: 'text-admin-text-sub hover:bg-admin-raised hover:text-admin-text',
                    },
                    {
                      label: 'Services',
                      icon: <Settings size={12} />,
                      onClick: () => handleNavigateToServices(branch),
                      className: 'text-admin-text-sub hover:bg-admin-raised hover:text-admin-text',
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

      {/* View Branch Modal */}
      <AnimatePresence>
        {modalOpen && selectedBranch && (
          <ViewBranchModal
            branch={selectedBranch}
            onClose={() => {
              setModalOpen(false);
              setSelectedBranch(null);
            }}
            onNavigateToBranch={handleNavigateToBranch}
            onNavigateToServices={handleNavigateToServices}
          />
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}