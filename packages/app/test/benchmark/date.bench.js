import { bench, describe } from 'vitest';

import { formatRelative, TimeSpan } from '@/composables/date';

describe('relative date', () => {
  const now = Date.now();
  const minutesAgo = now - 2 * TimeSpan.MINUTE;
  const hoursAgo = now - 2 * TimeSpan.HOUR;
  const yesterday = now - TimeSpan.DAY;
  const monthAgo = now - 30 * TimeSpan.DAY;
  const yearsAgo = now - 365 * TimeSpan.DAY;

  bench('now', () => {
    formatRelative(now, now);
  });
  bench('minutesAgo', () => {
    formatRelative(minutesAgo, now);
  });
  bench('hoursAgo', () => {
    formatRelative(hoursAgo, now);
  });
  bench('yesterday', () => {
    formatRelative(yesterday, now);
  });
  bench('monthAgo', () => {
    formatRelative(monthAgo, now);
  });
  bench('yearsAgo', () => {
    formatRelative(yearsAgo, now);
  });
});
