# Shree Ganesh Mandal Manager

A mobile-first private management app for a housing-colony Ganesh Mandal. Open `index.html` in a browser for the complete demo experience.

## Before sharing externally

This package starts with sample data stored in the browser so it can be reviewed immediately. For the requested shared live setup, connect it to a Supabase project (or another real-time database) before deploying.

1. Create a private Supabase project.
2. Add tables for `donations`, `expenses`, `aartis`, `events`, and `contacts`; enable Realtime for them.
3. Create a storage bucket for `bills` and `announcement-images`.
4. Replace the local storage adapter in `app.js` with Supabase reads/writes and subscriptions using the project URL and public anon key.
5. Change `FINANCIAL_PIN` in `app.js` before publishing; for a real deployment, store this securely on the server rather than in browser code.
6. Host the folder on an unlisted URL (Netlify, Vercel, or similar) and only share the link with committee members.

## Main files

- `index.html` — page shell
- `style.css` — responsive saffron/cream visual system
- `app.js` — screens, forms, calculations, Marathi WhatsApp messages, uploads, and report export

The sample shared financial PIN is `2026`; change it before use.
