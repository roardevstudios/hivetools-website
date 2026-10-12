import type { APIRoute } from 'astro';

const publicRoutes = ['/', '/use-cases', '/docs', '/pricing', '/changelog', '/download', '/benchmarks'];

export const GET: APIRoute = () => new Response(
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicRoutes.map((route) => `<url><loc>https://hivetools.pro${route === '/' ? '/' : route}</loc></url>`).join('')}</urlset>`,
  { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
);
