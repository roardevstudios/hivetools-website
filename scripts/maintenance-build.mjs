// Maintenance build: replaces the whole public site with one status page.
// Output: site/index.html and site/404.html. Every other route falls through to 404.
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>Hive — under construction</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0b0c0e; color: #e8e6e3; font-family: system-ui, -apple-system, Segoe UI, sans-serif; padding: 24px; box-sizing: border-box; }
    main { max-width: 560px; text-align: center; }
    h1 { font-size: 2rem; margin: 0 0 12px; color: #F5B63B; }
    p { line-height: 1.6; color: #b9b6b1; margin: 0 0 14px; }
    .links { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 24px; }
    a { color: #F5B63B; text-decoration: none; border: 1px solid #F5B63B55; border-radius: 999px; padding: 8px 16px; }
  </style>
</head>
<body>
  <main>
    <h1>Sorry, we have problems.</h1>
    <p>The website and Hive are under construction. We will fix it as soon as possible.</p>
    <p>New things are coming. Follow us for updates.</p>
    <div class="links">
      <a href="https://discord.gg/jN3MxRqvsV" rel="noopener">Discord</a>
      <a href="https://x.com/RoarDEV2014" rel="noopener">X</a>
    </div>
  </main>
</body>
</html>
`

mkdirSync('site', { recursive: true })
for (const name of readdirSync('site')) rmSync(join('site', name), { recursive: true, force: true })
writeFileSync('site/index.html', page, 'utf8')
writeFileSync('site/404.html', page, 'utf8')
console.log('[maintenance-build] site/ replaced with status page')
