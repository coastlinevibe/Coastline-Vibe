# Global Basic Reaction Template

This document outlines the standardized reaction system implemented across CoastlineVibe, which should be used consistently in all sections.

## Core Components

1. **CoastlineReactionBar** - Component for displaying and selecting reactions
   - Location: `src/components/feed/CoastlineReactionBar.tsx`
   - Purpose: Provides the reaction picker UI that appears when users click "React"

2. **CoastlineReactionDisplay** - Component for displaying existing reactions on content
   - Location: `src/components/feed/CoastlineReactionDisplay.tsx`
   - Purpose: Shows reaction counts and animated reaction effects

3. **TideReactionsContext** - Global state management for reactions
   - Location: `src/context/TideReactionsContext.tsx`
   - Purpose: Provides reaction state and methods across the app

## Reaction Types

CoastlineVibe uses beach-themed reactions from the `COASTAL_REACTION_PACK`:

- **Wave** (`https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/wave.svg`) - "Making Waves"
- **Beach Buddy** (`https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/beach-buddy.svg`) - "Beach Buddy"
- **Lighthouse** (`https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/lighthouse.svg`) - "Lighthouse"
- **Sunset** (`https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/sunset.svg`) - "Sunset Vibes"
- **Sand Dollar** (`https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/sand-dollar.svg`) - "Sand Dollar"

These beach-themed reactions provide a cohesive experience that matches the coastal theme of the application.

## Key Features

- **Ephemeral Reactions**: All reactions disappear after 20 minutes
- **Section-specific**: Reactions are scoped to specific sections (`feed`, `property`, `market`, `directory`, `group`)
- **Offline Support**: Reactions are cleared when users go offline
- **Animation Effects**: Reactions include floating animation effects

## Implementation Guidelines

When implementing in a new section:
1. Import the TideReactionsProvider at the section's root component
2. Use CoastlineReactionDisplay to show reactions on content
3. Pass the correct `sectionType` prop to ensure reactions stay within their section

Example:
```tsx
// In a section component
import { TideReactionsProvider } from '@/context/TideReactionsContext';
import CoastlineReactionDisplay from '@/components/feed/CoastlineReactionDisplay';

export default function SectionPage() {
  return (
    <TideReactionsProvider>
      {/* Section content */}
      <CoastlineReactionDisplay postId="post-123" sectionType="property" />
    </TideReactionsProvider>
  );
}
```

## Styling

The reaction components use coastal-themed Tailwind classes:
- Primary color: Teal (`bg-teal-50`, `text-teal-600`, `border-teal-200`)
- Reaction buttons: Rounded with teal accents
- Reaction display: Rounded borders with teal background
- Animation: Uses the `animate-reaction-float` class defined in tailwind.config.ts

This coastal color scheme should be maintained across all sections to ensure visual consistency. 