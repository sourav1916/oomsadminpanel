import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Bell, CheckCheck, RefreshCw, Trash2 } from 'lucide-react';
import apiCall from '../utils/apiCall';
import RefreshButton from '../components/common/RefreshButton';
import { EmptyState, Panel, StatusBadge } from '../components/common/Panel';
import { normalizeNotification } from '../utils/notification-utils';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [listResponse, countResponse] = await Promise.all([
        apiCall('/notifications?limit=100&include_read=true', 'GET'),
        apiCall('/notifications/unread-count', 'GET'),
      ]);
      const list = await listResponse.json().catch(() => null);
      const count = await countResponse.json().catch(() => null);
      if (!listResponse.ok || list?.success === false) throw new Error(list?.message || 'Failed to load notifications');
      setItems(Array.isArray(list?.data) ? list.data.map(normalizeNotification) : []);
      setUnreadCount(Number(count?.data?.unread_count || 0));
    } catch (requestError) {
      setItems([]);
      setError(requestError.message || 'Failed to load notifications');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const action = async (path, body, optimistic) => {
    setBusy(true);
    try {
      const response = await apiCall(path, 'POST', body);
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.success === false) throw new Error(payload?.message || 'Notification action failed');
      optimistic();
    } catch (requestError) {
      setError(requestError.message || 'Notification action failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-admin-muted">Platform operations</p><h1 className="mt-1 text-xl font-bold text-admin-text sm:text-2xl">Admin notifications</h1><p className="mt-1 text-sm text-admin-text-sub">Platform-scoped alerts, delivery state, and operator actions.</p></div>
        <div className="flex items-center gap-2"><StatusBadge tone="accent">{unreadCount} unread</StatusBadge><RefreshButton onClick={load} loading={loading} /></div>
      </div>
      {error && <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300"><AlertCircle size={16} />{error}<button type="button" onClick={load} className="ml-auto font-semibold hover:underline"><RefreshCw size={14} /></button></div>}
      <Panel padding={false}>
        <div className="flex items-center justify-between border-b border-admin-border px-4 py-3"><h2 className="flex items-center gap-2 text-sm font-semibold text-admin-text"><Bell size={16} /> Notification stream</h2><button type="button" disabled={busy || unreadCount === 0} onClick={() => action('/notifications/read', { mark_all: true }, () => { setItems(current => current.map(item => ({ ...item, isRead: true }))); setUnreadCount(0); })} className="inline-flex items-center gap-1.5 rounded-md border border-admin-border px-3 py-1.5 text-xs font-semibold text-admin-text-sub hover:bg-admin-raised disabled:opacity-50"><CheckCheck size={14} /> Mark all read</button></div>
        {loading ? <div className="p-8 text-center text-sm text-admin-muted">Loading notifications…</div> : items.length === 0 ? <EmptyState icon={Bell} title="No admin notifications" description="Platform alerts will appear here when they are emitted." /> : <div className="divide-y divide-admin-border">{items.map(item => <div key={item.id} className={`flex items-start gap-3 px-4 py-4 ${item.isRead ? '' : 'bg-admin-accent-soft/30'}`}><Bell className="mt-0.5 h-5 w-5 shrink-0 text-admin-accent-text" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-admin-text">{item.title}</h3><StatusBadge tone={item.isRead ? 'neutral' : 'accent'}>{item.category}</StatusBadge>{!item.isRead && <span className="text-[10px] font-bold uppercase text-admin-accent-text">Unread</span>}</div><p className="mt-1 text-sm text-admin-text-sub">{item.body}</p><time className="mt-2 block text-xs text-admin-muted">{item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : 'Date unavailable'}</time></div><div className="flex gap-1"><button type="button" disabled={busy || item.isRead} onClick={() => action('/notifications/read', { notification_ids: [item.id] }, () => { setItems(current => current.map(row => row.id === item.id ? { ...row, isRead: true } : row)); setUnreadCount(current => Math.max(0, current - 1)); })} aria-label={`Mark ${item.title} read`} className="rounded p-1.5 text-admin-muted hover:bg-admin-raised disabled:opacity-40"><CheckCheck size={15} /></button><button type="button" disabled={busy} onClick={() => action('/notifications/delete', { notification_ids: [item.id] }, () => { setItems(current => current.filter(row => row.id !== item.id)); if (!item.isRead) setUnreadCount(current => Math.max(0, current - 1)); })} aria-label={`Delete ${item.title}`} className="rounded p-1.5 text-admin-muted hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"><Trash2 size={15} /></button></div></div>)}</div>}
      </Panel>
    </div>
  );
}
