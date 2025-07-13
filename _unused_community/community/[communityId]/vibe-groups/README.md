# Vibe Groups

Vibe Groups is a real-time chat group system for the CoastlineVibe platform, featuring a coastal/naval theme. This feature allows community members to create and join chat groups for various purposes.

## Features

### Core Features
- **Private Chat Groups**: Real-time messaging in themed groups
- **Voice Notes**: Record and share voice messages with automatic transcription
- **AI Deckhand**: AI-powered conversation summaries
- **Media Sharing**: Share images, videos, and documents
- **Custom Emojis & Stickers**: Personalized reactions and sticker packs
- **Temporary Reactions**: Reactions that only appear to online users

### Group Hierarchy
- **Captains**: Group owners with full administrative control
- **Lieutenants**: Moderators with elevated permissions
- **Crew Members**: Regular group members

### Upgrade Options
- **Premium Features**: Additional pins, larger file uploads, custom emojis
- **Integration**: Connect with businesses, events, and marketplace listings

## Database Structure

The feature uses the following tables:
- `vibe_groups`: Main group information
- `vibe_groups_members`: Group membership and roles
- `vibe_groups_messages`: Chat messages
- `vibe_groups_media`: Media attachments for messages
- `vibe_groups_voice_notes`: Voice recordings with transcriptions
- `vibe_groups_pins`: Pinned content
- `vibe_groups_emoji`: Custom emoji definitions
- `vibe_groups_sticker_packs`: Sticker pack collections
- `vibe_groups_stickers`: Individual stickers
- `vibe_groups_reactions`: Message reactions
- `vibe_groups_upgrades`: Premium feature upgrades
- `vibe_groups_ai_summaries`: AI-generated conversation summaries

## File Structure

```
src/app/community/[communityId]/vibe-groups/
├── page.tsx                # Main groups listing page
├── create/
│   └── page.tsx            # Create new group page
├── [groupId]/
│   ├── page.tsx            # Group detail/chat page
│   ├── members/
│   │   └── page.tsx        # Member management page
│   ├── settings/
│   │   └── page.tsx        # Group settings page
│   └── ai-summary/
│       └── page.tsx        # AI Deckhand summaries page
├── db-migration.sql        # Database migration script
└── README.md               # This documentation
```

## Types and API

Types are defined in `src/types/vibe-groups.ts` and the API client in `src/lib/supabase/vibe-groups-client.ts`.

## API Endpoints

- `POST /api/vibe-groups/generate-summary`: Generate AI summary of conversations

## Getting Started

1. Run the database migration script in `db-migration.sql`
2. Set up the OpenAI API key in your environment variables for the AI Deckhand feature
3. Navigate to `/community/[communityId]/vibe-groups` to view and create groups

## Planned Enhancements

- Voice-to-text for voice notes
- End-to-end encryption for private messages
- Advanced permission system
- Integration with community events
- Mobile push notifications
- Voice and video chat capabilities 