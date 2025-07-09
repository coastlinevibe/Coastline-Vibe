'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslator } from './TranslatorContext';
import { Globe, X, ArrowLeftRight, ChevronDown, RefreshCw } from 'lucide-react';
import { AVAILABLE_LANGUAGES, PortalType } from './types';

export interface TranslatorPopupProps {
  position: { x: number; y: number };
  onClose: () => void;
}

export default function TranslatorPopup({ onClose }: TranslatorPopupProps) {
  // Get translator context
  const {
    portalType,
    setPortalType,
    selectedLanguages,
    setSelectedLanguages,
    textToTranslate,
    setTextToTranslate,
    translate,
    translateMultiple,
    isLoading,
    availableLanguages,
  } = useTranslator();

  const [results, setResults] = useState<Record<string, string>>({});
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [target1DropdownOpen, setTarget1DropdownOpen] = useState(false);
  const [target2DropdownOpen, setTarget2DropdownOpen] = useState(false);
  const [target3DropdownOpen, setTarget3DropdownOpen] = useState(false);
  const [typingEffect, setTypingEffect] = useState(false);

  const popupRef = useRef<HTMLDivElement>(null);
  const sourceDropdownRef = useRef<HTMLDivElement>(null);
  const target1DropdownRef = useRef<HTMLDivElement>(null);
  const target2DropdownRef = useRef<HTMLDivElement>(null);
  const target3DropdownRef = useRef<HTMLDivElement>(null);

  // Handle translation when text changes
  useEffect(() => {
    const handleTranslation = async () => {
      if (!textToTranslate.trim()) {
        setResults({});
        return;
      }

      try {
        setTypingEffect(true);
        let newResults: Record<string, string> = {};

        if (portalType === '1-way') {
          // Translate to one target language
          const result = await translate(textToTranslate, selectedLanguages.source, selectedLanguages.target1);
          newResults[selectedLanguages.target1] = result;
        } else if (portalType === '2-way') {
          // Translate to two target languages simultaneously
          const results = await translateMultiple(
            textToTranslate, 
            selectedLanguages.source, 
            [selectedLanguages.target1, selectedLanguages.target2]
          );
          newResults = results;
        } else if (portalType === '3-way') {
          // Translate to three target languages simultaneously
          const results = await translateMultiple(
            textToTranslate, 
            selectedLanguages.source, 
            [selectedLanguages.target1, selectedLanguages.target2, selectedLanguages.target3]
          );
          newResults = results;
        }

        setResults(newResults);
      } catch (error) {
        console.error('Translation error:', error);
      } finally {
        setTypingEffect(false);
      }
    };

    // Debounce the translation to avoid too many API calls
    const timer = setTimeout(() => {
      handleTranslation();
    }, 500);

    return () => clearTimeout(timer);
  }, [textToTranslate, portalType, selectedLanguages, translate, translateMultiple]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sourceDropdownRef.current && 
        !sourceDropdownRef.current.contains(event.target as Node)
      ) {
        setSourceDropdownOpen(false);
      }
      
      if (
        target1DropdownRef.current && 
        !target1DropdownRef.current.contains(event.target as Node)
      ) {
        setTarget1DropdownOpen(false);
      }
      
      if (
        target2DropdownRef.current && 
        !target2DropdownRef.current.contains(event.target as Node)
      ) {
        setTarget2DropdownOpen(false);
      }
      
      if (
        target3DropdownRef.current && 
        !target3DropdownRef.current.contains(event.target as Node)
      ) {
        setTarget3DropdownOpen(false);
      }
      
      if (
        popupRef.current && 
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle escape key to close popup
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  // Swap languages
  const handleSwapLanguages = () => {
    setSelectedLanguages({
      source: selectedLanguages.target1,
      target1: selectedLanguages.source,
    });
  };

  // Get language name from code
  const getLanguageName = (code: string) => {
    const language = availableLanguages.find(lang => lang.code === code);
    return language ? language.name : code;
  };

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-[90vw] max-w-2xl max-h-[80vh] overflow-hidden"
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-blue-500">
        <div className="flex items-center text-white">
          <Globe className="w-5 h-5 mr-2" />
          <h3 className="font-medium">Translator</h3>
        </div>
        
        {/* Portal type selector */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPortalType('1-way')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              portalType === '1-way' 
                ? 'bg-white text-blue-600' 
                : 'bg-blue-600/20 text-white hover:bg-blue-600/30'
            }`}
          >
            1-Way
          </button>
          <button
            onClick={() => setPortalType('2-way')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              portalType === '2-way' 
                ? 'bg-white text-blue-600' 
                : 'bg-blue-600/20 text-white hover:bg-blue-600/30'
            }`}
          >
            2-Way
          </button>
          <button
            onClick={() => setPortalType('3-way')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              portalType === '3-way' 
                ? 'bg-white text-blue-600' 
                : 'bg-blue-600/20 text-white hover:bg-blue-600/30'
            }`}
          >
            3-Way
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4 overflow-y-auto max-h-[calc(80vh-56px)]">
        {/* Source language selector and input */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="relative" ref={sourceDropdownRef}>
              <button
                onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
                className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                {getLanguageName(selectedLanguages.source)}
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              
              {/* Source language dropdown */}
              {sourceDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-48 max-h-60 overflow-y-auto"
                >
                  <input
                    type="text"
                    placeholder="Search languages..."
                    className="w-full p-2 border-b border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="py-1">
                    {availableLanguages.map(language => (
                      <button
                        key={language.code}
                        onClick={() => {
                          setSelectedLanguages({ source: language.code });
                          setSourceDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          selectedLanguages.source === language.code
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {language.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {portalType === '1-way' && (
              <button
                onClick={handleSwapLanguages}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Swap languages"
              >
                <ArrowLeftRight className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
          
          <textarea
            value={textToTranslate}
            onChange={(e) => {/* We don't update text here as it comes from selection */}}
            placeholder="Enter text to translate..."
            className="w-full h-24 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            readOnly
          />
        </div>
        
        {/* 1-way translation */}
        {portalType === '1-way' && (
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-200">
              <div className="relative" ref={target1DropdownRef}>
                <button
                  onClick={() => setTarget1DropdownOpen(!target1DropdownOpen)}
                  className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  {getLanguageName(selectedLanguages.target1)}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                
                {/* Target language dropdown */}
                {target1DropdownOpen && (
                  <div
                    className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-48 max-h-60 overflow-y-auto"
                  >
                    <input
                      type="text"
                      placeholder="Search languages..."
                      className="w-full p-2 border-b border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="py-1">
                      {availableLanguages.map(language => (
                        <button
                          key={language.code}
                          onClick={() => {
                            setSelectedLanguages({ target1: language.code });
                            setTarget1DropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm ${
                            selectedLanguages.target1 === language.code
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {language.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-3 min-h-[100px] bg-white">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              ) : (
                <div className="text-gray-800">
                  <TypewriterText text={results[selectedLanguages.target1] || ''} />
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 2-way translation */}
        {portalType === '2-way' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-200">
                <div className="relative" ref={target1DropdownRef}>
                  <button
                    onClick={() => setTarget1DropdownOpen(!target1DropdownOpen)}
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    {getLanguageName(selectedLanguages.target1)}
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  
                  {/* Target language dropdown */}
                  {target1DropdownOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-48 max-h-60 overflow-y-auto"
                    >
                      <input
                        type="text"
                        placeholder="Search languages..."
                        className="w-full p-2 border-b border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="py-1">
                        {availableLanguages.map(language => (
                          <button
                            key={language.code}
                            onClick={() => {
                              setSelectedLanguages({ target1: language.code });
                              setTarget1DropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm ${
                              selectedLanguages.target1 === language.code
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {language.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-3 min-h-[100px] bg-white">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                  </div>
                ) : (
                  <div className="text-gray-800">
                    <TypewriterText text={results[selectedLanguages.target1] || ''} />
                  </div>
                )}
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-200">
                <div className="relative" ref={target2DropdownRef}>
                  <button
                    onClick={() => setTarget2DropdownOpen(!target2DropdownOpen)}
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    {getLanguageName(selectedLanguages.target2)}
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  
                  {/* Target language dropdown */}
                  {target2DropdownOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-48 max-h-60 overflow-y-auto"
                    >
                      <input
                        type="text"
                        placeholder="Search languages..."
                        className="w-full p-2 border-b border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="py-1">
                        {availableLanguages.map(language => (
                          <button
                            key={language.code}
                            onClick={() => {
                              setSelectedLanguages({ target2: language.code });
                              setTarget2DropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm ${
                              selectedLanguages.target2 === language.code
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {language.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-3 min-h-[100px] bg-white">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                  </div>
                ) : (
                  <div className="text-gray-800">
                    <TypewriterText text={results[selectedLanguages.target2] || ''} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* 3-way translation */}
        {portalType === '3-way' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-200">
                <div className="relative" ref={target1DropdownRef}>
                  <button
                    onClick={() => setTarget1DropdownOpen(!target1DropdownOpen)}
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    {getLanguageName(selectedLanguages.target1)}
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  
                  {/* Target 1 language dropdown */}
                  {target1DropdownOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-48 max-h-60 overflow-y-auto"
                    >
                      <input
                        type="text"
                        placeholder="Search languages..."
                        className="w-full p-2 border-b border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="py-1">
                        {availableLanguages.map(language => (
                          <button
                            key={language.code}
                            onClick={() => {
                              setSelectedLanguages({ target1: language.code });
                              setTarget1DropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm ${
                              selectedLanguages.target1 === language.code
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {language.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-3 min-h-[100px] bg-white">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                  </div>
                ) : (
                  <div className="text-gray-800">
                    <TypewriterText text={results[selectedLanguages.target1] || ''} />
                  </div>
                )}
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-200">
                <div className="relative" ref={target2DropdownRef}>
                  <button
                    onClick={() => setTarget2DropdownOpen(!target2DropdownOpen)}
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    {getLanguageName(selectedLanguages.target2)}
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  
                  {/* Target 2 language dropdown */}
                  {target2DropdownOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-48 max-h-60 overflow-y-auto"
                    >
                      <input
                        type="text"
                        placeholder="Search languages..."
                        className="w-full p-2 border-b border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="py-1">
                        {availableLanguages.map(language => (
                          <button
                            key={language.code}
                            onClick={() => {
                              setSelectedLanguages({ target2: language.code });
                              setTarget2DropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm ${
                              selectedLanguages.target2 === language.code
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {language.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-3 min-h-[100px] bg-white">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                  </div>
                ) : (
                  <div className="text-gray-800">
                    <TypewriterText text={results[selectedLanguages.target2] || ''} />
                  </div>
                )}
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-200">
                <div className="relative" ref={target3DropdownRef}>
                  <button
                    onClick={() => setTarget3DropdownOpen(!target3DropdownOpen)}
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    {getLanguageName(selectedLanguages.target3)}
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  
                  {/* Target 3 language dropdown */}
                  {target3DropdownOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-48 max-h-60 overflow-y-auto"
                    >
                      <input
                        type="text"
                        placeholder="Search languages..."
                        className="w-full p-2 border-b border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="py-1">
                        {availableLanguages.map(language => (
                          <button
                            key={language.code}
                            onClick={() => {
                              setSelectedLanguages({ target3: language.code });
                              setTarget3DropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm ${
                              selectedLanguages.target3 === language.code
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {language.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-3 min-h-[100px] bg-white">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                  </div>
                ) : (
                  <div className="text-gray-800">
                    <TypewriterText text={results[selectedLanguages.target3] || ''} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Add the TypewriterText component inline
interface TypewriterTextProps {
  text: string;
  speed?: number;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  text, 
  speed = 15 
}) => {
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    setDisplayText('');

    if (!text) return;

    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(prev => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return <>{displayText}</>;
};
