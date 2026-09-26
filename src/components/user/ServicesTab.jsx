// components/user/ServicesTab.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Briefcase, CheckCircle, XCircle, Clock, Calendar, Search, X, Eye, DollarSign } from "lucide-react";
import { toast } from 'react-toastify';
import apiCall from '../../utils/apiCall';
import { TableSkeleton } from "../SkeletonComponent";

const ServiceStatusBadge = ({ status }) => {
  const variants = {
    completed: { icon: CheckCircle, text: 'Completed', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
    pending: { icon: Clock, text: 'Pending', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
    cancelled: { icon: XCircle, text: 'Cancelled', className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
    active: { icon: CheckCircle, text: 'Active', className: 'bg-admin-accent-soft text-admin-accent-text' },
  };
  
  const variant = variants[status?.toLowerCase()] || variants.pending;
  const Icon = variant.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${variant.className}`}>
      <Icon size={10} /> {variant.text}
    </span>
  );
};

export default function ServicesTab({ username }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/user/${username}/services`, 'GET');
      if (!response.ok) throw new Error('Failed to fetch services');
      const result = await response.json();
      if (result.success) {
        setServices(result.data || []);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error("Error fetching services:", err);
      toast.error(err.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || service.status?.toLowerCase() === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <TableSkeleton columns={4} rows={5} showActions={false} />
    );
  }

  if (services.length === 0) {
    return (
      <div className="py-12 text-center">
        <Briefcase className="mx-auto mb-3 h-12 w-12 text-admin-muted" />
        <h3 className="text-lg font-medium text-admin-text">No Services Found</h3>
        <p className="mt-1 text-admin-muted">This user hasn't subscribed to any services yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" size={16} />
          <input
            type="text"
            placeholder="Search services..."
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

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          {["all", "active", "pending", "completed", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filter === status
                  ? "bg-teal-600 text-white"
                  : "bg-admin-raised text-admin-text-sub hover:bg-admin-accent-soft hover:text-admin-accent-text"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredServices.map((service, index) => (
          <motion.div
            key={service.service_id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="admin-panel p-4"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Briefcase size={18} className="text-admin-accent-text" />
                  <h3 className="font-semibold text-admin-text">{service.service_name}</h3>
                  <ServiceStatusBadge status={service.status} />
                </div>
                
                {service.description && (
                  <p className="mb-3 text-sm text-admin-text-sub">{service.description}</p>
                )}
                
                <div className="flex flex-wrap gap-3 text-xs text-admin-muted">
                  {service.start_date && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      Started: {new Date(service.start_date).toLocaleDateString()}
                    </span>
                  )}
                  {service.end_date && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      Ends: {new Date(service.end_date).toLocaleDateString()}
                    </span>
                  )}
                  {service.price && (
                    <span className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300">
                      <DollarSign size={12} />
                      ₹{service.price}
                    </span>
                  )}
                </div>
              </div>
              
              <button className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold text-admin-accent-text transition-colors hover:bg-admin-accent-soft">
                <Eye size={12} />
                View Details
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-admin-muted">No services match your filters.</p>
        </div>
      )}
    </div>
  );
}
