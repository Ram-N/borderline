import { useRef, useCallback } from 'react';
import PinMarker from './PinMarker';

type Props = {
  svgSrc: string;            // URL to the map SVG file
  viewBox: string;           // e.g. "0 0 800 700"
  playerPin: { svgX: number; svgY: number } | null;
  correctPin?: { svgX: number; svgY: number }; // shown on reveal phase
  phase: 'question' | 'reveal';
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
  phase,
  onMapClick,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);

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

        {/* Dashed line from player pin to correct location (reveal phase) */}
        {phase === 'reveal' && playerPin && correctPin && (
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
        {phase === 'reveal' && correctPin && (
          <PinMarker
            svgX={correctPin.svgX}
            svgY={correctPin.svgY}
            variant="correct"
            label="Correct"
          />
        )}
      </svg>
    </div>
  );
}
