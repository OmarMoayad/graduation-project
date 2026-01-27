import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';

const savedLanguage = localStorage.getItem('language') || 'ar';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Set initial direction
const setDirection = (lng: string) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
};

setDirection(savedLanguage);

// Listen for language changes and update direction
i18n.on('languageChanged', (lng) => {
  setDirection(lng);
  localStorage.setItem('language', lng);
});

export default i18n;
