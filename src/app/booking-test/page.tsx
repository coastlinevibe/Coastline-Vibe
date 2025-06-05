import React from 'react';

export default function BookingTestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Booking Flow Components</h1>
      
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-8">
        <p className="font-bold">Component Compatibility Notice</p>
        <p>
          The spinner components (DateSpinner, GuestSpinner, BedAndExtrasSpinner, AmenitiesSpinner) 
          are built with React Native and cannot be directly rendered in this web application.
        </p>
      </div>
      
      <h2 className="text-2xl font-semibold mb-4">Testing Options:</h2>
      
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-medium mb-2">Option 1: Create a React Native Project</h3>
          <p className="mb-2">To test these components properly, create a React Native project and import them there.</p>
          <pre className="bg-gray-100 p-3 rounded">
            {`npx react-native init BookingApp
cd BookingApp
# Copy component files to the new project
# Install required dependencies
npm install react-native-vector-icons
# Run the app
npx react-native run-android
# or
npx react-native run-ios`}
          </pre>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-medium mb-2">Option 2: Adapt Components for Web</h3>
          <p className="mb-2">Convert the React Native components to use web-compatible elements.</p>
          <p>This requires replacing:</p>
          <ul className="list-disc pl-6 mb-2">
            <li>React Native components (View, Text, etc.) with HTML elements</li>
            <li>PanResponder with web drag-and-drop APIs</li>
            <li>Animated with CSS animations</li>
            <li>Vector icons with web-compatible icon libraries</li>
          </ul>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-medium mb-2">Option 3: Use React Native Web</h3>
          <p className="mb-2">Integrate React Native Web to run React Native components in the browser.</p>
          <pre className="bg-gray-100 p-3 rounded">
            {`npm install react-native-web
# Additional configuration required`}
          </pre>
        </div>
      </div>
    </div>
  );
} 