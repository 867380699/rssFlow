import { format } from 'date-fns';
import { assert, describe, it } from 'vitest';

import { TimeSpan, useRelative } from '@/composables/date';
import { i18n } from '@/i18n';

describe('relative date', () => {
  it('now', () => {
    const timestamp = Date.now();
    const timeString = useRelative(timestamp);
    console.log(format(timestamp, 'yyyy-MM-dd hh:mm:ss'), timeString.value);
    assert.equal(timeString.value, i18n.global.t('justNow'));
  });

  it('2 mins ago', () => {
    const timestamp = Date.now() - 2 * TimeSpan.MINUTE;
    const timeString = useRelative(timestamp);
    console.log(format(timestamp, 'yyyy-MM-dd hh:mm:ss'), timeString.value);
    assert.equal(timeString.value, i18n.global.t('minutesAgo', { n: 2 }));
  });
  it('15 mins ago', () => {
    const timestamp = Date.now() - 18 * TimeSpan.MINUTE;
    const timeString = useRelative(timestamp);
    console.log(format(timestamp, 'yyyy-MM-dd hh:mm:ss'), timeString.value);
    assert.equal(timeString.value, i18n.global.t('minutesAgo', { n: 15 }));
  });

  it('2 hours ago', () => {
    const timestamp = Date.now() - 2 * TimeSpan.HOUR;
    const timeString = useRelative(timestamp);
    console.log(format(timestamp, 'yyyy-MM-dd hh:mm:ss'), timeString.value);
    assert.equal(timeString.value, i18n.global.t('hoursAgo', { n: 2 }));
  });

  it('today', () => {
    const timestamp = Date.now() - 8 * TimeSpan.HOUR;
    const timeString = useRelative(timestamp);
    console.log(format(timestamp, 'yyyy-MM-dd hh:mm:ss'), timeString.value);
  });

  it('yesterday', () => {
    const timestamp = Date.now() - 12 * TimeSpan.HOUR;
    const timeString = useRelative(timestamp);
    console.log(format(timestamp, 'yyyy-MM-dd hh:mm:ss'), timeString.value);
  });

  it('days ago', () => {
    const timestamp = Date.now() - 3 * TimeSpan.DAY;
    const timeString = useRelative(timestamp);
    console.log(format(timestamp, 'yyyy-MM-dd hh:mm:ss'), timeString.value);
  });

  it('this year', () => {
    const timestamp = Date.now() - 30 * TimeSpan.DAY;
    const timeString = useRelative(timestamp);
    console.log(format(timestamp, 'yyyy-MM-dd hh:mm:ss'), timeString.value);
  });

  it('others', () => {
    const timestamp = Date.now() - 368 * TimeSpan.DAY;
    const timeString = useRelative(timestamp);
    console.log(format(timestamp, 'yyyy-MM-dd hh:mm:ss'), timeString.value);
  });
});
