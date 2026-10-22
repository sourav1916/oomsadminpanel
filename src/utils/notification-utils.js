export function normalizeNotification(row = {}) {
  return {
    id: row.notification_id,
    title: row.title || 'Admin notification',
    body: row.body || '',
    category: row.category || 'system',
    createdAt: row.create_date,
    isRead: Boolean(row.is_read || row.read_at),
  };
}
