type Props = {
  svgX: number;
  svgY: number;
  variant: 'player' | 'correct';
  label?: string;
};

const COLORS = {
  player: '#2563eb',  // blue
  correct: '#16a34a', // green
};

/**
 * An SVG pin marker (teardrop shape with circle tip) placed at (svgX, svgY).
 * Rendered as children of a parent <svg> element.
 */
export default function PinMarker({ svgX, svgY, variant, label }: Props) {
  const color = COLORS[variant];

  if (variant === 'correct') {
    return (
      <g>
        <text
          x={svgX}
          y={svgY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={20}
        >
          🎯
        </text>
        {label && (
          <text
            x={svgX}
            y={svgY - 18}
            textAnchor="middle"
            fontSize={11}
            fontFamily="sans-serif"
            fill={color}
            stroke="white"
            strokeWidth={3}
            paintOrder="stroke"
            fontWeight="bold"
          >
            {label}
          </text>
        )}
      </g>
    );
  }

  // Pin is drawn so its tip points down at (svgX, svgY)
  const tipY = svgY;
  const bodyY = tipY - 24;

  return (
    <g>
      {/* Teardrop body */}
      <ellipse
        cx={svgX}
        cy={bodyY - 8}
        rx={9}
        ry={11}
        fill={color}
        stroke="white"
        strokeWidth={1.5}
      />
      {/* Triangle tip */}
      <polygon
        points={`${svgX - 7},${bodyY + 1} ${svgX + 7},${bodyY + 1} ${svgX},${tipY}`}
        fill={color}
        stroke="white"
        strokeWidth={1}
        strokeLinejoin="round"
      />
      {/* Inner circle dot */}
      <circle cx={svgX} cy={bodyY - 8} r={4} fill="white" />
      {label && (
        <text
          x={svgX}
          y={bodyY - 40}
          textAnchor="middle"
          fontSize={11}
          fontFamily="sans-serif"
          fill={color}
          stroke="white"
          strokeWidth={3}
          paintOrder="stroke"
          fontWeight="bold"
        >
          {label}
        </text>
      )}
    </g>
  );
}
