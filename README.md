# Steam Family Share Checker

React + Vite + TypeScript rebuild of the Steam Family Share Checker, preserving the original flows:

- Quick check by Steam app URL or raw app ID.
- Game-name search with up to 10 Steam results.
- Proxy-backed Steam API/search requests gated by Cloudflare Turnstile.
- Server-status display for the backing fetch service.

## Development

1. Install Node.js 20+.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` if you need local overrides.
4. Start the app with `npm run dev`.

## Build

Run `npm run build` to create a production bundle in `dist/`.

## Configuration

Vite env vars:

- `VITE_API_DOMAIN`
- `VITE_APP_STATUS_URL`
- `VITE_TURNSTILE_SITE_KEY`

Defaults are provided in the app for the current production services.

## Deployment

GitHub Actions deploys the site to GitHub Pages from the `main` branch and copies the root `CNAME` into `dist/` so the custom domain `steamshare.site` remains attached.
