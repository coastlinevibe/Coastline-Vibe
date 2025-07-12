"use client";

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Check, Clock, Archive, Star, AlertCircle, ChevronDown, Search, RefreshCw, Inbox, Filter } from 'lucide-react';

// Interface for business inquiry
interface BusinessInquiry {
  id: string;
  business_id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'spam';
  community_id: string | null;
  created_at: string;
  updated_at: string | null;
  is_archived: boolean;
  is_spam: boolean;
}

const BusinessInquiryInbox: React.FC<{ businessId: string }> = ({ businessId }) => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // State
  const [inquiries, setInquiries] = useState<BusinessInquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<BusinessInquiry | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'archived' | 'spam'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Fetch inquiries
  useEffect(() => {
    const fetchInquiries = async () => {
      setLoading(true);
      try {
        // Calculate range for pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        
        // Base query
        let query = supabase
          .from('business_inquiries')
          .select('*', { count: 'exact' })
          .eq('business_id', businessId);
        
        // Apply filters
        if (filter === 'unread') {
          query = query.eq('status', 'unread');
        } else if (filter === 'read') {
          query = query.eq('status', 'read');
        } else if (filter === 'archived') {
          query = query.eq('is_archived', true);
        } else if (filter === 'spam') {
          query = query.eq('is_spam', true);
        }
        
        // Apply search if provided
        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`);
        }
        
        // Apply sorting
        query = query.order('created_at', { ascending: sortOrder === 'oldest' });
        
        // Apply pagination
        query = query.range(from, to);
        
        // Execute query
        const { data, error, count } = await query;
        
        if (error) throw error;
        
        setInquiries(data || []);
        if (count !== null) setTotalCount(count);
      } catch (err: unknown) {
        console.error('Error fetching inquiries:', err);
        if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
          setError((err as any).message);
        } else {
          setError('An error occurred while fetching inquiries.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchInquiries();
  }, [businessId, filter, searchTerm, sortOrder, page, pageSize, refreshTrigger]);

  // Mark inquiry as read
  const markAsRead = async (inquiry: BusinessInquiry) => {
    if (inquiry.status === 'unread') {
      try {
        const { error } = await supabase
          .from('business_inquiries')
          .update({ status: 'read', updated_at: new Date().toISOString() })
          .eq('id', inquiry.id);
        
        if (error) throw error;
        
        // Update local state
        setInquiries(prev => 
          prev.map(i => i.id === inquiry.id ? { ...i, status: 'read', updated_at: new Date().toISOString() } : i)
        );
        
        if (selectedInquiry?.id === inquiry.id) {
          setSelectedInquiry({ ...selectedInquiry, status: 'read', updated_at: new Date().toISOString() });
        }
      } catch (err: unknown) {
        console.error('Error marking inquiry as read:', err);
      }
    }
  };

  // Mark inquiry as replied
  const markAsReplied = async (inquiry: BusinessInquiry) => {
    try {
      const { error } = await supabase
        .from('business_inquiries')
        .update({ status: 'replied', updated_at: new Date().toISOString() })
        .eq('id', inquiry.id);
      
      if (error) throw error;
      
      // Update local state
      setInquiries(prev => 
        prev.map(i => i.id === inquiry.id ? { ...i, status: 'replied', updated_at: new Date().toISOString() } : i)
      );
      
      if (selectedInquiry?.id === inquiry.id) {
        setSelectedInquiry({ ...selectedInquiry, status: 'replied', updated_at: new Date().toISOString() });
      }
    } catch (err: unknown) {
      console.error('Error marking inquiry as replied:', err);
    }
  };

  // Toggle archive status
  const toggleArchive = async (inquiry: BusinessInquiry) => {
    try {
      const newArchivedState = !inquiry.is_archived;
      
      const { error } = await supabase
        .from('business_inquiries')
        .update({ 
          is_archived: newArchivedState, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', inquiry.id);
      
      if (error) throw error;
      
      // Update local state
      setInquiries(prev => 
        prev.map(i => i.id === inquiry.id ? { ...i, is_archived: newArchivedState, updated_at: new Date().toISOString() } : i)
      );
      
      if (selectedInquiry?.id === inquiry.id) {
        setSelectedInquiry({ ...selectedInquiry, is_archived: newArchivedState, updated_at: new Date().toISOString() });
      }
    } catch (err: unknown) {
      console.error('Error toggling archive status:', err);
    }
  };

  // Toggle spam status
  const toggleSpam = async (inquiry: BusinessInquiry) => {
    try {
      const newSpamState = !inquiry.is_spam;
      
      const { error } = await supabase
        .from('business_inquiries')
        .update({ 
          is_spam: newSpamState, 
          status: newSpamState ? 'spam' : 'unread', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', inquiry.id);
      
      if (error) throw error;
      
      // Update local state
      setInquiries(prev => 
        prev.map(i => i.id === inquiry.id ? { 
          ...i, 
          is_spam: newSpamState, 
          status: newSpamState ? 'spam' : 'unread',
          updated_at: new Date().toISOString() 
        } : i)
      );
      
      if (selectedInquiry?.id === inquiry.id) {
        setSelectedInquiry({ 
          ...selectedInquiry, 
          is_spam: newSpamState, 
          status: newSpamState ? 'spam' : 'unread',
          updated_at: new Date().toISOString() 
        });
      }
    } catch (err: unknown) {
      console.error('Error toggling spam status:', err);
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Handler for viewing an inquiry
  const viewInquiry = (inquiry: BusinessInquiry) => {
    setSelectedInquiry(inquiry);
    if (inquiry.status === 'unread') {
      markAsRead(inquiry);
    }
  };

  // Reset selected inquiry
  const closeInquiryView = () => {
    setSelectedInquiry(null);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Get status color and icon
  const getStatusInfo = (inquiry: BusinessInquiry) => {
    if (inquiry.is_spam) {
      return { 
        color: 'text-red-600', 
        bgColor: 'bg-red-100', 
        icon: <AlertCircle className="w-4 h-4" />,
        text: 'Spam'
      };
    }
    
    if (inquiry.is_archived) {
      return { 
        color: 'text-gray-600', 
        bgColor: 'bg-gray-100', 
        icon: <Archive className="w-4 h-4" />,
        text: 'Archived'
      };
    }
    
    switch(inquiry.status) {
      case 'unread':
        return { 
          color: 'text-blue-600', 
          bgColor: 'bg-blue-100', 
          icon: <Inbox className="w-4 h-4" />,
          text: 'Unread'
        };
      case 'read':
        return { 
          color: 'text-green-600', 
          bgColor: 'bg-green-100', 
          icon: <Check className="w-4 h-4" />,
          text: 'Read'
        };
      case 'replied':
        return { 
          color: 'text-cyan-600', 
          bgColor: 'bg-cyan-100', 
          icon: <Check className="w-4 h-4 text-cyan-600" />,
          text: 'Replied'
        };
      default:
        return { 
          color: 'text-gray-600', 
          bgColor: 'bg-gray-100', 
          icon: <Clock className="w-4 h-4" />,
          text: inquiry.status
        };
    }
  };

  // Filtered and sorted inquiries
  const filteredCount = totalCount;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-cyan-900">Business Inquiries</h2>
        
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search inquiries..."
              className="pl-8 pr-3 py-1 border rounded-md text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          
          {/* Filter dropdown */}
          <div className="relative inline-block">
            <button 
              className="border rounded-md px-3 py-1 text-sm flex items-center gap-1 hover:bg-gray-50"
              onClick={() => document.getElementById('filter-dropdown')?.classList.toggle('hidden')}
            >
              <Filter className="w-4 h-4 text-gray-500" />
              <span>
                {filter === 'all' ? 'All' : 
                 filter === 'unread' ? 'Unread' : 
                 filter === 'read' ? 'Read' : 
                 filter === 'archived' ? 'Archived' : 'Spam'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            <div 
              id="filter-dropdown" 
              className="absolute hidden right-0 mt-1 w-40 bg-white shadow-lg rounded-md border z-10"
            >
              <ul className="py-1">
                <li className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => { setFilter('all'); document.getElementById('filter-dropdown')?.classList.add('hidden'); }}>All</li>
                <li className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => { setFilter('unread'); document.getElementById('filter-dropdown')?.classList.add('hidden'); }}>Unread</li>
                <li className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => { setFilter('read'); document.getElementById('filter-dropdown')?.classList.add('hidden'); }}>Read</li>
                <li className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => { setFilter('archived'); document.getElementById('filter-dropdown')?.classList.add('hidden'); }}>Archived</li>
                <li className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => { setFilter('spam'); document.getElementById('filter-dropdown')?.classList.add('hidden'); }}>Spam</li>
              </ul>
            </div>
          </div>
          
          {/* Sort dropdown */}
          <div className="relative inline-block">
            <button 
              className="border rounded-md px-3 py-1 text-sm flex items-center gap-1 hover:bg-gray-50"
              onClick={() => document.getElementById('sort-dropdown')?.classList.toggle('hidden')}
            >
              <span>Sort: {sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            <div 
              id="sort-dropdown" 
              className="absolute hidden right-0 mt-1 w-40 bg-white shadow-lg rounded-md border z-10"
            >
              <ul className="py-1">
                <li className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => { setSortOrder('newest'); document.getElementById('sort-dropdown')?.classList.add('hidden'); }}>Newest First</li>
                <li className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => { setSortOrder('oldest'); document.getElementById('sort-dropdown')?.classList.add('hidden'); }}>Oldest First</li>
              </ul>
            </div>
          </div>
          
          {/* Refresh button */}
          <button 
            className="border rounded-md px-3 py-1 text-sm flex items-center gap-1 hover:bg-gray-50"
            onClick={handleRefresh}
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex flex-col md:flex-row">
        {/* Inquiries list */}
        <div className={`${selectedInquiry ? 'hidden md:block' : ''} md:w-1/3 lg:w-2/5 border-r`}>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading inquiries...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              <p>{error}</p>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Inbox className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p className="text-lg font-medium">No inquiries found</p>
              {searchTerm && <p className="mt-1">Try adjusting your search or filters</p>}
            </div>
          ) : (
            <>
              <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
                {inquiries.map((inquiry) => {
                  const statusInfo = getStatusInfo(inquiry);
                  return (
                    <div 
                      key={inquiry.id}
                      className={`border-b last:border-b-0 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${selectedInquiry?.id === inquiry.id ? 'bg-cyan-50' : ''}`}
                      onClick={() => viewInquiry(inquiry)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`font-medium ${inquiry.status === 'unread' ? 'text-cyan-800' : 'text-gray-800'}`}>{inquiry.name}</p>
                          <p className="text-sm text-gray-600 truncate">{inquiry.subject}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${statusInfo.bgColor} ${statusInfo.color} flex items-center gap-1`}>
                          {statusInfo.icon}
                          <span>{statusInfo.text}</span>
                        </div>
                      </div>
                      <div className="mt-1 flex justify-between items-end">
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{inquiry.message}</p>
                        <p className="text-xs text-gray-500">{formatDate(inquiry.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t p-3 flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    Showing {(page - 1) * pageSize + 1}-
                    {Math.min(page * pageSize, filteredCount)} of {filteredCount}
                  </div>
                  <div className="flex gap-1">
                    <button 
                      className={`px-2 py-1 border rounded-md text-xs ${page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <button 
                      className={`px-2 py-1 border rounded-md text-xs ${page >= totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Detail view */}
        {selectedInquiry ? (
          <div className="md:w-2/3 lg:w-3/5 p-4">
            <div className="flex justify-between mb-4">
              <button 
                className="md:hidden px-3 py-1 border rounded-md text-sm hover:bg-gray-50"
                onClick={closeInquiryView}
              >
                ← Back to List
              </button>
              <div className="flex gap-2">
                <button 
                  className={`px-3 py-1 border rounded-md text-sm hover:bg-gray-50 ${selectedInquiry.is_archived ? 'bg-gray-100' : ''}`}
                  onClick={() => toggleArchive(selectedInquiry)}
                >
                  {selectedInquiry.is_archived ? 'Unarchive' : 'Archive'}
                </button>
                <button 
                  className={`px-3 py-1 border rounded-md text-sm hover:bg-gray-50 ${selectedInquiry.is_spam ? 'bg-red-100 text-red-700' : ''}`}
                  onClick={() => toggleSpam(selectedInquiry)}
                >
                  {selectedInquiry.is_spam ? 'Not Spam' : 'Mark as Spam'}
                </button>
                {selectedInquiry.status !== 'replied' && (
                  <button 
                    className="px-3 py-1 bg-cyan-600 text-white rounded-md text-sm hover:bg-cyan-700"
                    onClick={() => markAsReplied(selectedInquiry)}
                  >
                    Mark as Replied
                  </button>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-cyan-900">{selectedInquiry.subject}</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                <p><span className="text-gray-500">From:</span> {selectedInquiry.name} &lt;{selectedInquiry.email}&gt;</p>
                {selectedInquiry.phone && <p><span className="text-gray-500">Phone:</span> {selectedInquiry.phone}</p>}
                <p><span className="text-gray-500">Date:</span> {formatDate(selectedInquiry.created_at)}</p>
                {selectedInquiry.updated_at && selectedInquiry.updated_at !== selectedInquiry.created_at && (
                  <p><span className="text-gray-500">Updated:</span> {formatDate(selectedInquiry.updated_at)}</p>
                )}
              </div>
            </div>
            
            <div className="border rounded-lg p-4 bg-gray-50 whitespace-pre-wrap">
              {selectedInquiry.message}
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium text-cyan-900 mb-2">Quick Reply</h4>
              <div className="space-y-4">
                <textarea 
                  className="w-full border rounded-md p-3 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                  rows={5}
                  placeholder="Type your reply here..."
                ></textarea>
                <div className="flex justify-end gap-2">
                  <button className="px-4 py-2 border rounded-md hover:bg-gray-50">Save Draft</button>
                  <button className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700">Send Reply</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="md:w-2/3 lg:w-3/5 p-8 flex flex-col items-center justify-center text-center">
            <Inbox className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Select an inquiry to view details</h3>
            <p className="text-gray-500 mt-2">You can read, reply to, and manage all your inquiries here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessInquiryInbox; 