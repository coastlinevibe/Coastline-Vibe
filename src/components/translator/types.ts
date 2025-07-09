/**
 * Types for the translator package
 */

// Portal types
export type PortalType = '1-way' | '2-way' | '3-way';

// Language definition
export interface Language {
  code: string;
  name: string;
}

// API response type
export interface TranslationResult {
  success: boolean;
  source_language: string;
  target_language: string;
  original_text: string;
  translated_text: string;
  model: string;
  error?: string;
}

// Context type
export interface TranslatorContextType {
  translate: (text: string, sourceLang: string, targetLang: string) => Promise<string>;
  translateMultiple: (text: string, sourceLang: string, targetLangs: string[]) => Promise<Record<string, string>>;
  isLoading: boolean;
  error: string | null;
  portalType: PortalType;
  setPortalType: (type: PortalType) => void;
  selectedLanguages: {
    source: string;
    target1: string;
    target2: string;
    target3: string;
  };
  setSelectedLanguages: (langs: { source?: string; target1?: string; target2?: string; target3?: string }) => void;
  showTranslator: boolean;
  setShowTranslator: (show: boolean) => void;
  position: { x: number; y: number };
  setPosition: (pos: { x: number; y: number }) => void;
  textToTranslate: string;
  setTextToTranslate: (text: string) => void;
  translationResults: Record<string, string>;
  availableLanguages: Language[];
}

// Configuration type
export interface TranslatorConfig {
  API_URL: string;
  API_KEY: string;
  FEATURES: {
    HIGHLIGHT_TO_TRANSLATE: boolean;
    FLOATING_ICON: boolean;
    DEFAULT_PORTAL_TYPE: PortalType;
  };
  DEFAULT_LANGUAGES: {
    source: string;
    target1: string;
    target2: string;
    target3: string;
  };
}

// List of common languages
export const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'pl', name: 'Polish' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'id', name: 'Indonesian' },
  { code: 'uk', name: 'Ukrainian' },
];
