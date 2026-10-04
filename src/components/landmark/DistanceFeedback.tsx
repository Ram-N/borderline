type Props = {
  distanceKm: number;
  baseScore: number;
  finalScore: number;
  confidence: string;
  /** When true, shows "Inside!" instead of the distance — used for region polygon hits. */
  insideRegion?: boolean;
};

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export default function DistanceFeedback({
  distanceKm,
  baseScore,
  finalScore,
  confidence,
  insideRegion,
}: Props) {
  const wasBonus = confidence === 'high' && finalScore > baseScore;
  const wasPenalty = confidence === 'high' && finalScore === 0 && baseScore > 0;

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
        <span className="feedback-base">Base: {baseScore}</span>
        {confidence !== 'medium' && (
          <span className={`feedback-confidence ${wasPenalty ? 'penalty' : wasBonus ? 'bonus' : ''}`}>
            {confidence === 'low' ? '×0.7 (Low)' : wasBonus ? '×1.4 (High)' : wasPenalty ? 'Overconfidence! ×0' : ''}
          </span>
        )}
        <span className="feedback-final">+{finalScore} pts</span>
      </div>
    </div>
  );
}
