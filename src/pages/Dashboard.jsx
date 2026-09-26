import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  ConciergeBell,
  Mail,
  ArrowRight,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import apiCall from '../utils/apiCall';
import { useAuth } from '../contexts/AuthContext';
import { DashboardSkeleton } from '../components/SkeletonComponent';
import RefreshButton from '../components/common/RefreshButton';
import { StatusBadge } from '../components/common/Panel';

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

const StatCard = ({ icon: Icon, label, value, hint, to, tone = 'teal' }) => {
  const tones = {
    teal: 'bg-admin-accent-soft text-admin-accent-text',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    slate: 'bg-admin-raised text-admin-muted',
  };

  return (
    <Link
      to={to}
      className="group admin-panel p-4 transition-colors hover:border-teal-300/60 dark:hover:border-teal-800"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-admin-muted">{label}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-admin-text">{value}</p>
          {hint && <p className="mt-1 text-xs text-admin-muted">{hint}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tones[tone] || tones.teal}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-admin-muted group-hover:text-admin-accent-text">
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
        apiCall('/user/list?page_no=1&limit=6&user_type=user', 'GET'),
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-admin-muted">Overview</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-admin-text sm:text-2xl">
            Control panel
          </h1>
          <p className="mt-1 text-sm text-admin-text-sub">
            Signed in as <span className="font-semibold text-admin-text">{greetingName}</span>
            <span className="mx-1.5 text-admin-muted">·</span>
            {today}
          </p>
        </div>
        <RefreshButton
          onClick={() => load(true)}
          loading={loading || refreshing}
        />
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Users}
              label="Clients"
              value={stats.users.toLocaleString('en-IN')}
              hint="Registered client accounts"
              to="/users"
              tone="teal"
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
              tone="slate"
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
            <div className="admin-panel p-4 lg:col-span-1">
              <div className="mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-admin-muted" />
                <h2 className="text-sm font-bold text-admin-text">Quick actions</h2>
              </div>
              <div className="space-y-1.5">
                {[
                  { to: '/users', label: 'Manage clients', desc: 'Accounts, status, and branches', icon: Users },
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
                      className="flex w-full items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 text-left transition-colors hover:border-admin-border hover:bg-admin-raised"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-admin-accent-soft text-admin-accent-text">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-admin-text">{item.label}</p>
                        <p className="truncate text-xs text-admin-muted">{item.desc}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-admin-muted" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="admin-panel p-4 lg:col-span-2">
              <div className="mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-admin-muted" />
                <h2 className="text-sm font-bold text-admin-text">System status</h2>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-admin-border bg-admin-raised px-3 py-3">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-xs font-bold uppercase tracking-wide">Panel</p>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-admin-text">Online</p>
                  <p className="text-xs text-admin-muted">Admin console is reachable</p>
                </div>
                <div className="rounded-lg border border-admin-border bg-admin-raised px-3 py-3">
                  <div className={`flex items-center gap-1.5 ${stats.activeMail ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                    {stats.activeMail ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    <p className="text-xs font-bold uppercase tracking-wide">SMTP</p>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-admin-text">
                    {stats.activeMail ? 'Configured' : 'Needs setup'}
                  </p>
                  <p className="truncate text-xs text-admin-muted">{mailHint}</p>
                </div>
                <div className="rounded-lg border border-admin-border bg-admin-raised px-3 py-3">
                  <div className="flex items-center gap-1.5 text-admin-text-sub">
                    <Clock className="h-4 w-4" />
                    <p className="text-xs font-bold uppercase tracking-wide">Directory</p>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-admin-text">
                    {stats.users} clients · {stats.branches} branches
                  </p>
                  <p className="text-xs text-admin-muted">{stats.services} services in catalog</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <div className="admin-panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-admin-border px-4 py-3">
                <h2 className="text-sm font-bold text-admin-text">Recent clients</h2>
                <Link to="/users" className="text-xs font-semibold text-admin-accent-text hover:underline">View all</Link>
              </div>
              {recentUsers.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-admin-muted">No clients found</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-admin-raised text-left text-[11px] uppercase tracking-wider text-admin-muted">
                    <tr>
                      <th className="px-4 py-2 font-semibold w-12">S.No</th>
                      <th className="px-4 py-2 font-semibold">Client</th>
                      <th className="px-4 py-2 font-semibold">Status</th>
                      <th className="px-4 py-2 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border">
                    {recentUsers.map((row, index) => (
                      <tr
                        key={row.username}
                        className="cursor-pointer hover:bg-admin-raised"
                        onClick={() => navigate(`/user/profile/${encodeURIComponent(row.username)}`)}
                      >
                        <td className="px-4 py-2.5 tabular-nums text-admin-muted">{index + 1}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            {row.profile?.image ? (
                              <img
                                src={row.profile.image}
                                alt=""
                                className="h-8 w-8 rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-600 text-xs font-bold text-white">
                                {(row.profile?.name || row.username || '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-admin-text">{row.profile?.name || row.username}</p>
                              <p className="text-xs text-admin-muted">{row.login_id || row.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge tone={row.status ? 'success' : 'danger'}>
                            {row.status ? 'Active' : 'Inactive'}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-2.5 text-admin-text-sub">{formatDate(row.create_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="admin-panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-admin-border px-4 py-3">
                <h2 className="text-sm font-bold text-admin-text">Recent branches</h2>
                <Link to="/branches" className="text-xs font-semibold text-admin-accent-text hover:underline">View all</Link>
              </div>
              {recentBranches.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-admin-muted">No branches found</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-admin-raised text-left text-[11px] uppercase tracking-wider text-admin-muted">
                    <tr>
                      <th className="px-4 py-2 font-semibold w-12">S.No</th>
                      <th className="px-4 py-2 font-semibold">Branch</th>
                      <th className="px-4 py-2 font-semibold">Owner</th>
                      <th className="px-4 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border">
                    {recentBranches.map((row, index) => (
                      <tr
                        key={row.branch_id}
                        className="cursor-pointer hover:bg-admin-raised"
                        onClick={() => navigate(`/branch/${encodeURIComponent(row.branch_id)}`)}
                      >
                        <td className="px-4 py-2.5 tabular-nums text-admin-muted">{index + 1}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-admin-text">{row.name || row.branch_id}</p>
                          <p className="text-xs text-admin-muted">{row.address?.city || row.branch_id}</p>
                        </td>
                        <td className="px-4 py-2.5 text-admin-text-sub">{row.owner?.name || row.owner?.username || '—'}</td>
                        <td className="px-4 py-2.5">
                          <StatusBadge tone={row.status ? 'success' : 'danger'}>
                            {row.status ? 'Active' : 'Inactive'}
                          </StatusBadge>
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
