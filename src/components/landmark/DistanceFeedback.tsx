import type { ConfidenceLevel } from '../../types/landmark/game';
import { CONFIDENCE_TIERS } from '../../utils/landmark/distanceScore';

type Props = {
  distanceKm: number;
  radiusKm: number;
  finalScore: number;
  confidence: ConfidenceLevel;
  /** When true, shows "Inside!" instead of the distance — used for region polygon hits. */
  insideRegion?: boolean;
};

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export default function DistanceFeedback({
  distanceKm,
  radiusKm,
  finalScore,
  confidence,
  insideRegion,
}: Props) {
  const hit = insideRegion || distanceKm <= radiusKm;

  return (
    <div className="distance-feedback">
      <div className="feedback-distance">
        {insideRegion ? (
          <span className="feedback-dist-value feedback-inside">Inside!</span>
        ) : (
          <>
            <span className="feedback-dist-value">{formatDistance(distanceKm)}</span>
            <span className="feedback-dist-label"> away</span>
          </>
        )}
      </div>
      <div className="feedback-scores">
        <span className="feedback-base">{CONFIDENCE_TIERS[confidence].label}</span>
        <span className={`feedback-confidence ${hit ? 'bonus' : 'penalty'}`}>
          {hit ? 'Inside' : 'Missed'} your {formatDistance(radiusKm)} circle
        </span>
        <span className="feedback-final">+{finalScore} pts</span>
      </div>
    </div>
  );
}
