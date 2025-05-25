# CoastlineVibe Project Overview

**CoastlineVibe** is a coastal lifestyle platform designed to empower residents, visitors, businesses, and property seekers. It brings together social content, local commerce, property listings, and service providers into a unified digital space.

---

## 📌 Platform Sections

### 1. Community Feed
Local events, questions, announcements, polls, and updates in a feed-style layout.

### 2. Marketplace
Peer-to-peer selling with live location filters, AI tags, and instant chat.

### 3. Properties
Real estate listings enhanced by smart filters, map-based search, and lifestyle tags.

### 4. Local Directory
A business hub with dashboards, AI tools, booking, promos, reviews, and analytics.

---

## ✅ Already Completed (As of Start)
- Next.js project initialized with TypeScript, Tailwind CSS, ESLint, App Router, src directory, and @/* import alias.
- Shadcn/UI initialized.
- Core dependencies installed (Supabase client, Lucide icons, React Hook Form, Zod, date-fns, React Map GL & Mapbox GL, OpenAI SDK).
- Initial landing page (`src/app/page.tsx`) designed with a header, hero section (including background video), "About Us" section (with decorative images and stats), "Communities to Join" section, and a features highlight section.
- Basic login page (`src/app/login/page.tsx`) created with username and 6-digit PIN fields.
- Header "Login" button now links to the login page.
- Basic signup page (`src/app/signup/page.tsx`) created with email, username, password, community selection, role selection (User/Business), and optional avatar upload fields.
- Supabase client configured in `src/lib/supabaseClient.ts` using environment variables from `.env.local`.
- `profiles` table created in Supabase with columns for id, created_at, updated_at, username, email, avatar_url, role, is_approved, and community_id. Triggers for `updated_at` and default `is_approved` (based on role) are set up. RLS is enabled.
- Client-side validation added to the signup form using React Hook Form's built-in validation (previously Zod, changed due to resolver issues).
- Signup form now handles user registration with Supabase Auth (email/password), optional avatar upload to Supabase Storage, and profile creation in the `profiles` table.

---

## 🎨 UI/Design Preferences
- General: Coastal pastel color scheme.
- Buttons: Prefer pastel colors.
- Enhancements: Considering background videos, images, and more dynamic UI elements (e.g., animations, parallax) as requested.

CoastlineVibe is a local-first coastal community app that empowers residents, visitors, businesses, and property seekers with a powerful all-in-one ecosystem. It includes a Community Feed (polls, posts), a Marketplace (smart buy/sell tools), Properties (map-based search, lifestyle tags), and a Local Directory (dashboard, AI tools for businesses). 

## Role Managemenet
The CoastlineVibe platform uses the following three user roles:

👤 user
Regular community member

Uses the feed, views properties, browses the market, and directory

Cannot post listings or manage businesses

🏪 business
Business owner

Gets access to a dashboard to manage business listings, bookings, promotions, and analytics

🧑‍⚖️ superadmin
Full administrative access

Can approve users, listings, and businesses

Can manage roles, moderate content, and access analytics

These roles are stored as strings in the role field inside the profiles table. You will use this info to control access and views, but do not assign roles unless the user explicitly tells you to.

community [slug] page info

Essential Components of the Community Landing Page (/[community]/feed)
1. Welcome/Header Section
Personalized welcome: “Welcome to CoastlineVibe, Miami!”

City/community branding (photo/banner)

Quick intro/mission statement for first-time visitors

2. Community Feed (Center Column)
Chronological or algorithmic feed with:

Announcements

Events

Polls/questions

User posts (text, image, or video)

Post composer (“What’s happening in Miami?”)

3. Upcoming Events Preview (Sidebar or Section)
Next 3–5 events in the city

“View all events” button

4. Featured Local Businesses/Promotions
Carousel or grid of sponsored or popular businesses

Latest coupons/promos

5. Marketplace Highlights
“Trending now” items

Top new listings in the last 24 hours

6. Property Spotlight
Featured property listing(s)

Quick “search properties” bar

7. Quick Links / Navigation
Tabs or buttons for:

Community Feed

Marketplace

Directory

Properties

Events

8. Notifications & Alerts
Unread messages or alerts (e.g., “2 new business promos,” “Event tonight”)

9. Community Poll or Question of the Day
Embedded at top or sidebar (“What’s the best pizza in Miami?”)

10. User Profile & Shortcuts
Profile avatar + link to settings

“Post an event/listing” quick button

Optional (But Powerful)
Weather widget (local)

Local news headlines (RSS integration)

Leaderboard (most helpful users/businesses)

Language selector

Wireframe Sketch (Layout Idea)
markdown
Copy
Edit
--------------------------------------------------
| Welcome Banner | Profile | Alerts/Notifications |
--------------------------------------------------
| Community Feed (posts, events, polls)           |
| ------------------------------------------------|
| Featured Businesses | Events | Marketplace      |
| (Carousel/Sidebar)                              |
| ------------------------------------------------|
| Trending Properties | Post Composer | Quick Links|
--------------------------------------------------
Goal:
Instantly “feel local”

See community activity and opportunity

Easy access to every part of CoastlineVibe

Encourage users to interact (post, comment, browse, shop)


superadmin page:
🛡️ SuperAdmin Dashboard: Key Layout & Features
Core Sections
Overview Cards (Top Row)

Total Users, Businesses, Active Communities

New Signups (last 24h/7d)

Pending Approvals (users, listings, businesses)

Reports/Flags to Review

Global Analytics Panel

User growth charts (all communities)

Active users by city/community

Most popular sections/features (Feed, Market, etc.)

Conversion (signups → active users → business signups)

Community Management

Table/list of all communities (Miami, Da Nang, etc.)

View, add, edit, or remove communities

Assign or demote community_admins

User & Role Management

Search/filter users by name, email, community, role

Promote/demote (user ↔ business ↔ community_admin)

Ban, suspend, or approve users

Export user data

Content Moderation

Review flagged posts/listings/comments (across all communities)

Approve/decline pending business or property listings

Access activity logs

Feature Toggles & Settings

Enable/disable features per community or globally (e.g., turn on Marketplace in Da Nang, off in Miami)

Adjust platform rules/policies

Messaging & Notifications

Send announcements to all users or targeted groups (e.g., “New feature live in Miami!”)

View/respond to support tickets or help requests

System Health

Uptime/status indicators

Recent system errors (if any)

Sample SuperAdmin Dashboard Layout
markdown
Copy
Edit
--------------------------------------------------
| [CoastlineVibe SuperAdmin Dashboard]           |
--------------------------------------------------
| Cards: Total Users | Total Businesses | Active Communities | Reports Pending |
--------------------------------------------------
| Analytics: User Growth | Community Activity | Section Usage   |
--------------------------------------------------
| [Community List & Management Table]            |
| - City      | Users | Admin | Businesses | ...|
|------------------------------------------------|
| [Pending Approvals & Reports Table]            |
|------------------------------------------------|
| [User Role Manager]  | [Feature Toggles]      |
|------------------------------------------------|
| [Send Announcement]  | [System Health]        |
--------------------------------------------------
Key Visual/Functional Differences from Regular Dashboard
Global, not local: Sees all cities/communities at once

Admin powers: Promote/demote, approve/ban, manage every role/community

Data-rich: Big focus on charts, tables, and logs—not just “community feed”

Moderation & toggles: Control features, handle abuse, and manage system health

Announcement tools: Broadcast messages across the entire network





community-admin page info

🛡️ CoastlineVibe Community Admin Dashboard — Features
Core Management Functions
Dashboard Overview

Quick stats: total users, active businesses, new posts, pending approvals, flagged/reported items, event calendar for their city.

User Management

Search/filter users by name, role, activity

Approve new member signups (if required)

Promote/demote between user/business roles

Suspend, warn, or ban users (in that community only)

Feed Moderation

View, edit, pin, or delete any post in their community feed

Approve/decline flagged or reported posts/comments

Pin important announcements to the top

Business & Directory Management

Approve new business listings

Edit/remove business listings (e.g., on complaints or policy violations)

Highlight “featured” businesses

Marketplace Moderation

Approve or remove flagged listings

Ban spam/inappropriate sellers (local only)

Mark listings as “verified”

Event Moderation

Approve or remove events (if required)

Pin city events to feed/calendar

Analytics & Insights

Local usage stats (daily active users, posts, business signups)

“Trending” topics/items in the community

Community Alerts & Announcements

Send alerts to all users (weather, outages, safety, platform updates)

Post “Community Poll of the Day”

Feedback & Support

View and respond to support tickets/feedback from users in their city

Request features or flag issues to superadmin

Nice-to-Have / Advanced Features
Role Management: Assign/revoke other community-admins for the same city.

Bulk Actions: Approve, remove, or message users/listings in bulk.

Export Data: Download user/business directory, post logs (CSV).

Event/Business Spotlight: Schedule auto-pinned spotlights for partners.

Custom Notification Scheduling: Schedule announcements or reminders.

Theme/Branding Adjustments: Edit city logo/banner/colors (if allowed).

Automated Moderation Tools: View AI-flagged content for review.

Local FAQ Editing: Manage community-specific FAQ/help articles.

Sample Community Admin Dashboard Layout
markdown
Copy
Edit
-----------------------------------------------------------
| Stats Cards: Users | Businesses | Listings | Reports    |
-----------------------------------------------------------
| Approvals Queue:  Users | Businesses | Listings        |
-----------------------------------------------------------
| Feed Management:  View/Edit/Delete/Pin Posts            |
-----------------------------------------------------------
| Business & Marketplace Moderation: Approve/Remove/Edit  |
-----------------------------------------------------------
| Events:  Approve/Pin/Remove | Calendar View             |
-----------------------------------------------------------
| Analytics:  DAU | Posts | Trends | Poll Results         |
-----------------------------------------------------------
| Alerts & Announcements | Feedback | Support Tickets     |
-----------------------------------------------------------
What Community Admin CANNOT Do:
See/control other cities/communities.

Access or edit global platform settings.

View/manage superadmin-level analytics.

Change platform-wide roles (can’t make superadmins).