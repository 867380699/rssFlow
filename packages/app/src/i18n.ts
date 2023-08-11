import { createI18n } from 'vue-i18n';

import messageEn from './locales/en.json';
import messageCn from './locales/zh.json';

export const i18n = createI18n({
  locale: 'zh',
  fallbackLocale: 'en',
  globalInjection: true,
  messages: { en: messageEn, zh: messageCn },
});
