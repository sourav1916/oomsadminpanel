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
  Store,
  UserCheck,
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

// ─── Profile Avatar Component ───────────────────────────────────────

const ProfileAvatar = ({ record, name, className, children, onClick }) => {
  const getInitials = () => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const profileImage = record?.profile?.avatar || record?.profile?.profile_image || null;

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

// ─── User Card Component ─────────────────────────────────────────────────────

const UserCard = ({ user, index, onView, onNavigateToProfile }) => {
  const hasBranches = user.branches && user.branches.length > 0;
  const profileComplete = user.profile?.name || user.profile?.mobile;

  return (
    <ManagementCard
      delay={index * 0.05}
      accent="blue"
      eyebrow={`Joined: ${formatDateSimple(user.create_date)}`}
      title={
        <span 
          className="cursor-pointer hover:text-blue-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onNavigateToProfile(user);
          }}
        >
          {user.profile?.name || user.username || 'Unknown User'}
        </span>
      }
      subtitle={user.login_id}
      icon={
        <ProfileAvatar
          record={user}
          name={user.profile?.name || user.username}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onNavigateToProfile(user);
          }}
        >
          {(user.profile?.name?.charAt(0) || user.username?.charAt(0) || 'U').toUpperCase()}
        </ProfileAvatar>
      }
      badge={<StatusBadge status={user.status} />}
      onClick={() => onView(user)}
      hoverable
      actions={[
        {
          label: 'View Details',
          icon: <Eye size={12} />,
          onClick: () => onView(user),
          className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
        },
        {
          label: 'View Profile',
          icon: <User size={12} />,
          onClick: () => onNavigateToProfile(user),
          className: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50',
        },
      ]}
      menuId={`user-card-${user.username}`}
      footer={
        <div className="flex items-center justify-between w-full text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Store size={10} className="text-purple-400" />
            {user.branch_count} {user.branch_count === 1 ? 'Branch' : 'Branches'}
          </span>
          <span className="flex items-center gap-1">
            <UserCheck size={10} className="text-green-400" />
            {profileComplete ? 'Profile Updated' : 'Profile Incomplete'}
          </span>
        </div>
      }
    >
      <div className="space-y-2 mt-1">
        <div className="flex flex-wrap gap-1.5">
          {user.profile?.mobile && (
            <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Phone size={8} /> {user.profile.mobile}
            </span>
          )}
          {hasBranches && (
            <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
              {user.branches.length} Active Branch{user.branches.length > 1 ? 'es' : ''}
            </span>
          )}
        </div>
        {user.profile?.city && (
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <MapPin size={10} className="text-gray-400 shrink-0" />
            <span className="truncate">{user.profile.city}, {user.profile.state || ''}</span>
          </p>
        )}
      </div>
    </ManagementCard>
  );
};

