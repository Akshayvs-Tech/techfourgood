Tech for Good — Project Overview

This repository implements a web application to run tournaments. The sections below describe the primary user flows, the server APIs that support them, the data model and persistence, authentication points, common failure modes, and required environment variables.

Key flows (concise)

- Admin: create and manage a tournament
  - Create tournament details: ID, dates, venue, format, number of teams, and fields.
  - Configure the public registration form (field labels, types, options, required flags).
  - Configure spirit scoring and other competition settings.
  - Manage teams, assign fixtures, and export reports from the admin UI.

- Public registration: team and player onboarding
  - Public users access a registration page tied to a tournament ID.
  - The configured form collects player and team data and submits to public API routes.
  - The public APIs return structured JSON confirming submission or returning validation errors.

- Live operations (live scoring and leaderboard)
  - Officials submit match scores through authenticated admin paths or liveops APIs.
  - The app exposes live match data (e.g. `/api/liveops`) consumed by the homepage and score components.
  - Leaderboards and schedule pages read the latest match and team data to present derived views.

- Scheduling & assignments
  - The scheduling builder assigns teams to fixtures and fields and saves assignments via admin APIs.
  - Assignments feed into live scoring and public schedule endpoints.

- Reports & exports
  - Admin endpoints provide exports for rosters, match results, and registrations in JSON or CSV formats.

API overview (short)

- `app/api/liveops/route.ts` — GET: returns live match objects for clients.
- `app/api/admin/*` — collection of routes for tournament setup, team/roster management, reports, and admin actions. They accept and return JSON.
- `app/api/public/*` — public registration, roster submission, and team-related endpoints. They return confirmation JSON including created resource IDs.

Data and persistence

- Primary datastore: PostgreSQL. Server routes use a Postgres connection string (`POSTGRES_URL`) to read/write persistent data.
- Supabase is used for authentication and optional realtime features; some flows use `@supabase/supabase-js` and require Supabase keys.
- Several endpoints use mocked data for local development (check `/api/liveops` for a mocked example).

Authentication and authorization

- Client-side authentication uses Supabase for login and session management.
- Server-side operations that require elevated privileges use a Supabase service role key and must run on the server only.

Environment variables (required for full functionality)

- `NEXT_PUBLIC_SUPABASE_URL` — public Supabase URL used by client code
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public Supabase anon key used by client code
- `SUPABASE_SERVICE_ROLE_KEY` — server-side Supabase service role
- `POSTGRES_URL` — Postgres connection string used by server routes

Error handling and common failure modes

- Missing dependency: if `@supabase/supabase-js` is not installed, imports will fail and pages that depend on Supabase will return server errors.
- Missing environment variables: routes that use Postgres or Supabase will throw or return 500 if their env vars are not set. Add runtime checks in server routes where appropriate.
- Non-JSON responses: client code expects JSON from API endpoints. If an endpoint returns HTML (404/500), client-side JSON parsing will fail. API routes should consistently return JSON.

Development notes (architecture)

- Built with Next.js App Router using a mix of server and client components.
- Client components handle interactivity (forms, sliders, polling) and call server APIs for state changes.
- Server API routes under `app/api` perform data access and return JSON.

Testing and verification guidance

- Use API requests (curl, Postman) to confirm endpoints return JSON and the expected status codes. Example: `GET /api/liveops` should return an array of match objects.
- Check the server console for missing dependency errors or database connection failures when a route returns 500.

Recommended small improvements

- Add explicit environment guards to server routes so missing variables return clear JSON error responses.
- Persist registration form configuration to Postgres instead of keeping it in memory or mocked.
- Preload homepage slider images to reduce visual flicker on initial load.

If you want, I can implement any of the recommended improvements next: env guards, persistence for forms, or image preloading.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.