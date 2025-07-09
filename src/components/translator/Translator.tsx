'use client';

import React, { ReactNode } from 'react';
import { TranslatorProvider } from './TranslatorContext';
import FloatingTranslator from './FloatingTranslator';
import { TranslatorConfig } from './types';

interface TranslatorProps {
  children: ReactNode;
  config?: Partial<TranslatorConfig>;
}

/**
 * Main Translator component that wraps your application
 * 
 * @example
 * ```tsx
 * // In your root layout or app component:
 * import { Translator } from '@/components/translator';
 * 
 * export default function App() {
 *   return (
 *     <Translator>
 *       <YourApp />
 *     </Translator>
 *   );
 * }
 * ```
 */
export default function Translator({ 
  children,
  config = {}
}: TranslatorProps) {
  return (
    <TranslatorProvider config={config}>
      {children}
      <FloatingTranslator />
    </TranslatorProvider>
  );
}
