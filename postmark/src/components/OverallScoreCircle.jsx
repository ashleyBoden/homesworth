export default function OverallScoreFunction({ animate, overallScore }) {
  return (
    <svg width="200" height="200" viewBox="0 0 120 120">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle
        cx="60"
        cy="60"
        r="54"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="4"
      />
      <circle
        cx="60"
        cy="60"
        r="54"
        fill="none"
        stroke="#0D9488"
        strokeWidth="8"
        strokeDasharray="339.3"
        strokeDashoffset={
          animate ? 339.3 * (1 - (overallScore ?? 0) / 10) : 339.3
        }
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        filter="url(#glow)"
        style={{ transition: "stroke-dashoffset 1s ease-out" }}
      />
      <text
        x="60"
        y="53"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FFFFFF"
        fontSize="35"
        fontWeight="700"
        fontFamily="Outfit, sans-serif"
      >
        {overallScore?.toFixed(1) ?? "-"}
      </text>
      <text
        x="60"
        y="80"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#888892"
        fontSize="12"
        fontFamily="Outfit, sans-serif"
      >
        / 10
      </text>
    </svg>
  );
}
