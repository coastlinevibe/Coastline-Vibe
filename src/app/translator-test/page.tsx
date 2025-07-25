'use client';

import React from 'react';
import { TranslatorProvider, FloatingTranslator } from '@/components/translator';

export default function TranslatorTest() {
  return (
    <TranslatorProvider>
      <div className="min-h-screen bg-gray-100 p-8">
        <h1 className="text-3xl font-bold mb-6">Translator Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <p className="mb-4">
            Select this text to test the translator. When you select text, you should see a translator icon appear.
            Click on the icon to open the translator popup.
          </p>
        </div>
        
        <FloatingTranslator />
      </div>
    </TranslatorProvider>
  );
}
