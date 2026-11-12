# AeroMed Germany website

This is the existing static AeroMed Germany site, extended with a news page, a 16-state name search, and Supabase-ready member/admin pages. The existing GitHub Pages domain and plain HTML/CSS/JavaScript structure are preserved. Nothing has been published or deployed.

## Pages and main files

- `index.html` — home page
- `language.html`, `approbation.html`, `exams.html`, `residency.html` — existing learning guides
- `documents.html` — existing public Google Drive and Google Forms links
- `news.html` and `news.js` — published announcements, with title, publication date, and Google Docs link
- `login.html` and `login.js` — email/password sign-in; there is no public registration
- `members.html` and `members.js` — signed-in members' private resource library
- `admin.html` and `admin.js` — admin-only publishing and private resource upload/delete tools
- `bundeslaender.html`, `bundeslaender-data.js`, `bundeslaender.js` — searchable names of all 16 states, with no state-specific legal or medical guidance yet
- `supabase-config.js` — blank slots for the project URL and browser-safe publishable key
- `supabase-setup.sql` — database, private Storage bucket, and access policies
- `styles.css`, `script.js` — styling and shared navigation behavior

## What needs to be supplied before Supabase can be connected

1. The Supabase **Project URL** and **publishable key** from your project. The publishable key is designed for browser use. Never give me or put in website code a secret key or legacy `service_role` key.
2. The email address you want to use for the first administrator account. Create that account yourself in Supabase Authentication; then its user UUID must be inserted into `aeromed_admins` using the SQL comment at the bottom of `supabase-setup.sql`.
3. Decide who should receive member accounts. For safety, this site has no public sign-up; accounts are created manually in Supabase Authentication.
4. For each existing announcement: the title, publication date, and shareable Google Docs link. An admin can add future announcements on `admin.html` after setup.

## Supabase setup (only after the owner is ready)

1. In Supabase, open **SQL Editor**, paste in `supabase-setup.sql`, and run it. The SQL sets up published announcements, signed-in member resources, admin checks, and a private storage bucket. Review it before running.
2. In **Authentication → Users**, create the owner account and any member accounts. Keep public sign-ups disabled.
3. Copy the owner's user UUID and run the insert statement shown at the bottom of `supabase-setup.sql` with that UUID.
4. Put the Project URL and publishable key in `supabase-config.js`. Do not add a secret/service-role key.
5. Visit `login.html`, sign in, and open the member dashboard. An administrator will see the admin tools link and can publish updates on `admin.html`.

The browser-side key is not an access-control mechanism. Row Level Security and Storage policies in the SQL enforce permissions. Member files use a private bucket and time-limited signed download links. Admin access depends on the `aeromed_admins` table.

## Add state-specific information later

`bundeslaender-data.js` currently contains only the 16 state names. Extend the data only after collecting state-specific information from verified, current official sources, and include the source and review date for every claim. The current page does not state licensing requirements.

## Update the public site

Edit the relevant `.html` file for wording and `styles.css` for visual changes. The existing public Google Drive and Form URLs are in `links-config.js`. To publish later, upload the project files to the existing GitHub repository while keeping the site's current address and repository structure. This package has not been deployed.
