'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { content } from './content';
import { WA } from './waConfig';

interface LanguageContextType {
  lang: 'en' | 'hi';
  setLang: React.Dispatch<React.SetStateAction<'en' | 'hi'>>;
  toggleLanguage: () => void;
  t: typeof content.en;
  getWaLink: (type?: 'general' | 'plumbing' | 'electrical') => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  toggleLanguage: () => {},
  t: content.en,
  getWaLink: () => '',
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<'en' | 'hi'>('en');

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

  const getWaLink = (type: 'general' | 'plumbing' | 'electrical' = 'general') => {
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
