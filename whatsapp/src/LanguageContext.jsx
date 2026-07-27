import React, { createContext, useContext, useState, useEffect } from 'react';
import { content } from './content';
import { WA } from './waConfig';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const t = content[lang] || content.en;

  useEffect(() => {
    if (lang === 'hi') {
      document.body.classList.add('lang-hi');
    } else {
      document.body.classList.remove('lang-hi');
    }
  }, [lang]);

  const getWaLink = (type = 'general') => {
    return WA.getWaLink(type, lang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t, getWaLink }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
