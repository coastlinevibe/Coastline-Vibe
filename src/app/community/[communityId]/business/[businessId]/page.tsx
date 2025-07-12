"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter } from "next/navigation";
import AccommodationTemplate from "../../../../../components/templates/AccommodationTemplate";
import Link from "next/link";
import Breadcrumb from "../../../../../components/shared/Breadcrumb";
import BusinessInquiryForm from "../../../../../components/shared/BusinessInquiryForm";
import SocialShareButtons from "../../../../../components/shared/SocialShareButtons";
import FloatingSocialShare from "../../../../../components/shared/FloatingSocialShare";

type Business = {
  id: string;
  name: string;
  title?: string;
  description?: string;
  banner_url?: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  website?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  category?: { name: string };
  subcategory?: { name: string };
  is_verified?: boolean;
  amenities?: string[];
  gallery_urls?: string[];
  schedule?: {
    [key: string]: {
      open: string;
      close: string;
    } | null;
  };
  community_id?: string;
  average_rating?: number;
  review_count?: number;
  cover_url?: string;
  is_featured?: boolean;
  thumbnail_url?: string;
  facilities?: string[];
  business_types?: string[];
  menu_name?: string;
  menu_price?: string;
  menu_items?: string[];
  menu_image_url?: string;
  tags?: string[];
  contact_phone?: string;
  contact_email?: string;
  social_facebook?: string;
  social_twitter?: string;
  social_linkedin?: string;
  neighborhood?: string;
};

type Review = {
  id: string;
  business_id: string;
  user_id: string;
  rating: number;
  comment: string;
  community_id: string;
  created_at: string;
  updated_at?: string;
  is_edited?: boolean;
  user_email?: string;
  user_name?: string;
};

// Inquiry form type removed - now handled by BusinessInquiryForm component

