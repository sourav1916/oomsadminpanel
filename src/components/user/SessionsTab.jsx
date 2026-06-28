// components/user/SessionsTab.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Clock, LogOut, Calendar, Globe, Activity, X, Search, 
  Smartphone, Monitor, Shield, CheckCircle, Ban, User, Mail, Phone 
} from "lucide-react";
import { toast } from 'react-toastify';
import apiCall from '../../utils/apiCall';
import Pagination, { usePagination } from "../common/PaginationComponent";

const SessionStatusBadge = ({ isActive, isExpired }) => {
  if (isActive && !isExpired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
        <CheckCircle size={10} /> Active
      </span>
    );
  }
  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
        <Ban size={10} /> Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
      <Clock size={10} /> Inactive
    </span>
  );
};

const LoginMethodBadge = ({ method }) => {
  const methods = {
    google: { icon: Globe, text: 'Google', className: 'bg-blue-100 text-blue-800' },
    email: { icon: Mail, text: 'Email', className: 'bg-purple-100 text-purple-800' },
    facebook: { icon: Globe, text: 'Facebook', className: 'bg-indigo-100 text-indigo-800' }
  };
  
  const selected = methods[method?.toLowerCase()] || methods.email;
  const Icon = selected.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${selected.className}`}>
      <Icon size={10} /> {selected.text}
    </span>
  );
};

export default function SessionsTab({ username }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [totalSessions, setTotalSessions] = useState(0);
  
  // Use the shared pagination hook
  const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 10);

  // Fetch sessions function
  const fetchSessions = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        username: username,
        page_no: page.toString(),
        limit: pagination.limit.toString()
      });
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      const response = await apiCall(`/user/sessions?${params.toString()}`, 'GET');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const result = await response.json();
      
      if (result.success) {
        setSessions(result.data || []);
        setTotalSessions(result.pagination?.total || 0);
        
        // Update pagination state
        updatePagination({
          page: result.pagination?.page_no || page,
          limit: result.pagination?.limit || pagination.limit,
          total: result.pagination?.total || 0,
          total_pages: result.pagination?.total_pages || 0,
          has_more: result.pagination?.has_more || false,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      toast.error(err.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [username, pagination.limit, debouncedSearchTerm, updatePagination]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch sessions when page, limit, or search changes
  useEffect(() => {
    fetchSessions(pagination.page);
  }, [pagination.page, pagination.limit, debouncedSearchTerm, fetchSessions]);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    if (newPage !== pagination.page) {
      goToPage(newPage);
    }
  }, [pagination.page, goToPage]);

  // Handle limit change
  const handleLimitChange = useCallback((newLimit) => {
    if (newLimit !== pagination.limit) {
      changeLimit(newLimit);
      // Reset to page 1 when changing limit
      if (pagination.page !== 1) {
        goToPage(1);
      }
    }
  }, [pagination.limit, pagination.page, changeLimit, goToPage]);

  // Terminate session
  const handleTerminateSession = async (tokenId) => {
    try {
      const response = await apiCall(`/user/sessions/${tokenId}`, 'DELETE');
      if (!response.ok) throw new Error('Failed to terminate session');
      const result = await response.json();
      if (result.success) {
        toast.success('Session terminated successfully');
        // Refresh current page
        fetchSessions(pagination.page);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error("Error terminating session:", err);
      toast.error(err.message || "Failed to terminate session");
    }
  };

  // Filter sessions based on search (client-side filtering as fallback)
  const filteredSessions = sessions.filter(session =>
    session.create_ip?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    session.user?.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    session.user?.login_id?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    session.login_method?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  if (loading && sessions.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!loading && sessions.length === 0 && !debouncedSearchTerm) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <h3 className="text-lg font-medium text-gray-900">No Sessions Found</h3>
        <p className="text-gray-500 mt-1">No active sessions found for this user.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search sessions by IP address, user name, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')} 
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X size={14} className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Loading indicator for subsequent loads */}
      {loading && sessions.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-3">
        {filteredSessions.map((session, index) => (
          <motion.div
            key={session.token_id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border border-gray-200 rounded-xl hover:shadow-md transition-shadow bg-white overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  {/* Session Header */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Globe size={14} className="text-blue-500" />
                      <span className="text-sm font-mono font-medium text-gray-700">
                        {session.create_ip || 'Unknown IP'}
                      </span>
                    </div>
                    <SessionStatusBadge isActive={session.is_active} isExpired={session.is_expired} />
                    <LoginMethodBadge method={session.login_method} />
                  </div>

                  {/* User Info */}
                  {session.user && (
                    <div className="flex items-center gap-4 flex-wrap text-sm bg-gray-50 p-2 rounded-lg">
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-gray-400" />
                        <span className="text-gray-600">{session.user.name || session.user.login_id}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail size={12} className="text-gray-400" />
                        <span className="text-gray-500 text-xs">{session.user.login_id}</span>
                      </div>
                      {session.user.mobile && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-gray-400" />
                          <span className="text-gray-500 text-xs">+{session.user.country_code} {session.user.mobile}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Session Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-400" />
                      <span className="text-gray-500">Created:</span>
                      <span className="text-gray-700">{new Date(session.create_date).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-gray-500">Last Used:</span>
                      <span className="text-gray-700">{new Date(session.last_used_date).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-400" />
                      <span className="text-gray-500">Expires:</span>
                      <span className="text-gray-700">{new Date(session.expire_date).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Globe size={12} className="text-gray-400" />
                      <span className="text-gray-500">Last IP:</span>
                      <span className="text-gray-700 font-mono">{session.last_ip}</span>
                    </div>
                  </div>

                  {/* Token ID (if needed) */}
                  {session.token_id && (
                    <p className="text-xs text-gray-400 font-mono">
                      Token: {session.token_id.substring(0, 20)}...
                    </p>
                  )}
                </div>
                
                {session.is_active && !session.is_expired && (
                  <button
                    onClick={() => handleTerminateSession(session.token_id)}
                    className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
                    title="Terminate Session"
                  >
                    <LogOut size={16} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* No search results */}
      {filteredSessions.length === 0 && debouncedSearchTerm && (
        <div className="text-center py-8">
          <Search className="mx-auto h-10 w-10 text-gray-400 mb-2" />
          <p className="text-gray-500">No sessions match your search.</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Pagination Component */}
      {totalSessions > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Pagination
            currentPage={pagination.page}
            totalItems={totalSessions}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            showInfo={true}
          />
        </div>
      )}

      {/* Results summary */}
      {!loading && sessions.length > 0 && (
        <div className="text-center text-xs text-gray-400 pt-2">
          Showing {filteredSessions.length} of {sessions.length} sessions
        </div>
      )}
    </div>
  );
}