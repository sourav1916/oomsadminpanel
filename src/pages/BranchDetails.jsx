// pages/BranchDetails.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Building, MapPin, Phone,
    Mail,
    Calendar,
    CheckCircle,
    Ban,
    IdCard,
    User,
    ArrowLeft,
    FileText,
    Users,
    Briefcase,
    Clock,
    Store,
    Store as StoreIcon,
    Settings,
    ChevronDown,
} from "lucide-react";
import { toast } from 'react-toastify';
import apiCall from '../utils/apiCall';
import Skeleton from "../components/SkeletonComponent";
import RefreshButton from "../components/common/RefreshButton";
import StatisticsCard from "../components/user/StatisticsCard";

// ─── Helper Components ─────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
    if (status) {
        return (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                <CheckCircle size={10} className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Active
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <Ban size={10} className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Inactive
        </span>
    );
};

const InfoCard = ({ icon: Icon, title, children, className = "" }) => (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <div className="flex items-center gap-2">
                <Icon size={16} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            </div>
        </div>
        <div className="p-4">{children}</div>
    </div>
);

const InfoRow = ({ icon: Icon, label, value, className = "" }) => (
    <div className={`flex items-center gap-1 sm:gap-2 ${className}`}>
        <Icon size={12} className="text-gray-400 shrink-0 w-3 h-3 sm:w-3.5 sm:h-3.5" />
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
            <span className="text-[10px] sm:text-xs text-gray-500 shrink-0">{label}:</span>
            <span className="text-[11px] sm:text-sm text-gray-800 font-medium truncate">{value || "N/A"}</span>
        </div>
    </div>
);

const VerificationBadge = ({ isVerified }) => (
    <span className={`inline-flex items-center gap-1 text-xs ${isVerified ? 'text-green-600' : 'text-red-500'}`}>
        {isVerified ? <CheckCircle size={12} /> : <Ban size={12} />}
        {isVerified ? 'Verified' : 'Not Verified'}
    </span>
);

// ─── Main Component ─────────────────────────────────────────────────────────