export default function CommunityBusinessDetailPage() {
  const params = useParams();
  const businessId = params?.businessId as string;
  const communityId = params?.communityId as string;
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Business state
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Schedule state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentDay, setCurrentDay] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [timeUntilChange, setTimeUntilChange] = useState<string>('');
  const [statusTimer, setStatusTimer] = useState<any>(null);
  
  // Review state
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<{
    rating?: string;
    reviewText?: string;
  }>({});
  
  // Review management state
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(0);
  const [editReviewText, setEditReviewText] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editHoverRating, setEditHoverRating] = useState<number>(0);
  const [isUpdatingReview, setIsUpdatingReview] = useState<boolean>(false);
  
  // No longer needed inquiry form state - removed

  // Get current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setUserRole(profileData?.role || null);
      } else {
        setUserRole(null);
      }
    };
    
    getCurrentUser();
  }, [supabase]);

  // Format time to 12-hour format with AM/PM
  const formatTime = (timeStr: string): string => {
    if (!timeStr) return 'N/A';
    
    // If it's already in 12-hour format (contains AM/PM), return as is
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      return timeStr;
    }
    
    try {
      // Parse 24-hour format
      const [hourStr, minuteStr] = timeStr.split(':');
      let hours = parseInt(hourStr, 10);
      const minutes = parseInt(minuteStr, 10);
      
      // Convert to 12-hour format
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
      
      return `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${period}`;
    } catch (err) {
      console.error('Error formatting time:', timeStr, err);
      return timeStr; // Return original if parsing fails
    }
  };
  
  // Check for 24/7 business
  const check24HourBusiness = (schedule: any): boolean => {
    if (!schedule) return false;
    
    // Check if all days have the same open and close times
    const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // Check if all days have open and close times
    const hasAllDays = allDays.every(day => 
      schedule[day] && 
      schedule[day].open && 
      schedule[day].close
    );
    
    if (!hasAllDays) return false;
    
    // Check if all days have the same open and close times (00:00 - 23:59 or similar)
    const firstDay = schedule[allDays[0]];
    const openTime = convertTimeToMinutes(firstDay.open);
    const closeTime = convertTimeToMinutes(firstDay.close);
    
    // Check if open time is very early and close time is very late
    // or if they're the same (indicating 24 hours)
    if (
      (openTime <= 30 && closeTime >= 1410) || // 00:30 and 23:30
      (openTime === closeTime) || // Same time indicates 24 hours
      (openTime === 0 && closeTime === 1439) // 00:00 to 23:59
    ) {
      // Also check if all days have the same pattern
      return allDays.every(day => {
        const daySchedule = schedule[day];
        const dayOpenTime = convertTimeToMinutes(daySchedule.open);
        const dayCloseTime = convertTimeToMinutes(daySchedule.close);
        
        return (
          (dayOpenTime <= 30 && dayCloseTime >= 1410) ||
          (dayOpenTime === dayCloseTime) ||
          (dayOpenTime === 0 && dayCloseTime === 1439)
        );
      });
    }
    
    return false;
  };

  // Function to check if business is currently open
  const isCurrentlyOpen = (): boolean => {
    if (!business?.schedule) return false;
    
    // If business is 24/7, always return true
    if (isOpen) return true;
    
    // Get day of week in lowercase
    const today = currentDay.toLowerCase();
    const schedule = business.schedule[today];
    
    if (!schedule || !schedule.open || !schedule.close) return false;
    
    // Convert time strings to comparable values (minutes since midnight)
    const openTime = convertTimeToMinutes(schedule.open);
    const closeTime = convertTimeToMinutes(schedule.close);
    const now = convertTimeToMinutes(currentTime);
    
    // Handle regular hours (e.g., 9:00 AM - 5:00 PM)
    if (openTime < closeTime) {
      return now >= openTime && now < closeTime;
    } 
    // Handle overnight hours (e.g., 10:00 PM - 2:00 AM)
    else {
      return now >= openTime || now < closeTime;
    }
  };
  
  // Calculate time until opening or closing
  const calculateTimeUntilChange = (): string => {
    if (!business?.schedule || isOpen) return '';
    
    const today = currentDay.toLowerCase();
    const schedule = business.schedule[today];
    
    if (!schedule || !schedule.open || !schedule.close) return '';
    
    const openTime = convertTimeToMinutes(schedule.open);
    const closeTime = convertTimeToMinutes(schedule.close);
    const now = convertTimeToMinutes(currentTime);
    
    let minutesUntilChange = 0;
    let isOpening = false;
    
    // If currently open, calculate time until closing
    if (isCurrentlyOpen()) {
      if (closeTime > now) {
        // Normal case: closing time is later today
        minutesUntilChange = closeTime - now;
      } else {
        // Overnight case: closing time is tomorrow
        minutesUntilChange = (1440 - now) + closeTime;
      }
    } 
    // If currently closed, calculate time until opening
    else {
      isOpening = true;
      if (openTime > now) {
        // Opening later today
        minutesUntilChange = openTime - now;
      } else {
        // Find the next day's opening time
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const todayIndex = days.indexOf(today);
        let nextOpeningDay = '';
        let daysUntil = 0;
        
        // Check up to 7 days ahead to find the next opening day
        for (let i = 1; i <= 7; i++) {
          const nextDayIndex = (todayIndex + i) % 7;
          const nextDay = days[nextDayIndex];
          const nextDaySchedule = business.schedule[nextDay];
          
          if (nextDaySchedule && nextDaySchedule.open) {
            nextOpeningDay = nextDay;
            daysUntil = i;
            break;
          }
        }
        
        if (nextOpeningDay && business?.schedule && business.schedule[nextOpeningDay] && business.schedule[nextOpeningDay].open) {
          const nextOpenTime = convertTimeToMinutes(business.schedule[nextOpeningDay].open);
          minutesUntilChange = (1440 - now) + (daysUntil - 1) * 1440 + nextOpenTime;
        }
      }
    }
    
    // Format the time difference
    if (minutesUntilChange <= 0) return '';
    
    const hours = Math.floor(minutesUntilChange / 60);
    const minutes = minutesUntilChange % 60;
    
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${isOpening ? 'Opens' : 'Closes'} in ${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${isOpening ? 'Opens' : 'Closes'} in ${hours} hr${hours > 1 ? 's' : ''} ${minutes > 0 ? minutes + ' min' : ''}`;
    } else {
      return `${isOpening ? 'Opens' : 'Closes'} in ${minutes} min`;
    }
  };
  
  // Convert time string (e.g., "9:00 AM") to minutes since midnight
  const convertTimeToMinutes = (timeStr: string): number => {
    try {
      if (!timeStr) return 0;
      
      // Handle different time formats
      let hours = 0;
      let minutes = 0;
      
      // For "9:00 AM" format
      if (timeStr.includes(':') && (timeStr.includes('AM') || timeStr.includes('PM'))) {
        const [time, period] = timeStr.split(' ');
        const [hourStr, minuteStr] = time.split(':');
        
        hours = parseInt(hourStr, 10);
        minutes = parseInt(minuteStr, 10);
        
        // Convert 12-hour to 24-hour
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
      } 
      // For "09:00" 24-hour format
      else if (timeStr.includes(':')) {
        const [hourStr, minuteStr] = timeStr.split(':');
        hours = parseInt(hourStr, 10);
        minutes = parseInt(minuteStr, 10);
      }
      
      return hours * 60 + minutes;
    } catch (err) {
      console.error('Error parsing time:', timeStr, err);
      return 0;
    }
  };
  
  // Update current day and time
  useEffect(() => {
    const updateTimeInfo = () => {
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    setCurrentDay(days[now.getDay()]);
    
    // Format current time as HH:MM
    const hours = now.getHours();
    const minutes = now.getMinutes();
    setCurrentTime(`${hours}:${minutes < 10 ? '0' + minutes : minutes}`);
      
      // Update countdown
      if (business?.schedule) {
        setTimeUntilChange(calculateTimeUntilChange());
      }
    };
    
    // Run immediately
    updateTimeInfo();
    
    // Set up timer to update every minute
    const timer = setInterval(updateTimeInfo, 60000); // Update every minute
    
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.schedule]); // We're using calculateTimeUntilChange inside which uses business
  
  // Check if business is 24/7 when schedule data is available
  useEffect(() => {
    if (business?.schedule) {
      setIsOpen(check24HourBusiness(business.schedule));
    }
  }, [business?.schedule]);

  // Fetch reviews
  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from('business_reviews')
        .select('*, is_edited, updated_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get user details for each review
      const reviewsWithUserInfo = await Promise.all(data.map(async (review) => {
        try {
          // Try to get user info
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', review.user_id)
            .single();
          
          if (userError || !userData) {
            return {
              ...review,
              user_name: 'Anonymous User',
              user_email: ''
            };
          }
          
          return {
            ...review,
            user_name: userData.full_name || 'Anonymous User',
            user_email: userData.email || ''
          };
        } catch (err) {
          return {
            ...review,
            user_name: 'Anonymous User',
            user_email: ''
          };
        }
      }));
      
      setReviews(reviewsWithUserInfo);
      
      // Calculate average rating and update business
      if (reviewsWithUserInfo.length > 0) {
        const totalRating = reviewsWithUserInfo.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviewsWithUserInfo.length;
        
        // Update business with new rating and count
        const { error: updateError } = await supabase
          .from('businesses')
          .update({ 
            average_rating: averageRating,
            review_count: reviewsWithUserInfo.length
          })
          .eq('id', businessId);
          
        if (updateError) {
          console.error('Error updating business rating:', updateError);
        } else {
          // Update local business state with new rating info
          if (business) {
            setBusiness({
              ...business,
              average_rating: averageRating,
              review_count: reviewsWithUserInfo.length
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Fetch business data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select(`
            *,
            category:category_id(id, name),
            subcategory:subcategory_id(id, name)
          `)
          .eq("id", businessId)
          .single();

        if (error) {
          console.error("Error fetching business:", error);
          setError(error.message);
          setLoading(false);
          return;
        }

        if (!data) {
          setError("Business not found");
          setLoading(false);
          return;
        }

        // Format business data with correct field mappings
        const formattedBusiness: Business = {
          id: data.id,
          name: data.name || data.title || "Unnamed Business",
          title: data.title || data.name,
          description: data.description,
          banner_url: data.cover_image_url || data.cover_url,
          logo_url: data.logo_url || data.thumbnail_url,
          phone: data.phone || data.contact_phone,
          email: data.email || data.contact_email,
          website: data.website,
          facebook: data.social_facebook || data.facebook,
          twitter: data.social_twitter || data.twitter,
          linkedin: data.social_linkedin || data.linkedin,
          address: data.address,
          city: data.city,
          country: data.country,
          latitude: data.location_lat || data.latitude,
          longitude: data.location_lng || data.longitude,
          category: data.category,
          subcategory: data.subcategory,
          is_verified: data.is_verified || data.is_approved,
          amenities: data.amenities || [],
          gallery_urls: data.gallery_urls || [],
          schedule: data.schedule || {},
          community_id: data.community_id,
          average_rating: data.average_rating || data.rating,
          review_count: data.review_count || 0,
          cover_url: data.cover_image_url || data.cover_url,
          is_featured: data.is_featured,
          thumbnail_url: data.thumbnail_url || data.logo_url,
          facilities: data.facilities || [],
          business_types: data.business_types || [],
          menu_name: data.menu_name,
          menu_price: data.menu_price,
          menu_items: data.menu_items || [],
          menu_image_url: data.menu_image_url,
          tags: data.tags || [],
          neighborhood: data.neighborhood
        };
        
        console.log("Business data loaded:", formattedBusiness);
        
        setBusiness(formattedBusiness);
        
        // Also fetch reviews
        fetchReviews();
      } catch (err: any) {
        console.error("Error in fetchData:", err);
        setError(err.message || "An error occurred while fetching business data");
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      fetchData();
    }
  }, [supabase, businessId]);

  // Handle lightbox navigation
  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 
        ? ((business?.gallery_urls?.length || 1) - 1) 
        : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === ((business?.gallery_urls?.length || 1) - 1) 
        ? 0 
        : prevIndex + 1
    );
  };

  // Add review submission function
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setReviewError(null);
    setValidationErrors({});
    
    // Check if user is logged in
    if (!currentUser) {
      setReviewError("Please log in to submit a review");
      return;
    }
    
    // Validate input with better error handling
    const errors: {
      rating?: string;
      reviewText?: string;
    } = {};
    
    if (rating === 0) {
      errors.rating = "Please select a star rating";
    }
    
    if (reviewText.trim().length < 10) {
      errors.reviewText = "Please write a review with at least 10 characters";
    } else if (reviewText.trim().length > 500) {
      errors.reviewText = "Review cannot exceed 500 characters";
    }
    
    // If there are validation errors, show them and stop submission
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use the business's community_id directly
      if (!business || !business.community_id) {
        throw new Error("Business data is missing community information");
      }
      
      // Submit to Supabase using the business's community_id
      const { error } = await supabase
        .from('business_reviews')
        .insert([
          { 
            business_id: businessId,
            rating,
            comment: reviewText,
            community_id: business.community_id,
            user_id: currentUser.id
          }
        ]);
      
      if (error) throw error;
      
      // Show success message
      setReviewSubmitted(true);
      
      // Reset form
      setRating(0);
      setReviewText('');
      setHoverRating(0);
      
      // Refresh reviews list
      fetchReviews();
      
      // Refresh business data to show updated rating
      const refreshBusinessData = async () => {
        try {
          // Just get the business data directly
          const { data, error } = await supabase
            .from("businesses")
            .select("*, category:category_id(name), subcategory:subcategory_id(name)")
            .eq("id", businessId)
            .single();

          if (error) throw error;
          
          setBusiness(data);
        } catch (err: any) {
          console.error("Error refreshing business data:", err);
        }
      };
      
      refreshBusinessData();
      
    } catch (err: any) {
      console.error("Error submitting review:", err);
      setReviewError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add functions for review management
  const startEditingReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditReviewText(review.comment);
    setEditHoverRating(0);
  };

  const cancelEditingReview = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditReviewText('');
    setEditHoverRating(0);
  };

  const handleUpdateReview = async (reviewId: string) => {
    // Reset errors
    setReviewError(null);
    setValidationErrors({});
    
    // Validate input with better error handling
    const errors: {
      rating?: string;
      reviewText?: string;
    } = {};
    
    if (editRating === 0) {
      errors.rating = "Please select a star rating";
    }
    
    if (editReviewText.trim().length < 10) {
      errors.reviewText = "Please write a review with at least 10 characters";
    } else if (editReviewText.trim().length > 500) {
      errors.reviewText = "Review cannot exceed 500 characters";
    }
    
    // If there are validation errors, show them and stop submission
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsUpdatingReview(true);
    
    try {
      // Update the review in Supabase
      const { error } = await supabase
        .from('business_reviews')
        .update({ 
          rating: editRating,
          comment: editReviewText,
          updated_at: new Date().toISOString(),
          is_edited: true
        })
        .eq('id', reviewId);
      
      if (error) throw error;
      
      // Update the reviews array
      setReviews(prevReviews => 
        prevReviews.map(r => 
          r.id === reviewId 
            ? {
                ...r, 
                rating: editRating, 
                comment: editReviewText,
                updated_at: new Date().toISOString(),
                is_edited: true
              } 
            : r
        )
      );
      
      // Recalculate average rating
      const updatedReviews = reviews.map(r => 
        r.id === reviewId ? { ...r, rating: editRating } : r
      );
      
      if (updatedReviews.length > 0) {
        const totalRating = updatedReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / updatedReviews.length;
        
        // Update business with new rating
        const { error: updateError } = await supabase
          .from('businesses')
          .update({ average_rating: averageRating })
          .eq('id', businessId);
          
        if (updateError) {
          console.error('Error updating business rating:', updateError);
        } else if (business) {
          // Update local business state with new rating info
          setBusiness({
            ...business,
            average_rating: averageRating
          });
        }
      }
      
      // Reset editing state
      setEditingReviewId(null);
      setEditRating(0);
      setEditReviewText('');
      
    } catch (err: any) {
      console.error('Error updating review:', err);
      setReviewError(err.message || "Failed to update review. Please try again.");
    } finally {
      setIsUpdatingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      // Delete the review from Supabase
      const { error } = await supabase
        .from('business_reviews')
        .delete()
        .eq('id', reviewId);
      
      if (error) throw error;
      
      // Remove the review from the reviews array
      const updatedReviews = reviews.filter(r => r.id !== reviewId);
      setReviews(updatedReviews);
      
      // Recalculate average rating
      if (updatedReviews.length > 0) {
        const totalRating = updatedReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / updatedReviews.length;
        
        // Update business with new rating and count
        const { error: updateError } = await supabase
          .from('businesses')
          .update({ 
            average_rating: averageRating,
            review_count: updatedReviews.length
          })
          .eq('id', businessId);
          
        if (updateError) {
          console.error('Error updating business rating:', updateError);
        } else if (business) {
          // Update local business state with new rating info
          setBusiness({
            ...business,
            average_rating: averageRating,
            review_count: updatedReviews.length
          });
        }
      } else if (business) {
        // If no reviews left, reset rating to 0
        const { error: updateError } = await supabase
          .from('businesses')
          .update({ 
            average_rating: 0,
            review_count: 0
          })
          .eq('id', businessId);
          
        if (updateError) {
          console.error('Error updating business rating:', updateError);
        } else {
          // Update local business state
          setBusiness({
            ...business,
            average_rating: 0,
            review_count: 0
          });
        }
      }
      
      // Reset delete confirmation
      setShowDeleteConfirm(null);
      
    } catch (err: any) {
      console.error('Error deleting review:', err);
      setReviewError(err.message || "Failed to delete review. Please try again.");
    }
  };

  // Fetch current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user || null);
    };
    getCurrentUser();
  }, []);

  // Inquiry form logic removed as it's now handled by the BusinessInquiryForm component

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cyan-600">Loading...</div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-2">Error Loading Business</h2>
          <p>{error || "Could not find the requested business"}</p>
          <div className="mt-4 flex gap-4">
            <button 
              onClick={() => router.push(`/community/${communityId}/business/directory`)}
              className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700"
            >
              Back to Directory
            </button>
            <button 
              onClick={() => router.push(`/community/${communityId}/business/directory/my-businesses`)}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
            >
              My Businesses
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine which template to use based on the business category
  const categoryName = business.category?.name;
  
  if (categoryName === "Accommodations") {
    return <AccommodationTemplate business={business} userRole={userRole} />;
  }
  
  // Default template for other business types
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-blue-200 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumbs Navigation */}
        <Breadcrumb 
          items={[
            { label: 'Directory', href: `/community/${communityId}/business/directory` },
            { label: business.name || business.title || 'Business Details' }
          ]}
          className="text-xs sm:text-sm"
        />

        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          {userRole === 'business' && (
          <Link 
            href={`/community/${communityId}/business/directory/my-businesses`}
            className="flex items-center justify-center sm:justify-start text-cyan-700 hover:text-cyan-900 bg-white py-2 px-4 rounded-md shadow-sm"
          >
            <span>← Back to My Businesses</span>
          </Link>
          )}
          <button 
            onClick={() => router.push(`/community/${communityId}/business/directory`)}
            className="flex items-center justify-center text-cyan-700 hover:text-cyan-900 bg-white py-2 px-4 rounded-md shadow-sm"
          >
            Back to Directory
          </button>
        </div>
      
        {/* Business header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          {/* Display the business banner/cover image - check both possible field names */}
          {(business.banner_url || business.cover_url) && (
            <div className="relative h-40 sm:h-48 md:h-56 w-full">
              <img 
                src={business.banner_url || business.cover_url || '/placeholder-business.jpg'} 
                alt={business.name || "Business Cover"} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("Error loading banner/cover image");
                  e.currentTarget.src = '/placeholder-business.jpg';
                }}
              />
              {business.is_featured && (
                <div className="absolute top-2 right-2 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Featured
                </div>
              )}
            </div>
          )}
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
              {/* Display logo/thumbnail if available */}
              {(business.logo_url || business.thumbnail_url) && (
                <img 
                  src={business.logo_url || business.thumbnail_url} 
                  alt="Logo" 
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover border-2 border-white shadow-sm"
                  onError={(e) => {
                    console.error("Error loading logo/thumbnail image");
                    e.currentTarget.src = '/placeholder-business.jpg';
                  }}
                />
              )}
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-cyan-900">{business.name || business.title}</h1>
                <div className="flex flex-wrap gap-2 mt-1">
                    <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-xs font-medium">
                      {categoryName}
                    </span>
                  {business.subcategory && (
                      <span className="bg-cyan-50 text-cyan-700 px-2 py-1 rounded text-xs">
                        {business.subcategory?.name}
                      </span>
                  )}
                  </div>
                </div>
              </div>
              
              {/* Verification Badge */}
              <div className="flex flex-col sm:flex-row gap-2 items-center">
              <div className={`flex items-center gap-2 px-3 py-2 mt-2 sm:mt-0 rounded-lg ${
                business.is_verified 
                  ? "bg-emerald-100 text-emerald-700" 
                  : "bg-gray-100 text-gray-500"
              }`}>
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d={business.is_verified
                      ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    }
                  />
                </svg>
                <span className="font-medium">
                  {business.is_verified ? "Verified Business" : "Verification Pending"}
                </span>
                </div>
                
                {/* Social Share Buttons */}
                {business && (
                  <SocialShareButtons
                    url={typeof window !== 'undefined' ? window.location.href : `/community/${communityId}/business/${businessId}`}
                    title={business.name || business.title || 'Business'}
                    description={business.description || ''}
                    imageUrl={business.banner_url || business.cover_url || business.logo_url || ''}
                    className="mt-2 sm:mt-0"
                  />
                )}
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-700 whitespace-pre-line">{business.description}</p>
          </div>
        </div>
        
        {/* Contact & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-cyan-900 mb-4">Contact Information</h2>
            <div className="space-y-3 mb-6">
              {/* Use both field variations in case different naming conventions are used */}
              {(business.phone || business.contact_phone) && (
                <p className="flex items-center gap-2 text-sm sm:text-base">
                  <span className="text-cyan-500 flex-shrink-0">📞</span> {business.phone || business.contact_phone}
                </p>
              )}
              
              {(business.email || business.contact_email) && (
                <p className="flex items-center gap-2 text-sm sm:text-base">
                  <span className="text-cyan-500 flex-shrink-0">✉️</span> 
                  <span className="break-all">{business.email || business.contact_email}</span>
                </p>
              )}
              
              {business.website && (
                <p className="flex items-center gap-2 text-sm sm:text-base">
                  <span className="text-cyan-500 flex-shrink-0">🌐</span>
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline break-all">{business.website}</a>
                </p>
              )}
              
              {/* Social media links */}
              {(business.facebook || business.social_facebook) && (
                <p className="flex items-center gap-2 text-sm sm:text-base">
                  <span className="text-cyan-500 flex-shrink-0">👍</span>
                  <a 
                    href={business.facebook || business.social_facebook} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-cyan-600 hover:underline"
                  >
                    Facebook
                  </a>
                </p>
              )}
              
              {(business.twitter || business.social_twitter) && (
                <p className="flex items-center gap-2 text-sm sm:text-base">
                  <span className="text-cyan-500 flex-shrink-0">🐦</span>
                  <a 
                    href={business.twitter || business.social_twitter} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-cyan-600 hover:underline"
                  >
                    Twitter
                  </a>
                </p>
              )}
              
              {(business.linkedin || business.social_linkedin) && (
                <p className="flex items-center gap-2 text-sm sm:text-base">
                  <span className="text-cyan-500 flex-shrink-0">💼</span>
                  <a 
                    href={business.linkedin || business.social_linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-cyan-600 hover:underline"
                  >
                    LinkedIn
                  </a>
                </p>
              )}
            </div>
            
            {/* Contact CTA Buttons */}
            <div className="flex flex-col gap-3 mt-4">
              {business.website && (
                <a 
                  href={business.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center gap-2 bg-cyan-600 text-white py-3 sm:py-2 px-4 rounded-md hover:bg-cyan-700 transition-colors text-sm sm:text-base"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Visit Website
                </a>
              )}
              
              {(business.phone || business.contact_phone) && (
                <a 
                  href={`tel:${business.phone || business.contact_phone}`} 
                  className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 sm:py-2 px-4 rounded-md hover:bg-emerald-700 transition-colors text-sm sm:text-base"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Now
                </a>
              )}
              
              {(business.email || business.contact_email) && (
                <a 
                  href={`mailto:${business.email || business.contact_email}`} 
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 sm:py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Email
                </a>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-cyan-900 mb-4">Location</h2>
            <div className="space-y-3 mb-5">
              {business.address && <p className="flex items-center gap-2 text-sm sm:text-base"><span className="text-cyan-500">📍</span> {business.address}</p>}
              {business.neighborhood && <p className="flex items-center gap-2 text-sm sm:text-base"><span className="text-cyan-500">🏘️</span> {business.neighborhood}</p>}
              {(business.city || business.country) && (
                <p className="flex items-center gap-2 text-sm sm:text-base">
                  <span className="text-cyan-500">🏙️</span> 
                  {[business.city, business.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            
            {/* Embedded Map */}
            {(business.latitude && business.longitude) ? (
              <div className="w-full">
                <div className="rounded-lg overflow-hidden h-48 sm:h-56 md:h-64 mb-3 relative">
                  <iframe
                    title={`Map location for ${business.name}`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${business.latitude},${business.longitude}&zoom=15`}
                    allowFullScreen
                  ></iframe>
                  
                  {/* Map Overlay Info Window */}
                  <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-2 sm:p-3 max-w-[80%]">
                    <div className="text-xs sm:text-sm font-medium text-gray-800 truncate">{business.name}</div>
                    {business.address && <div className="text-xs text-gray-600 truncate">{business.address}</div>}
                  </div>
                </div>
                
                {/* Get Directions Button */}
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-cyan-600 text-white py-3 sm:py-2 px-4 rounded-md hover:bg-cyan-700 transition-colors w-full text-sm sm:text-base"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Get Directions
                </a>
                
                {/* Nearby Points of Interest Links */}
                <div className="mt-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Find nearby:</p>
                  <div className="flex flex-wrap gap-2">
                    {["Restaurants", "Hotels", "Attractions", "Shopping", "Coffee"].map(place => (
                      <a
                        key={place}
                        href={`https://www.google.com/maps/search/${place}+near+${business.latitude},${business.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
                      >
                        {place}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 h-32 sm:h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center p-4">
                  <p className="text-gray-500 mb-2 text-sm">Map location not available</p>
                  {business.address && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([business.address, business.city, business.country].filter(Boolean).join(', '))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-600 hover:underline text-xs sm:text-sm inline-flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Search address on Google Maps
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Amenities (if available) */}
        {business.amenities && business.amenities.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-cyan-900 mb-4">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {business.amenities.map((amenity: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-cyan-500">✓</span>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Facilities (if available) */}
        {business.facilities && business.facilities.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-cyan-900 mb-4">Facilities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {business.facilities.map((facility: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>{facility}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Business Types (if available) */}
        {business.business_types && business.business_types.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-cyan-900 mb-4">Business Types</h2>
            <div className="flex flex-wrap gap-2">
              {business.business_types.map((type: string, idx: number) => (
                <div key={idx} className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm">
                  {type}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Business image gallery */}
        {business.gallery_urls && business.gallery_urls.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-cyan-900 mb-4">Photo Gallery</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
              {business.gallery_urls.map((url, index) => (
                <div 
                  key={index} 
                  className="relative h-24 sm:h-32 rounded-lg overflow-hidden cursor-pointer border border-gray-200 hover:opacity-90 transition-opacity"
                  onClick={() => openLightbox(index)}
                >
                  <img 
                    src={url} 
                    alt={`${business.name} gallery ${index + 1}`} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Error loading gallery image");
                      e.currentTarget.src = '/placeholder-business.jpg';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-cyan-900">Customer Reviews</h2>
              <div className="flex items-center mt-1">
                <div className="flex items-center mr-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                  <svg 
                      key={i}
                      className={`w-4 h-4 ${i < (business.average_rating || 0) ? "text-yellow-400" : "text-gray-300"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
                <span className="text-sm text-gray-600">
                  {business.average_rating?.toFixed(1) || '0.0'} ({business.review_count || 0} reviews)
                </span>
              </div>
            </div>
          </div>
          
          {/* Write a review form */}
          {currentUser && !editingReviewId && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Share Your Experience</h3>
              
              <form onSubmit={handleReviewSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="p-1 focus:outline-none"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                      >
                        <svg 
                          className={`w-6 h-6 ${
                            (hoverRating || rating) >= star ? "text-yellow-400" : "text-gray-300"
                          } transition-colors`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  {validationErrors.rating && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.rating}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="review-text" className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                  <textarea
                    id="review-text"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                    placeholder="Share your experience with this business..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  ></textarea>
                  {validationErrors.reviewText && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.reviewText}</p>
                  )}
                </div>
                
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-md shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 text-sm font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            </div>
            )}

          {/* Review submission success message */}
          {reviewSubmitted && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
              <p className="text-sm">Your review has been submitted successfully!</p>
          </div>
          )}
          
          {/* Reviews list */}
          <div className="space-y-4">
            {loadingReviews ? (
              <div className="py-4 text-center text-gray-500">Loading reviews...</div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <div 
                  key={review.id} 
                  className="border-t border-gray-200 pt-4 first:border-t-0 first:pt-0"
                >
                  {/* Display review or edit form */}
                    {editingReviewId === review.id ? (
                    // Edit review form
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Edit Your Review</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                className="p-1 focus:outline-none"
                                onClick={() => setEditRating(star)}
                                onMouseEnter={() => setEditHoverRating(star)}
                                onMouseLeave={() => setEditHoverRating(0)}
                              >
                                <svg 
                                  className={`w-6 h-6 ${
                                    (editHoverRating || editRating) >= star ? "text-yellow-400" : "text-gray-300"
                                  } transition-colors`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="edit-review-text" className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                          <textarea
                            id="edit-review-text"
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                            value={editReviewText}
                            onChange={(e) => setEditReviewText(e.target.value)}
                          ></textarea>
                        </div>
                        
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEditingReview}
                            className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 text-xs sm:text-sm font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateReview(review.id)}
                            disabled={isUpdatingReview}
                            className="px-3 py-1.5 bg-cyan-600 text-white rounded-md shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 text-xs sm:text-sm font-medium disabled:opacity-50"
                          >
                            {isUpdatingReview ? "Updating..." : "Update Review"}
                          </button>
                        </div>
                        </div>
                      </div>
                    ) : (
                    // Review display
                      <div>
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center">
                          <div className="rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-white w-8 h-8 flex items-center justify-center font-medium text-sm">
                            {review.user_name?.charAt(0) || review.user_email?.charAt(0) || "?"}
                          </div>
                          <div className="ml-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {review.user_name || review.user_email?.split('@')[0] || "Anonymous"}
                            </h4>
                            <div className="flex items-center">
                              <div className="flex mr-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg 
                              key={star}
                                    className={`w-3.5 h-3.5 ${star <= review.rating ? "text-yellow-400" : "text-gray-300"}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                              <time className="text-xs text-gray-500" dateTime={review.created_at}>
                        {new Date(review.created_at).toLocaleDateString()}
                              </time>
                              {review.is_edited && (
                                <span className="text-xs text-gray-500 ml-1">(edited)</span>
                              )}
                            </div>
                          </div>
                      </div>
                            
                        {/* Review Management Controls (for user's own reviews) */}
                            {currentUser && currentUser.id === review.user_id && (
                          <div className="flex items-center space-x-2 ml-2">
                                <button 
                              type="button"
                                  onClick={() => startEditingReview(review)}
                                  className="text-xs text-cyan-600 hover:text-cyan-800"
                              aria-label="Edit review"
                                >
                                  Edit
                                </button>
                                <button 
                              type="button"
                                  onClick={() => setShowDeleteConfirm(review.id)}
                                  className="text-xs text-red-600 hover:text-red-800"
                              aria-label="Delete review"
                                >
                                  Delete
                                </button>
                    </div>
                            )}
      </div>
      
                      <div className="mt-1 text-sm text-gray-700 whitespace-pre-line">{review.comment}</div>
      
                      {/* Delete confirmation */}
                      {showDeleteConfirm === review.id && (
                        <div className="mt-3 p-2 sm:p-3 border border-red-200 bg-red-50 rounded-md">
                          <p className="text-xs sm:text-sm text-red-600 mb-2">Are you sure you want to delete this review? This action cannot be undone.</p>
                          <div className="flex justify-end space-x-2">
          <button 
                              type="button"
                              onClick={() => setShowDeleteConfirm(null)}
                              className="px-2 py-1 text-xs border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50"
                            >
                              Cancel
          </button>
          <button 
                              type="button"
                              onClick={() => handleDeleteReview(review.id)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                              Delete
          </button>
            </div>
          </div>
                      )}
              </div>
                  )}
            </div>
              ))
            ) : (
              <div className="py-4 text-center text-gray-500">
                <p className="text-sm mb-1">No reviews yet.</p>
                <p className="text-xs text-gray-400">Be the first to share your experience!</p>
          </div>
        )}
          </div>
        </div>
      </div>
      
      {/* Floating Social Share Button */}
      {business && (
        <FloatingSocialShare
          url={typeof window !== 'undefined' ? window.location.href : `/community/${communityId}/business/${businessId}`}
          title={business.name || business.title || 'Business'}
          description={business.description || ''}
          imageUrl={business.banner_url || business.cover_url || business.logo_url || ''}
        />
        )}
    </div>
  );
} 