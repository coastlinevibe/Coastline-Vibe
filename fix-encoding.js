const fs = require('fs');

// Content for index.ts
const content = `// Export all translator components
export { default as Translator } from './Translator';
export { default as TranslatorPopup } from './TranslatorPopup';
export { default as FloatingTranslator } from './FloatingTranslator';
export { useTranslator, TranslatorProvider } from './TranslatorContext';
export * from './types';
`;

// Write the file with UTF-8 encoding
fs.writeFileSync('./src/components/translator/index.ts', content, 'utf8');

console.log('File written successfully!');
