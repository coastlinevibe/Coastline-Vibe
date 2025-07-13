import { useEffect, useCallback } from 'react';

// useLastSeenUpdater is disabled because it depends on @supabase/auth-helpers-react, which is not installed.
// To re-enable, restore the import and implementation.

// const supabase = useSupabaseClient();
// const user = useUser();

// const updateUserLastSeen = useCallback(async () => {
//   if (!user || !supabase) {
//     // console.log('User not available or Supabase client not ready for last_seen update.');
//     return;
//   }
//   try {
//     const { error } = await supabase.functions.invoke('update-last-seen', {
//       method: 'POST', // Ensure method is POST as expected by the function
//     });
//     if (error) {
//       console.error('Error updating last_seen_at:', error.message);
//     } else {
//       // console.log('Successfully pinged update-last-seen');
//     }
//   } catch (e: any) {
//     console.error('Exception when calling update-last-seen function:', e.message);
//   }
// }, [supabase, user]);

// useEffect(() => {
//   if (!user) return;
//   // Initial call
//   updateUserLastSeen();
//   // Set up interval
//   const intervalId = setInterval(updateUserLastSeen, UPDATE_INTERVAL_MS);
//   // Add event listener for visibility change
//   const handleVisibilityChange = () => {
//     if (document.visibilityState === 'visible') {
//       updateUserLastSeen();
//     }
//   };
//   document.addEventListener('visibilitychange', handleVisibilityChange);
//   // Cleanup
//   return () => {
//     clearInterval(intervalId);
//     document.removeEventListener('visibilitychange', handleVisibilityChange);
//   };
// }, [updateUserLastSeen, user]); 