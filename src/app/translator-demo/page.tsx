'use client';

import React from 'react';

export default function TranslatorDemo() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Translator Demo</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">How to use</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Select any text on this page</li>
            <li>Click on the translation icon that appears</li>
            <li>View translations in the popup</li>
            <li>Switch between 1-way, 2-way, and 3-way translation modes</li>
            <li>Change languages using the dropdown menus</li>
          </ol>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Sample Text (English)</h2>
            <p className="mb-4">
              Hello! This is a sample text that you can select to test the translator.
              The translator will automatically detect when you select text and show
              an icon that you can click to translate.
            </p>
            <p>
              You can try selecting different parts of this text to see how the
              translator works. You can also change the translation languages and
              modes in the translator popup.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Texto de muestra (Spanish)</h2>
            <p className="mb-4">
              ¡Hola! Este es un texto de muestra que puedes seleccionar para probar el traductor.
              El traductor detectará automáticamente cuando selecciones texto y mostrará
              un icono en el que puedes hacer clic para traducir.
            </p>
            <p>
              Puedes intentar seleccionar diferentes partes de este texto para ver cómo
              funciona el traductor. También puedes cambiar los idiomas de traducción y
              los modos en la ventana emergente del traductor.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Exemple de texte (French)</h2>
            <p className="mb-4">
              Bonjour! Ceci est un exemple de texte que vous pouvez sélectionner pour tester le traducteur.
              Le traducteur détectera automatiquement lorsque vous sélectionnez du texte et affichera
              une icône sur laquelle vous pouvez cliquer pour traduire.
            </p>
            <p>
              Vous pouvez essayer de sélectionner différentes parties de ce texte pour voir comment
              fonctionne le traducteur. Vous pouvez également modifier les langues de traduction et
              les modes dans la fenêtre contextuelle du traducteur.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Beispieltext (German)</h2>
            <p className="mb-4">
              Hallo! Dies ist ein Beispieltext, den Sie auswählen können, um den Übersetzer zu testen.
              Der Übersetzer erkennt automatisch, wenn Sie Text auswählen, und zeigt
              ein Symbol an, auf das Sie klicken können, um zu übersetzen.
            </p>
            <p>
              Sie können versuchen, verschiedene Teile dieses Textes auszuwählen, um zu sehen, wie der
              Übersetzer funktioniert. Sie können auch die Übersetzungssprachen und
              Modi im Übersetzer-Popup ändern.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
