// Shown while the signed-in account and its data load from the database.
export default function Splash() {
  return (
    <div style={{ minHeight: '100vh', background: '#1D103D', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
      <svg width="44" height="50" viewBox="138 118 176 196" fill="none" stroke="#B49A5A" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'tmPulse 1.4s infinite' }}>
        <path d="M153 130 V186 Q153 214 182 214 H274 Q304 214 284 240 L214 298 Q205 306 196 298 L168 248" />
        <path d="M201 158 H266" />
      </svg>
      <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: '.24em', color: 'rgba(255,255,255,.6)' }}>LOADING WORKSPACE</span>
    </div>
  );
}
