# Predictions Dashboard

A frontend-only prediction market dashboard built with Next.js (App Router), TypeScript, Tailwind, and NextAuth.

It fetches live event data from Polymarket, supports simulated YES/NO trades with a fake wallet, and tracks positions with unrealized P&L.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui primitives
- NextAuth.js (Google OAuth)
- Sonner (toasts)
- Axios/Fetch for API integration

## Core Features

- Dashboard tab with top 5 politics events from Polymarket
- Event cards with market-level YES/NO prices and buy actions
- Simulated wallet (default $1,000) with add-funds flow
- Buy logic merges existing position by `(marketId + side)`
- Positions tab grouped by event
- Position metrics: average entry, quantity, total invested, current price, unrealized P&L
- Per-user local persistence keyed to authenticated user session
- Demo mode button (manual opt-in) for local testing without OAuth setup

## Bonus Features Implemented

- Responsive layout across desktop/mobile
- Periodic live refresh of market data (every 30 seconds)
- Search/filter in dashboard:
  - Search by event title or market title
  - Filter: `All Events` / `Tradable Only`
- Clean loading and error states:
  - Skeleton loaders
  - Retry action on API failure
- Dark mode support via theme toggle (Light/System/Dark)
- Micro-interactions and animations:
  - Sliding tab/filter indicators
  - Buy button processing state + fill feedback
  - Wallet value animation on updates
  - Animated amount selector in wallet funding dialog

## Project Structure

- `app/`
  - `api/auth/[...nextauth]/route.ts` - NextAuth route handler
  - `api/events/route.ts` - server-side Polymarket proxy (avoids browser CORS)
  - `signin/page.tsx` - sign-in screen
- `components/`
  - `app-shell/` - main dashboard shell, wallet dialog, theme toggle
  - `auth/` - auth controls
  - `dashboard/` - event and market UI
  - `positions/` - grouped positions + analytics
  - `providers/` - session/theme/toast providers
- `contexts/portfolio-context.tsx` - wallet + positions state reducer and persistence
- `lib/`
  - `auth.ts` - NextAuth config
  - `polymarket.ts` - normalization + client fetch helpers
  - `constants.ts`, `format.ts`
- `types/` - domain types for API and portfolio state

## Environment Variables

Create `.env.local`:

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

Optional (only if you want bypass):

```bash
NEXT_PUBLIC_BYPASS_AUTH=false
```

Note: app defaults to auth-first. Demo access is available using the `Continue in Demo Mode` button on the sign-in screen.

## Google OAuth Setup

1. Create OAuth credentials in Google Cloud Console (`Web application`).
2. Add redirect URI for local:
   - `http://localhost:3000/api/auth/callback/google`
3. Add redirect URI for deployed app:
   - `https://<your-domain>/api/auth/callback/google`
4. Add env vars locally and in Vercel.

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build & Lint

```bash
npm run lint
npm run build
```

## Deployment (Vercel)

1. Push repository to GitHub.
2. Import into Vercel.
3. Add required env vars in Vercel project settings.
4. Deploy and verify Google auth callback URL is configured in Google Console.
