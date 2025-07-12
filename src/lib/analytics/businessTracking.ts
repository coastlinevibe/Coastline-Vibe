import Analytics from 'analytics'
import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import { useEffect } from 'react'

// Define payload types for analytics
interface PagePayload {
  properties?: {
    businessId?: string;
    userId?: string;
    url?: string;
    referrer?: string;
    [key: string]: any;
  };
}

interface TrackPayload {
  event: string;
  properties?: {
    businessId?: string;
    userId?: string;
    elementId?: string;
    [key: string]: any;
  };
}

// Define analytics data types
interface BusinessAnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  totalInquiries: number;
  totalFavorites: number;
  viewsChange: number;
  visitorsChange: number;
  inquiriesChange: number;
  favoritesChange: number;
}

interface VisitorAnalytics {
  dailyViews: Array<{
    date: string;
    views: number;
    uniqueVisitors: number;
  }>;
  deviceTypes: Array<{
    device: string;
    count: number;
  }>;
  trafficSources: Array<{
    referrer: string;
    count: number;
  }>;
  countries: Array<{
    country: string;
    count: number;
  }>;
}

// Initialize a session ID if one doesn't exist
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return uuidv4()
  
  let sessionId = localStorage.getItem('coastline_session_id')
  if (!sessionId) {
    sessionId = uuidv4()
    localStorage.setItem('coastline_session_id', sessionId)
  }
  return sessionId
}

// Get user agent information
function getUserAgentInfo(): { deviceType: string; browser: string; os: string } {
  if (typeof window === 'undefined') {
    return { deviceType: 'server', browser: 'server', os: 'server' }
  }
  
  const ua = navigator.userAgent
  
  // Simple device detection
  let deviceType = 'desktop'
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
    deviceType = 'mobile'
  } else if (/Tablet|iPad/i.test(ua)) {
    deviceType = 'tablet'
  }
  
  // Simple browser detection
  let browser = 'unknown'
  if (/Chrome/i.test(ua)) browser = 'Chrome'
  else if (/Firefox/i.test(ua)) browser = 'Firefox'
  else if (/Safari/i.test(ua)) browser = 'Safari'
  else if (/Edge/i.test(ua)) browser = 'Edge'
  else if (/MSIE|Trident/i.test(ua)) browser = 'IE'
  
  // Simple OS detection
  let os = 'unknown'
  if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Macintosh|Mac OS/i.test(ua)) os = 'MacOS'
  else if (/Linux/i.test(ua)) os = 'Linux'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/iOS|iPhone|iPad|iPod/i.test(ua)) os = 'iOS'
  
  return { deviceType, browser, os }
}

// Create the analytics instance
export const businessAnalytics = Analytics({
  app: 'coastline-business-directory',
  plugins: [
    {
      name: 'business-analytics',
      // Track page views
      page: async ({ payload }: { payload: PagePayload }) => {
        const { businessId, userId } = payload.properties || {}
        if (!businessId) return
        
        const supabase = createClient()
        const sessionId = getOrCreateSessionId()
        const { deviceType, browser, os } = getUserAgentInfo()
        
        try {
          await supabase.rpc('track_business_page_view', {
            p_business_id: businessId,
            p_user_id: userId || null,
            p_session_id: sessionId,
            p_page_path: payload.properties?.url || (typeof window !== 'undefined' ? window.location.pathname : ''),
            p_referrer: payload.properties?.referrer || (typeof document !== 'undefined' ? document.referrer : ''),
            p_device_type: deviceType,
            p_browser: browser,
            p_os: os,
            p_country: null, // Would need a geolocation service
            p_region: null,
            p_city: null
          })
        } catch (error) {
          console.error('Error tracking page view:', error)
        }
      },
      
      // Track custom events
      track: async ({ payload }: { payload: TrackPayload }) => {
        const { businessId, userId, elementId } = payload.properties || {}
        if (!businessId) return
        
        const supabase = createClient()
        const sessionId = getOrCreateSessionId()
        
        try {
          await supabase.rpc('track_business_interaction', {
            p_business_id: businessId,
            p_user_id: userId || null,
            p_session_id: sessionId,
            p_interaction_type: payload.event,
            p_element_id: elementId || null,
            p_page_path: typeof window !== 'undefined' ? window.location.pathname : ''
          })
        } catch (error) {
          console.error('Error tracking interaction:', error)
        }
      }
    }
  ]
})

// Utility function to track a business page view
export function trackBusinessPageView(businessId: string, userId?: string) {
  businessAnalytics.page({
    properties: {
      businessId,
      userId
    }
  })
}

// Utility function to track a business interaction
export function trackBusinessInteraction(
  businessId: string, 
  interactionType: 'click' | 'inquiry' | 'favorite' | 'call' | 'directions' | 'website' | string,
  userId?: string,
  elementId?: string
) {
  businessAnalytics.track(interactionType, {
    businessId,
    userId,
    elementId
  })
}

// Utility function to get business analytics summary
export async function getBusinessAnalyticsSummary(
  businessId: string,
  startDate: string,
  endDate: string
): Promise<BusinessAnalyticsSummary | null> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.rpc('get_business_analytics_summary', {
      p_business_id: businessId,
      p_start_date: startDate,
      p_end_date: endDate
    })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching analytics summary:', error)
    return null
  }
}

// Utility function to get detailed visitor analytics
export async function getBusinessVisitorAnalytics(
  businessId: string,
  startDate: string,
  endDate: string
): Promise<VisitorAnalytics | null> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.rpc('get_business_visitor_analytics', {
      p_business_id: businessId,
      p_start_date: startDate,
      p_end_date: endDate
    })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching visitor analytics:', error)
    return null
  }
}

// Hook to track page view on component mount
export function useBusinessPageViewTracking(businessId?: string, userId?: string) {
  useEffect(() => {
    if (typeof window === 'undefined' || !businessId) return
    
    trackBusinessPageView(businessId, userId)
  }, [businessId, userId])
} 