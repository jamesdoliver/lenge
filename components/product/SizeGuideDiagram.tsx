export default function SizeGuideDiagram() {
  return (
    <svg
      viewBox="0 0 360 180"
      role="img"
      aria-label="T-Shirt Maße: A Brustbreite, B Länge, C Ärmellänge"
      className="w-full max-w-md mx-auto text-border"
    >
      {/* FRONT */}
      <g transform="translate(20 20)" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M40 10 L60 0 L100 0 L120 10 L155 25 L150 55 L130 50 L130 130 L30 130 L30 50 L10 55 L5 25 Z" />
        {/* A — half chest line */}
        <line x1="30" y1="50" x2="130" y2="50" stroke="currentColor" strokeDasharray="3 3" />
        <text x="80" y="44" textAnchor="middle" fontSize="10" fill="currentColor">A</text>
        {/* B — body length */}
        <line x1="20" y1="0" x2="20" y2="130" stroke="currentColor" strokeDasharray="3 3" />
        <text x="14" y="68" textAnchor="middle" fontSize="10" fill="currentColor">B</text>
        {/* C — sleeve length */}
        <line x1="120" y1="10" x2="155" y2="25" stroke="currentColor" strokeDasharray="3 3" />
        <text x="146" y="14" textAnchor="middle" fontSize="10" fill="currentColor">C</text>
      </g>
      <text x="100" y="170" textAnchor="middle" fontSize="11" fill="currentColor" fontFamily="var(--font-dm-mono)" letterSpacing="2">FRONT</text>

      {/* BACK */}
      <g transform="translate(200 20)" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M40 10 L60 0 L100 0 L120 10 L155 25 L150 55 L130 50 L130 130 L30 130 L30 50 L10 55 L5 25 Z" />
      </g>
      <text x="280" y="170" textAnchor="middle" fontSize="11" fill="currentColor" fontFamily="var(--font-dm-mono)" letterSpacing="2">BACK</text>
    </svg>
  );
}
