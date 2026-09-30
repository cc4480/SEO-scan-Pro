import React, { useEffect, useRef, useState } from 'react';

export const EMAIL_VERIFIED_EVENT = 'email-verified';

// Handles the confirmation link from the signup email (`/?verifyToken=...`). Mounted outside App
// so it works whether or not the visitor is signed in, and tells App to refresh the user on success.
export default function VerifyLinkNotice() {
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('verifyToken');
    if (!token || started.current) return;
    started.current = true;
    // Keep the credential out of the visible URL and history.
    window.history.replaceState({}, '', window.location.pathname);
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then(async res => {
        if (res.ok) {
          setNotice({ ok: true, text: 'Email confirmed. You can now run scans.' });
          window.dispatchEvent(new Event(EMAIL_VERIFIED_EVENT));
        } else {
          const data = await res.json().catch(() => ({}));
          setNotice({ ok: false, text: data.error || 'That confirmation link could not be used.' });
        }
      })
      .catch(() => setNotice({ ok: false, text: 'Could not reach the server to confirm your email. Try the link again.' }));
  }, []);

  if (!notice) return null;
  return (
    <div
      role="status"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] rounded-xl border px-4 py-3 text-sm shadow-xl flex items-start gap-3 ${
        notice.ok ? 'bg-emerald-950 border-emerald-500/40 text-emerald-100' : 'bg-red-950 border-red-500/40 text-red-100'
      }`}
    >
      <span className="flex-1">{notice.text}</span>
      <button onClick={() => setNotice(null)} className="opacity-70 hover:opacity-100" aria-label="Dismiss">✕</button>
    </div>
  );
}
