'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { ChevronDown, Globe } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  flag: string;
}

// Define available languages with proper emoji flags
const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
];

export default function LanguageSwitcher() {
  const { language, changeLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>(
    LANGUAGES.find(lang => lang.code === language) || LANGUAGES[0]
  );

  // Update current language when language context changes
  useEffect(() => {
    const lang = LANGUAGES.find(lang => lang.code === language) || LANGUAGES[0];
    setCurrentLang(lang);
  }, [language]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectLanguage = (code: string) => {
    changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        className="flex items-center text-gray-700 hover:text-teal-600 transition-colors"
        onClick={toggleDropdown}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={t('profile.language', 'Language')}
      >
        <Globe className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium hidden sm:inline">{currentLang.flag} {currentLang.name}</span>
        <span className="text-sm font-medium sm:hidden">{currentLang.flag}</span>
        <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 py-2 w-40 bg-white rounded-md shadow-lg z-20 border border-gray-200"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="language-menu"
        >
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${
                lang.code === language ? 'text-teal-600 font-medium bg-gray-50' : 'text-gray-700'
              }`}
              onClick={() => handleSelectLanguage(lang.code)}
              role="menuitem"
              aria-label={lang.name}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 