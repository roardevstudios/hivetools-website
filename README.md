# hivetools.pro Website

Source for [hivetools.pro](https://hivetools.pro), the website for **Hive**, the Windows desktop AI workspace by Apis.
Built with [Astro](https://astro.build) + Tailwind CSS v4 + [Motion](https://motion.dev), exported as a fully static site.

## Develop

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs site/ (the files you upload)
npm run preview   # serve the built site
```

## Deploy (Vercel)

Production is the Vercel project `apis-ai/hivetools`, which serves `hivetools.pro`. Settings live in `vercel.json`:
build with `npm run build`, serve `site/`, clean URLs, `www` → apex redirect, security headers, and cache rules.

```bash
vercel deploy --prod --scope apis-ai    # from this folder, after `vercel link`
```

`site/` is the committed build output. Rebuild it with `npm run build` after editing `src/` or `public/`, then commit it.
The homepage tour video (`public/videos/hive-motion-design.mp4`) ships in the repo.

Pages build as `name.html` (`build.format: 'file'`) and Vercel's `cleanUrls` maps `/pricing` to `pricing.html`.
The old Apache `.htaccess` files are kept for reference only and are not used on Vercel.

## Layout

| Path | What |
| --- | --- |
| `src/pages/` | One file per URL: `index`, `use-cases`, `docs`, `pricing`, `changelog`, `benchmarks`, `download`, `404`, and account pages `auth`, `profile`, `stats`, `admin` |
| `src/layouts/Base.astro` | Shared shell: meta, fonts, nav, footer, scroll reveal, progress bar |
| `src/layouts/AppPage.astro` | Wrapper for the account pages (loads Supabase from the CDN) |
| `src/components/` | Nav, Footer, hero/section headers, demo chat, beta notice |
| `src/styles/global.css` | Design tokens (`@theme`) and shared components |
| `src/content/docs.html` | Docs body (edit text here) |
| `src/content/app/*.html`, `src/styles/app/` | Account page markup + scripts and their styles, carried over from the previous site so sign-in flows are unchanged |
| `public/` | Served as-is: images, videos, `hive-language.js` + `hive-languages.json` (language switcher), auth helper |
| `server/` | **Not deployed.** Supabase schema (`supabase-setup.sql`) and the `send-claim-receipt` Edge Function |
| `scripts/` | One-off helpers used to port content from the previous site |

## Notes

- Motion respects `prefers-reduced-motion`; content is visible without JavaScript.
- The Supabase key in the account pages is the public *publishable* key. Data safety depends on the row-level security policies in `server/supabase-setup.sql`. Never put a service-role key or Gmail app password in this repo; set them with `supabase secrets set`.
- Stable releases published in `Hive-AI-APP/Hive-Public-Hive` trigger `.github/workflows/release-email.yml`. It calls the `github-release-email` Supabase Edge Function using GitHub Actions OIDC; only subscribers with recorded release-email consent are included. The function uses the existing Supabase `SUPABASE_SERVICE_ROLE_KEY`, `GMAIL_USER`, and `GMAIL_APP_PASSWORD` secrets and records delivery state in `release_email_deliveries`. A manual workflow run is a recipient-count dry run and sends no email.
- The language switcher translates by matching exact English strings in `public/hive-languages.json`; add entries there for new copy.
