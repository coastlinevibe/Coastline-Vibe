# CoastlineVibe Step-by-Step Testing Procedure

This document provides detailed step-by-step instructions for testing critical user flows in the CoastlineVibe platform. Use this in conjunction with the comprehensive TESTING_CHECKLIST.md.

## Pre-Testing Setup

1. Clear browser cache and cookies
2. Prepare test accounts:
   - Regular user account
   - Business owner account
   - Admin account
3. Prepare test data (images, text content)
4. Set up screen recording software for issue documentation
5. Prepare testing devices (desktop, mobile, tablet)

## Critical Path 1: User Registration & Onboarding

### Test Steps
1. **Visit Landing Page**
   - Navigate to coastlinevibe.com
   - Verify all images load correctly
   - Verify all buttons are clickable

2. **Registration Process**
   - Click "Join Community" button
   - Fill out registration form with test data
   - Submit form
   - Verify email verification is sent
   - Complete email verification process
   - Verify redirect to profile completion page

3. **Profile Setup**
   - Upload profile picture
   - Fill out personal information
   - Set location preferences
   - Save profile
   - Verify profile information is saved correctly

4. **First-time User Experience**
   - Verify onboarding tooltips appear
   - Follow guided tour if available
   - Dismiss tooltips
   - Verify they don't reappear on next login

## Critical Path 2: Business Directory Navigation

### Test Steps
1. **Access Directory**
   - Login as regular user
   - Navigate to Local Directory section
   - Verify business categories load correctly
   - Verify featured businesses display correctly

2. **Search & Filter**
   - Use search bar to find "coffee"
   - Apply category filter for "Cafes"
   - Apply location filter for specific neighborhood
   - Verify results update correctly
   - Clear all filters
   - Verify all listings return

3. **Business Profile Viewing**
   - Click on a business listing
   - Verify business details load correctly
   - Verify images load correctly
   - Verify contact information is displayed
   - Verify map location is accurate
   - Verify reviews section loads

4. **Business Interaction**
   - Save business to favorites
   - Share business listing (if available)
   - Click contact button
   - Verify contact form opens correctly
   - Submit test message
   - Verify confirmation message appears

## Critical Path 3: Business Registration & Management

### Test Steps
1. **Business Registration**
   - Logout of regular user account
   - Click "Register Business" button
   - Complete business registration form
   - Verify email verification is sent
   - Complete verification process
   - Verify redirect to business profile setup

2. **Business Profile Setup**
   - Upload business logo
   - Add business description
   - Set business hours
   - Add contact information
   - Set business location on map
   - Add business category tags
   - Upload business photos (min 3)
   - Save profile
   - Verify all information is saved correctly

3. **Business Dashboard Access**
   - Navigate to business dashboard
   - Verify analytics section loads
   - Verify recent activity section loads
   - Verify quick actions menu works
   - Verify notification center loads

4. **Business Listing Management**
   - Edit business description
   - Update business hours
   - Add special offer/promotion
   - Save changes
   - View public business listing
   - Verify changes are reflected

## Critical Path 4: Community Feed Interaction

### Test Steps
1. **Feed Access**
   - Login as regular user
   - Navigate to Community Feed
   - Verify posts load correctly
   - Verify infinite scroll works

2. **Post Creation**
   - Click "Create Post" button
   - Add text content
   - Upload image
   - Add location tag
   - Add user mentions (if available)
   - Submit post
   - Verify post appears in feed

3. **Post Interaction**
   - Like a post
   - Comment on a post
   - Reply to a comment
   - Add reaction to a post (if available)
   - Share a post (if available)
   - Verify all interactions are recorded correctly

4. **Content Moderation**
   - Report a post for testing
   - Verify report submission works
   - Login as admin
   - Check reported content queue
   - Take moderation action
   - Verify action is applied correctly

## Critical Path 5: Property Listing & Inquiry

### Test Steps
1. **Property Section Access**
   - Login as regular user
   - Navigate to Properties section
   - Verify property listings load correctly
   - Verify filtering options work

2. **Property Search**
   - Set price range filter
   - Set bedrooms filter
   - Set location filter
   - Apply additional filters (amenities, etc.)
   - Verify results update correctly
   - Save search (if available)

3. **Property Viewing**
   - Click on property listing
   - Verify property details load correctly
   - Verify image gallery works
   - Verify amenities list displays correctly
   - Verify map location is accurate
   - Verify contact information is available

