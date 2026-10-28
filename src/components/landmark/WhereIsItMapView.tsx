import { useRef, useCallback, useMemo } from 'react';
import PinMarker from './PinMarker';

type Props = {
  svgSrc: string;            // URL to the map SVG file
  viewBox: string;           // e.g. "0 0 800 700"
  playerPin: { svgX: number; svgY: number } | null;
  correctPin?: { svgX: number; svgY: number }; // shown on reveal phase
  correctLabel?: string;     // label for the correct pin (default: "Correct")
  /** Reveal phase only: SVG path of the answer area, drawn instead of the correct pin. */
  correctArea?: { d: string; hit: boolean };
  phase: 'question' | 'reveal';
  /** Confidence circle around the player pin, in SVG units. */
  claimRadius?: number | null;
  /** Reveal phase only: whether the answer fell inside the circle (colours it green/red). */
  claimHit?: boolean;
  onMapClick: (svgX: number, svgY: number) => void;
};

/**
 * Renders an SVG map with click-to-place pin interaction.
 * The map image is embedded as <image> inside a wrapper <svg>.
 * Click coordinates are converted from DOM pixels to SVG viewBox space.
 */
export default function WhereIsItMapView({
  svgSrc,
  viewBox,
  playerPin,
  correctPin,
  correctLabel = 'Correct',
  correctArea,
  phase,
  claimRadius,
  claimHit,
  onMapClick,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);

  // Zoomed inset: shown in reveal phase when the two pins are close together
  const inset = useMemo(() => {
    if (phase !== 'reveal' || !playerPin || !correctPin || correctArea) return null;
    const dx = playerPin.svgX - correctPin.svgX;
    const dy = playerPin.svgY - correctPin.svgY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const diagonal = Math.sqrt(vbWidth * vbWidth + vbHeight * vbHeight);
    if (dist >= diagonal * 0.08) return null;

    const cx = (playerPin.svgX + correctPin.svgX) / 2;
    const cy = (playerPin.svgY + correctPin.svgY) / 2;
    // Content area: enough to fully show both pin markers (pin body extends ~50 units above tip)
    const contentHalf = Math.max(dist / 2 + 50, 55);
    const insetSize = 155; // in parent SVG viewBox units

    // Place inset in the corner farthest from the pins
    const atTop = cy >= vbHeight / 2;
    const atLeft = cx >= vbWidth / 2;
    const x = atLeft ? 14 : vbWidth - insetSize - 14;
    const y = atTop ? 14 : vbHeight - insetSize - 14;
    const labelY = atTop ? y + insetSize + 13 : y - 4;

    return {
      x, y, labelY, insetSize,
      viewBox: `${cx - contentHalf} ${cy - contentHalf} ${contentHalf * 2} ${contentHalf * 2}`,
      playerPin, correctPin,
    };
  }, [phase, playerPin, correctPin, correctArea, vbWidth, vbHeight]);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (phase !== 'question') return;
      const svgEl = svgRef.current;
      if (!svgEl) return;

      const rect = svgEl.getBoundingClientRect();
      // Scale from DOM pixels to SVG viewBox coordinates
      const scaleX = vbWidth / rect.width;
      const scaleY = vbHeight / rect.height;
      const svgX = Math.round((e.clientX - rect.left) * scaleX);
      const svgY = Math.round((e.clientY - rect.top) * scaleY);
      onMapClick(svgX, svgY);
    },
    [phase, vbWidth, vbHeight, onMapClick],
  );

  return (
    <div className="map-view-wrapper">
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className={`map-svg${phase === 'question' ? ' map-svg--clickable' : ''}`}
        onClick={handleClick}
        aria-label="Map — click to place your pin"
      >
        {/* Background map image */}
        <image href={svgSrc} x={0} y={0} width={vbWidth} height={vbHeight} />

        {/* Answer area outline (reveal phase) */}
        {phase === 'reveal' && correctArea && (
          <path
            d={correctArea.d}
            className={`correct-area${correctArea.hit ? ' correct-area--hit' : ' correct-area--miss'}`}
          />
        )}

        {/* Confidence circle around the player pin */}
        {playerPin && claimRadius && (
          <circle
            cx={playerPin.svgX}
            cy={playerPin.svgY}
            r={claimRadius}
            className={`claim-circle${phase === 'reveal' ? (claimHit ? ' claim-circle--hit' : ' claim-circle--miss') : ''}`}
          />
        )}

        {/* Dashed line from player pin to correct location (reveal phase) */}
        {phase === 'reveal' && playerPin && correctPin && !correctArea && (
          <line
            x1={playerPin.svgX}
            y1={playerPin.svgY}
            x2={correctPin.svgX}
            y2={correctPin.svgY}
            stroke="#888"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        )}

        {/* Player pin (blue) */}
        {playerPin && (
          <PinMarker
            svgX={playerPin.svgX}
            svgY={playerPin.svgY}
            variant="player"
            label={phase === 'reveal' ? 'You' : undefined}
          />
        )}

        {/* Correct pin (green) — shown only on reveal */}
        {phase === 'reveal' && correctPin && !correctArea && (
          <PinMarker
            svgX={correctPin.svgX}
            svgY={correctPin.svgY}
            variant="correct"
            label={correctLabel}
          />
        )}

        {/* Zoomed inset — shown when the two pins are close together */}
        {inset && (
          <g>
            <text
              x={inset.x + inset.insetSize / 2}
              y={inset.labelY}
              textAnchor="middle"
              fontSize={11}
              fontFamily="sans-serif"
              fill="#444"
              fontStyle="italic"
            >
              zoomed in
            </text>
            <rect
              x={inset.x - 2}
              y={inset.y - 2}
              width={inset.insetSize + 4}
              height={inset.insetSize + 4}
              fill="#c8e6f5"
              stroke="#555"
              strokeWidth={2.5}
              rx={3}
            />
            <svg
              x={inset.x}
              y={inset.y}
              width={inset.insetSize}
              height={inset.insetSize}
              viewBox={inset.viewBox}
            >
              <image href={svgSrc} x={0} y={0} width={vbWidth} height={vbHeight} />
              <line
                x1={inset.playerPin.svgX}
                y1={inset.playerPin.svgY}
                x2={inset.correctPin.svgX}
                y2={inset.correctPin.svgY}
                stroke="#888"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
              <PinMarker svgX={inset.playerPin.svgX} svgY={inset.playerPin.svgY} variant="player" />
              <PinMarker svgX={inset.correctPin.svgX} svgY={inset.correctPin.svgY} variant="correct" />
            </svg>
          </g>
        )}
      </svg>
    </div>
  );
}
