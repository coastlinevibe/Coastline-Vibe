import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Check, X, Flag, AlertTriangle, MessageSquare, User, Star, MoreHorizontal, Search } from 'lucide-react';

interface Review {
  id: string;
  business_id: string;
  user_id: string;
  content: string;
  rating: number;
  created_at: string;
  is_reported: boolean;
  report_reason?: string;
  report_details?: string;
  report_date?: string;
  reported_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  business_name?: string;
  user_name?: string;
  user_avatar?: string;
}

interface ReviewModerationPanelProps {
  communityId: string;
}

const ReviewModerationPanel: React.FC<ReviewModerationPanelProps> = ({ communityId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchReportedReviews();
  }, [communityId, filter]);

  const fetchReportedReviews = async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would fetch from a reports table joined with reviews
      // For now, we'll use mock data
      const mockReviews: Review[] = [
        {
          id: '1',
          business_id: 'business-1',
          user_id: 'user-1',
          content: 'This place is terrible! The owner is a scammer and should be shut down immediately!',
          rating: 1,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          is_reported: true,
          report_reason: 'harassment',
          report_details: 'This review contains personal attacks and false accusations',
          report_date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
          reported_by: 'business-owner-1',
          status: 'pending',
          business_name: 'Beach Cafe',
          user_name: 'AngryCustomer123',
          user_avatar: '/placeholder-avatar.png'
        },
        {
          id: '2',
          business_id: 'business-2',
          user_id: 'user-2',
          content: 'I found bugs in my food. DO NOT EAT HERE! I got sick for days after eating here. Worst restaurant in town!',
          rating: 1,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
          is_reported: true,
          report_reason: 'misinformation',
          report_details: 'This review contains false information that could harm our business',
          report_date: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 36 hours ago
          reported_by: 'business-owner-2',
          status: 'pending',
          business_name: 'Seaside Grill',
          user_name: 'FoodCritic99',
          user_avatar: '/placeholder-avatar.png'
        },
        {
          id: '3',
          business_id: 'business-3',
          user_id: 'user-3',
          content: 'The owner was rude and discriminated against me because of my race. Avoid this place!',
          rating: 1,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
          is_reported: true,
          report_reason: 'hate_speech',
          report_details: 'This review makes false accusations of discrimination',
          report_date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 24 hours ago
          reported_by: 'business-owner-3',
          status: 'pending',
          business_name: 'Ocean View Hotel',
          user_name: 'TravelLover22',
          user_avatar: '/placeholder-avatar.png'
        },
        {
          id: '4',
          business_id: 'business-1',
          user_id: 'user-4',
          content: 'This business is a front for illegal activities. I saw suspicious activities in the back room.',
          rating: 1,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
          is_reported: true,
          report_reason: 'misinformation',
          report_details: 'This review makes serious false allegations about illegal activities',
          report_date: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
          reported_by: 'business-owner-1',
          status: 'pending',
          business_name: 'Beach Cafe',
          user_name: 'LocalResident45',
          user_avatar: '/placeholder-avatar.png'
        },
        {
          id: '5',
          business_id: 'business-4',
          user_id: 'user-5',
          content: 'The staff was extremely rude and unprofessional. They need better training.',
          rating: 2,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
          is_reported: true,
          report_reason: 'inappropriate',
          report_details: 'This review is unfair and does not reflect our service standards',
          report_date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 48 hours ago
          reported_by: 'business-owner-4',
          status: 'approved', // This one was reviewed and approved to stay
          business_name: 'Palm Tree Spa',
          user_name: 'SpaEnthusiast',
          user_avatar: '/placeholder-avatar.png'
        },
        {
          id: '6',
          business_id: 'business-5',
          user_id: 'user-6',
          content: 'Worst service ever! The manager is incompetent and should be fired immediately!',
          rating: 1,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
          is_reported: true,
          report_reason: 'harassment',
          report_details: 'This review personally attacks our staff',
          report_date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 72 hours ago
          reported_by: 'business-owner-5',
          status: 'rejected', // This one was reviewed and rejected (hidden)
          business_name: 'Sunset Restaurant',
          user_name: 'FoodieCritic',
          user_avatar: '/placeholder-avatar.png'
        }
      ];

      // Filter based on current filter selection
      let filteredReviews = mockReviews;
      if (filter !== 'all') {
        filteredReviews = mockReviews.filter(review => review.status === filter);
      }

      // Apply search if there is a search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredReviews = filteredReviews.filter(review => 
          review.content.toLowerCase().includes(term) || 
          review.business_name?.toLowerCase().includes(term) ||
          review.user_name?.toLowerCase().includes(term)
        );
      }

      setReviews(filteredReviews);
    } catch (err) {
      console.error('Error fetching reported reviews:', err);
      setError('Failed to load reported reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    setActionLoading(true);
    try {
      // In a real implementation, this would update the database
      // For now, we'll just update the local state
      setReviews(prevReviews => 
        prevReviews.map(review => 
          review.id === reviewId ? { ...review, status: 'approved' } : review
        )
      );
      
      if (selectedReview?.id === reviewId) {
        setSelectedReview({ ...selectedReview, status: 'approved' });
      }
      
      setSuccessMessage('Review has been approved and will remain visible');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error approving review:', err);
      setError('Failed to approve review. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    setActionLoading(true);
    try {
      // In a real implementation, this would update the database
      // For now, we'll just update the local state
      setReviews(prevReviews => 
        prevReviews.map(review => 
          review.id === reviewId ? { ...review, status: 'rejected' } : review
        )
      );
      
      if (selectedReview?.id === reviewId) {
        setSelectedReview({ ...selectedReview, status: 'rejected' });
      }
      
      setSuccessMessage('Review has been rejected and hidden from public view');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error rejecting review:', err);
      setError('Failed to reject review. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this review? This action cannot be undone.')) {
      return;
    }
    
    setActionLoading(true);
    try {
      // In a real implementation, this would delete from the database
      // For now, we'll just remove from the local state
      setReviews(prevReviews => prevReviews.filter(review => review.id !== reviewId));
      
      if (selectedReview?.id === reviewId) {
        setSelectedReview(null);
      }
      
      setSuccessMessage('Review has been permanently deleted');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting review:', err);
      setError('Failed to delete review. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star}
            size={16}
            className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Review Moderation</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage reported reviews to maintain community standards
        </p>
      </div>

      <div className="p-6 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === 'all' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === 'pending' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === 'approved' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === 'rejected' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              Rejected
            </button>
          </div>
          
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reviews..."
              className="pl-10 pr-4 py-2 border rounded-md w-full md:w-64"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-100 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        {/* Reviews List */}
        <div className="md:w-1/2 border-r">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-6 text-center">
              <Flag className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No reported reviews found</p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-blue-500 hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {reviews.map(review => (
                <div 
                  key={review.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedReview?.id === review.id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedReview(review)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{review.business_name}</p>
                      <div className="flex items-center mt-1">
                        {renderStars(review.rating)}
                        <span className="text-xs text-gray-500 ml-2">
                          by {review.user_name}
                        </span>
                      </div>
                    </div>
                    <div>
                      {review.status === 'pending' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <AlertTriangle size={12} className="mr-1" />
                          Pending
                        </span>
                      )}
                      {review.status === 'approved' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check size={12} className="mr-1" />
                          Approved
                        </span>
                      )}
                      {review.status === 'rejected' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <X size={12} className="mr-1" />
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{review.content}</p>
                  
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <div>
                      <Flag size={12} className="inline mr-1 text-red-500" />
                      Reported for: {review.report_reason?.replace('_', ' ')}
                    </div>
                    <div>
                      {new Date(review.report_date || '').toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Review Details */}
        <div className="md:w-1/2">
          {selectedReview ? (
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">{selectedReview.business_name}</h3>
                  <div className="flex items-center mt-1">
                    {renderStars(selectedReview.rating)}
                    <span className="ml-2 text-sm text-gray-500">
                      {new Date(selectedReview.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div>
                  {selectedReview.status === 'pending' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      <AlertTriangle size={12} className="mr-1" />
                      Pending Review
                    </span>
                  )}
                  {selectedReview.status === 'approved' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Check size={12} className="mr-1" />
                      Approved
                    </span>
                  )}
                  {selectedReview.status === 'rejected' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <X size={12} className="mr-1" />
                      Rejected
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center mb-6">
                <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                  {selectedReview.user_avatar ? (
                    <img 
                      src={selectedReview.user_avatar} 
                      alt={selectedReview.user_name} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-full w-full p-2 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{selectedReview.user_name}</p>
                  <p className="text-xs text-gray-500">User ID: {selectedReview.user_id}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <p className="text-gray-700">{selectedReview.content}</p>
              </div>
              
              <div className="border-t pt-4 mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Report Details</h4>
                <div className="bg-red-50 border border-red-100 rounded-md p-3">
                  <p className="text-sm mb-2">
                    <span className="font-medium">Reason:</span> {selectedReview.report_reason?.replace('_', ' ')}
                  </p>
                  <p className="text-sm mb-2">
                    <span className="font-medium">Reported on:</span> {new Date(selectedReview.report_date || '').toLocaleString()}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Details:</span> {selectedReview.report_details || 'No additional details provided'}
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-2">Moderation Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleApproveReview(selectedReview.id)}
                    disabled={actionLoading || selectedReview.status === 'approved'}
                    className={`flex items-center px-3 py-2 rounded-md text-sm ${
                      selectedReview.status === 'approved'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    <Check size={16} className="mr-1" />
                    Approve Review
                  </button>
                  
                  <button
                    onClick={() => handleRejectReview(selectedReview.id)}
                    disabled={actionLoading || selectedReview.status === 'rejected'}
                    className={`flex items-center px-3 py-2 rounded-md text-sm ${
                      selectedReview.status === 'rejected'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    <X size={16} className="mr-1" />
                    Reject & Hide
                  </button>
                  
                  <button
                    onClick={() => handleDeleteReview(selectedReview.id)}
                    disabled={actionLoading}
                    className="flex items-center px-3 py-2 rounded-md text-sm bg-gray-800 text-white hover:bg-gray-900"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    Delete Permanently
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Select a review to see details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewModerationPanel; 