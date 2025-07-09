# Business Inquiry System Documentation

## Overview

The Business Inquiry System allows customers to send inquiries to businesses listed on the platform, and for business owners to manage these inquiries through a dedicated inbox interface. This system enhances communication between customers and businesses, helping to generate leads and improve customer engagement.

## Features

### For Customers:

1. **Submit Inquiries**: Customers can send inquiries to businesses directly from the business detail page
2. **Form Validation**: Real-time validation ensures all required fields are filled correctly
3. **Success Confirmation**: Clear feedback when an inquiry is successfully sent

### For Business Owners:

1. **Inquiry Inbox**: A dedicated inbox for managing all incoming inquiries
2. **Filtering & Search**: Filter inquiries by status (unread, read, replied, archived, spam) and search by content
3. **Status Management**: Mark inquiries as read, replied, archived, or spam
4. **Sorting Options**: Sort inquiries by newest or oldest first
5. **Pagination**: Navigate through multiple pages of inquiries
6. **Detail View**: View complete inquiry details and customer contact information
7. **Quick Reply**: Respond to inquiries directly from the inbox

## Components

### 1. BusinessInquiryForm

This component is used on business detail pages to allow customers to submit inquiries.

**Props:**
- `businessId`: The ID of the business receiving the inquiry
- `businessName`: The name of the business (used for display purposes)
- `communityId`: The ID of the community the business belongs to (optional)
- `onSuccess`: Callback function triggered when an inquiry is successfully submitted (optional)

**Fields:**
- Name (required)
- Email (required)
- Phone (optional)
- Subject (required)
- Message (required, minimum 10 characters)

### 2. BusinessInquiryInbox

This component provides business owners with an interface to manage incoming inquiries.

**Props:**
- `businessId`: The ID of the business whose inquiries should be displayed

**Features:**
- **Status Labels**: Visual indicators for unread, read, replied, archived, and spam
- **Filtering**: Dropdown to filter inquiries by status
- **Search**: Search through inquiries by name, email, subject, or message
- **Sorting**: Sort inquiries by newest or oldest first
- **Actions**: Mark as read, mark as replied, archive/unarchive, mark as spam/not spam
- **Quick Reply**: Text area for composing responses (UI only in current version)

## Database Structure

The system uses a `business_inquiries` table with the following structure:

```sql
CREATE TABLE public.business_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'spam')),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  is_spam BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  metadata JSONB
);
```

## Usage Instructions

### For Customers:

1. Navigate to a business detail page
2. Scroll down to the "Contact Business" section
3. Fill in the required fields (Name, Email, Subject, Message)
4. Click "Send Message"
5. A success message will appear when the inquiry is sent

### For Business Owners:

1. Log in to your business account
2. Navigate to your business dashboard
3. Click on the "Inquiries" tab in the sidebar
4. View the list of inquiries on the left
5. Click on an inquiry to view its details on the right
6. Use the action buttons to mark as replied, archive, or mark as spam
7. Use the filter dropdown to show only inquiries with a specific status
8. Use the search box to find specific inquiries
9. Use the sort dropdown to change the order of inquiries

## Implementation Notes

- Inquiries are automatically marked as "read" when viewed for the first time
- The inbox updates in real-time when filters or search terms are changed
- Pagination is implemented to handle large numbers of inquiries
- The system includes both mobile and desktop-friendly layouts

## Future Enhancements

1. Email notifications for new inquiries
2. Actual email sending functionality for replies
3. Templates for quick replies
4. Batch actions for multiple inquiries
5. Advanced analytics on inquiry volume and response times 