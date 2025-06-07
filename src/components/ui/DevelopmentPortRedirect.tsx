'use client';

import { useEffect, useState } from 'react';

/**
 * This component redirects users from the default port 3000 to port 3001
 * during development mode. This helps avoid API call issues when the server
 * is running on a different port than the one the user is accessing.
 */
export default function DevelopmentPortRedirect() {
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    // Only run in browser and in development mode
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && !redirectAttempted) {
      const currentUrl = window.location.href;
      
      // Check if the user is on port 3000
      if (currentUrl.includes('localhost:3000')) {
        setRedirectAttempted(true);
        
        // Check if port 3001 is available before redirecting
        const checkPort = async () => {
          const newUrl = currentUrl.replace('localhost:3000', 'localhost:3001');
          
          try {
            // Attempt to fetch from the target port to see if it's available
            const response = await fetch(newUrl, { 
              method: 'HEAD',
              mode: 'no-cors',
              cache: 'no-cache',
              credentials: 'same-origin',
              redirect: 'follow',
              referrerPolicy: 'no-referrer',
            });
            
            // If we got here, the port is likely reachable
            console.log(`Port 3001 is available. Redirecting from ${currentUrl} to ${newUrl}`);
            window.location.href = newUrl;
          } catch (error) {
            // If there's an error, port 3001 might not be running
            console.error('Error checking port 3001:', error);
            console.log('Continuing on port 3000 as port 3001 appears to be unavailable');
            
            // Add a warning to the console for developers
            console.warn(
              'WARNING: You are running on port 3000, but the app is configured for port 3001.\n' +
              'This might cause API issues. Please start the server with:\n' +
              'PORT=3001 npm run dev'
            );
          }
        };
        
        checkPort();
      }
    }
  }, [redirectAttempted]);

  // This component doesn't render anything
  return null;
} 