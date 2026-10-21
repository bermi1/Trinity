// Line icon from the app's icon set (24×24 paths in src/logic/constants.js).
export default function Icon({ d, size = 20, width = 1.8, color = 'currentColor', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', ...style }} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export const Logo = ({ size = 28, color = '#B49A5A' }) => (
  <svg width={size} height={size * 1.12} viewBox="138 118 176 196" fill="none" stroke={color} strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M153 130 V186 Q153 214 182 214 H274 Q304 214 284 240 L214 298 Q205 306 196 298 L168 248" />
    <path d="M201 158 H266" />
  </svg>
);
