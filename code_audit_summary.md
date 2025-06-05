# Code Audit Summary: Potential Duplication & Abstraction Opportunities

This document summarizes potential areas for code refactoring to improve reusability and maintainability, identified during a codebase audit.

## A. Forms

1.  **Poll Creation:**
    *   **Files:** `src/components/modals/CreatePollModal.tsx`, `src/components/feed/PollPostForm.tsx`
    *   **Issue:** `CreatePollModal.tsx` might duplicate form logic from `PollPostForm.tsx`.
    *   **Suggestion:** Ensure the modal uses the `PollPostForm.tsx` component for its form aspects.

2.  **Feed Post Type Forms:**
    *   **Files:** `src/components/feed/EventPostForm.tsx`, `src/components/feed/AskPostForm.tsx`, `src/components/feed/AnnouncePostForm.tsx`, general post form logic within `src/app/community/[communityId]/feed/page.tsx`.
    *   **Issue:** Potential for repeated logic and UI for common fields (title, content, uploads) and form management. The main feed page (`feed/page.tsx`) manages multiple `useForm` instances.
    *   **Suggestion:**
        *   Abstract common fields into reusable field components or a `BasePostForm` component.
        *   Delegate `useForm` instances and form logic to the specific form components (`EventPostForm.tsx`, etc.) rather than the main `feed/page.tsx`.

3.  **Generic Form Field UI:**
    *   **Context:** Various forms across the application.
    *   **Issue:** Repetitive HTML/Tailwind for labels, inputs, error messages.
    *   **Suggestion:** Create shared UI components for form elements (e.g., `InputField`, `TextareaField`, `SelectField` in `src/components/ui/forms/`) that integrate with `react-hook-form` for label, input, and error display.

## B. Data Fetching

1.  **Admin Page - Pending Items (Approval/Rejection):**
    *   **File:** `src/app/community/[communityId]/admin/page.tsx`
    *   **Issue:** Similar fetching logic for pending items from `profiles`, `properties`, `market_items`. Similar update logic for approving/declining items.
    *   **Suggestion:**
        *   Create a generic function/hook like `fetchPendingItems(supabase, tableName, selectQuery, communityUuid)`.
        *   Create a generic function like `updateItemApprovalStatus(supabase, tableName, itemId, status)`.

2.  **Item Creation (Properties, Market Items, etc.):**
    *   **Files:** `src/app/properties/create/page.tsx`, `src/app/market/create/page.tsx` (and potentially others).
    *   **Issue:** Common patterns for form handling, validation, submission, state management, and file uploads.
    *   **Suggestion:**
        *   Consider a reusable hook like `useCreateItemForm({ validationSchema, insertFunction, ... })`.
        *   Develop a shared utility/hook for file/image uploads to Supabase Storage if used in multiple creation forms.

3.  **User Profile Snippets (Proactive):**
    *   **Context:** Displaying minimal user info (username, avatar) in various places.
    *   **Issue:** Potential for multiple components to independently fetch the same profile snippets.
    *   **Suggestion:** If this pattern emerges, create a shared `useUserProfileSnippet(userId)` hook.

4.  **Poll Data Fetching in `FeedPostItem.tsx`:**
    *   **File:** `src/components/feed/FeedPostItem.tsx`
    *   **Issue:** The same Supabase query for poll details is repeated multiple times within the component.
    *   **Suggestion:** Abstract this query into a single, reusable async function within the component.

## C. UI Layouts & Components

1.  **Page Structure & Layout:**
    *   **Issue:** Common page layout patterns (e.g., main content area with max-width, sidebar layouts) are reimplemented.
    *   **Suggestion:**
        *   `PageLayout` or `MainContentWrapper` component (`src/components/shared/` or `src/components/ui/`) for consistent main content area.
        *   `SidebarLayout` component for pages needing a filter/nav sidebar and main content area.

2.  **Common UI Elements:**
    *   **Issue:** Styling for elements like cards, responsive grids, and section titles is repeated.
    *   **Suggestion:** Create generic UI components:
        *   `Card` component (`src/components/ui/`) for base card styling.
        *   `ResponsiveGrid` or `ItemGrid` component for displaying lists of items.
        *   `SectionTitle` or `PageHeader` component for standardized headings.

3.  **Business Detail Page Templates:**
    *   **Files:** `src/components/templates/AccommodationTemplate.tsx`, `src/app/business/[businessId]/page.tsx`.
    *   **Observation:** The pattern of specific templates (e.g., `AccommodationTemplate`) and a generic fallback is good.
    *   **Suggestion:** Ensure common elements *between different templates* (if more are created) are abstracted into smaller, reusable components.

## D. Repetitive Logic Across Sections (Feed, Properties, Coastline Market, Local Directory)

*   **Observation:** The four main sections likely share needs for displaying item lists, creation forms, and filtering/sorting UI.
*   **Suggestion:** The component abstractions suggested above (e.g., `ResponsiveGrid`, generic `Card`, `SidebarLayout`, `useCreateItemForm`, shared form field components) will directly help by providing common building blocks usable across all sections, promoting consistency and reducing section-specific reimplementation. 