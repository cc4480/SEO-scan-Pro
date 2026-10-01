import fs from 'fs';
import path from 'path';

// The SPA shell is the same file for every URL, but canonical and social-card URLs must be
// absolute and per-page, and APP_URL is only known at runtime. The built index.html carries
// __APP_URL__ / __CANONICAL__ tokens that are filled here on each request.
const INDEXABLE = new Set(['/', '/terms', '/privacy', '/signup']);

export function loadIndexTemplate(distPath: string): string {
  return fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
}

export function renderIndex(template: string, appUrl: string, pathname: string, staticHtml = ''): string {
  const origin = appUrl.replace(/\/+$/, '');
  const p = pathname.replace(/\/+$/, '') || '/';
  const canonical = origin + (INDEXABLE.has(p) ? (p === '/' ? '/' : p) : '/');
  return template.split('__APP_URL__').join(origin).split('__CANONICAL__').join(canonical).split('__STATIC_CONTENT__').join(staticHtml);
}

export const INDEXABLE_PATHS = ['/', '/signup', '/terms', '/privacy'];
