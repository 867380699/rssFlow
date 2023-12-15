import {
  format,
  startOfDay,
  startOfToday,
  startOfYear,
  startOfYesterday,
} from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import { interval } from 'rxjs';

import { i18n } from '@/i18n';

const locales: Record<string, Locale> = { en: enUS, zh: zhCN };

const t = i18n.global.t;

export enum TimeSpan {
  MINUTE = 60 * 1000,
  HOUR = 60 * TimeSpan.MINUTE,
  DAY = 24 * TimeSpan.HOUR,
}

const now = ref(Date.now());
const today = computed(() => {
  return startOfToday().getTime();
});
const yesterday = computed(() => {
  return startOfYesterday().getTime();
});
const fiveDaysAgo = computed(() => {
  return startOfDay(today.value - 5 * TimeSpan.DAY).getTime();
});

interval(1000).subscribe(() => {
  now.value = Date.now();
});

/**
 * - <1m => Just Now
 * - <5m => 1,2,3,4,5 Minutes ago
 * - <20m => 10,15,20 Minutes ago
 * - <50m => 30,40,50 Minutes ago
 * - <6h => 1,2,3,4,5,6 Hours ago
 * - <today> => N:00 AM/PM
 * - <yesterday => yesterday at N:00 AM/PM
 * - <5d => N days ago
 * - others => dd/MM/YYYY
 */
export const formatRelative = (time = 0, now: number) => {
  const diff = now - time;
  if (diff < 1 * TimeSpan.MINUTE) {
    return t('justNow');
  } else if (diff < (5 + 1) * TimeSpan.MINUTE) {
    const n = Math.round(diff / TimeSpan.MINUTE);
    return t('minutesAgo', { n });
  } else if (diff < (20 + 1) * TimeSpan.MINUTE) {
    const n = Math.floor(diff / (5 * TimeSpan.MINUTE)) * 5;
    return t('minutesAgo', { n });
  } else if (diff < 1 * TimeSpan.HOUR) {
    const n = Math.floor(diff / (10 * TimeSpan.MINUTE)) * 10;
    return t('minutesAgo', { n });
  } else if (diff < (6 + 1) * TimeSpan.HOUR) {
    const n = Math.round(diff / TimeSpan.HOUR);
    return t('hoursAgo', { n });
  } else if (time > today.value) {
    return format(time, t('today'), {
      locale: locales[i18n.global.locale.value],
    });
  } else if (time > yesterday.value) {
    return format(time, t('yesterday'), {
      locale: locales[i18n.global.locale.value],
    });
  } else if (time > fiveDaysAgo.value) {
    const n = Math.ceil(diff / TimeSpan.DAY);
    return t('daysAgo', { n });
  } else if (time > startOfYear(now).getTime()) {
    return format(time, 'MM-dd');
  } else {
    return format(time, 'yyyy-MM-dd');
  }
};

export const useRelative = (time: number) =>
  computed(() => {
    return formatRelative(time, now.value);
  });
