import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Package,
  Calendar,
  CheckCircle,
  Eye,
  DollarSign,
  Clock,
  FileText,
  Tag,
  Hash,
  AlertCircle,
  Repeat,
  CalendarDays,
  IndianRupee,
  Layers,
  Info,
  Plus,
  Edit,
  Save,
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
import SelectField from '../components/common/SelectField';

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

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getFrequencyIcon = (frequency) => {
  switch (frequency?.toLowerCase()) {
    case 'monthly':
      return <Calendar size={12} />;
    case 'quarterly':
      return <Layers size={12} />;
    case 'yearly':
      return <CalendarDays size={12} />;
    default:
      return <Clock size={12} />;
  }
};

const getFrequencyLabel = (frequency) => {
  if (!frequency) return 'N/A';
  return frequency.charAt(0).toUpperCase() + frequency.slice(1);
};

const getTypeBadge = (type, isCompliance) => {
  if (isCompliance || type === 'compliance') {
    return { icon: CheckCircle, text: 'Compliance', className: 'bg-blue-100 text-blue-800 border border-blue-200' };
  }
  return { icon: Package, text: 'General', className: 'bg-gray-100 text-gray-800 border border-gray-200' };
};

const TypeBadge = ({ type, compliance }) => {
  const badge = getTypeBadge(type, compliance);
  const Icon = badge.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.className}`}>
      <Icon size={10} /> {badge.text}
    </span>
  );
};

// ─── Service Avatar Component ─────────────────────────────────────────────────

const ServiceAvatar = ({ service, name }) => {
  const getInitials = () => {
    if (!name) return 'S';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold shrink-0 ${
      service.compliance 
        ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
        : 'bg-gradient-to-br from-gray-500 to-gray-600'
    }`}>
      {getInitials()}
    </div>
  );
};

// ─── Info Item Component ─────────────────────────────────────────────────────

const InfoItem = ({ icon: Icon, label, value, highlight = false, className = "" }) => (
  <div className={`flex items-start gap-2 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 px-3 py-2 ${highlight ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''} ${className}`}>
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 border border-gray-200">
      <Icon size={14} className={highlight ? 'text-blue-600' : ''} />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 leading-none mb-1">{label}</div>
      <div className={`text-sm font-medium leading-snug break-words ${highlight ? 'text-blue-700' : 'text-gray-800'}`}>{value || 'N/A'}</div>
    </div>
  </div>
);

// ─── Create/Edit Service Modal ───────────────────────────────────────────────

