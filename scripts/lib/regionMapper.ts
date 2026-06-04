/**
 * Maps region keys from REGION_CONFIG to continent labels for distribution tracking.
 */

const REGION_TO_CONTINENT: Record<string, string> = {
  europe: 'Europe',
  africa: 'Africa',
  asia: 'Asia',
  caribbean: 'Americas',
  'central-america': 'Americas',
  'latin-america': 'Americas',
  'middle-east': 'Asia',
  'north-america': 'Americas',
  oceania: 'Oceania',
  'south-america': 'Americas',
  'usa-states': 'Americas',
  'india-states': 'Asia',
};

export function regionToContinent(regionKey: string): string {
  return REGION_TO_CONTINENT[regionKey] ?? 'Unknown';
}
