// components/user/ServicesTab.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Briefcase, CheckCircle, XCircle, Clock, Calendar, Search, X, Eye, DollarSign } from "lucide-react";
import { toast } from 'react-toastify';
import apiCall from '../../utils/apiCall';

const ServiceStatusBadge = ({ status }) => {
  const variants = {
    completed: { icon: CheckCircle, text: 'Completed', className: 'bg-green-100 text-green-800' },
    pending: { icon: Clock, text: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
    cancelled: { icon: XCircle, text: 'Cancelled', className: 'bg-red-100 text-red-800' },
    active: { icon: CheckCircle, text: 'Active', className: 'bg-blue-100 text-blue-800' },
  };
  
  const variant = variants[status?.toLowerCase()] || variants.pending;
  const Icon = variant.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${variant.className}`}>
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
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <h3 className="text-lg font-medium text-gray-900">No Services Found</h3>
        <p className="text-gray-500 mt-1">This user hasn't subscribed to any services yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search services..."
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

        {/* Status Filter */}
        <div className="flex gap-2">
          {["all", "active", "pending", "completed", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
            className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase size={18} className="text-blue-500" />
                  <h3 className="font-semibold text-gray-800">{service.service_name}</h3>
                  <ServiceStatusBadge status={service.status} />
                </div>
                
                {service.description && (
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                )}
                
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
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
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                      <DollarSign size={12} />
                      ₹{service.price}
                    </span>
                  )}
                </div>
              </div>
              
              <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Eye size={12} />
                View Details
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No services match your filters.</p>
        </div>
      )}
    </div>
  );
}