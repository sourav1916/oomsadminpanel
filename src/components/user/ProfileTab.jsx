// components/user/ProfileTab.jsx
import React from "react";
import {
  User,
  Phone,
  MapPin,
  Building,
} from "lucide-react";

const InfoSection = ({ title, icon: Icon, children }) => (
  <div className="mb-6">
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-admin-text">
      <Icon size={16} className="text-admin-accent-text" />
      {title}
    </h3>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {children}
    </div>
  </div>
);

const InfoField = ({ label, value }) => (
  <div className="rounded-md border border-admin-border bg-admin-raised p-3">
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-admin-muted">{label}</p>
    <p className="break-words text-sm font-medium text-admin-text">{value || "N/A"}</p>
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
