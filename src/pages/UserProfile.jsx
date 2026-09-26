// pages/UserProfile.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Building,
  Clock,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Ban,
  Users,
  FileText,
  UserCircle,
  ArrowLeft,
} from "lucide-react";
import { toast } from 'react-toastify';
import apiCall from '../utils/apiCall';
import { DetailPageSkeleton } from "../components/SkeletonComponent";
import ProfileTab from "../components/user/ProfileTab";
import BranchesTab from "../components/user/BranchesTab";
import SessionsTab from "../components/user/SessionsTab";
import RefreshButton from "../components/common/RefreshButton";
import ServicesTab from "../components/user/ServicesTab";
import StatisticsCard from "../components/user/StatisticsCard";

// ─── Helper Components ─────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  if (status) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 sm:text-xs">
        <CheckCircle size={10} className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 sm:text-xs">
      <Ban size={10} className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Inactive
    </span>
  );
};

const DetailItem = ({ icon: Icon, label, value, className = "" }) => (
  <div className={`flex items-center gap-1 sm:gap-2 ${className}`}>
    <Icon size={12} className="h-3 w-3 shrink-0 text-admin-muted sm:h-3.5 sm:w-3.5" />
    <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
      <span className="shrink-0 text-[10px] text-admin-muted sm:text-xs">{label}:</span>
      <span className="truncate text-[11px] font-medium text-admin-text sm:text-sm">{value || "N/A"}</span>
    </div>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");

  // Refs to prevent duplicate API calls
  const fetchInProgress = useRef(false);
  const initialFetchDone = useRef(false);
  const currentRequestId = useRef(0);
  const lastFetchedUsername = useRef(null);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "branches", label: "Branches", icon: Building },
    { id: "sessions", label: "Sessions", icon: Clock },
    { id: "services", label: "Services", icon: Briefcase },
  ];

  const fetchUserProfile = useCallback(async (showRefresh = false) => {
    // Prevent multiple simultaneous requests
    if (fetchInProgress.current) {
      console.log("Fetch already in progress, skipping...");
      return;
    }

    // Prevent fetching the same username twice
    if (!showRefresh && lastFetchedUsername.current === username) {
      console.log("Already fetched this username, skipping...");
      return;
    }

    fetchInProgress.current = true;
    
    // Generate unique request ID
    const requestId = ++currentRequestId.current;

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await apiCall(`/user/profile/${username}`, 'GET');

      // Check if this request is still the latest
      if (requestId !== currentRequestId.current) {
        console.log("Stale request ignored");
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch user profile');

      const result = await response.json();

      if (result.success) {
        setUserData(result.data);
        lastFetchedUsername.current = username;
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to fetch user profile');
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      toast.error(err.message || "Failed to load user profile.");
    } finally {
      if (requestId === currentRequestId.current) {
        setLoading(false);
        setRefreshing(false);
        fetchInProgress.current = false;
      }
    }
  }, [username]);

  useEffect(() => {
    if (username && !initialFetchDone.current) {
      console.log("Initial fetch triggered");
      initialFetchDone.current = true;
      fetchUserProfile();
    }
  }, [username, fetchUserProfile]);

  const handleRefresh = () => {
    // Reset the last fetched username to allow refresh
    lastFetchedUsername.current = null;
    fetchUserProfile(true);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (error || !userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <div className="admin-panel max-w-md p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold text-admin-text">User Not Found</h2>
          <p className="mb-6 text-admin-muted">{error || "Unable to load user profile"}</p>
          <button
            onClick={handleBack}
            className="rounded-md bg-teal-600 px-6 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { user, profile, statistics } = userData;

  return (
    <div className="mx-auto min-h-screen space-y-4">
      {/* Header Section */}
      <div className="admin-panel overflow-hidden">
        {/* Top Bar with Eyebrow and Refresh */}
        <div className="flex items-center justify-between gap-3 border-b border-admin-border bg-admin-raised px-3 py-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={handleBack}
              className="shrink-0 rounded-md p-1.5 text-admin-muted transition-colors hover:bg-admin-surface hover:text-admin-text"
            >
              <ArrowLeft size={18} />
            </button>
            <UserCircle size={16} className="shrink-0 text-admin-accent-text" />
            <span className="hidden shrink-0 text-sm font-medium text-admin-muted sm:inline">Profile</span>
            <span className="hidden shrink-0 text-xs text-admin-muted sm:inline">/</span>
            <span className="truncate text-sm font-semibold text-admin-text">{profile?.name || user?.username}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <RefreshButton
              onClick={handleRefresh}
              loading={refreshing}
              className="justify-center px-3 sm:px-4"
            >
              <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
            </RefreshButton>
          </div>
        </div>

        {/* Main User Info */}
        <div className="px-3 py-3 sm:px-6 sm:py-5">
          <div className="flex flex-row items-start gap-3 sm:gap-5">
            {/* Avatar */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-admin-accent-soft text-admin-accent-text sm:h-16 sm:w-16">
              {profile?.image ? (
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold sm:text-2xl">
                  {profile?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
                </span>
              )}
            </div>

            {/* User Details */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-1 sm:mb-2 sm:gap-3">
                <h1 className="truncate text-base font-bold leading-tight text-admin-text sm:text-2xl">
                  {profile?.name || user?.username}
                </h1>
                <StatusBadge status={user?.status} />
              </div>

              <div className="mb-1.5 flex flex-wrap items-center gap-2 sm:mb-3">
                <div className="flex max-w-full items-center gap-1 rounded-md border border-admin-border bg-admin-raised px-1.5 py-0.5 sm:px-2 sm:py-1">
                  <Mail size={10} className="shrink-0 text-admin-muted sm:h-3 sm:w-3" />
                  <span className="truncate text-[10px] leading-none text-admin-text-sub sm:text-sm">{user?.login_id}</span>
                </div>
                {profile?.mobile && (
                  <div className="flex max-w-full items-center gap-1 rounded-md border border-admin-border bg-admin-raised px-1.5 py-0.5 sm:px-2 sm:py-1">
                    <Phone size={10} className="shrink-0 text-admin-muted sm:h-3 sm:w-3" />
                    <span className="truncate text-[10px] leading-none text-admin-text-sub sm:text-sm">+{profile.country_code || '91'} {profile.mobile}</span>
                  </div>
                )}
              </div>

              {/* Additional Details Row */}
              <div className="flex w-full flex-wrap gap-x-3 gap-y-1 text-left sm:gap-x-6 sm:gap-y-2">
                <DetailItem icon={Calendar} label="Since" value={new Date(user?.create_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} />
                {user?.create_by && (
                  <DetailItem icon={User} label="By" value={user?.create_by} />
                )}
                {user?.remark && (
                  <DetailItem icon={FileText} label="Remark" value={user?.remark} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6 lg:gap-4"
        >
          <StatisticsCard
            title="Branches"
            total={statistics.branches?.total || 0}
            active={statistics.branches?.active || 0}
            icon={Building}
            color="blue"
          />
          <StatisticsCard
            title="Clients"
            total={statistics.clients?.total || 0}
            active={statistics.clients?.active || 0}
            icon={Users}
            color="green"
          />
          <StatisticsCard
            title="CA Firms"
            total={statistics.ca?.total || 0}
            active={statistics.ca?.active || 0}
            icon={Briefcase}
            color="purple"
          />
          <StatisticsCard
            title="Agents"
            total={statistics.agent?.total || 0}
            active={statistics.agent?.active || 0}
            icon={Users}
            color="orange"
          />
          <StatisticsCard
            title="Employees"
            total={statistics.employees?.total || 0}
            active={statistics.employees?.active || 0}
            icon={User}
            color="indigo"
            extra={`${statistics.employees?.accepted || 0} accepted, ${statistics.employees?.pending || 0} pending`}
          />
          <StatisticsCard
            title="Firms"
            total={statistics.firms?.total || 0}
            active={statistics.firms?.active || 0}
            icon={Building}
            color="pink"
          />
        </motion.div>
      )}

      {/* Tasks Summary Card */}
      {statistics?.tasks && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="admin-panel p-4 sm:p-6"
        >
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-admin-text">
            <FileText size={20} className="text-admin-accent-text" />
            Task Overview
          </h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
            <div className="rounded-md border border-admin-border bg-emerald-50 p-3 text-center dark:bg-emerald-950/30">
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{statistics.tasks.complete || 0}</p>
              <p className="text-xs text-admin-muted">Completed</p>
            </div>
            <div className="rounded-md border border-admin-border bg-rose-50 p-3 text-center dark:bg-rose-950/30">
              <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{statistics.tasks.cancel || 0}</p>
              <p className="text-xs text-admin-muted">Cancelled</p>
            </div>
            <div className="rounded-md border border-admin-border bg-amber-50 p-3 text-center dark:bg-amber-950/30">
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{statistics.tasks.pending_from_department || 0}</p>
              <p className="text-xs text-admin-muted">Pending (Dept)</p>
            </div>
            <div className="rounded-md border border-admin-border bg-orange-50 p-3 text-center dark:bg-orange-950/30">
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{statistics.tasks.pending_from_client || 0}</p>
              <p className="text-xs text-admin-muted">Pending (Client)</p>
            </div>
            <div className="rounded-md border border-admin-border bg-admin-accent-soft p-3 text-center">
              <p className="text-2xl font-bold text-admin-accent-text">{statistics.tasks.in_process || 0}</p>
              <p className="text-xs text-admin-muted">In Process</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="admin-panel overflow-hidden"
      >
        <div className="border-b border-admin-border">
          <nav className="scrollbar-hide flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                      relative flex items-center gap-2 whitespace-nowrap px-6 py-4 text-sm font-medium transition-all
                      ${activeTab === tab.id
                      ? "text-admin-accent-text"
                      : "text-admin-muted hover:bg-admin-raised hover:text-admin-text"
                    }
                    `}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Pass user and profile data to ProfileTab */}
                <ProfileTab user={user} profile={profile} />
              </motion.div>
            )}
            {activeTab === "branches" && (
              <motion.div
                key="branches"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* BranchesTab will fetch its own data */}
                <BranchesTab username={username} />
              </motion.div>
            )}
            {activeTab === "sessions" && (
              <motion.div
                key="sessions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* SessionsTab will fetch its own data */}
                <SessionsTab username={username} />
              </motion.div>
            )}
            {activeTab === "services" && (
              <motion.div
                key="services"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* ServicesTab will fetch its own data */}
                <ServicesTab username={username} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
