# Unified Feed Implementation

This folder contains the components for the unified feed system in CoastlineVibe. The feed now supports multiple content types in a single, filterable view:

## Content Types

1. **Posts** - Regular text posts with optional images
2. **Polls** - Interactive polls that users can vote on
3. **Events** - Community events with date, time, location, and attendance tracking
4. **Announcements** - Important community announcements
5. **Questions** - Q&A format posts for community help

## Key Components

- `FeedFilters.tsx` - Tab navigation for filtering content by type
- `PollCard.tsx` / `PollCreator.tsx` - Poll functionality
- `EventCard.tsx` / `EventCreator.tsx` - Event functionality
- `AnnouncementCard.tsx` / `AnnouncementCreator.tsx` - Announcement functionality
- `QuestionCard.tsx` / `QuestionCreator.tsx` - Question functionality
- `ConfirmationDialog.tsx` - Reusable confirmation dialog

## Database Tables

The implementation uses the following database tables:

- `posts` - Base table for all content types (with `type` field and `metadata` JSONB column)
- `polls` / `poll_options` / `poll_votes` - For poll functionality
- `event_attendees` - For tracking event attendance
- `question_answers` - For tracking accepted answers to questions

## Usage

The main feed page (`src/app/community/[communityId]/feed/page.tsx`) integrates all these components into a unified feed experience. Users can:

1. Filter content by type using the tabs
2. Create different types of content using the appropriate creator components
3. Interact with content (like, comment, vote, attend, etc.)

## Future Enhancements

Potential enhancements for the future:

1. Advanced filtering and sorting options
2. Pinned/featured content
3. Content recommendations
4. Content moderation tools
5. Rich text editor for content creation
6. Media galleries and attachments
7. Content scheduling
8. Analytics dashboard for community managers 