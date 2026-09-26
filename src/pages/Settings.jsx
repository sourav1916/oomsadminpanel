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
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Configuration</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
              className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-sky-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{item.description}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
                    Open <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p>
          Reports and other console modules will appear here when they are implemented. Dead sidebar links have been removed so you only navigate to working pages.
        </p>
      </div>
    </div>
  );
}
