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
  MapPin,
  Calendar,
  CheckCircle,
  Ban,
  Users,
  FileText,
  UserCircle,
  IdCard,
} from "lucide-react";
import { toast } from 'react-toastify';
import apiCall from '../utils/apiCall';
import Skeleton from "../components/SkeletonComponent";
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

const DetailItem = ({ icon: Icon, label, value, className = "" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <Icon size={14} className="text-gray-400 shrink-0" />
    <span className="text-xs text-gray-500">{label}:</span>
    <span className="text-sm text-gray-700 font-medium">{value || "N/A"}</span>
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
    
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Generate unique request ID
      const requestId = ++currentRequestId.current;

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
      if (currentRequestId.current === currentRequestId.current) {
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
    return <Skeleton />;
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "Unable to load user profile"}</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { user, profile, statistics } = userData;
  const address = profile?.address || {};

  return (
    <div className="min-h-screen mx-auto">
      {/* Header Section */}
      <div className="mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Top Bar with Eyebrow and Refresh */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2">
              <UserCircle size={16} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-600">Profile</span>
              <span className="text-xs text-gray-400">/</span>
              <span className="text-sm text-gray-900">{profile?.name || user?.username}</span>
            </div>
            <RefreshButton
              onClick={handleRefresh}
              loading={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </RefreshButton>
          </div>

          {/* Main User Info */}
          <div className="px-6 py-5">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Section - Avatar and Basic Info */}
              <div className="flex items-start gap-5 flex-1">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-4 ring-blue-50 shrink-0">
                  {profile?.image ? (
                    <img
                      src={profile.image}
                      alt={profile.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-white">
                      {profile?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
                    </span>
                  )}
                </div>

                {/* User Details */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {profile?.name || user?.username}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-600">{user?.login_id}</span>
                    </div>
                    {profile?.mobile && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600">+{profile.country_code || '91'} {profile.mobile}</span>
                      </div>
                    )}
                    <StatusBadge status={user?.status} />
                  </div>

                  {/* Additional Details Row */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <DetailItem icon={IdCard} label="User ID" value={user?.username} />
                    <DetailItem icon={Calendar} label="Member Since" value={new Date(user?.create_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} />
                    {user?.create_by && (
                      <DetailItem icon={User} label="Created By" value={user?.create_by} />
                    )}
                    {user?.remark && (
                      <DetailItem icon={FileText} label="Remark" value={user?.remark} />
                    )}
                  </div>
                </div>
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
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6"
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
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            Task Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{statistics.tasks.complete || 0}</p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-xl">
              <p className="text-2xl font-bold text-red-600">{statistics.tasks.cancel || 0}</p>
              <p className="text-xs text-gray-600">Cancelled</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-xl">
              <p className="text-2xl font-bold text-yellow-600">{statistics.tasks.pending_from_department || 0}</p>
              <p className="text-xs text-gray-600">Pending (Dept)</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-xl">
              <p className="text-2xl font-bold text-orange-600">{statistics.tasks.pending_from_client || 0}</p>
              <p className="text-xs text-gray-600">Pending (Client)</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{statistics.tasks.in_process || 0}</p>
              <p className="text-xs text-gray-600">In Process</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                      flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative whitespace-nowrap
                      ${activeTab === tab.id
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }
                    `}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
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