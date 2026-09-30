import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  ConciergeBell,
  Mail,
  Activity,
  Landmark,
  LogIn,
  UserX,
  Search,
  X,
} from 'lucide-react';
import apiCall from '../utils/apiCall';
import { useAuth } from '../contexts/AuthContext';
import { ActivityTableSkeleton, DashboardSkeleton } from '../components/SkeletonComponent';
import RefreshButton from '../components/common/RefreshButton';
import TablePagination from '../components/common/TablePagination';
import { StatusBadge } from '../components/common/Panel';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'ended', label: 'Ended' },
];

const PANEL_LABELS = {
  user: 'Client',
  platform_admin: 'Admin',
  ca: 'CA',
  agent: 'Agent',
  end_client: 'End client',
};

const formatDateTime = (date) => {
  if (!date) return '—';
  const normalized = String(date).includes('T') ? String(date) : String(date).replace(' ', 'T');
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatMoney = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const panelLabel = (type) => {
  const key = String(type || '').toLowerCase();
  if (!key) return '—';
  return PANEL_LABELS[key] || key.replace(/_/g, ' ');
};

const displayMobile = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '—';
  return digits.length > 10 ? digits.slice(-10) : digits;
};

const emptyStats = {
  clients: { total: 0, active: 0 },
  branches: { total: 0, active: 0 },
  services: { total: 0 },
  payments: { pending_count: 0, pending_amount: 0 },
  deletions: { pending: 0 },
  logins: { today: 0, last_7_days: 0, active_sessions: 0 },
  mail: { configs: 0, active: null },
};

