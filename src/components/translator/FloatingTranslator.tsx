'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslator } from './TranslatorContext';
import TranslatorPopup from './TranslatorPopup';
import { Languages } from 'lucide-react';

export default function FloatingTranslator() {
  const { setTextToTranslate } = useTranslator();
  const [showSelectionIcon, setShowSelectionIcon] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const selectionIconRef = useRef<HTMLDivElement>(null);

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      
      if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Set position for the selection icon
        setSelectionPosition({
          x: rect.left + (rect.width / 2) + window.scrollX,
          y: rect.bottom + 10 + window.scrollY, // 10px below the selection
        });
        
        // Store the selected text
        setSelectedText(selection.toString().trim());
        setShowSelectionIcon(true);
      } else {
        // Don't hide immediately to allow clicking the icon
        setTimeout(() => {
          const isIconClicked = 
            selectionIconRef.current && 
            selectionIconRef.current.contains(document.activeElement);
          
          if (!isIconClicked) {
            setShowSelectionIcon(false);
          }
        }, 200);
      }
    };
    
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
    };
  }, []);

  // Handle clicking outside the selection icon
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectionIconRef.current && 
        !selectionIconRef.current.contains(event.target as Node) &&
        !showPopup // Don't hide if popup is shown
      ) {
        setShowSelectionIcon(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup]);

  // Handle clicking the selection icon
  const handleSelectionIconClick = () => {
    console.log('Selection icon clicked!');
    if (selectedText) {
      // Store the selected text
      setTextToTranslate(selectedText);
      
      // Show the translator popup
      setShowPopup(true);
      
      // Hide the selection icon
      setShowSelectionIcon(false);
    }
  };

  // Handle closing the popup
  const handleClosePopup = () => {
    setShowPopup(false);
  };

  return (
    <>
      {/* Selection icon */}
      {showSelectionIcon && (
        <div
          ref={selectionIconRef}
          className="fixed z-50 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full shadow-lg w-10 h-10 flex items-center justify-center cursor-pointer transform transition-transform hover:scale-110"
          style={{
            top: `${selectionPosition.y}px`,
            left: `${selectionPosition.x - 20}px`, // Center the 40px wide icon
          }}
          onClick={handleSelectionIconClick}
          role="button"
          aria-label="Translate selected text"
          tabIndex={0}
        >
          <Languages className="w-5 h-5 text-white" />
        </div>
      )}
      
      {/* Translator popup */}
      {showPopup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
          <TranslatorPopup onClose={handleClosePopup} position={{ x: 0, y: 0 }} />
        </div>
      )}
    </>
  );
}
