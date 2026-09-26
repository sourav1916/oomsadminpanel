// components/user/BranchesTab.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Building, MapPin, Phone, Mail, Calendar, CheckCircle, Ban, 
  Search, X, ChevronRight, Eye 
} from "lucide-react";
import { toast } from 'react-toastify';
import apiCall from '../../utils/apiCall';
import { TableSkeleton } from "../SkeletonComponent";

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

const BranchCard = ({ branch, index, onViewDetails }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="admin-panel group cursor-pointer overflow-hidden transition-colors hover:border-teal-300/60 dark:hover:border-teal-800"
      onClick={() => onViewDetails(branch.branch_id)}
    >
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-admin-accent-soft text-admin-accent-text">
              <Building size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-admin-text transition-colors group-hover:text-admin-accent-text">
                {branch.name}
              </h3>
              <p className="mt-0.5 font-mono text-xs text-admin-muted">ID: {branch.branch_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={branch.status} />
            <button 
              className="rounded-md bg-admin-raised p-1.5 transition-colors group-hover:bg-admin-accent-soft"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(branch.branch_id);
              }}
            >
              <Eye size={14} className="text-admin-muted group-hover:text-admin-accent-text" />
            </button>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          {branch.contact?.mobile_1 && (
            <div className="flex items-center gap-1.5">
              <Phone size={12} className="text-admin-muted" />
              <span className="text-xs text-admin-text-sub">{branch.contact.mobile_1}</span>
            </div>
          )}
          {branch.address?.city && (
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-admin-muted" />
              <span className="truncate text-xs text-admin-text-sub">{branch.address.city}</span>
            </div>
          )}
          {branch.contact?.email_1 && (
            <div className="col-span-2 flex items-center gap-1.5">
              <Mail size={12} className="shrink-0 text-admin-muted" />
              <span className="truncate text-xs text-admin-text-sub">{branch.contact.email_1}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-admin-border pt-2">
          <div className="flex items-center gap-3 text-xs text-admin-muted">
            {branch.create_date && (
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {new Date(branch.create_date).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-admin-accent-text">
            View Details
            <ChevronRight size={12} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function BranchesTab({ username }) {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/branch/list?username=${username}`, 'GET');
      if (!response.ok) throw new Error('Failed to fetch branches');
      const result = await response.json();
      if (result.success) {
        setBranches(result.data || []);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error("Error fetching branches:", err);
      toast.error(err.message || "Failed to load branches");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (username) {
      fetchBranches();
    }
  }, [username, fetchBranches]);

  const handleViewDetails = (branchId) => {
    navigate(`/branch/${branchId}`);
  };

  const filteredBranches = branches.filter(branch =>
    branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.branch_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.contact?.mobile_1?.includes(searchTerm) ||
    branch.contact?.email_1?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <TableSkeleton columns={4} rows={5} showActions={false} />
    );
  }

  if (branches.length === 0) {
    return (
      <div className="py-12 text-center">
        <Building className="mx-auto mb-3 h-12 w-12 text-admin-muted" />
        <h3 className="text-lg font-medium text-admin-text">No Branches Found</h3>
        <p className="mt-1 text-admin-muted">This user hasn't created any branches yet.</p>
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
          placeholder="Search branches by name, ID, city, mobile, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-input pl-9 pr-8"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={14} className="text-admin-muted hover:text-admin-text" />
          </button>
        )}
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredBranches.map((branch, index) => (
          <BranchCard 
            key={branch.branch_id || index} 
            branch={branch} 
            index={index}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      {/* Results Count */}
      <div className="pt-2 text-center text-xs text-admin-muted">
        Showing {filteredBranches.length} of {branches.length} branches
      </div>

      {filteredBranches.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-admin-muted">No branches match your search.</p>
        </div>
      )}
    </div>
  );
}
