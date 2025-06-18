import { create } from 'zustand';
import { Language } from '../types/news';
import i18n from '../i18n';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

const useLanguageStore = create<LanguageState>((set) => ({
  language: (localStorage.getItem('newsapp-language') as Language) || 'nl',
  setLanguage: (language) => {
    localStorage.setItem('newsapp-language', language);
    i18n.changeLanguage(language);
    set({ language });
  },
}));

i18n.on('languageChanged', (lng) => {
  useLanguageStore.setState({ language: lng as Language });
});

export default useLanguageStore; 