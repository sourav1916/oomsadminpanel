import { normalizeNotification } from './notification-utils';

test('normalizes the admin notification contract', () => {
  expect(normalizeNotification({
    notification_id: 'admin-1',
    title: 'Gateway warning',
    body: 'Provider delivery is degraded',
    category: 'system',
    create_date: '2026-10-22T10:00:00.000Z',
    read_at: null,
    private_key: 'not copied',
  })).toEqual({
    id: 'admin-1',
    title: 'Gateway warning',
    body: 'Provider delivery is degraded',
    category: 'system',
    createdAt: '2026-10-22T10:00:00.000Z',
    isRead: false,
  });
});
