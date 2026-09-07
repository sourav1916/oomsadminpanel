import { Shield, User, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const username = user?.username || localStorage.getItem('username') || '—';
  const mobile = user?.mobile || '—';

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Account</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Admin profile</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Session identity for the platform control panel.</p>
      </div>

      <div className="max-w-xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-900 text-lg font-bold text-sky-300">
            {String(username).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{username}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">Platform administrator</p>
          </div>
        </div>
        <dl className="divide-y divide-slate-100 dark:divide-slate-800">
          <div className="flex items-start gap-3 px-5 py-3.5">
            <User className="mt-0.5 h-4 w-4 text-slate-400" />
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Username</dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">{username}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3 px-5 py-3.5">
            <Smartphone className="mt-0.5 h-4 w-4 text-slate-400" />
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Mobile</dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">{mobile}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3 px-5 py-3.5">
            <Shield className="mt-0.5 h-4 w-4 text-slate-400" />
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Role</dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">Administrator</dd>
            </div>
          </div>
        </dl>
      </div>
    </div>
  );
}
