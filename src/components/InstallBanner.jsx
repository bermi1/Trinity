import { useState } from 'react';
import { useInstall } from '../mobile/native';

const KEY = 'tm360-install-later';
const snoozed = () => { try { return Date.now() < +(localStorage.getItem(KEY) || 0); } catch (e) { return false; } };

// Invites everyone to install Trinity Mark 360 as an app: the browser's own prompt where there is one
// (Android, Chrome, Edge, Samsung Internet), the Share → Add to Home Screen steps on iPhone and iPad,
// File → Add to Dock in Safari on a Mac. Hidden once installed; "Later" hides it for a week.
export default function InstallBanner() {
  const { mode, install } = useInstall();
  const [hide, setHide] = useState(snoozed);
  if (!mode || hide || (typeof navigator !== 'undefined' && navigator.webdriver)) return null;
  const later = () => { try { localStorage.setItem(KEY, String(Date.now() + 7 * 864e5)); } catch (e) { /* private mode */ } setHide(true); };
  return (
    <div className={"inst is-" + mode} role="dialog" aria-label="Install Trinity Mark 360">
      <img src="/icon-192.png" alt="" />
      <div className="inst-t">
        <b>Install Trinity Mark 360</b>
        {mode === 'prompt' ? <span>Open it from your home screen or desktop like an app: faster, full screen, works with a weak connection.</span> : null}
        {mode === 'ios' ? <span>Tap <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Share"><path d="M12 3v12M8 7l4-4 4 4" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg> <b>Share</b>, then <b>Add to Home Screen</b>.</span> : null}
        {mode === 'mac' ? <span>In Safari, choose <b>File → Add to Dock</b>.</span> : null}
      </div>
      <div className="inst-b">
        {mode === 'prompt' ? <button type="button" className="inst-go" onClick={async () => { if (await install()) setHide(true); }}>Install</button> : null}
        <button type="button" className="inst-later" onClick={later}>{mode === 'prompt' ? 'Later' : 'OK'}</button>
      </div>
    </div>
  );
}
