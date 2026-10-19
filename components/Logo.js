// The JJ mark: two interlocked homes with a woven line. `ground` must match the color behind it.
export default function Logo({ ground = '#0D4A50', light = '#F6F1E7', accent = '#E07A3F', className, title }) {
  return (
    <svg className={className} viewBox="-20 0 240 200" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path d="M10 104 L64 56 L118 104 V170 H10 Z" fill="none" stroke={light} strokeWidth="6" strokeLinejoin="miter" />
      <path d="M82 84 L138 32 L194 84 V190 H82 Z" fill="none" stroke={accent} strokeWidth="6" strokeLinejoin="miter" />
      <path d="M82 156 V184" stroke={ground} strokeWidth="16" />
      <path d="M82 154 V186" stroke={accent} strokeWidth="6" />
      <path d="M79.4 69.4 L97.9 87.1" stroke={ground} strokeWidth="16" />
      <path d="M78 67.9 L99.2 86.7" stroke={light} strokeWidth="6" />
      <path d="M3 116 H17 M111 116 H125" stroke={ground} strokeWidth="12" />
      <path d="M-20 116 H75 M89 116 H187 M201 116 H220" stroke={light} strokeWidth="4.5" />
      <text x="46" y="151" textAnchor="middle" fontFamily="Bodoni Moda, Didot, serif" fontWeight="600" fontSize="44" fill={light}>J</text>
      <text x="150" y="164" textAnchor="middle" fontFamily="Bodoni Moda, Didot, serif" fontWeight="600" fontSize="54" fill={accent}>J</text>
    </svg>
  );
}