export default function BranchDetails() {
    const { branchId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [branchData, setBranchData] = useState(null);
    const [showMobileContacts, setShowMobileContacts] = useState(false);

    // Refs to prevent duplicate API calls
    const fetchInProgress = useRef(false);
    const initialFetchDone = useRef(false);
    const currentRequestId = useRef(0);
    const lastFetchedBranchId = useRef(null);

    const fetchBranchDetails = useCallback(async (showRefresh = false) => {
        // Prevent multiple simultaneous requests
        if (fetchInProgress.current) {
            console.log("Fetch already in progress, skipping...");
            return;
        }

        // Prevent fetching the same branch ID twice
        if (!showRefresh && lastFetchedBranchId.current === branchId) {
            console.log("Already fetched this branch, skipping...");
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

            const response = await apiCall(`/branch/details/${branchId}`, 'GET');

            // Check if this request is still the latest
            if (requestId !== currentRequestId.current) {
                console.log("Stale request ignored");
                return;
            }

            if (!response.ok) throw new Error('Failed to fetch branch details');

            const result = await response.json();

            if (result.success) {
                setBranchData(result.data);
                lastFetchedBranchId.current = branchId;
                setError(null);
            } else {
                throw new Error(result.message || 'Failed to fetch branch details');
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setError(err.message);
            toast.error(err.message || "Failed to load branch details.");
        } finally {
            if (currentRequestId.current === currentRequestId.current) {
                setLoading(false);
                setRefreshing(false);
                fetchInProgress.current = false;
            }
        }
    }, [branchId]);

    useEffect(() => {
        if (branchId && !initialFetchDone.current) {
            console.log("Initial fetch triggered for branch:", branchId);
            initialFetchDone.current = true;
            fetchBranchDetails();
        }
    }, [branchId, fetchBranchDetails]);

    const handleRefresh = () => {
        // Reset the last fetched branch ID to allow refresh
        lastFetchedBranchId.current = null;
        fetchBranchDetails(true);
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleViewServices = () => {
        navigate(`/branch/${branchId}/services`);
    };

    if (loading) {
        return <Skeleton />;
    }

    if (error || !branchData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">😕</div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Branch Not Found</h2>
                    <p className="text-gray-600 mb-6">{error || "Unable to load branch details"}</p>
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

    const branch = branchData;
    const statistics = branchData.statistics || {};
    const address = branch?.address || {};
    const contact = branch?.contact || {};
    const taxInfo = branch?.tax_info || {};
    const owner = branch?.owner || {};

    return (
        <div className="min-h-screen mx-auto">
            {/* Header Section */}
            <div className="lg:mb-6 mb-2">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Top Bar with Eyebrow and Refresh */}
                    <div className="flex items-center justify-between gap-3 px-2 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex items-center gap-2 min-w-0">
                            <button
                                onClick={handleBack}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                            >
                                <ArrowLeft size={18} className="text-gray-600" />
                            </button>
                            <StoreIcon size={16} className="text-purple-500 shrink-0" />
                            <span className="text-sm font-medium text-gray-600 shrink-0 hidden sm:inline">Branch</span>
                            <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">/</span>
                            <span className="text-sm text-gray-900 font-semibold truncate">{branch?.name || 'Branch Details'}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={handleViewServices}
                                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                            >
                                <Settings size={16} />
                                <span className="text-sm font-semibold hidden sm:inline">Services</span>
                            </button>
                            <RefreshButton onClick={handleRefresh} loading={refreshing} className="justify-center px-3 sm:px-4">
                                <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
                            </RefreshButton>
                        </div>
                    </div>

                    {/* Main Branch Info */}
                    <div className="px-3 sm:px-6 py-3 sm:py-5">
                        <div className="flex flex-row items-start gap-3 sm:gap-5">
                            {/* Logo */}
                            <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-sm sm:shadow-lg ring-2 sm:ring-4 ring-purple-50 shrink-0 overflow-hidden">
                                {branch?.logo ? (
                                    <img
                                        src={branch.logo}
                                        alt={branch.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Building size={20} className="text-white sm:w-8 sm:h-8" />
                                )}
                            </div>

                            {/* Branch Details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 sm:gap-3 mb-1 sm:mb-2">
                                    <h1 className="text-base sm:text-2xl font-bold text-gray-900 truncate leading-tight">
                                        {branch?.name || 'N/A'}
                                    </h1>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={branch?.status} />
                                    </div>
                                </div>

                                {/* Additional Details Row */}
                                <div className="flex flex-wrap gap-x-3 sm:gap-x-6 gap-y-1 sm:gap-y-2 w-full">
                                    {branch?.create_date && (
                                        <InfoRow icon={Calendar} label="Created" value={new Date(branch.create_date).toLocaleDateString()} />
                                    )}
                                    {branch?.create_by && (
                                        <InfoRow icon={User} label="Created By" value={branch.create_by} />
                                    )}
                                    {branch?.modify_date && branch?.create_date && branch.modify_date !== branch.create_date && (
                                        <InfoRow icon={Clock} label="Modified" value={new Date(branch.modify_date).toLocaleDateString()} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Section Mobile Toggle */}
                    {(contact?.mobile_1 || contact?.mobile_2 || contact?.email_1 || contact?.email_2) && (
                        <div className="xl:hidden px-4 py-3 border-t border-slate-100 bg-gray-50/50">
                            <button
                                onClick={() => setShowMobileContacts(!showMobileContacts)}
                                className="w-full flex items-center justify-between text-sm text-gray-700 font-medium"
                            >
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-gray-500" />
                                    <span>Contact Information</span>
                                </div>
                                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${showMobileContacts ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    )}

                    <div className={`${showMobileContacts ? 'grid' : 'hidden'} xl:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-4 sm:px-6 pb-4 pt-2 xl:pt-4 border-t-0 xl:border-t border-slate-100 items-center bg-gray-50/50`}>
                        {contact?.mobile_1 && (
                            <InfoRow icon={Phone} label="Mobile 1" value={contact.mobile_1} />
                        )}
                        {contact?.mobile_2 && (
                            <InfoRow icon={Phone} label="Mobile 2" value={contact.mobile_2} />
                        )}
                        {contact?.email_1 && (
                            <InfoRow icon={Mail} label="Email 1" value={contact.email_1} />
                        )}
                        {contact?.email_2 && (
                            <InfoRow icon={Mail} label="Email 2" value={contact.email_2} />
                        )}
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            {statistics && Object.keys(statistics).length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-4 gap-2 mb-2 lg:mb-6"
                >
                    {statistics.clients && (
                        <StatisticsCard
                            title="Clients"
                            total={statistics.clients?.total || 0}
                            active={statistics.clients?.active || 0}
                            icon={Users}
                            color="blue"
                        />
                    )}
                    {statistics.ca && (
                        <StatisticsCard
                            title="CA Firms"
                            total={statistics.ca?.total || 0}
                            active={statistics.ca?.active || 0}
                            icon={Briefcase}
                            color="purple"
                        />
                    )}
                    {statistics.agent && (
                        <StatisticsCard
                            title="Agents"
                            total={statistics.agent?.total || 0}
                            active={statistics.agent?.active || 0}
                            icon={Users}
                            color="orange"
                        />
                    )}
                    {statistics.employees && (
                        <StatisticsCard
                            title="Employees"
                            total={statistics.employees?.total || 0}
                            active={statistics.employees?.active || 0}
                            icon={User}
                            color="indigo"
                            extra={`${statistics.employees?.accepted || 0} accepted, ${statistics.employees?.pending || 0} pending`}
                        />
                    )}
                    {statistics.firms && (
                        <StatisticsCard
                            title="Firms"
                            total={statistics.firms?.total || 0}
                            active={statistics.firms?.active || 0}
                            icon={Store}
                            color="pink"
                        />
                    )}
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

            {/* Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Address Information */}
                {Object.keys(address).length > 0 && (
                    <InfoCard icon={MapPin} title="Address Information">
                        <div className="space-y-2">
                            {address.address_line_1 && (
                                <p className="text-sm text-gray-700">{address.address_line_1}</p>
                            )}
                            {address.address_line_2 && (
                                <p className="text-sm text-gray-700">{address.address_line_2}</p>
                            )}
                            <p className="text-sm text-gray-700">
                                {[address.city, address.state, address.country].filter(Boolean).join(', ')}
                                {address.pincode && ` - ${address.pincode}`}
                            </p>
                            {address.invoice_address && (
                                <p className="text-sm text-gray-500 mt-2 pt-2 border-t">
                                    <span className="font-medium">Invoice Address:</span> {address.invoice_address}
                                </p>
                            )}
                        </div>
                    </InfoCard>
                )}

                {/* Tax Information */}
                {Object.keys(taxInfo).length > 0 && (taxInfo.pan || taxInfo.gst) && (
                    <InfoCard icon={IdCard} title="Tax Information">
                        <div className="space-y-3">
                            {taxInfo.pan && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">PAN Number:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-mono font-medium">{taxInfo.pan}</span>
                                        <VerificationBadge isVerified={taxInfo.is_pan_verified} />
                                    </div>
                                </div>
                            )}
                            {taxInfo.gst && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">GST Number:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-mono font-medium">{taxInfo.gst}</span>
                                        <VerificationBadge isVerified={taxInfo.is_gst_verified} />
                                    </div>
                                </div>
                            )}
                            {taxInfo.gst_rate && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">GST Rate:</span>
                                    <span className="text-sm font-medium text-green-600">{taxInfo.gst_rate}%</span>
                                </div>
                            )}
                        </div>
                    </InfoCard>
                )}

                {/* Owner Information */}
                {Object.keys(owner).length > 0 && (
                    <InfoCard icon={User} title="Owner Information" className="lg:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoRow icon={User} label="Name" value={owner.name} />
                            <InfoRow icon={Mail} label="Email" value={owner.email || owner.login_id} />
                            <InfoRow icon={Phone} label="Mobile" value={owner.mobile ? `+${owner.country_code || '91'} ${owner.mobile}` : 'N/A'} />
                            <InfoRow icon={IdCard} label="Username" value={owner.username} />
                            <InfoRow icon={Calendar} label="Status" value={<StatusBadge status={owner.status} />} />
                        </div>
                    </InfoCard>
                )}
            </div>

            {/* Logo and Signature Section */}
            {(branch?.logo || branch?.sign) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
                >
                    {branch?.logo && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Building size={16} className="text-blue-600" />
                                Branch Logo
                            </h3>
                            <img src={branch.logo} alt="Branch Logo" className="max-h-32 object-contain" />
                        </div>
                    )}
                    {branch?.sign && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <FileText size={16} className="text-blue-600" />
                                Signature
                            </h3>
                            <img src={branch.sign} alt="Branch Signature" className="max-h-20 object-contain" />
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}