import React, { useCallback, useEffect, useState } from "react";
import { Inbox, Settings, RefreshCw, Send, Star, Archive, Mail } from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "../utils/apiCall";
import ManagementHub from "../components/common/ManagementHub";
import ManagementButton from "../components/common/ManagementButton";
import { TableSkeleton, DetailPageSkeleton } from "../components/SkeletonComponent";

const EMPTY_SETTINGS = {
  enabled: false,
  support_address: "",
  display_name: "OOMS Support",
  imap_host: "",
  imap_port: 993,
  imap_secure: true,
  imap_username: "",
  imap_password_saved: false,
  imap_folder: "INBOX",
  smtp_host: "",
  smtp_port: 587,
  smtp_secure: true,
  smtp_username: "",
  smtp_password_saved: false,
  smtp_from_name: "OOMS Support",
  smtp_from_address: "",
  ack_enabled: true,
  ack_subject: "We received your support request",
  ack_body_template: "",
};

const statuses = [
  ["", "All"],
  ["submitted", "Submitted"],
  ["in_progress", "In progress"],
  ["waiting_on_customer", "Waiting"],
  ["resolved", "Resolved"],
  ["closed", "Closed"],
];

export default function SupportPage() {
  const [tab, setTab] = useState("inbox");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [passwords, setPasswords] = useState({ imap_password: "", smtp_password: "" });
  const [tickets, setTickets] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState("");
  const [syncStatus, setSyncStatus] = useState(null);

  const loadSettings = useCallback(async () => {
    const res = await apiCall("/support/settings", "GET");
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load support settings");
    setSettings({ ...EMPTY_SETTINGS, ...(data.data || {}) });
  }, []);

  const loadTickets = useCallback(async (nextCursor = null, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ archived: "0", limit: "30" });
      if (status) params.set("status", status);
      if (search.trim()) params.set("search", search.trim());
      if (nextCursor) params.set("cursor", nextCursor);
      const res = await apiCall(`/support/tickets?${params}`, "GET");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load tickets");
      setTickets((prev) => append ? [...prev, ...(data.data?.items || [])] : (data.data?.items || []));
      setCursor(data.data?.next_cursor || null);
      setHasMore(Boolean(data.data?.next_cursor));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  const loadSyncStatus = useCallback(async () => {
    const res = await apiCall("/support/sync-status", "GET");
    const data = await res.json();
    if (res.ok) setSyncStatus(data.data);
  }, []);

  const refresh = useCallback(async () => {
    try {
      await Promise.all([loadTickets(null, false), loadSettings(), loadSyncStatus()]);
    } catch (_) {}
  }, [loadTickets, loadSettings, loadSyncStatus]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const timer = setTimeout(() => loadTickets(), 350);
    return () => clearTimeout(timer);
  }, [status, search, loadTickets]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await apiCall("/support/settings", "PUT", { ...settings, ...passwords });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");
      setSettings({ ...EMPTY_SETTINGS, ...(data.data || {}) });
      setPasswords({ imap_password: "", smtp_password: "" });
      toast.success("Support settings saved");
      await loadSyncStatus();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const runSync = async () => {
    setSyncing(true);
    try {
      const res = await apiCall("/support/sync", "POST", {});
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Sync failed");
      toast.success(data.data?.skipped ? data.data.reason : "Mailbox synchronized");
      await Promise.all([loadTickets(), loadSyncStatus()]);
    } catch (error) {
      toast.error(error.message);
      await loadSyncStatus();
    } finally {
      setSyncing(false);
    }
  };

  const openTicket = async (ticketId) => {
    setLoading(true);
    try {
      const res = await apiCall(`/support/tickets/${ticketId}`, "GET");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to open ticket");
      setActive(data.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTicket = async (patch) => {
    if (!active) return;
    try {
      const res = await apiCall(`/support/tickets/${active.ticket.ticket_id}`, "PUT", patch);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      setActive(data.data);
      await loadTickets();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendReply = async () => {
    if (!active || !reply.trim()) return;
    setSaving(true);
    try {
      const res = await apiCall(`/support/tickets/${active.ticket.ticket_id}/reply`, "POST", { text: reply.trim() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reply failed");
      toast.success("Reply sent");
      setReply("");
      await openTicket(active.ticket.ticket_id);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const testSend = async () => {
    if (!settings.smtp_from_address && !settings.support_address) {
      toast.error("Set the support or sender address first");
      return;
    }
    const to = settings.smtp_from_address || settings.support_address;
    setSaving(true);
    try {
      const res = await apiCall("/support/test-send", "POST", { to });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Test send failed");
      toast.success("Test email sent");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ManagementHub
      eyebrow="Customer support"
      title="Support inbox"
      description="Mailbox-backed tickets, replies, status changes, and support settings."
      onRefresh={refresh}
      refreshing={loading}
      actions={
        <ManagementButton
          type="button"
          onClick={runSync}
          loading={syncing}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Sync mailbox
        </ManagementButton>
      }
    >
      <div className="mb-4 flex gap-2">
        <button type="button" onClick={() => setTab("inbox")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${tab === "inbox" ? "bg-admin-accent-soft text-admin-accent-text" : "text-admin-text-sub"}`}>
          <Inbox className="mr-1.5 inline h-3.5 w-3.5" />Inbox
        </button>
        <button type="button" onClick={() => setTab("settings")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${tab === "settings" ? "bg-admin-accent-soft text-admin-accent-text" : "text-admin-text-sub"}`}>
          <Settings className="mr-1.5 inline h-3.5 w-3.5" />Mail settings
        </button>
      </div>

      {tab === "inbox" ? (
        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="admin-panel overflow-hidden">
            <div className="border-b border-admin-border p-3">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets" className="admin-input" />
              <div className="mt-2 flex flex-wrap gap-1">
                {statuses.map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setStatus(value)} className={`rounded-md px-2 py-1 text-[11px] font-semibold ${status === value ? "bg-admin-accent-soft text-admin-accent-text" : "text-admin-text-sub"}`}>{label}</button>
                ))}
              </div>
              {syncStatus?.state?.last_error ? (
                <p className="mt-2 text-xs text-rose-600">{syncStatus.state.last_error}</p>
              ) : syncStatus?.state?.last_successful_sync ? (
                <p className="mt-2 text-xs text-admin-muted">Synced {syncStatus.state.last_successful_sync}</p>
              ) : null}
            </div>
            {loading && tickets.length === 0 ? <TableSkeleton columns={2} rows={6} /> : tickets.length === 0 ? (
              <p className="p-8 text-center text-sm text-admin-muted">No support tickets</p>
            ) : (
              <div className="divide-y divide-admin-border">
                {tickets.map((ticket) => (
                  <button key={ticket.ticket_id} type="button" onClick={() => openTicket(ticket.ticket_id)} className={`w-full p-3 text-left hover:bg-admin-raised ${active?.ticket?.ticket_id === ticket.ticket_id ? "bg-admin-raised" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-admin-text">{ticket.requester_name || ticket.requester_email}</p>
                        <p className="mt-0.5 truncate text-xs text-admin-text-sub">{ticket.subject}</p>
                      </div>
                      {ticket.unread ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-admin-accent" /> : null}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-admin-muted">
                      <span>{ticket.ticket_number}</span><span className="capitalize">{ticket.status.replaceAll("_", " ")}</span>
                    </div>
                  </button>
                ))}
                {hasMore ? <button type="button" onClick={() => loadTickets(cursor, true)} className="w-full p-3 text-xs font-semibold text-admin-accent-text">Load more</button> : null}
              </div>
            )}
          </aside>

          <section className="admin-panel min-h-[420px]">
            {!active ? (
              <div className="flex h-full min-h-[420px] items-center justify-center text-center">
                <div><Mail className="mx-auto mb-3 h-8 w-8 text-admin-muted" /><p className="text-sm text-admin-muted">Select a ticket to view the thread</p></div>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex flex-col gap-3 border-b border-admin-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold text-admin-accent-text">{active.ticket.ticket_number}</p>
                    <h2 className="mt-1 text-lg font-bold text-admin-text">{active.ticket.subject}</h2>
                    <p className="text-xs text-admin-muted">{active.ticket.requester_name} · {active.ticket.requester_email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => updateTicket({ starred: !active.ticket.starred })} className="rounded-md border border-admin-border p-2 text-admin-text-sub" title="Star"><Star className={`h-4 w-4 ${active.ticket.starred ? "fill-current" : ""}`} /></button>
                    <button type="button" onClick={() => updateTicket({ archived: true })} className="rounded-md border border-admin-border p-2 text-admin-text-sub" title="Archive"><Archive className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-xs text-admin-muted">Status</label>
                  <select value={active.ticket.status} onChange={(e) => updateTicket({ status: e.target.value })} className="admin-input max-w-[220px] py-1.5">
                    {statuses.slice(1).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="mt-4 space-y-3">
                  {active.messages.map((message) => (
                    <article key={message.message_id} className="rounded-lg border border-admin-border p-3">
                      <div className="flex justify-between gap-2 text-xs">
                        <p className="font-semibold text-admin-text">{message.sender_name || message.sender_email || (message.direction === "outbound" ? "Support" : "")}</p>
                        <p className="text-admin-muted">{message.sent_at || message.received_at || message.created_at}</p>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-admin-text-sub">{message.text_body || "(No text content)"}</p>
                      {message.direction === "outbound" ? <p className="mt-2 text-[11px] capitalize text-admin-muted">{message.delivery_state}</p> : null}
                    </article>
                  ))}
                </div>
                <div className="mt-4 border-t border-admin-border pt-4">
                  <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={5} className="admin-textarea" placeholder={`Reply to ${active.ticket.requester_email}`} />
                  <div className="mt-2 flex justify-end">
                    <ManagementButton
                      type="button"
                      onClick={sendReply}
                      loading={saving}
                      disabled={!reply.trim()}
                      leftIcon={<Send className="h-4 w-4" />}
                    >
                      Send reply
                    </ManagementButton>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="admin-panel p-5">
          {loading ? <DetailPageSkeleton /> : (
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["enabled", "Enabled", "checkbox"],
                ["support_address", "Support address", "email"],
                ["display_name", "Display name", "text"],
                ["imap_host", "IMAP host", "text"],
                ["imap_port", "IMAP port", "number"],
                ["imap_username", "IMAP username", "text"],
                ["imap_folder", "Inbox folder", "text"],
                ["smtp_host", "SMTP host", "text"],
                ["smtp_port", "SMTP port", "number"],
                ["smtp_username", "SMTP username", "text"],
                ["smtp_from_name", "Sender name", "text"],
                ["smtp_from_address", "Sender address", "email"],
                ["ack_subject", "Acknowledgment subject", "text"],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="admin-label">{label}</label>
                  {type === "checkbox" ? (
                    <input type="checkbox" checked={Boolean(settings[key])} onChange={(e) => setSettings((p) => ({ ...p, [key]: e.target.checked }))} />
                  ) : (
                    <input type={type} value={settings[key] || ""} onChange={(e) => setSettings((p) => ({ ...p, [key]: type === "number" ? Number(e.target.value) : e.target.value }))} className="admin-input" />
                  )}
                </div>
              ))}
              <div>
                <label className="admin-label">IMAP password {settings.imap_password_saved ? "(saved)" : ""}</label>
                <input type="password" value={passwords.imap_password} onChange={(e) => setPasswords((p) => ({ ...p, imap_password: e.target.value }))} className="admin-input" placeholder={settings.imap_password_saved ? "Leave blank to keep" : ""} />
              </div>
              <div>
                <label className="admin-label">SMTP password {settings.smtp_password_saved ? "(saved)" : ""}</label>
                <input type="password" value={passwords.smtp_password} onChange={(e) => setPasswords((p) => ({ ...p, smtp_password: e.target.value }))} className="admin-input" placeholder={settings.smtp_password_saved ? "Leave blank to keep" : ""} />
              </div>
              <div className="md:col-span-2">
                <label className="admin-label">Acknowledgment template</label>
                <textarea value={settings.ack_body_template || ""} onChange={(e) => setSettings((p) => ({ ...p, ack_body_template: e.target.value }))} rows={4} className="admin-textarea" />
              </div>
              <label className="flex items-center gap-2 text-sm text-admin-text"><input type="checkbox" checked={Boolean(settings.ack_enabled)} onChange={(e) => setSettings((p) => ({ ...p, ack_enabled: e.target.checked }))} />Send automatic acknowledgment</label>
            </div>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <ManagementButton type="button" onClick={testSend} disabled={saving}>Test send</ManagementButton>
            <ManagementButton type="button" onClick={saveSettings} disabled={saving}>{saving ? "Saving..." : "Save settings"}</ManagementButton>
          </div>
        </div>
      )}
    </ManagementHub>
  );
}
