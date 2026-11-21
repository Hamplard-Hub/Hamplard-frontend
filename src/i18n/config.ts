export const locales = ['en', 'fr', 'sw', 'ha', 'yo'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  sw: 'Kiswahili',
  ha: 'Hausa',
  yo: 'Yorùbá',
};
