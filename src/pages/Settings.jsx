import { Link } from 'react-router-dom';
import { Mail, MessageSquareText, MessageSquare, Smartphone, Phone, CreditCard, Landmark, LifeBuoy, Globe, Scale, User, ArrowRight, Shield } from 'lucide-react';

const SETTINGS_ITEMS = [
  {
    to: '/settings/mail',
    icon: Mail,
    title: 'Company Mail',
    description: 'SMTP host, sender identity, and the active outbound mail config used for OTP and notifications.',
  },
  {
    to: '/settings/wp-system-templates',
    icon: MessageSquareText,
    title: 'System WhatsApp Templates',
    description: 'Manage global OOMS System WhatsApp template content for all notification types.',
  },
  {
    to: '/settings/sms-system-config',
    icon: Smartphone,
    title: 'System SMS Config',
    description: 'Platform Fast2SMS credentials for the OOMS System SMS channel (separate from OTP).',
  },
  {
    to: '/settings/sms-system-templates',
    icon: MessageSquare,
    title: 'System SMS Templates',
    description: 'Manage global OOMS System SMS / DLT templates by notification type.',
  },
  {
    to: '/settings/call-system-config',
    icon: Phone,
    title: 'System Call Config',
    description: 'Platform PBX API URL for the OOMS System Call channel (branch tokens are per office).',
  },
  {
    to: '/settings/razorpay',
    icon: CreditCard,
    title: 'Razorpay Payment Gateway',
    description: 'API keys, webhook secret, and wallet gateway charges for Razorpay top-ups.',
  },
  {
    to: '/settings/wallet-payments',
    icon: Landmark,
    title: 'Wallet Payments',
    description: 'Bank accounts for manual transfers and approve/reject payment requests (no gateway fee).',
  },
  {
    to: '/settings/help-support',
    icon: LifeBuoy,
    title: 'Help & Support',
    description: 'Contact email, phone, WhatsApp, hours, and address shown on the CLIENT Help page.',
  },
  {
    to: '/settings/website-contact',
    icon: Globe,
    title: 'Website Contact',
    description: 'Public emails, phones, WhatsApp, addresses, and hours for the OOMS marketing website.',
  },
  {
    to: '/settings/website-legal',
    icon: Scale,
    title: 'Website Legal Pages',
    description: 'Privacy policy, terms of service, refunds, and other legal pages for ooms.in.',
  },
  {
    to: '/profile',
    icon: User,
    title: 'Admin profile',
    description: 'Signed-in administrator account details for this control panel session.',
  },
];

export default function Settings() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-admin-muted">Configuration</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-admin-text">Settings</h1>
        <p className="mt-1 text-sm text-admin-text-sub">
          Platform-level options. Only pages that exist are listed here.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {SETTINGS_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="group admin-panel p-5 transition-colors hover:border-teal-300/60 dark:hover:border-teal-800"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-admin-accent-soft text-admin-accent-text">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold text-admin-text">{item.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-admin-text-sub">{item.description}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-admin-accent-text">
                    Open <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="flex items-start gap-3 admin-panel px-4 py-3 text-sm text-admin-text-sub">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-admin-muted" />
        <p>
          Reports and other console modules will appear here when they are implemented. Dead sidebar links have been removed so you only navigate to working pages.
        </p>
      </div>
    </div>
  );
}
