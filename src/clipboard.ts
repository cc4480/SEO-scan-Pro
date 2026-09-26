/**
 * Copies text to the clipboard and reports whether it actually succeeded.
 *
 * `navigator.clipboard` is `undefined` outside a secure context and its promise can reject when
 * permission is denied, so a caller must never show a "Copied" confirmation without checking the
 * result. Falls back to the legacy selection + execCommand path.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Blocked or unavailable — fall through to the legacy path.
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