// ─── View User Modal ─────────────────────────────────────────────────────────

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
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden m-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex justify-between items-center p-5 border-b bg-white rounded-t-xl">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <User className="text-blue-500" size={20} /> User Details
          </h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all shadow-sm hover:shadow-md bg-white/50 border border-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* User Header */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <ProfileAvatar
              record={user}
              name={user.profile?.name || user.username}
              className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                onNavigateToProfile(user);
                onClose();
              }}
            >
              {(user.profile?.name?.charAt(0) || user.username?.charAt(0) || 'U').toUpperCase()}
            </ProfileAvatar>
            <div>
              <h3 
                className="text-xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => {
                  onNavigateToProfile(user);
                  onClose();
                }}
              >
                {user.profile?.name || user.username}
              </h3>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <Mail className="text-blue-500" size={14} />
                {user.login_id}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={user.status} />
                <span className="text-xs text-gray-400">ID: {user.username}</span>
              </div>
            </div>
          </div>

          {/* Remark & Create Date */}
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Remark</p>
                <p className="text-sm font-medium text-gray-700">{user.remark || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Registered On</p>
                <p className="text-sm font-medium text-gray-700">{formatDate(user.create_date)}</p>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <IdCard className="text-blue-500" size={16} /> Profile Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
            <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setShowBranches(!showBranches)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                type="button"
              >
                <div className="flex items-center gap-2">
                  <Building className="text-purple-500" size={16} />
                  <span className="text-sm font-semibold text-gray-700">Branches</span>
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 font-medium">{user.branches.length}</span>
                </div>
                <motion.div animate={{ rotate: showBranches ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  {showBranches ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </motion.div>
              </button>
              <AnimatePresence>
                {showBranches && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="p-3 bg-white space-y-3 max-h-[400px] overflow-y-auto">
                      {user.branches.map((branch, idx) => (
                        <motion.div
                          key={branch.branch_id || idx}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-semibold text-gray-800">{branch.name}</h5>
                            <StatusBadge status={branch.status} />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <p><span className="text-xs text-gray-500">Branch ID:</span> {branch.branch_id}</p>
                            <p><span className="text-xs text-gray-500">PAN:</span> {branch.pan || 'N/A'}</p>
                            <p><span className="text-xs text-gray-500">GST:</span> {branch.gst || 'N/A'}</p>
                            <p><span className="text-xs text-gray-500">City:</span> {branch.city || 'N/A'}</p>
                            <p><span className="text-xs text-gray-500">State:</span> {branch.state || 'N/A'}</p>
                            <p><span className="text-xs text-gray-500">Created:</span> {formatDateSimple(branch.create_date)}</p>
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
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 shrink-0">
          <button
            onClick={() => {
              onNavigateToProfile(user);
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <User size={16} />
            View Full Profile
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
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

  const navigate = useNavigate();

  // Navigate to profile page
  const handleNavigateToProfile = useCallback((user) => {
    navigate(`/user/profile/${user.username}`);
  }, [navigate]);

  // Open modal with user details
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
        limit: pagination.limit.toString()
      });
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      console.log(`Fetching users with params:`, params.toString());

      const response = await apiCall(`/user/list?${params.toString()}`, 'GET');

      // Check if this request is still the latest
      if (requestId !== currentRequestId.current) {
        console.log("Stale request ignored");
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch users');

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
        throw new Error(result.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      toast.error(err.message || "Failed to load users.");
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
      label: 'User',
      render: (user) => (
        <div className="flex items-center gap-3 w-full">
          <ProfileAvatar
            record={user}
            name={user.profile?.name || user.username}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold cursor-pointer hover:opacity-80 transition-opacity shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigateToProfile(user);
            }}
          >
            {(user.profile?.name?.charAt(0) || user.username?.charAt(0) || 'U').toUpperCase()}
          </ProfileAvatar>
          <div className="min-w-0 flex-1">
            <p 
              className="truncate font-semibold text-gray-800 text-sm cursor-pointer hover:text-blue-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleNavigateToProfile(user);
              }}
            >
              {user.profile?.name || user.username}
            </p>
            <p className="truncate text-xs text-gray-500">{user.login_id}</p>
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
            <p className="text-sm text-gray-700 flex items-center gap-1">
              <Phone size={10} className="text-gray-400" /> {user.profile.mobile}
            </p>
          )}
          {user.profile?.email && user.profile.email !== user.login_id && (
            <p className="text-xs text-gray-500 mt-1">{user.profile.email}</p>
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
            <p className="text-sm text-gray-700">{user.profile.city}</p>
          )}
          {user.profile?.state && (
            <p className="text-xs text-gray-500">{user.profile.state}</p>
          )}
        </div>
      ),
    },
    {
      key: 'branches',
      label: 'Branches',
      render: (user) => (
        <div className="flex items-center gap-1">
          <Building size={12} className="text-purple-500" />
          <span className="text-sm font-medium text-gray-700">{user.branch_count}</span>
          {user.branch_count > 0 && (
            <span className="text-xs text-gray-400">({user.branches?.length || 0} active)</span>
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
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Calendar className="text-gray-400 text-xs shrink-0" size={12} />
          {formatDateSimple(user.create_date)}
        </div>
      ),
    },
  ], [handleNavigateToProfile]);

  // Show loading skeleton only on initial load
  if (loading && users.length === 0) {
    return <Skeleton />;
  }

  return (
    <ManagementHub
      eyebrow={<><User size={11} /> Users</>}
      title="User Management"
      description="View and manage all registered users from a single workspace."
      accent="blue"
      onRefresh={handleRefresh}
    >
      <div className="space-y-3">

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
                placeholder="Search by username, email, name, or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm min-h-[42px]"
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

            {!loading && users.length > 0 && (
              <p className="text-sm text-gray-500 hidden xl:block">
                <span className="font-semibold text-gray-800">{users.length}</span> of{' '}
                <span className="font-semibold text-gray-800">{pagination.total}</span> users
                {searchTerm && <span className="ml-1 text-blue-600">· "{searchTerm}"</span>}
              </p>
            )}
          </div>

          <div className="flex w-full lg:w-auto justify-end">
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
          </div>
        </motion.div>

        {/* Loading indicator for subsequent loads */}
        {loading && users.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white rounded-xl shadow-xl">
            <X className="text-6xl text-red-400 mx-auto mb-4" size={48} />
            <p className="text-xl text-gray-600">Error loading users</p>
            <p className="text-gray-400 mt-2">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && !error && users.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white rounded-xl shadow-xl">
            <User className="text-8xl text-gray-300 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500">No users found</p>
            <p className="text-gray-400 mt-2">{searchTerm ? 'Try adjusting your search' : 'No users registered yet'}</p>
          </motion.div>
        )}

        {/* Content */}
        {!loading && !error && users.length > 0 && (
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
                  rows={users}
                  columns={tableColumns}
                  rowKey={(row) => row.username}
                  onRowClick={(row) => handleViewUserModal(row)}
                  getActions={(user) => [
                    {
                      label: 'View Details',
                      icon: <Eye size={12} />,
                      onClick: () => handleViewUserModal(user),
                      className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
                    },
                    {
                      label: 'View Profile',
                      icon: <User size={12} />,
                      onClick: () => handleNavigateToProfile(user),
                      className: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50',
                    },
                  ]}
                  accent="blue"
                />
              )}

              {/* Card View */}
              {viewMode === 'card' && (
                <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
                  <AnimatePresence>
                    {users.map((user, index) => (
                      <UserCard
                        key={user.username}
                        user={user}
                        index={index}
                        onView={handleViewUserModal}
                        onNavigateToProfile={handleNavigateToProfile}
                      />
                    ))}
                  </AnimatePresence>
                </ManagementGrid>
              )}
            </motion.div>

            {/* Pagination */}
            {(users.length > 0 || pagination.total > 0) && (
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