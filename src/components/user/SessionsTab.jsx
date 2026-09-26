// components/user/SessionsTab.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Clock, LogOut, Calendar, Globe, X, Search, 
  CheckCircle, Ban, User, Mail, Phone 
} from "lucide-react";
import { toast } from 'react-toastify';
import apiCall from '../../utils/apiCall';
import { usePagination } from "../common/PaginationComponent";
import TablePagination from "../common/TablePagination";
import { TableSkeleton } from "../SkeletonComponent";

const SessionStatusBadge = ({ isActive, isExpired }) => {
  if (isActive && !isExpired) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        <CheckCircle size={10} /> Active
      </span>
    );
  }
  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <Ban size={10} /> Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
      <Clock size={10} /> Inactive
    </span>
  );
};

const LoginMethodBadge = ({ method }) => {
  const methods = {
    google: { icon: Globe, text: 'Google', className: 'bg-admin-accent-soft text-admin-accent-text' },
    email: { icon: Mail, text: 'Email', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    facebook: { icon: Globe, text: 'Facebook', className: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' }
  };
  
  const selected = methods[method?.toLowerCase()] || methods.email;
  const Icon = selected.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${selected.className}`}>
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
      <TableSkeleton columns={4} rows={5} showActions={false} />
    );
  }

  if (!loading && sessions.length === 0 && !debouncedSearchTerm) {
    return (
      <div className="py-12 text-center">
        <Clock className="mx-auto mb-3 h-12 w-12 text-admin-muted" />
        <h3 className="text-lg font-medium text-admin-text">No Sessions Found</h3>
        <p className="mt-1 text-admin-muted">No active sessions found for this user.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" size={16} />
        <input
          type="text"
          placeholder="Search sessions by IP address, user name, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-input pl-9 pr-8"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')} 
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X size={14} className="text-admin-muted hover:text-admin-text" />
          </button>
        )}
      </div>

      {/* Loading indicator for subsequent loads */}
      {loading && sessions.length > 0 && (
        <TableSkeleton columns={4} rows={4} showActions={false} />
      )}

      {/* Sessions List */}
      <div className="space-y-3">
        {filteredSessions.map((session, index) => (
          <motion.div
            key={session.token_id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="admin-panel overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  {/* Session Header */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Globe size={14} className="text-admin-accent-text" />
                      <span className="font-mono text-sm font-medium text-admin-text">
                        {session.create_ip || 'Unknown IP'}
                      </span>
                    </div>
                    <SessionStatusBadge isActive={session.is_active} isExpired={session.is_expired} />
                    <LoginMethodBadge method={session.login_method} />
                  </div>

                  {/* User Info */}
                  {session.user && (
                    <div className="flex flex-wrap items-center gap-4 rounded-md border border-admin-border bg-admin-raised p-2 text-sm">
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-admin-muted" />
                        <span className="text-admin-text-sub">{session.user.name || session.user.login_id}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail size={12} className="text-admin-muted" />
                        <span className="text-xs text-admin-muted">{session.user.login_id}</span>
                      </div>
                      {session.user.mobile && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-admin-muted" />
                          <span className="text-xs text-admin-muted">+{session.user.country_code} {session.user.mobile}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Session Details */}
                  <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-admin-muted" />
                      <span className="text-admin-muted">Created:</span>
                      <span className="text-admin-text-sub">{new Date(session.create_date).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-admin-muted" />
                      <span className="text-admin-muted">Last Used:</span>
                      <span className="text-admin-text-sub">{new Date(session.last_used_date).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-admin-muted" />
                      <span className="text-admin-muted">Expires:</span>
                      <span className="text-admin-text-sub">{new Date(session.expire_date).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Globe size={12} className="text-admin-muted" />
                      <span className="text-admin-muted">Last IP:</span>
                      <span className="font-mono text-admin-text-sub">{session.last_ip}</span>
                    </div>
                  </div>

                  {/* Token ID (if needed) */}
                  {session.token_id && (
                    <p className="font-mono text-xs text-admin-muted">
                      Token: {session.token_id.substring(0, 20)}...
                    </p>
                  )}
                </div>
                
                {session.is_active && !session.is_expired && (
                  <button
                    onClick={() => handleTerminateSession(session.token_id)}
                    className="rounded-md p-2 text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40"
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
        <div className="py-8 text-center">
          <Search className="mx-auto mb-2 h-10 w-10 text-admin-muted" />
          <p className="text-admin-muted">No sessions match your search.</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-2 text-sm font-medium text-admin-accent-text hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Pagination Component */}
      {totalSessions > 0 && (
        <div className="mt-6 border-t border-admin-border pt-4">
          <TablePagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.total_pages}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </div>
      )}

      {/* Results summary */}
      {!loading && sessions.length > 0 && (
        <div className="pt-2 text-center text-xs text-admin-muted">
          Showing {filteredSessions.length} of {sessions.length} sessions
        </div>
      )}
    </div>
  );
}