const StatCard = ({ icon: Icon, label, value, hint, to, tone = 'teal' }) => {
  const tones = {
    teal: 'bg-admin-accent-soft text-admin-accent-text',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    slate: 'bg-admin-raised text-admin-muted',
  };

  const className = 'group admin-panel px-3 py-2 transition-colors hover:border-teal-300/60 dark:hover:border-teal-800';
  const body = (
    <div className="flex items-center gap-2">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${tones[tone] || tones.teal}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-admin-muted">{label}</p>
        <p className="truncate text-base font-bold leading-tight tabular-nums tracking-tight text-admin-text">{value}</p>
        {hint && <p className="truncate text-[11px] leading-tight text-admin-muted">{hint}</p>}
      </div>
    </div>
  );

  if (!to) return <div className={className}>{body}</div>;
  return (
    <Link to={to} className={className}>
      {body}
    </Link>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(emptyStats);

  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadStats = useCallback(async () => {
    const response = await apiCall('/dashboard', 'GET');
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || 'Failed to load dashboard');
    }
    setStats({ ...emptyStats, ...(payload.data?.stats || {}) });
  }, []);

  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const params = new URLSearchParams({
        status,
        search: query,
        page_no: String(page),
        limit: String(limit),
      });
      const response = await apiCall(`/dashboard/login-activity?${params}`, 'GET');
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || 'Failed to load login activity');
      }
      setActivity(Array.isArray(payload.data) ? payload.data : []);
      setTotal(payload.pagination?.total || 0);
      setTotalPages(payload.pagination?.total_pages || 1);
    } catch (error) {
      console.error('Login activity load failed:', error);
      setActivity([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setActivityLoading(false);
    }
  }, [status, query, page, limit]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadStats();
      } catch (error) {
        console.error('Dashboard load failed:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadStats]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadStats(), loadActivity()]);
    } catch (error) {
      console.error('Dashboard refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const greetingName = user?.username || localStorage.getItem('username') || 'Admin';
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const mailHint = stats.mail?.active
    ? `Active: ${stats.mail.active.config_name || stats.mail.active.host}`
    : stats.mail?.configs
      ? 'No active SMTP config'
      : 'Not configured';

  const serialStart = (page - 1) * limit;

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
          onClick={refresh}
          loading={loading || refreshing || activityLoading}
        />
      </div>

      {loading || refreshing ? (
        <DashboardSkeleton rows={limit} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8">
            <StatCard
              icon={Users}
              label="Clients"
              value={(stats.clients?.total || 0).toLocaleString('en-IN')}
              hint={`${stats.clients?.active || 0} active accounts`}
              to="/users"
              tone="teal"
            />
            <StatCard
              icon={Building2}
              label="Branches"
              value={(stats.branches?.total || 0).toLocaleString('en-IN')}
              hint={`${stats.branches?.active || 0} active branches`}
              to="/branches"
              tone="emerald"
            />
            <StatCard
              icon={Landmark}
              label="Pending payments"
              value={(stats.payments?.pending_count || 0).toLocaleString('en-IN')}
              hint={`${formatMoney(stats.payments?.pending_amount)} waiting review`}
              to="/settings/wallet-payments"
              tone="amber"
            />
            <StatCard
              icon={UserX}
              label="Deletion requests"
              value={(stats.deletions?.pending || 0).toLocaleString('en-IN')}
              hint="Pending account deletion"
              to="/settings/account-deletion"
              tone="rose"
            />
            <StatCard
              icon={LogIn}
              label="Logins today"
              value={(stats.logins?.today || 0).toLocaleString('en-IN')}
              hint={`${stats.logins?.last_7_days || 0} in the last 7 days`}
            />
            <StatCard
              icon={Activity}
              label="Active sessions"
              value={(stats.logins?.active_sessions || 0).toLocaleString('en-IN')}
              hint="Tokens that have not expired"
            />
            <StatCard
              icon={ConciergeBell}
              label="Services"
              value={(stats.services?.total || 0).toLocaleString('en-IN')}
              hint="Catalog items available to branches"
              to="/services"
              tone="slate"
            />
            <StatCard
              icon={Mail}
              label="Company mail"
              value={stats.mail?.active ? 'Active' : 'Inactive'}
              hint={mailHint}
              to="/settings/mail"
              tone="amber"
            />
          </div>

          <div className="admin-panel w-full overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-admin-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-bold text-admin-text">Login activity</h2>
                <p className="text-xs text-admin-muted">
                  {total.toLocaleString('en-IN')} session{total === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-admin-muted" />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search name, mobile, email, or IP"
                    className="admin-input pl-8 pr-8"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-admin-muted hover:text-admin-text"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setStatus(item.value);
                        setPage(1);
                      }}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                        status === item.value
                          ? 'bg-admin-accent-soft text-admin-accent-text'
                          : 'bg-admin-raised text-admin-text-sub'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activityLoading ? (
              <ActivityTableSkeleton rows={limit} />
            ) : activity.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-admin-muted">
                {query || status !== 'all' ? 'No sessions match this filter' : 'No logins recorded'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-admin-raised text-left text-[11px] uppercase tracking-wider text-admin-muted">
                    <tr>
                      <th className="w-12 px-4 py-2 font-semibold">S.No</th>
                      <th className="px-4 py-2 font-semibold">User</th>
                      <th className="px-4 py-2 font-semibold">Access</th>
                      <th className="px-4 py-2 font-semibold">Login</th>
                      <th className="px-4 py-2 font-semibold">Last</th>
                      <th className="px-4 py-2 font-semibold">Expires</th>
                      <th className="px-4 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border">
                    {activity.map((row, index) => (
                      <tr key={row.token_id || index} className="hover:bg-admin-raised">
                        <td className="px-4 py-2.5 tabular-nums text-admin-muted">{serialStart + index + 1}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-admin-text">{row.name || '—'}</p>
                          <p className="text-xs text-admin-muted">{displayMobile(row.mobile)}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="capitalize text-admin-text-sub">{panelLabel(row.user_type)}</p>
                          <p className="text-xs capitalize text-admin-muted">{row.login_method || '—'}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-mono text-xs text-admin-text-sub">{row.create_ip || '—'}</p>
                          <p className="text-xs text-admin-muted">{formatDateTime(row.create_date)}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-mono text-xs text-admin-text-sub">{row.last_ip || '—'}</p>
                          <p className="text-xs text-admin-muted">{formatDateTime(row.last_used_date)}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-admin-text-sub">{formatDateTime(row.expire_date)}</td>
                        <td className="px-4 py-2.5">
                          <StatusBadge tone={row.active ? 'success' : 'danger'}>
                            {row.active ? 'Active' : 'Ended'}
                          </StatusBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <TablePagination
              page={page}
              limit={limit}
              total={total}
              totalPages={Math.max(1, totalPages)}
              onPageChange={setPage}
              onLimitChange={(next) => {
                setLimit(next);
                setPage(1);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
