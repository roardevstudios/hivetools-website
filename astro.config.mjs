import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static output: build to dist/ and upload to the Apache host as before.
// format: 'file' keeps /pricing -> pricing.html so the existing .htaccess routes still work.
export default defineConfig({
  site: 'https://hivetools.pro',
  build: { format: 'file' },
  vite: { plugins: [tailwindcss()] },
});
