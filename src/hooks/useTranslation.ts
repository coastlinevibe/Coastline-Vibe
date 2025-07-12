import { useState, useEffect, useCallback } from 'react';
import { getTranslation, DEFAULT_LANGUAGE } from '@/translations';

// Simple hook for translations
export function useTranslation() {
  const [language, setLanguage] = useState<string>(DEFAULT_LANGUAGE);

  // Initialize language from localStorage if available
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('coastline_language');
      if (savedLang && (savedLang === 'en' || savedLang === 'vi')) {
        setLanguage(savedLang);
      } else {
        // If invalid or no language saved, set to default
        localStorage.setItem('coastline_language', DEFAULT_LANGUAGE);
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  }, []);

  // Change language function
  const changeLanguage = useCallback((lang: string) => {
    if (lang === 'en' || lang === 'vi') {
      setLanguage(lang);
      try {
        localStorage.setItem('coastline_language', lang);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      // Force a page refresh to ensure all components update
      window.location.reload();
    }
  }, []);

  // Translation function
  const t = useCallback((key: string, fallback?: string) => {
    return getTranslation(language, key, fallback);
  }, [language]);

  return {
    t,
    language,
    changeLanguage,
  };
} 