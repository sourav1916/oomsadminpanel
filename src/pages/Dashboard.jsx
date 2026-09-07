import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  ConciergeBell,
  Mail,
  ArrowRight,
  RefreshCw,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import apiCall from '../utils/apiCall';
import { useAuth } from '../contexts/AuthContext';
import { DashboardSkeleton } from '../components/SkeletonComponent';

const formatDate = (date) => {
  if (!date) return '—';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const StatCard = ({ icon: Icon, label, value, hint, to, tone = 'sky' }) => {
  const tones = {
    sky: 'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-900',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-900',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-900',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-900',
  };

  return (
    <Link
      to={to}
      className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-md ring-1 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 group-hover:text-sky-700 dark:group-hover:text-sky-300">
        Open <ArrowRight className="h-3 w-3" />
      </p>
    </Link>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    users: 0,
    branches: 0,
    activeBranches: 0,
    services: 0,
    mailConfigs: 0,
    activeMail: null,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentBranches, setRecentBranches] = useState([]);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    try {
      const [usersRes, branchesRes, servicesRes, mailRes] = await Promise.all([
        apiCall('/user/list?page_no=1&limit=6', 'GET'),
        apiCall('/branch/list?page_no=1&limit=6', 'GET'),
        apiCall('/service/list?page_no=1&limit=1', 'GET'),
        apiCall('/mail/config/list?page_no=1&limit=50', 'GET'),
      ]);

      const [usersJson, branchesJson, servicesJson, mailJson] = await Promise.all([
        usersRes.json().catch(() => ({})),
        branchesRes.json().catch(() => ({})),
        servicesRes.json().catch(() => ({})),
        mailRes.json().catch(() => ({})),
      ]);

      const users = Array.isArray(usersJson.data) ? usersJson.data : [];
      const branches = Array.isArray(branchesJson.data) ? branchesJson.data : [];
      const mailRows = Array.isArray(mailJson.data) ? mailJson.data : [];
      const activeMail = mailRows.find((row) => String(row.status).toLowerCase() === 'active') || null;

      setRecentUsers(users);
      setRecentBranches(branches);
      setStats({
        users: Number(usersJson.pagination?.total ?? users.length) || 0,
        branches: Number(branchesJson.pagination?.total ?? branches.length) || 0,
        activeBranches: branches.filter((b) => b.status).length,
        services: Number(servicesJson.pagination?.total ?? 0) || 0,
        mailConfigs: mailRows.length,
        activeMail,
      });
    } catch (error) {
      console.error('Dashboard load failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const greetingName = user?.username || localStorage.getItem('username') || 'Admin';
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const mailHint = stats.activeMail
    ? `Active: ${stats.activeMail.config_name || stats.activeMail.host}`
    : stats.mailConfigs
      ? 'No active SMTP config'
      : 'Not configured';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Overview</p>
          <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
            Control panel
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Signed in as <span className="font-semibold text-slate-700 dark:text-slate-200">{greetingName}</span>
            <span className="mx-1.5 text-slate-300">·</span>
            {today}
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Users}
              label="Users"
              value={stats.users.toLocaleString('en-IN')}
              hint="Registered platform accounts"
              to="/users"
              tone="sky"
            />
            <StatCard
              icon={Building2}
              label="Branches"
              value={stats.branches.toLocaleString('en-IN')}
              hint={`${stats.activeBranches} active in latest page`}
              to="/branches"
              tone="emerald"
            />
            <StatCard
              icon={ConciergeBell}
              label="Services"
              value={stats.services.toLocaleString('en-IN')}
              hint="Catalog items available to branches"
              to="/services"
              tone="violet"
            />
            <StatCard
              icon={Mail}
              label="Company mail"
              value={stats.activeMail ? 'Active' : 'Inactive'}
              hint={mailHint}
              to="/settings/mail"
              tone="amber"
            />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Quick actions</h2>
          </div>
          <div className="space-y-1.5">
            {[
              { to: '/users', label: 'Manage users', desc: 'Accounts, status, and branches', icon: Users },
              { to: '/branches', label: 'Review branches', desc: 'Tenants, plans, and contacts', icon: Building2 },
              { to: '/services', label: 'Service catalog', desc: 'General and compliance services', icon: ConciergeBell },
              { to: '/settings/mail', label: 'SMTP configuration', desc: 'Company outbound email', icon: Mail },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => navigate(item.to)}
                  className="flex w-full items-center gap-3 rounded-md border border-transparent px-2.5 py-2 text-left transition-colors hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.label}</p>
                    <p className="truncate text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">System status</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-xs font-bold uppercase tracking-wide">Panel</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Online</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Admin console is reachable</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <div className={`flex items-center gap-1.5 ${stats.activeMail ? 'text-emerald-700' : 'text-amber-700'}`}>
                {stats.activeMail ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <p className="text-xs font-bold uppercase tracking-wide">SMTP</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                {stats.activeMail ? 'Configured' : 'Needs setup'}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{mailHint}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Clock className="h-4 w-4" />
                <p className="text-xs font-bold uppercase tracking-wide">Directory</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                {stats.users} users · {stats.branches} branches
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stats.services} services in catalog</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Recent users</h2>
            <Link to="/users" className="text-xs font-semibold text-sky-700 hover:underline dark:text-sky-400">View all</Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">No users found</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-semibold">User</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentUsers.map((row) => (
                  <tr
                    key={row.username}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70"
                    onClick={() => navigate(`/user/profile/${encodeURIComponent(row.username)}`)}
                  >
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{row.profile?.name || row.username}</p>
                      <p className="text-xs text-slate-500">{row.username}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        row.status
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                      }`}>
                        {row.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{formatDate(row.create_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Recent branches</h2>
            <Link to="/branches" className="text-xs font-semibold text-sky-700 hover:underline dark:text-sky-400">View all</Link>
          </div>
          {recentBranches.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">No branches found</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-semibold">Branch</th>
                  <th className="px-4 py-2 font-semibold">Owner</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentBranches.map((row) => (
                  <tr
                    key={row.branch_id}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70"
                    onClick={() => navigate(`/branch/${encodeURIComponent(row.branch_id)}`)}
                  >
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{row.name || row.branch_id}</p>
                      <p className="text-xs text-slate-500">{row.address?.city || row.branch_id}</p>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{row.owner?.name || row.owner?.username || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        row.status
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                      }`}>
                        {row.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
