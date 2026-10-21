// Small bridges to the phone: install prompt, home-screen mode and status bar colour.
import { useEffect, useState, useSyncExternalStore } from 'react';

let deferredPrompt = null;
const listeners = new Set();
const emit = () => listeners.forEach(fn => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; emit(); });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; emit(); });
}

export const isIOS = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
export const isStandalone = () => typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);

// What the "Install app" button can do here: 'prompt' (Android/Chrome), 'ios' (show steps), or null.
export function useInstall() {
  const prompt = useSyncExternalStore(fn => { listeners.add(fn); return () => listeners.delete(fn); }, () => deferredPrompt, () => null);
  const mode = isStandalone() ? null : prompt ? 'prompt' : isIOS() ? 'ios' : null;
  const install = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null; emit();
    return outcome === 'accepted';
  };
  return { mode, install };
}

// Matches the phone's status bar to the screen behind it.
export function useThemeColor(color) {
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const before = meta.getAttribute('content');
    meta.setAttribute('content', color);
    return () => meta.setAttribute('content', before);
  }, [color]);
}

// True while the on-screen keyboard is up, so the tab bar can step aside.
export function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const check = () => setOpen(vv.height < window.innerHeight * 0.78);
    vv.addEventListener('resize', check);
    return () => vv.removeEventListener('resize', check);
  }, []);
  return open;
}
