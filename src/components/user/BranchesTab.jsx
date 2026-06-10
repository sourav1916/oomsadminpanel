// components/user/BranchesTab.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Building, MapPin, Phone, Mail, Calendar, CheckCircle, Ban, 
  Search, X, IdCard, User, ChevronRight, Eye 
} from "lucide-react";
import { toast } from 'react-toastify';
import apiCall from '../../utils/apiCall';

const StatusBadge = ({ status }) => {
  if (status) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
        <CheckCircle size={10} /> Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
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
      className="border border-gray-200 rounded-xl hover:shadow-md transition-all bg-white overflow-hidden group cursor-pointer"
      onClick={() => onViewDetails(branch.branch_id)}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 flex-1">
            <Building size={18} className="text-purple-600 shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                {branch.name}
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {branch.branch_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={branch.status} />
            <button 
              className="p-1.5 rounded-lg bg-gray-50 group-hover:bg-purple-50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(branch.branch_id);
              }}
            >
              <Eye size={14} className="text-gray-500 group-hover:text-purple-600" />
            </button>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {branch.contact?.mobile_1 && (
            <div className="flex items-center gap-1.5">
              <Phone size={12} className="text-gray-400" />
              <span className="text-xs text-gray-600">{branch.contact.mobile_1}</span>
            </div>
          )}
          {branch.address?.city && (
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-gray-400" />
              <span className="text-xs text-gray-600 truncate">{branch.address.city}</span>
            </div>
          )}
          {branch.contact?.email_1 && (
            <div className="flex items-center gap-1.5 col-span-2">
              <Mail size={12} className="text-gray-400 shrink-0" />
              <span className="text-xs text-gray-600 truncate">{branch.contact.email_1}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {branch.create_date && (
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {new Date(branch.create_date).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-purple-600 font-medium">
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
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <h3 className="text-lg font-medium text-gray-900">No Branches Found</h3>
        <p className="text-gray-500 mt-1">This user hasn't created any branches yet.</p>
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
          placeholder="Search branches by name, ID, city, mobile, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={14} className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
      <div className="text-center text-xs text-gray-400 pt-2">
        Showing {filteredBranches.length} of {branches.length} branches
      </div>

      {filteredBranches.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No branches match your search.</p>
        </div>
      )}
    </div>
  );
}