4. **Property Inquiry**
   - Click "Contact" button
   - Fill out inquiry form
   - Submit inquiry
   - Verify confirmation message appears
   - Login as property owner
   - Verify inquiry is received
   - Respond to inquiry
   - Login as regular user
   - Verify response is received

## Critical Path 6: Coastline Market Interaction

### Test Steps
1. **Market Access**
   - Login as regular user
   - Navigate to Coastline Market
   - Verify product categories load
   - Verify featured items display correctly

2. **Product Search**
   - Use search bar to find specific item
   - Apply category filters
   - Apply price range filter
   - Verify results update correctly
   - Sort results by different criteria
   - Verify sorting works correctly

3. **Product Viewing**
   - Click on product listing
   - Verify product details load correctly
   - Verify images load correctly
   - Verify seller information displays
   - Verify contact options are available

4. **Product Interaction**
   - Save product to favorites
   - Share product listing (if available)
   - Contact seller
   - Verify message is sent correctly
   - Login as seller
   - Verify message is received
   - Respond to message
   - Login as buyer
   - Verify response is received

## Critical Path 7: Notifications System

### Test Steps
1. **Notification Generation**
   - Login as User A
   - Create a post mentioning User B
   - Comment on User B's existing post
   - Like User B's post
   - Send direct message to User B

2. **Notification Reception**
   - Login as User B
   - Check notification bell
   - Verify all expected notifications appear
   - Verify notification count badge is accurate

3. **Notification Interaction**
   - Click on a notification
   - Verify redirect to relevant content
   - Mark notification as read
   - Verify notification is removed from unread list
   - Clear all notifications
   - Verify notifications are cleared

4. **Notification Settings**
   - Navigate to notification settings
   - Disable specific notification types
   - Generate actions that would trigger those notifications
   - Verify disabled notifications don't appear
   - Re-enable notifications
   - Verify notifications appear again

## Critical Path 8: Cross-Device Experience

### Test Steps
1. **Desktop Testing**
   - Complete Critical Paths 1-7 on desktop browser
   - Verify all functionality works correctly
   - Test on multiple browsers (Chrome, Firefox, Safari, Edge)

2. **Mobile Testing**
   - Complete Critical Paths 1-7 on mobile device
   - Verify all functionality works correctly
   - Test on both iOS and Android if possible
   - Verify touch interactions work properly
   - Verify responsive design elements adjust correctly

3. **Tablet Testing**
   - Complete Critical Paths 1-7 on tablet device
   - Verify all functionality works correctly
   - Test in both portrait and landscape orientations
   - Verify UI elements scale appropriately

4. **Cross-Device Continuity**
   - Start a task on mobile (e.g., draft a post)
   - Continue on desktop
   - Verify data persists correctly
   - Start conversation on desktop
   - Continue on mobile
   - Verify message history loads correctly

## Bug Reporting Procedure

For each issue discovered:

1. **Document the Issue**
   - Take screenshot or video recording
   - Note exact steps to reproduce
   - Record device/browser information
   - Note any error messages

2. **Categorize the Issue**
   - Critical: Prevents core functionality
   - High: Significantly impacts user experience
   - Medium: Noticeable but has workaround
   - Low: Minor visual or non-essential feature issue

3. **Report the Issue**
   - Create ticket in project management system
   - Include all documentation
   - Assign priority level
   - Tag relevant team members

4. **Verification Process**
   - After fix is implemented, retest using same steps
   - Verify issue is resolved
   - Check for any regression issues
   - Update ticket status

## Testing Schedule

| Day | Focus Area | Responsible Team |
|-----|------------|------------------|
| Monday | Authentication & User Management | QA Team |
| Tuesday | Business Directory & Listings | QA Team + Business Team |
| Wednesday | Community Feed & Interactions | QA Team + Content Team |
| Thursday | Properties & Market | QA Team + Product Team |
| Friday | Cross-functional & Regression | All Teams |

## Sign-off Procedure

Before each release:

1. All critical and high priority issues must be resolved
2. All critical user paths must pass testing
3. Performance metrics must meet established thresholds
4. Security scan must show no vulnerabilities
5. Accessibility compliance must be verified
6. Project manager and tech lead must sign off

## Post-Release Monitoring

After each release:

1. Monitor error logging systems for 48 hours
2. Track user engagement metrics
3. Monitor server performance
4. Collect user feedback
5. Document any issues for immediate hotfix or next release 