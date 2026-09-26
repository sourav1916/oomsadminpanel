import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  User,
  Mail,
  Calendar,
  Building,
  CheckCircle,
  Ban,
  Eye,
  Phone,
  MapPin,
  IdCard,
  Globe,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from 'react-toastify';
import apiCall from '../utils/apiCall';
import { ListPageSkeleton, TableSkeleton } from "../components/SkeletonComponent";
import TablePagination from "../components/common/TablePagination";
import { usePagination } from "../components/common/PaginationComponent";
import ManagementTable from '../components/common/ManagementTable';
import ManagementHub from '../components/common/ManagementHub';
import ModalScrollLock from "../components/common/ModalScrollLock";
import { useNavigate } from 'react-router-dom';

// âââ Constants & Helpers âââââââââââââââââââââââââââââââââââââââââââââââââââââ

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

// âââ Profile Avatar Component âââââââââââââââââââââââââââââââââââââââ

const ProfileAvatar = ({ record, name, className, children, onClick }) => {
  const getInitials = () => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const profileImage = record?.profile?.image || record?.profile?.avatar || record?.profile?.profile_image || null;

  if (profileImage) {
    return (
      <img
        src={profileImage}
        alt={name}
        className={`object-cover cursor-pointer hover:opacity-80 transition-opacity ${className}`}
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
      className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      onClick={onClick}
    >
      {children || getInitials()}
    </div>
  );
};

// âââ Info Item Component âââââââââââââââââââââââââââââââââââââââââââââââââââââ

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

// âââ View User Modal âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

const ViewUserModal = ({ user, onClose, onNavigateToProfile }) => {
  const [showBranches, setShowBranches] = useState(false);
  const hasBranches = user.branches && user.branches.length > 0;

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
            <User className="text-admin-accent-text" size={20} /> Client Details
          </h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md border border-admin-border bg-admin-raised text-admin-muted transition-colors hover:text-admin-text">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* User Header */}
          <div className="flex items-center gap-4 border-b border-admin-border pb-4">
            <ProfileAvatar
              record={user}
              name={user.profile?.name || user.username}
              className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg bg-teal-600 text-2xl font-bold text-white transition-opacity hover:opacity-80"
              onClick={() => {
                onNavigateToProfile(user);
                onClose();
              }}
            >
              {(user.profile?.name?.charAt(0) || user.username?.charAt(0) || 'U').toUpperCase()}
            </ProfileAvatar>
            <div>
              <h3 
                className="cursor-pointer text-xl font-bold text-admin-text transition-colors hover:text-admin-accent-text"
                onClick={() => {
                  onNavigateToProfile(user);
                  onClose();
                }}
              >
                {user.profile?.name || user.username}
              </h3>
              <p className="mt-1 flex items-center gap-2 text-admin-text-sub">
                <Mail className="text-admin-accent-text" size={14} />
                {user.login_id}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={user.status} />
                <span className="text-xs text-admin-muted">ID: {user.username}</span>
              </div>
            </div>
          </div>

          {/* Remark & Create Date */}
          <div className="mt-4 rounded-lg border border-admin-border bg-admin-raised p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-admin-muted">Remark</p>
                <p className="text-sm font-medium text-admin-text">{user.remark || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-admin-muted">Registered On</p>
                <p className="text-sm font-medium text-admin-text">{formatDate(user.create_date)}</p>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="mt-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-admin-text">
              <IdCard className="text-admin-accent-text" size={16} /> Profile Information
            </h4>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <InfoItem icon={User} label="Full Name" value={user.profile?.name} />
              <InfoItem icon={Phone} label="Mobile" value={user.profile?.mobile} />
              <InfoItem icon={Mail} label="Email" value={user.profile?.email} />
              <InfoItem icon={IdCard} label="PAN Number" value={user.profile?.pan_number} />
              <InfoItem icon={MapPin} label="Address Line 1" value={user.profile?.address_line_1} />
              <InfoItem icon={MapPin} label="Address Line 2" value={user.profile?.address_line_2} />
              <InfoItem icon={MapPin} label="City" value={user.profile?.city} />
              <InfoItem icon={Globe} label="State" value={user.profile?.state} />
              <InfoItem icon={Globe} label="District" value={user.profile?.district} />
              <InfoItem icon={MapPin} label="Pincode" value={user.profile?.pincode} />
              <InfoItem icon={Globe} label="Country Code" value={user.profile?.country_code} />
            </div>
          </div>

          {/* Branches Section */}
          {hasBranches && (
            <div className="mt-4 overflow-hidden rounded-lg border border-admin-border">
              <button
                onClick={() => setShowBranches(!showBranches)}
                className="flex w-full items-center justify-between bg-admin-raised px-4 py-3 transition-colors hover:bg-admin-surface"
                type="button"
              >
                <div className="flex items-center gap-2">
                  <Building className="text-admin-accent-text" size={16} />
                  <span className="text-sm font-semibold text-admin-text">Branches</span>
                  <span className="ml-1 rounded-md bg-admin-accent-soft px-2 py-0.5 text-xs font-medium text-admin-accent-text">{user.branches.length}</span>
                </div>
                <motion.div animate={{ rotate: showBranches ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  {showBranches ? <ChevronUp className="h-4 w-4 text-admin-muted" /> : <ChevronDown className="h-4 w-4 text-admin-muted" />}
                </motion.div>
              </button>
              <AnimatePresence>
                {showBranches && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="max-h-[400px] space-y-3 overflow-y-auto bg-admin-surface p-3">
                      {user.branches.map((branch, idx) => (
                        <motion.div
                          key={branch.branch_id || idx}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="rounded-lg border border-admin-border bg-admin-raised p-3"
                        >
                          <div className="mb-2 flex items-start justify-between">
                            <h5 className="font-semibold text-admin-text">{branch.name}</h5>
                            <StatusBadge status={branch.status} />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-admin-text-sub">
                            <p><span className="text-xs text-admin-muted">Branch ID:</span> {branch.branch_id}</p>
                            <p><span className="text-xs text-admin-muted">PAN:</span> {branch.pan || 'N/A'}</p>
                            <p><span className="text-xs text-admin-muted">GST:</span> {branch.gst || 'N/A'}</p>
                            <p><span className="text-xs text-admin-muted">City:</span> {branch.city || 'N/A'}</p>
                            <p><span className="text-xs text-admin-muted">State:</span> {branch.state || 'N/A'}</p>
                            <p><span className="text-xs text-admin-muted">Created:</span> {formatDateSimple(branch.create_date)}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-admin-border bg-admin-raised px-6 py-4">
          <button
            onClick={() => {
              onNavigateToProfile(user);
              onClose();
            }}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <User size={16} />
            View Full Profile
          </button>
          <button onClick={onClose} className="rounded-lg border border-admin-border bg-admin-surface px-5 py-2.5 text-sm font-semibold text-admin-text-sub transition-colors hover:bg-admin-raised">
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// âââ Main Component âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
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

  // Navigate to profile page
  const handleNavigateToProfile = useCallback((user) => {
    navigate(`/user/profile/${user.username}`);
  }, [navigate]);

  // Open modal with Client Details
  const handleViewUserModal = useCallback((user) => {
    setSelectedUser(user);
    setModalOpen(true);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users function with duplicate prevention
  const fetchUsers = useCallback(async (page, resetLoading = true) => {
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
        limit: pagination.limit.toString(),
        user_type: 'user',
      });
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      console.log(`Fetching users with params:`, params.toString());

      const response = await apiCall(`/user/list?${params.toString()}`, 'GET');

      // Check if this request is still the latest
      if (requestId !== currentRequestId.current) {
        console.log("Stale request ignored");
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch clients');

      const result = await response.json();

      if (result.success) {
        setUsers(result.data || []);
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
        throw new Error(result.message || 'Failed to fetch clients');
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      toast.error(err.message || "Failed to load clients.");
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
      fetchUsers(1, true);
    }
  }, [fetchUsers]);

  // Handle page changes
  useEffect(() => {
    if (initialFetchDone.current && !fetchInProgress.current) {
      console.log("Page/limit/search changed, fetching...");
      fetchUsers(pagination.page, true);
    }
  }, [pagination.page, pagination.limit, debouncedSearchTerm, fetchUsers]);

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
        fetchUsers(1, true);
      }
    }
  }, [fetchUsers, pagination.page, goToPage]);

  // Table columns config
  const tableColumns = useMemo(() => [
    {
      key: 'user',
      label: 'Client',
      render: (user) => (
        <div className="flex w-full items-center gap-3">
          <ProfileAvatar
            record={user}
            name={user.profile?.name || user.username}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md bg-teal-600 font-semibold text-white transition-opacity hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigateToProfile(user);
            }}
          >
            {(user.profile?.name?.charAt(0) || user.username?.charAt(0) || 'U').toUpperCase()}
          </ProfileAvatar>
          <div className="min-w-0 flex-1">
            <p 
              className="cursor-pointer truncate text-sm font-semibold text-admin-text transition-colors hover:text-admin-accent-text"
              onClick={(e) => {
                e.stopPropagation();
                handleNavigateToProfile(user);
              }}
            >
              {user.profile?.name || user.username}
            </p>
            <p className="truncate text-xs text-admin-muted">{user.login_id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (user) => (
        <div>
          {user.profile?.mobile && (
            <p className="flex items-center gap-1 text-sm text-admin-text-sub">
              <Phone size={10} className="text-admin-muted" /> {user.profile.mobile}
            </p>
          )}
          {user.profile?.email && user.profile.email !== user.login_id && (
            <p className="mt-1 text-xs text-admin-muted">{user.profile.email}</p>
          )}
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (user) => (
        <div>
          {user.profile?.city && (
            <p className="text-sm text-admin-text-sub">{user.profile.city}</p>
          )}
          {user.profile?.state && (
            <p className="text-xs text-admin-muted">{user.profile.state}</p>
          )}
        </div>
      ),
    },
    {
      key: 'branches',
      label: 'Branches',
      render: (user) => (
        <div className="flex items-center gap-1">
          <Building size={12} className="text-admin-accent-text" />
          <span className="text-sm font-medium text-admin-text">{user.branch_count}</span>
          {user.branch_count > 0 && (
            <span className="text-xs text-admin-muted">({user.branches?.length || 0} active)</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (user) => <StatusBadge status={user.status} />,
    },
    {
      key: 'registered',
      label: 'Registered',
      render: (user) => (
        <div className="flex items-center gap-1.5 text-sm text-admin-text-sub">
          <Calendar className="shrink-0 text-admin-muted" size={12} />
          {formatDateSimple(user.create_date)}
        </div>
      ),
    },
  ], [handleNavigateToProfile]);

  // Show loading skeleton only on initial load
  if (loading && users.length === 0) {
    return (
      <ManagementHub
        eyebrow="Directory"
        title="Clients"
        description="Client accounts, status, and assigned branches."
        accent="slate"
      >
        <ListPageSkeleton columns={5} />
      </ManagementHub>
    );
  }

  return (
    <ManagementHub
      eyebrow="Directory"
      title="Clients"
      description="Client accounts, status, and assigned branches."
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
                placeholder="Search clients by username, email, name, or mobile"
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

            {!loading && users.length > 0 && (
              <p className="hidden text-sm text-admin-muted xl:block">
                <span className="font-semibold text-admin-text">{users.length}</span> of{' '}
                <span className="font-semibold text-admin-text">{pagination.total}</span> clients
                {searchTerm && <span className="ml-1 text-admin-accent-text">· "{searchTerm}"</span>}
              </p>
            )}
          </div>
        </motion.div>

        {loading && users.length > 0 && (
          <TableSkeleton columns={5} rows={6} />
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-panel py-16 text-center">
            <X className="mx-auto mb-4 text-rose-400" size={48} />
            <p className="text-xl text-admin-text-sub">Error loading clients</p>
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
        {!loading && !error && users.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="admin-panel py-16 text-center">
            <User className="mx-auto mb-4 text-admin-muted" size={64} />
            <p className="text-xl text-admin-text-sub">No clients found</p>
            <p className="mt-2 text-admin-muted">{searchTerm ? 'Try adjusting your search' : 'No clients registered yet'}</p>
          </motion.div>
        )}

        {/* Content */}
        {!loading && !error && users.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ManagementTable
              rows={users}
              columns={tableColumns}
              rowKey={(row) => row.username}
              onRowClick={(row) => handleViewUserModal(row)}
              showSerial
              serialStart={(pagination.page - 1) * pagination.limit + 1}
              getActions={(user) => [
                {
                  label: 'View Details',
                  icon: <Eye size={12} />,
                  onClick: () => handleViewUserModal(user),
                  className: 'text-admin-accent-text hover:bg-admin-accent-soft',
                },
                {
                  label: 'View Profile',
                  icon: <User size={12} />,
                  onClick: () => handleNavigateToProfile(user),
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
        )}
      </div>

      {/* View User Modal */}
      <AnimatePresence>
        {modalOpen && selectedUser && (
          <ViewUserModal
            user={selectedUser}
            onClose={() => {
              setModalOpen(false);
              setSelectedUser(null);
            }}
            onNavigateToProfile={handleNavigateToProfile}
          />
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}