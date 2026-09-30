import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { TOAST_EVENT, type ToastDetail, type ToastTone } from './notify';

interface Toast extends ToastDetail { id: number }

// Complete class literals so Tailwind can see them.
const STYLE: Record<ToastTone, { box: string; Icon: typeof Info }> = {
  error: { box: 'border-rose-400/40 bg-rose-950/90 text-rose-50', Icon: AlertCircle },
  info: { box: 'border-sky-400/40 bg-slate-900/95 text-slate-50', Icon: Info },
  success: { box: 'border-emerald-400/40 bg-emerald-950/90 text-emerald-50', Icon: CheckCircle2 }
};

let nextId = 1;

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const { message, tone } = (e as CustomEvent<ToastDetail>).detail;
      const id = nextId++;
      setToasts((t) => [...t.slice(-3), { id, message, tone }]);
      window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 8000 : 5000);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(92vw,24rem)] flex-col gap-2" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const { box, Icon } = STYLE[t.tone];
          return (
            <motion.div
              key={t.id} layout role={t.tone === 'error' ? 'alert' : 'status'}
              initial={{ opacity: 0, x: 40, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur ${box}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1 leading-snug">{t.message}</span>
              <button type="button" aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="opacity-70 hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
