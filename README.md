# AiTLE Events

Serverless React app for AiTLE event registration, attendance, and certificates.

- Public: browse events, register, look up attendance, download certificates
- Admin: dashboard, events CRUD, mark attendance, invite admins, notification + certificate templates
- Stack: Vite + React + Cloudflare Workers + D1 (no Twilio; email via Resend, optional WhatsApp via Meta Cloud API)

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

Open http://localhost:5173

The first API request creates tables and seeds two sample 2026 events. `jasperlee016@gmail.com` is pre-invited.

### Admin login (local)

If `GOOGLE_CLIENT_ID` is not set, open `/admin` and sign in with an invited email (first sign-in on an empty admin table also becomes admin).

With Google OAuth, add authorized redirect URI:

`http://localhost:5173/api/auth/callback`

## Deploy to Cloudflare

1. Create a D1 database and paste its id into `wrangler.jsonc`:

```bash
npx wrangler d1 create aitle-events
npx wrangler d1 migrations apply aitle-events
```

2. Set secrets (only what you use):

```bash
npx wrangler secret put SESSION_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put APP_URL
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_FROM
# optional WhatsApp
npx wrangler secret put WHATSAPP_TOKEN
npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID
npx wrangler secret put WHATSAPP_TEMPLATE_NAME
```

3. Deploy:

```bash
npm run deploy
```

Google OAuth production redirect: `https://<your-worker>.workers.dev/api/auth/callback` (or your custom domain).

## Notifications

- **Email (default):** Resend free tier. Toggle in Settings.
- **WhatsApp (optional):** Meta Cloud API directly. Cheaper than Twilio. Sandbox/testing can send session text; production should use an approved Utility template (`WHATSAPP_TEMPLATE_NAME` with 5 body variables: name, event, date, location, registrationId).
- **Promote:** event Share uses a free `wa.me` link. No API cost.

## Certificate template

Admins edit heading, intro, body, issuer, footer, and accent color under Settings. Placeholders: `{{name}}` `{{event}}` `{{date}}` `{{location}}` `{{registrationId}}`. Certificates are generated in the browser (print / PNG download).
