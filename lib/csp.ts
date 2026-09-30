// Content-Security-Policy for the app shell (HTML pages), not the JSON API or the downloadable
// report HTML, which embeds inline styles and scripts of its own and is rendered separately.
//  - script-src 'self': the Vite bundle is the only script; inline script is refused.
//  - style-src 'unsafe-inline': the UI sets inline styles at runtime (animation, charts).
//  - img-src https:: white-label logos are arbitrary https URLs chosen by the account owner.
//  - frame-ancestors: only /embed may be framed by other sites; everything else may be framed
//    only by this origin (the dashboard previews the widget in an iframe).
export function contentSecurityPolicy(pathname: string): string {
  const framing = pathname.startsWith('/embed') ? '*' : "'self'";
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${framing}`
  ].join('; ');
}
