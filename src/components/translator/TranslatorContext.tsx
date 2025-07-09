'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  TranslatorContextType, 
  PortalType, 
  TranslationResult, 
  AVAILABLE_LANGUAGES,
  TranslatorConfig
} from './types';

// Default configuration
const DEFAULT_CONFIG: TranslatorConfig = {
  API_URL: 'http://192.168.100.3:8000/api/translate',
  API_KEY: 'e248d9fd232a9b738301c4420f587fed',
  FEATURES: {
    HIGHLIGHT_TO_TRANSLATE: true,
    FLOATING_ICON: true,
    DEFAULT_PORTAL_TYPE: '1-way',
  },
  DEFAULT_LANGUAGES: {
    source: 'en',
    target1: 'es',
    target2: 'fr',
    target3: 'de',
  },
};

// Create context
const TranslatorContext = createContext<TranslatorContextType | undefined>(undefined);

/**
 * Main translation function that calls the API
 */
async function callTranslateAPI(
  text: string,
  sourceLang: string,
  targetLang: string,
  apiUrl: string,
  apiKey: string
): Promise<TranslationResult> {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text,
        source_language: sourceLang,
        target_language: targetLang,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Translation error:', error);
    return {
      success: false,
      source_language: sourceLang,
      target_language: targetLang,
      original_text: text,
      translated_text: '',
      model: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

interface TranslatorProviderProps {
  children: ReactNode;
  config?: Partial<TranslatorConfig>;
}

/**
 * Provider component for the translator
 */
export const TranslatorProvider: React.FC<TranslatorProviderProps> = ({ 
  children,
  config = {}
}) => {
  // Merge default config with user config
  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    FEATURES: {
      ...DEFAULT_CONFIG.FEATURES,
      ...(config.FEATURES || {}),
    },
    DEFAULT_LANGUAGES: {
      ...DEFAULT_CONFIG.DEFAULT_LANGUAGES,
      ...(config.DEFAULT_LANGUAGES || {}),
    },
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portalType, setPortalType] = useState<PortalType>(mergedConfig.FEATURES.DEFAULT_PORTAL_TYPE);
  const [selectedLanguages, setSelectedLanguages] = useState({
    source: mergedConfig.DEFAULT_LANGUAGES.source,
    target1: mergedConfig.DEFAULT_LANGUAGES.target1,
    target2: mergedConfig.DEFAULT_LANGUAGES.target2,
    target3: mergedConfig.DEFAULT_LANGUAGES.target3,
  });
  const [showTranslator, setShowTranslator] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [textToTranslate, setTextToTranslate] = useState('');
  const [translationResults, setTranslationResults] = useState<Record<string, string>>({});

  // Translate a single text
  const translate = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    if (!text.trim()) return '';
    
    try {
      setIsLoading(true);
      
      // Using the provided local API
      const response = await fetch(mergedConfig.API_URL, {
        method: 'POST',
        body: JSON.stringify({
          text: text,
          source_language: sourceLang,
          target_language: targetLang
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mergedConfig.API_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.translated_text || data.translatedText || '';
    } catch (err) {
      console.error('Translation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return `Error: Could not translate text`;
    } finally {
      setIsLoading(false);
    }
  };

  // Translate to multiple languages at once
  const translateMultiple = async (
    text: string,
    sourceLang: string,
    targetLangs: string[]
  ): Promise<Record<string, string>> => {
    if (!text.trim() || !targetLangs.length) return {};
    
    try {
      setIsLoading(true);
      
      // Translate to multiple languages in parallel using the local API
      const translations = await Promise.all(
        targetLangs.map(async (targetLang) => {
          try {
            const response = await fetch(mergedConfig.API_URL, {
              method: 'POST',
              body: JSON.stringify({
                text: text,
                source_language: sourceLang,
                target_language: targetLang
              }),
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mergedConfig.API_KEY}`
              }
            });
            
            if (!response.ok) {
              throw new Error(`Translation failed: ${response.status}`);
            }
            
            const data = await response.json();
            return { lang: targetLang, text: data.translated_text || data.translatedText || '' };
          } catch (error) {
            console.error(`Error translating to ${targetLang}:`, error);
            return { lang: targetLang, text: `Error: Could not translate to ${targetLang}` };
          }
        })
      );
      
      // Convert array of results to record object
      return translations.reduce((acc, { lang, text }) => {
        acc[lang] = text;
        return acc;
      }, {} as Record<string, string>);
    } catch (err) {
      console.error('Multiple translation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return {};
    } finally {
      setIsLoading(false);
    }
  };

  // Update selected languages
  const handleSetSelectedLanguages = useCallback((langs: { 
    source?: string; 
    target1?: string; 
    target2?: string;
    target3?: string;
  }) => {
    setSelectedLanguages(prev => ({
      ...prev,
      ...langs,
    }));
  }, []);

  const value = {
    translate,
    translateMultiple,
    isLoading,
    error,
    portalType,
    setPortalType,
    selectedLanguages,
    setSelectedLanguages: handleSetSelectedLanguages,
    showTranslator,
    setShowTranslator,
    position,
    setPosition,
    textToTranslate,
    setTextToTranslate,
    translationResults,
    availableLanguages: AVAILABLE_LANGUAGES,
  };

  return (
    <TranslatorContext.Provider value={value}>
      {children}
    </TranslatorContext.Provider>
  );
};

/**
 * Hook to use the translator functionality
 */
export const useTranslator = (): TranslatorContextType => {
  const context = useContext(TranslatorContext);
  
  if (context === undefined) {
    throw new Error('useTranslator must be used within a TranslatorProvider');
  }
  
  return context;
};
