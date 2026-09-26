import { Shield, User, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const username = user?.username || localStorage.getItem('username') || '—';
  const mobile = user?.mobile || '—';

  return (
    <div className="space-y-5">
      <div className="border-b border-admin-border pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-admin-accent-text">
          Account
        </p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-admin-text md:text-2xl">
          Admin profile
        </h1>
        <p className="mt-1 text-sm text-admin-text-sub">
          Session identity for the platform control panel.
        </p>
      </div>

      <div className="admin-panel max-w-xl overflow-hidden">
        <div className="flex items-center gap-3 border-b border-admin-border bg-admin-raised px-5 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-admin-accent-soft text-lg font-bold text-admin-accent-text">
            {String(username).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-admin-text">{username}</p>
            <p className="text-xs uppercase tracking-wide text-admin-muted">
              Platform administrator
            </p>
          </div>
        </div>
        <dl className="divide-y divide-admin-border">
          <div className="flex items-start gap-3 px-5 py-3.5">
            <User className="mt-0.5 h-4 w-4 text-admin-muted" />
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-admin-muted">
                Username
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-admin-text">{username}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3 px-5 py-3.5">
            <Smartphone className="mt-0.5 h-4 w-4 text-admin-muted" />
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-admin-muted">
                Mobile
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-admin-text">{mobile}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3 px-5 py-3.5">
            <Shield className="mt-0.5 h-4 w-4 text-admin-muted" />
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-admin-muted">
                Role
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-admin-text">Administrator</dd>
            </div>
          </div>
        </dl>
      </div>
    </div>
  );
}
