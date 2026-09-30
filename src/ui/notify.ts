export type ToastTone = 'error' | 'info' | 'success';

export const TOAST_EVENT = 'app-toast';

export interface ToastDetail {
  message: string;
  tone: ToastTone;
}

/** Show a non-blocking message. Replaces window.alert, which freezes the page and looks unfinished. */
export function notify(message: string, tone: ToastTone = 'error'): void {
  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail: { message, tone } }));
}
