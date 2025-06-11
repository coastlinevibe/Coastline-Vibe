# Feed Page Checklist

## A. Basic Features

### 1. Feed UI & Navigation

#### 1.1 Initial Page Load
- [ ] Load the "Coastline Chatter" (feed) page and verify that the feed container renders without errors
- [ ] Confirm the header "Miami – Coastline Chatter" (or relevant community) displays correctly
- [ ] Check that the "See what's new and join the conversation!" subtext appears

#### 1.2 Filter / Search Bar Visibility
- [ ] Verify presence of a text search input labeled "Search by keyword…"
- [ ] Verify presence of a hashtag/tag input labeled "Type #tag & press Enter"
- [ ] Verify presence of a "Type" icons (All Types, Ask, Announcement, Poll, Event)
- [ ] Verify presence of a "Sort" dropdown (Newest First, Oldest First, Most Popular, etc.)
- [ ] Verify "Clear Filters" button is visible and disabled when no filters selected

#### 1.3 Feed Scroll Behavior
- [ ] Scroll down the feed and confirm more posts load (infinite scroll or pagination)
- [ ] Scroll to bottom, confirm that a "Loading…" spinner or button appears (if applicable)
- [ ] When no new posts, verify a "No more posts" or blank-state message displays

#### 1.4 User Profile Link
- [ ] Click on a poster's avatar or username; confirm navigation to their profile page
- [ ] Hover over avatar/username and verify tooltip shows full name, role, and "View Profile" link
- [ ] Confirm profile link opens in same tab (or new tab if spec'd)

### 2. Creating a Post (Text, Photo, Video, Poll, Event)

#### 2.1 Tab Selection
- [ ] On page load, verify the composer's default tab is "Ask" (✏️ icon) or "Event" depending on design
- [ ] Check the default tab's styling: highlighted background, bold text/icon
- [ ] Confirm other tabs appear inactive (e.g., "Announcement," "Poll," "Event")
- [ ] Click "Announcement" tab: verify the content area updates to announcement‐style
- [ ] Click "Poll" tab: verify poll UI appears (question input + option inputs)
- [ ] Click "Event" tab: verify event fields appear (title, date selector, time selector, location input)
- [ ] Click "Ask" tab: verify plain textarea appears ("What's on your mind…?")
- [ ] For each tab, confirm only the relevant fields are visible and other fields are hidden

#### 2.2 Text‐Only Post (Ask / Announcement)
- [ ] Without typing anything, click "Post." Confirm an inline error message appears ("Please enter text.")
- [ ] Type whitespace only (spaces/newlines), click "Post." Confirm same error or a "Content cannot be empty" message
- [ ] Start typing in the textarea; confirm line breaks are allowed (press "Enter" → new line)
- [ ] Paste text longer than 1,000 characters (or max char limit if defined); verify character count indicator or a truncation
- [ ] Confirm that pressing "Shift+Enter" inserts a line break without submitting
- [ ] Type "Hello, this is a test post." Click "Post." Confirm the post appears correctly at the top of the feed
- [ ] For Announcements: Verify title field appears and is required

#### 2.3 Photo Upload
- [ ] In composer, click "🖼️ Add Photo." Confirm file‐picker appears
- [ ] Upload a JPG/PNG < 5 MB. Confirm thumbnail preview appears in composer
- [ ] Upload a JPG/PNG > 10 MB. Verify error "Image too large. Max 5 MB."
- [ ] Upload a non-image file (e.g., .pdf). Confirm "Invalid file type" error
- [ ] Add two photos sequentially. Confirm both thumbnails appear side by side or in a collage
- [ ] Try dragging & dropping multiple images; verify they upload correctly
- [ ] Confirm ability to remove a selected photo before posting (e.g., click "×" on thumbnail removes it)
- [ ] With text + 1–3 photos selected, click "Post." Confirm photos display properly in the feed post

#### 2.4 Video Upload
- [ ] In composer, click "🎥 Add Video." Confirm file‐picker appears
- [ ] Try uploading a supported video (.mp4 < 50 MB). Confirm preview thumbnail or video duration displayed
- [ ] Upload .mp4 > 100 MB (exceeds limit). Verify error "Video too large. Max 50 MB."
- [ ] Upload .mov or unsupported video format. Confirm "Unsupported video format."
- [ ] Submit post with video. Confirm video is embedded in feed post with a playable thumbnail
- [ ] Click "Play." Confirm inline playback works (pauses, seeks)
- [ ] Confirm video plays in fullscreen/lightbox when clicking expand icon

#### 2.5 Poll Creation
- [ ] Click "Poll" tab. Confirm a "Question" input field appears
- [ ] Confirm two "Option" input fields appear by default, labeled "Option 1" and "Option 2"
- [ ] Confirm an "Add Option" link/button appears below option fields
- [ ] Leave question blank, fill two options, click "Post" → verify "Question is required" error
- [ ] Fill question, leave one option blank, click "Post" → verify "All options must be filled" error
- [ ] Click "Add Option" to create "Option 3." Confirm a third input appears
- [ ] Continue adding until max option limit (e.g., 5). Confirm "Cannot add more than 5 options" error once limit reached
- [ ] Try removing an option: click the "–" or "×" on Option 3. Confirm it disappears and re-indexing of option numbers
- [ ] Enter question "Which community event should we host?" with at least two options. Click "Post."
- [ ] Confirm poll appears in feed: question displayed above "Vote" button(s)
- [ ] Vote on an option: confirm vote increments count, bars update visually, and "You voted" highlight appears
- [ ] Try voting again: confirm either "change vote" allowed or prevent double voting per user

#### 2.6 Event Post
- [ ] Click "Event" tab. Confirm inputs appear in order: Title, Date picker, Time picker, Location input
- [ ] Verify date picker opens a calendar widget on click
- [ ] Verify time picker opens time selection (HH:MM AM/PM)
- [ ] Leave Title blank, select date/time, fill location, click "Post" → verify "Title is required" error
- [ ] Fill Title, leave date blank, click "Post" → verify "Date is required" error
- [ ] Fill past date (e.g., yesterday), click "Post" → verify "Date must be today or later" error
- [ ] Fill Title & date only (no time), click "Post" → if time is optional, confirm no error; otherwise verify "Time is required"
- [ ] Fill Title, date, time, leave location blank, click "Post" → verify "Location is required" error
- [ ] Enter all required fields correctly, click "Post." Confirm event post appears in feed correctly
- [ ] Click "RSVP" button as a user. Confirm the button toggles to "You're going" or "RSVP'd"
- [ ] Click "RSVP" again to un-RSVP. Confirm it toggles back

### 3. Comments & Replies
- [ ] Under any post, verify a "Write a comment…" input is always visible
- [ ] Confirm pressing "Enter" in empty comment box does not submit (requires text)
- [ ] Type "Nice post!" in comment box, press "Enter" or click "Comment"
- [ ] Verify comment appears immediately under the post, with commenter's avatar/name and timestamp
- [ ] Verify "Reply," "Like," and "More" options appear beside the comment
- [ ] Click "Reply" under an existing comment. Confirm an indented "Write a reply…" textbox appears
- [ ] Type reply "Thanks!" and press "Enter." Confirm nested reply appears beneath original comment
- [ ] Hover over own comment, click "⋮" or "More" → select "Edit." Confirm comment text becomes editable inline
- [ ] Change text, click "Save" → confirm updated text and new "Edited" label/timestamp
- [ ] Hover, click "⋮" → select "Delete." Confirm a confirmation dialog: "Are you sure?" → click "Yes"
- [ ] Confirm comment is removed and "1 comment" count decrements
- [ ] Hover/hover‐tap on comment, click "❤️" or "👍" icon. Confirm reaction count increments from 0 → 1
- [ ] Click again: confirm reaction toggles off and count decrements
- [ ] In comment box, type "@" → confirm a dropdown of usernames appears
- [ ] Select one username → confirm it inserts "@username" styled as a link
- [ ] Submit comment. Confirm that mentioned user receives a "mention" notification

### 4. Reactions on Posts
- [ ] Hover over post (desktop) or tap on reaction area (mobile). Confirm heart/thumbs‐up icon is visible
- [ ] Click "Like." Confirm icon changes color, reaction count increments
- [ ] Click again: confirm toggles off and count decrements
- [ ] If multiple reaction types: Hover on "Like" to show reaction palette (e.g., 😍, 😂, 😢)
- [ ] Select "😂." Confirm "😂" appears as selected reaction with count
- [ ] Click the reaction again: confirm reaction is removed
- [ ] Hover over reaction count. Confirm tooltip lists usernames who reacted
- [ ] Click reaction count, confirm a modal lists all reacted users with profile links
- [ ] Log out and back in as another user. Like the same post. Confirm original reaction remains, new reaction increments properly

### 5. Profiles (User & Business)
- [ ] From feed, click a user's avatar. Confirm profile page loads with avatar image, display name, username handle, bio text, "Joined [date]" info
- [ ] Click a business profile link (e.g., from a business post). Confirm business banner/logo appears at top, business name, category, address, contact info, website link
- [ ] On own profile, click "Edit Profile." Confirm fields available: avatar upload, display name, bio, contact details, business-specific fields (hours, category)
- [ ] Attempt to upload invalid avatar (e.g., .svg, >5 MB). Verify error
- [ ] Successfully upload valid avatar. Fill out bio, address, phone. Click "Save." Confirm changes persist when reloading
- [ ] From business feed or directory, click "Follow." Confirm button toggles to "Following"
- [ ] On own profile or "Following" list, click "Unfollow." Confirm toggles back to "Follow" and business disappears from following list
- [ ] As non‐friend, view a private user's profile. Confirm only public fields show; private fields hidden
- [ ] As admin, view private profile. Confirm admin sees additional flag or "View details" notification

### 6. Moderation Tools (Admins & SuperAdmins)
- [ ] On any post by another user, click "⋮" or "More" → "Report Post." Confirm a dropdown or modal appears with reasons (Spam, Hate Speech, Misinformation, Other)
- [ ] Select "Spam," click "Submit." Confirm a success toast ("Post reported"). Confirm post highlights flagged (e.g., yellow banner "Under review")
- [ ] Create a test post containing blacklisted words. Submit post; confirm system triggers a flagged state automatically
- [ ] As Admin user, navigate to any flagged or normal post. Click "⋮" → "Hide Post." Confirm confirmation modal ("Are you sure you want to hide?")
- [ ] Confirm post disappears from feed for non-admins; admin sees "Hidden" badge
- [ ] Click "Unhide" as admin; confirm post reappears
- [ ] As Admin, click "⋮" → "Remove Post." Confirm permanent deletion prompt
- [ ] Confirm post is removed from feed, and "This post was removed by an admin" appears if accessed by direct URL
- [ ] As Admin, navigate to user's profile or click "⋮" on their post → "Ban User." Confirm prompt ("Ban user? This action cannot be undone.")
- [ ] Confirm user's next login attempt is blocked with "You have been banned"
- [ ] Login as a Moderator (without full admin). Confirm Moderator can hide posts and remove comments but cannot ban users
- [ ] Attempt to ban user → confirm "Insufficient permissions"
- [ ] Login as SuperAdmin. Confirm SuperAdmin can perform all actions, including editing system-level settings

### 7. Notification System
- [ ] In a comment, type "@username" referencing another user. Submit comment. Log in as mentioned user. Confirm a notification appears
- [ ] Click notification; confirm it navigates to the exact comment in feed
- [ ] On your post, have another user comment "Replying to test." Then reply to that comment
- [ ] Log in as original commenter. Confirm a notification: "Someone replied to your comment"
- [ ] Click notification; confirm it jumps to that reply
- [ ] Follow a category/tag (e.g., #Events). Another user posts a new event tagged #Events
- [ ] Confirm that "Follower" receives a notification: "New #Events post: [Title]"
- [ ] Click notification; verify it opens that post
- [ ] Another user likes your post. Confirm a notification: "X liked your post"
- [ ] Click it; verify it opens that post
- [ ] For a test user, ensure they have opted in (or default opt‐in) for daily/weekly email
- [ ] After 24 hours, confirm a "What's Hot in My Area" email arrives with a digest of top 5 posts
- [ ] Click a link in the email; confirm it navigates to that feed
- [ ] In browser settings, grant notification permissions
- [ ] Trigger a "reply to comment" notification. Confirm a browser push pops up
- [ ] Click it; verify it navigates to the feed / comment

## Current Progress
We are starting with section 1.1 Initial Page Load 