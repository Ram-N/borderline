export type RegionConfig = {
  label: string;
  svgMap: string;
  adjacencyUrl: string;
  group: 'world' | 'states';
};

export const REGION_CONFIG: Record<string, RegionConfig> = {
  // World regions
  world:            { label: 'Any Country',      svgMap: '/images/maps/worldChinaLow.svg',                adjacencyUrl: '/data/adjacency.json',              group: 'world' },
  europe:           { label: 'Europe',          svgMap: '/images/maps/region_world_europeLow.svg',        adjacencyUrl: '/data/adjacency.json',              group: 'world' },
  africa:           { label: 'Africa',           svgMap: '/images/maps/region_world_africaLow.svg',        adjacencyUrl: '/data/adjacency.json',              group: 'world' },
  asia:             { label: 'Asia',             svgMap: '/images/maps/region_world_asiaLow.svg',          adjacencyUrl: '/data/adjacency.json',              group: 'world' },
  caribbean:        { label: 'Caribbean',        svgMap: '/images/maps/region_world_caribbeanLow.svg',     adjacencyUrl: '/data/adjacency.json',              group: 'world' },
  'central-america':{ label: 'Central America',  svgMap: '/images/maps/region_world_centralAmericaLow.svg',adjacencyUrl: '/data/adjacency.json',              group: 'world' },
  'latin-america':  { label: 'Latin America',    svgMap: '/images/maps/region_world_latinAmericaLow.svg', adjacencyUrl: '/data/adjacency.json',              group: 'world' },
  'middle-east':    { label: 'Middle East',      svgMap: '/images/maps/region_world_middleEastLow.svg',   adjacencyUrl: '/data/adjacency.json',              group: 'world' },
  'north-america':  { label: 'North America',    svgMap: '/images/maps/region_world_northAmericaLow.svg', adjacencyUrl: '/data/adjacency.json',              group: 'world' },
  oceania:          { label: 'Oceania',          svgMap: '/images/maps/region_world_oceaniaLow.svg',      adjacencyUrl: '/data/adjacency.json',              group: 'world' },
  'south-america':  { label: 'South America',    svgMap: '/images/maps/region_world_southAmericaLow.svg', adjacencyUrl: '/data/adjacency.json',              group: 'world' },
  // States / provinces
  'usa-states':     { label: 'USA States',       svgMap: '/images/maps/usaAlbersLow.svg',                 adjacencyUrl: '/data/us_states_adjacency.json',    group: 'states' },
  'india-states':   { label: 'India States',     svgMap: '/images/maps/indiaLow.svg',                     adjacencyUrl: '/data/india_states_adjacency.json', group: 'states' },
};
