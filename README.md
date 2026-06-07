# Inner Haven

> GuidanceGo is a web-based counseling appointment scheduling system developed for Visayas State University. The system is designed to improve accessibility, efficiency, and privacy in delivering counseling services to students.

---

##  Release History

| Internal Release Code | Date Released |
|-----------------------|---------------|
| IH.010.001            | 2026-02-27    |
| IH.010.002            | 2026-03-07    |
| IH.010.003            | 2026-03-13    |
| IH.010.004            | 2026-03-25    |
| IH.010.005            | 2026-04-10    |
| IH.010.006            | 2026-04-28    |
| IH.010.007            | 2026-06-07    |
| ...                   | ...           |

---
## [IH.010.007](https://github.com/Piadopo-JK/internal-codename/tree/dev) Release Notes

- Added counselor session notes with note management and appointment integration.
- Migrated the application to TanStack Query, improving data fetching, caching, and loading states.
- Introduced anonymous support messaging, including anonymous identities, counselor queues, and chat functionality.
- Added a guided onboarding flow with profile creation checks and route guards.
- Improved notifications, appointment synchronization, and overall application performance.
- Strengthened security with Content Security Policy (CSP) enforcement and infrastructure updates.
- Added comprehensive unit and integration test coverage across core application features.

## [IH.010.006](https://github.com/Piadopo-JK/internal-codename/tree/dev) Release Notes

- add booking, availability, counselor schedule, and settings API endpoints with updated server actions  for appointments and profile management
- refactor booking domain (contracts, service, repository) to support caching, scheduling changes, and improved supabase integration
- introduce client-side settings cache layer for optimized profile and settings reads
- update supabase repository logic and add avatar storage helper for profile image management
- add global application layout shell with sidebar navigation system and shared layout context
- introduce cache warmer initializer and global cache warming mechanism to improve navigation performance and reduce initial load latency
- integrate counselor heartbeat system into layout for presence tracking and session awareness
- refactor navigation architecture with centralized config and sidebar context state management
- add full appointments frontend module including booking flow, session pages, and appointment detail/edit views
- add appointment UI components
- refactor student and counselor dashboards with improved session visibility, stats, and upcoming appointment widgets
- redesign counselor directory and dashboard cards for availability, summaries, and appointment insights


## [IH.010.005](https://github.com/Piadopo-JK/internal-codename/tree/dev) Release Notes

- enforce session auth, role checks, and identity scoping on all API routes and server actions
- harden booking repository ID resolution and use service-role Supabase client
- add Google OAuth 2.0 flow for counselors and secure token storage
- add /settings page for managing Google integration
- update dashboard banner to only show connect prompt when not linked
- show “Join Meeting” buttons in appointments list for approved online sessions
- render Google Meet links in notification cards
- fix CalendarCard to receive actual appointment data, rendering booked dates correctly
- replace SPA navigation with full page navigation after auth transitions
- convert profile menu to anchored dropdown with Settings and Log out actions

## [IH.010.004](https://github.com/Piadopo-JK/internal-codename/tree/dev) Release Notes

- add supabase booking repository and move appointment flow to supabase
- add counselor directory search and availability slots
- refactor booking page to slot-first booking flow
- add appointment conflict checking and past booking guard
- add realtime availability updates for counselor directory and booking page
- add missing entity modules for build stability

## [IH.010.003](https://github.com/Piadopo-JK/internal-codename/tree/dev) Release Notes

-add navigation bar
-add notification bell component
-add notification page, list card & server action
-add booking notifications
-add notif DTO
-add notif API on booking service
-add API route for notification for student/councelor

## [IH.010.002](https://github.com/Piadopo-JK/internal-codename/tree/dev) Release Notes

- add counselor dashboard
- add counselor specific components
- fix config files & color tokens
- add student dashboard components
- add student appointment booking page
- change api routes for booking
- remove placeholder db
- replaced entities with data transfer types
- add in-memory repository
- add CRUD APIs for booking
- unified dashboard layout
- add user role check for dashboard
- add appointments page
- change booking modal to booking page

## [IH.010.001](https://github.com/Piadopo-JK/internal-codename/tree/dev) Release Notes

- project initialization
- add initial layout of student dashboard
- add entity classes according to URD
- add student dashboard components
- add student appointment booking page

## Important Links

- **Design Specifications:** https://github.com/Piadopo-JK/inner-haven-docportal
---

