# hivetools.pro Website

Source for [hivetools.pro](https://hivetools.pro), the website for **Hive**, the Windows desktop AI workspace by Apis.
Built with [Astro](https://astro.build) + Tailwind CSS v4 + [Motion](https://motion.dev), exported as a fully static site.

## Develop

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs dist/
npm run preview   # serve the built site
```

## Deploy (Spaceship / Apache)

1. `npm run build`
2. Upload the **contents** of `dist/` to the web root (it includes `.htaccess`, so enable "show hidden files" in your FTP client).
3. Copy the large media that is not kept in git from the
   [Original website backup](https://github.com/roardevstudios/hivetools-website/releases/tag/source-backup-2026-10-10) release into `videos/` on the server:
   `hive-launch-v4.mp4` (homepage tour) and `hive-launch-preview-v0.0.2.mp4` (changelog).

Pages build as `name.html` (`build.format: 'file'`), so the existing `.htaccess` clean-URL rules (`/pricing` → `pricing.html`) keep working.

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
| `public/` | Served as-is: images, `.htaccess`, `hive-language.js` + `hive-languages.json` (EN/DE/ZH switcher), installer script |
| `server/` | **Not deployed.** Supabase schema (`supabase-setup.sql`) and the `send-claim-receipt` Edge Function |
| `scripts/` | One-off helpers used to port content from the previous site |

## Notes

- Motion respects `prefers-reduced-motion`; content is visible without JavaScript.
- The Supabase key in the account pages is the public *publishable* key. Data safety depends on the row-level security policies in `server/supabase-setup.sql`. Never put a service-role key or Gmail app password in this repo; set them with `supabase secrets set`.
- The language switcher translates by matching exact English strings in `public/hive-languages.json`; add entries there for new copy.
