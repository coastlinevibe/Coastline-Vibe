# Tide Reactions

Tide Reactions is an ephemeral reaction system for CoastlineVibe that allows users to express immediate emotions and responses without permanently altering the content. Like the tide patterns that come and go along the shoreline, these reactions only appear while users are online and disappear when they go offline.

## Features

- **Ephemeral Reactions**: Reactions only appear while the user is online and disappear when they go offline
- **Coastal-Themed**: All reactions follow the coastal/beach theme of CoastlineVibe
- **Real-Time Updates**: Reactions appear and disappear in real-time using Supabase's real-time capabilities
- **User-Aware**: Users can see who reacted with which reaction

## Components

### TideReactionBar

The `TideReactionBar` component displays a button that, when clicked, opens a panel with available reactions. Users can select a reaction to add to a post.

```tsx
<TideReactionBar postId={postId} />
```

### TideReactionDisplay

The `TideReactionDisplay` component shows all active reactions for a post, grouped by reaction type. It displays the count of each reaction and who reacted.

```tsx
<TideReactionDisplay postId={postId} />
```

## Context

The `TideReactionsProvider` context provides state management and actions for the Tide Reactions system. It handles:

- Tracking online/offline status
- Fetching and refreshing reactions
- Adding and removing reactions
- Real-time updates via Supabase

## Database

Tide Reactions are stored in the `tide_reactions` table with the following structure:

- `id`: UUID primary key
- `post_id`: Reference to the post
- `user_id`: Reference to the user who reacted
- `reaction_type`: Type of reaction (emoji, animated, sticker)
- `reaction_code`: Code identifier for the reaction
- `reaction_url`: URL for the reaction image/animation
- `created_at`: When the reaction was created
- `expires_at`: When the reaction should expire
- `is_active`: Whether the reaction is currently active
- `position_x`, `position_y`: Optional position data for floating reactions
- `metadata`: Additional customization data

## Reaction Packs

Reactions are organized into themed packs. The base pack is "Coastal Vibes" with beach and ocean themed reactions:

1. "Making Waves" - A surfboard creating ripples
2. "Beach Buddy" - Two beach chairs side by side
3. "Lighthouse" - Illuminated lighthouse
4. "Sunset Vibes" - Beautiful sunset over water
5. "Sand Dollar" - Detailed sand dollar
6. "Tide's Rising" - Water level rising with bubbles
7. "Sandcastle Builder" - Quick build of a sandcastle
8. "Beach Volleyball" - Ball bouncing between players
9. "Bonfire Gathering" - Flames flickering with silhouettes
10. "Seagull Swoop" - Bird diving down

## Usage

1. Add the `TideReactionsProvider` to your app layout
2. Add the `TideReactionBar` component to posts where users can add reactions
3. Add the `TideReactionDisplay` component to show active reactions

```tsx
// In a post component
<div className="post-actions">
  <TideReactionBar postId={post.id} />
</div>

<div className="post-reactions">
  <TideReactionDisplay postId={post.id} />
</div>
```

## Implementation Details

- Reactions are automatically expired after 20 minutes of inactivity
- When a user comes back online, their reactions are refreshed
- Users can toggle their own reactions by clicking on them again
- Reactions are grouped by type in the display
- Tooltips show who reacted with each reaction 