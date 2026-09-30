import React, { useState } from 'react';

// Shown to signed-in users whose address is not confirmed yet. Scans, monitors and API keys are
// refused server-side until it is, so this is the way out rather than a nag.
export default function VerifyEmailBanner({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const resend = async () => {
    setState('sending');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setState(res.ok ? 'sent' : 'error');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="relative z-30 bg-amber-500/10 border-b border-amber-500/30 text-amber-100 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex-1 min-w-[16rem]">
          Confirm <strong>{email}</strong> to start running scans — we sent you a link.
        </span>
        <button
          onClick={resend}
          disabled={state === 'sending' || state === 'sent'}
          className="font-semibold underline underline-offset-2 disabled:opacity-60 disabled:no-underline"
        >
          {state === 'sent' ? 'Link sent — check your inbox' : state === 'sending' ? 'Sending…' : 'Resend link'}
        </button>
        {state === 'error' && <span className="text-red-300">Could not send. Try again shortly.</span>}
      </div>
    </div>
  );
}
