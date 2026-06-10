// components/user/ProfileTab.jsx
import React from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  IdCard,
  Calendar,
  Globe,
  Building,
  CreditCard,
} from "lucide-react";

const InfoSection = ({ title, icon: Icon, children }) => (
  <div className="mb-6">
    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
      <Icon size={16} className="text-blue-500" />
      {title}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {children}
    </div>
  </div>
);

const InfoField = ({ label, value }) => (
  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-sm font-medium text-gray-800 break-words">{value || "N/A"}</p>
  </div>
);

export default function ProfileTab({ user, profile }) {
  const address = profile?.address || {};

  return (
    <div className="space-y-3">
      {/* Personal Information */}
      <InfoSection title="Personal Information" icon={User}>
        <InfoField label="Full Name" value={profile?.name} />
        <InfoField label="User Type" value={profile?.user_type || "User"} />
        <InfoField label="Gender" value={profile?.gender || "Not specified"} />
        <InfoField label="Date of Birth" value={profile?.date_of_birth || "Not specified"} />
        <InfoField label="Care Of" value={profile?.care_of || "N/A"} />
        <InfoField label="Guardian Name" value={profile?.guardian_name || "N/A"} />
      </InfoSection>

      {/* Contact Information */}
      <InfoSection title="Contact Information" icon={Phone}>
        <InfoField label="Mobile Number" value={profile?.mobile ? `+${profile.country_code || '91'} ${profile.mobile}` : "N/A"} />
        <InfoField label="Email Address" value={profile?.email || user?.login_id} />
        <InfoField label="Country Code" value={profile?.country_code || "91"} />
      </InfoSection>

      {/* Address Information */}
      {Object.values(address).some(val => val) && (
        <InfoSection title="Address Information" icon={MapPin}>
          <InfoField label="Address Line 1" value={address?.address_line_1} />
          <InfoField label="Address Line 2" value={address?.address_line_2} />
          <InfoField label="City" value={address?.city} />
          <InfoField label="District" value={address?.district} />
          <InfoField label="State" value={address?.state} />
          <InfoField label="Country" value={address?.country} />
          <InfoField label="Pincode" value={address?.pincode} />
          <InfoField label="Village/Town" value={address?.village_town} />
        </InfoSection>
      )}

      {/* Account Information */}
      <InfoSection title="Account Information" icon={Building}>
        <InfoField label="Username" value={user?.username} />
        <InfoField label="Login ID" value={user?.login_id} />
        <InfoField label="PAN Number" value={profile?.pan_number || "Not provided"} />
        <InfoField label="Remark" value={user?.remark || "N/A"} />
        <InfoField label="Created By" value={user?.create_by} />
        <InfoField label="Registration Date" value={user?.create_date ? new Date(user.create_date).toLocaleString() : "N/A"} />
      </InfoSection>
    </div>
  );
}