const ServiceFormModal = ({ service, onClose, onSuccess }) => {
  const isEditing = !!service;
  const [formData, setFormData] = useState({
    name: service?.name || '',
    sac_code: service?.sac_code || '',
    type: service?.type || 'general',
    compliance: service?.compliance || false,
    frequency: service?.frequency || 'monthly',
    default_amount: service?.default_amount || 0,
    remark: service?.remark || '',
    due_day: service?.due_day || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Service name is required';
    if (!formData.sac_code.trim()) newErrors.sac_code = 'SAC code is required';
    if (formData.default_amount < 0) newErrors.default_amount = 'Amount cannot be negative';
    if (formData.due_day && (formData.due_day < 1 || formData.due_day > 31)) {
      newErrors.due_day = 'Due day must be between 1 and 31';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      let response;
      if (isEditing) {
        // Edit service
        const payload = {
          service_id: service.service_id,
          name: formData.name,
          default_amount: parseFloat(formData.default_amount),
          due_day: formData.due_day ? parseInt(formData.due_day) : null,
        };
        response = await apiCall('/service/edit', 'POST', payload);
      } else {
        // Create service
        const payload = {
          name: formData.name,
          sac_code: formData.sac_code,
          type: formData.type,
          compliance: formData.compliance,
          frequency: formData.frequency,
          default_amount: parseFloat(formData.default_amount),
          remark: formData.remark || null,
          due_day: formData.due_day ? parseInt(formData.due_day) : null,
        };
        response = await apiCall('/service/create', 'POST', payload);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(isEditing ? 'Service updated successfully!' : 'Service created successfully!');
        onSuccess();
        onClose();
      } else {
        throw new Error(result.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error(error.message || 'Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <ModalScrollLock />
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden m-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex justify-between items-center p-5 border-b bg-white rounded-t-xl">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            {isEditing ? <Edit size={20} className="text-blue-500" /> : <Plus size={20} className="text-green-500" />}
            {isEditing ? 'Edit Service' : 'Create New Service'}
          </h2>
          <button 
            onClick={onClose} 
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all shadow-sm hover:shadow-md bg-white/50 border border-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Service Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Service Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., GST Filing, Company Registration"
                className={`w-full px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* SAC Code */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                SAC Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sac_code"
                value={formData.sac_code}
                onChange={handleChange}
                placeholder="e.g., 998231"
                disabled={isEditing}
                className={`w-full px-4 py-2 border ${errors.sac_code ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              {errors.sac_code && <p className="text-xs text-red-500 mt-1">{errors.sac_code}</p>}
              {isEditing && <p className="text-xs text-gray-400 mt-1">SAC code cannot be changed after creation</p>}
            </div>

            {/* Service Type & Compliance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Service Type
                </label>
                <SelectField
                  name="type"
                  value={{ value: formData.type, label: formData.type === 'general' ? 'General' : 'Compliance' }}
                  onChange={(selectedOption) => handleChange({ target: { name: 'type', value: selectedOption.value } })}
                  options={[
                    { value: 'general', label: 'General' },
                    { value: 'compliance', label: 'Compliance' }
                  ]}
                  menuPlacement="auto"
                />
              </div>

              <div className="flex items-center gap-3 pt-7">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="compliance"
                    checked={formData.compliance}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">Compliance Service</span>
                </label>
              </div>
            </div>

            {/* Frequency & Due Day */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Frequency
                </label>
                <SelectField
                  name="frequency"
                  value={{ 
                    value: formData.frequency, 
                    label: formData.frequency === 'monthly' ? 'Monthly' : formData.frequency === 'quarterly' ? 'Quarterly' : 'Yearly' 
                  }}
                  onChange={(selectedOption) => handleChange({ target: { name: 'frequency', value: selectedOption.value } })}
                  options={[
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'quarterly', label: 'Quarterly' },
                    { value: 'yearly', label: 'Yearly' }
                  ]}
                  menuPlacement="auto"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Due Day (Optional)
                </label>
                <input
                  type="number"
                  name="due_day"
                  value={formData.due_day}
                  onChange={handleChange}
                  placeholder="1-31"
                  min="1"
                  max="31"
                  className={`w-full px-4 py-2 border ${errors.due_day ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                />
                {errors.due_day && <p className="text-xs text-red-500 mt-1">{errors.due_day}</p>}
              </div>
            </div>

            {/* Default Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Default Amount (₹)
              </label>
              <input
                type="number"
                name="default_amount"
                value={formData.default_amount}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="100"
                className={`w-full px-4 py-2 border ${errors.default_amount ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
              />
              {errors.default_amount && <p className="text-xs text-red-500 mt-1">{errors.default_amount}</p>}
            </div>

            {/* Remark */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Remark (Optional)
              </label>
              <textarea
                name="remark"
                value={formData.remark}
                onChange={handleChange}
                rows="3"
                placeholder="Additional notes about this service..."
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              />
            </div>

            {/* Info Note for Edit Mode */}
            {isEditing && (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Editing Service</p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      You can only edit the service name, default amount, and due day. 
                      Other fields are locked to maintain data integrity.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                {isEditing ? 'Update Service' : 'Create Service'}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── View Service Modal ───────────────────────────────────────────────────────

const ViewServiceModal = ({ service, onClose, onEdit }) => {
  const hasAmount = service.default_amount && service.default_amount > 0;
  const hasDueDay = service.due_day && service.due_day > 0;
  const hasRemark = service.remark && service.remark.trim();

  return (
    <motion.div
      variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <ModalScrollLock />
      <motion.div
        variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden m-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex justify-between items-center p-5 border-b bg-white rounded-t-xl">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <Package className={`text-${service.compliance ? 'blue' : 'gray'}-500`} size={20} /> Service Details
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(service)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-blue-600 transition-all shadow-sm hover:shadow-md bg-white/50 border border-slate-100 hover:bg-blue-50"
            >
              <Edit size={18} />
            </button>
            <button 
              onClick={onClose} 
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all shadow-sm hover:shadow-md bg-white/50 border border-slate-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body - Same as before */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {/* Service Header */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <ServiceAvatar service={service} name={service.name} />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800">{service.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <TypeBadge type={service.type} compliance={service.compliance} />
                <span className="text-xs text-gray-400">ID: {service.service_id}</span>
              </div>
            </div>
          </div>

          {/* Key Information Grid */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Info className="text-blue-500" size={16} /> Key Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <InfoItem 
                icon={Hash} 
                label="Service ID" 
                value={service.service_id} 
              />
              <InfoItem 
                icon={Tag} 
                label="SAC Code" 
                value={service.sac_code || 'N/A'} 
              />
              <InfoItem 
                icon={service.compliance ? CheckCircle : Package} 
                label="Service Type" 
                value={service.compliance ? 'Compliance Service' : 'General Service'} 
              />
              <InfoItem 
                icon={Repeat} 
                label="Frequency" 
                value={getFrequencyLabel(service.frequency)} 
              />
            </div>
          </div>

          {/* Financial Information */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <DollarSign className="text-green-500" size={16} /> Financial Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <InfoItem 
                icon={IndianRupee} 
                label="Default Amount" 
                value={hasAmount ? formatCurrency(service.default_amount) : 'No default amount set'}
                highlight={hasAmount}
              />
              <InfoItem 
                icon={Calendar} 
                label="Due Day" 
                value={hasDueDay ? `Day ${service.due_day} of the ${service.frequency || 'billing'} cycle` : 'No due date specified'}
              />
            </div>
          </div>

          {/* Additional Information */}
          {(hasRemark || service.sac_code) && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="text-purple-500" size={16} /> Additional Information
              </h4>
              <div className="space-y-2.5">
                {hasRemark && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <AlertCircle size={12} /> Remark
                    </p>
                    <p className="text-sm font-medium text-gray-700">{service.remark}</p>
                  </div>
                )}
                {service.sac_code && (
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Tag size={12} /> SAC Code Description
                    </p>
                    <p className="text-sm font-medium text-gray-700">
                      Services Accounting Code (SAC) {service.sac_code} - Used for GST classification
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Compliance Note */}
          {service.compliance && (
            <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Compliance Service</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    This service is marked as a compliance requirement and may have regulatory filing obligations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Service Timeline Info */}
          <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={10} /> Service Configuration
                </p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">
                  {service.frequency ? `${getFrequencyLabel(service.frequency)} service` : 'No frequency set'}
                  {hasDueDay && ` with due date on day ${service.due_day}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Service Type</p>
                <p className="text-sm font-medium text-gray-700 capitalize">{service.type || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 shrink-0">
          <button
            onClick={() => onEdit(service)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Edit size={16} />
            Edit Service
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Service Card Component ───────────────────────────────────────────────────

const ServiceCard = ({ service, index, onView, onEdit }) => {
  const hasRemark = service.remark && service.remark.trim();
  const hasDueDay = service.due_day && service.due_day > 0;
  const hasAmount = service.default_amount && service.default_amount > 0;

  return (
    <ManagementCard
      delay={index * 0.05}
      accent={service.compliance ? "blue" : "gray"}
      eyebrow={`SAC: ${service.sac_code || 'N/A'}`}
      title={service.name}
      subtitle={`Service ID: ${service.service_id?.substring(0, 20)}${service.service_id?.length > 20 ? '...' : ''}`}
      icon={<ServiceAvatar service={service} name={service.name} />}
      badge={<TypeBadge type={service.type} compliance={service.compliance} />}
      onClick={() => onView(service)}
      hoverable
      actions={[
        {
          label: 'View Details',
          icon: <Eye size={12} />,
          onClick: () => onView(service),
          className: `text-${service.compliance ? 'blue' : 'gray'}-600`,
        },
        {
          label: 'Edit Service',
          icon: <Edit size={12} />,
          onClick: () => onEdit(service),
          className: 'text-green-600 hover:text-green-700 hover:bg-green-50',
        },
      ]}
      menuId={`service-card-${service.service_id}`}
      footer={
        <div className="flex items-center justify-between w-full text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Repeat size={10} className="text-purple-400" />
            {getFrequencyLabel(service.frequency)}
          </span>
          {hasAmount && (
            <span className="flex items-center gap-1">
              <IndianRupee size={10} className="text-green-500" />
              {formatCurrency(service.default_amount)}
            </span>
          )}
        </div>
      }
    >
      <div className="space-y-2 mt-1">
        <div className="flex flex-wrap gap-1.5">
          {hasDueDay && (
            <span className="text-[11px] font-semibold bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Calendar size={8} /> Due Day: {service.due_day}
            </span>
          )}
          {service.frequency && (
            <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              {getFrequencyIcon(service.frequency)} {getFrequencyLabel(service.frequency)}
            </span>
          )}
        </div>
        {hasRemark && (
          <p className="text-xs text-gray-500 flex items-start gap-1.5 line-clamp-2">
            <FileText size={10} className="text-gray-400 shrink-0 mt-0.5" />
            <span className="truncate">{service.remark}</span>
          </p>
        )}
      </div>
    </ManagementCard>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ServiceManagement() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");

  // Refs to prevent duplicate API calls
  const fetchInProgress = useRef(false);
  const initialFetchDone = useRef(false);
  const currentRequestId = useRef(0);
  const lastFetchParams = useRef({ page: 1, limit: 20, search: "" });

  const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 20);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch services function with duplicate prevention
  const fetchServices = useCallback(async (page, resetLoading = true) => {
    if (fetchInProgress.current) {
      console.log("Fetch already in progress, skipping...");
      return;
    }

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
    
    const requestId = ++currentRequestId.current;
    
    try {
      const params = new URLSearchParams({ 
        page_no: page.toString(), 
        limit: pagination.limit.toString() 
      });
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      console.log(`Fetching services with params:`, params.toString());
      
      const response = await apiCall(`/service/list?${params.toString()}`, 'GET');
      
      if (requestId !== currentRequestId.current) {
        console.log("Stale request ignored");
        return;
      }
      
      if (!response.ok) throw new Error('Failed to fetch services');

      const result = await response.json();
      
      if (result.success) {
        setServices(result.data || []);
        updatePagination({
          page: result.pagination.page_no,
          limit: result.pagination.limit,
          total: result.pagination.total,
          total_pages: result.pagination.total_pages,
          has_more: result.pagination.has_more,
        });
        setError(null);
        lastFetchParams.current = currentParams;
      } else {
        throw new Error(result.message || 'Failed to fetch services');
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      toast.error(err.message || "Failed to load services.");
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
      fetchServices(1, true);
    }
  }, [fetchServices]);

  // Handle page changes
  useEffect(() => {
    if (initialFetchDone.current && !fetchInProgress.current) {
      console.log("Page/limit/search changed, fetching...");
      fetchServices(pagination.page, true);
    }
  }, [pagination.page, pagination.limit, debouncedSearchTerm, fetchServices]);

  const handleViewService = (service) => {
    setSelectedService(service);
    setModalOpen(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setFormModalOpen(true);
    if (modalOpen) setModalOpen(false);
  };

  const handleCreateService = () => {
    setEditingService(null);
    setFormModalOpen(true);
  };

  const handleFormSuccess = () => {
    // Refresh the services list
    fetchServices(pagination.page, true);
  };

  const handlePageChange = useCallback((newPage) => {
    if (newPage !== pagination.page && !fetchInProgress.current) {
      goToPage(newPage);
    }
  }, [pagination.page, goToPage]);

  const handleLimitChange = useCallback((newLimit) => {
    if (newLimit !== pagination.limit && !fetchInProgress.current) {
      changeLimit(newLimit);
      if (pagination.page !== 1) {
        goToPage(1);
      }
    }
  }, [pagination.limit, pagination.page, changeLimit, goToPage]);

  const handleRefresh = useCallback(() => {
    if (!fetchInProgress.current) {
      if (pagination.page !== 1) {
        goToPage(1);
      } else {
        fetchServices(1, true);
      }
    }
  }, [fetchServices, pagination.page, goToPage]);

  // Table columns config
  const tableColumns = useMemo(() => [
    {
      key: 'service',
      label: 'Service',
      render: (service) => (
        <div className="flex items-center gap-3">
          <ServiceAvatar service={service} name={service.name} />
          <div>
            <p className="font-semibold text-gray-800 text-sm">{service.name}</p>
            <p className="text-xs text-gray-500 font-mono">
              {service.service_id?.substring(0, 16)}...
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'sac_code',
      label: 'SAC Code',
      render: (service) => (
        <span className="text-sm font-mono text-gray-600">{service.sac_code || 'N/A'}</span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (service) => <TypeBadge type={service.type} compliance={service.compliance} />,
    },
    {
      key: 'frequency',
      label: 'Frequency',
      render: (service) => (
        <div className="flex items-center gap-1.5">
          {getFrequencyIcon(service.frequency)}
          <span className="text-sm text-gray-700 capitalize">{service.frequency || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Default Amount',
      render: (service) => (
        <div className="flex items-center gap-1">
          <IndianRupee size={12} className="text-gray-400" />
          <span className={`text-sm font-semibold ${service.default_amount > 0 ? 'text-green-600' : 'text-gray-500'}`}>
            {formatCurrency(service.default_amount)}
          </span>
        </div>
      ),
    },
    {
      key: 'due_day',
      label: 'Due Day',
      render: (service) => (
        service.due_day ? (
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-orange-400" />
            <span className="text-sm text-gray-700">Day {service.due_day}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Not set</span>
        )
      ),
    },
  ], []);

  // Show loading skeleton only on initial load
  if (loading && services.length === 0) {
    return <Skeleton />;
  }

  return (
    <>
      <ManagementHub
        eyebrow={<><Package size={11} /> Services</>}
        title="Service Management"
        description="View and manage all available services, their pricing, and compliance requirements."
        accent={services.some(s => s.compliance) ? "blue" : "gray"}
        onRefresh={handleRefresh}
        actions={
          <button
            type="button"
            onClick={handleCreateService}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
          >
            <Plus size={18} />
            New Service
          </button>
        }
      >
        <div className="space-y-6 p-2 lg:p-0">

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
                  placeholder="Search by service name, service ID, SAC code, or remark..."
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
            </div>

            <div className="flex w-full lg:w-auto justify-end">
              <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
            </div>
          </motion.div>

          {/* Loading indicator for subsequent loads */}
          {loading && services.length > 0 && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white rounded-xl shadow-xl">
              <X className="text-6xl text-red-400 mx-auto mb-4" size={48} />
              <p className="text-xl text-gray-600">Error loading services</p>
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
          {!loading && !error && services.length === 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white rounded-xl shadow-xl">
              <Package className="text-8xl text-gray-300 mx-auto mb-4" size={64} />
              <p className="text-xl text-gray-500">No services found</p>
              <p className="text-gray-400 mt-2">{searchTerm ? 'Try adjusting your search' : 'No services available yet'}</p>
              <button
                onClick={handleCreateService}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Create your first service
              </button>
            </motion.div>
          )}

          {/* Content */}
          {!loading && !error && services.length > 0 && (
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
                    rows={services}
                    columns={tableColumns}
                    rowKey={(row) => row.service_id}
                    onRowClick={(row) => handleViewService(row)}
                    getActions={(service) => [
                      {
                        label: 'View Details',
                        icon: <Eye size={12} />,
                        onClick: () => handleViewService(service),
                        className: `text-${service.compliance ? 'blue' : 'gray'}-600`,
                      },
                      {
                        label: 'Edit',
                        icon: <Edit size={12} />,
                        onClick: () => handleEditService(service),
                        className: 'text-green-600 hover:text-green-700 hover:bg-green-50',
                      },
                    ]}
                    accent="blue"
                  />
                )}

                {/* Card View */}
                {viewMode === 'card' && (
                  <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
                    <AnimatePresence>
                      {services.map((service, index) => (
                        <ServiceCard
                          key={service.service_id}
                          service={service}
                          index={index}
                          onView={handleViewService}
                          onEdit={handleEditService}
                        />
                      ))}
                    </AnimatePresence>
                  </ManagementGrid>
                )}
              </motion.div>

              {/* Pagination */}
              {(services.length > 0 || pagination.total > 0) && (
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
      </ManagementHub>

      {/* View Service Modal */}
      <AnimatePresence>
        {modalOpen && selectedService && (
          <ViewServiceModal
            service={selectedService}
            onClose={() => {
              setModalOpen(false);
              setSelectedService(null);
            }}
            onEdit={handleEditService}
          />
        )}
      </AnimatePresence>

      {/* Create/Edit Service Modal */}
      <AnimatePresence>
        {formModalOpen && (
          <ServiceFormModal
            service={editingService}
            onClose={() => {
              setFormModalOpen(false);
              setEditingService(null);
            }}
            onSuccess={handleFormSuccess}
          />
        )}
      </AnimatePresence>
    </>
  );
}
