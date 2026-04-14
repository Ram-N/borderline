# Adding Maps to Borderline

This guide explains how to add a new geographic region to Borderline's Puzzle mode (and optionally Quiz mode).

---

## How the Map Pipeline Works

1. **SVG file** in `public/images/maps/` — vector outlines where each country/state is a `<path>` with an `id` (ISO code) and a `title` (display name).
2. **Adjacency JSON** in `public/data/` — lists each region entity's neighbors. Used to generate puzzles.
3. **`regionConfig.ts`** — maps a region key (e.g. `"europe"`) to its SVG URL and adjacency URL. This is what populates the region dropdown on the Home page.

---

## SVG Requirements

Every path in the SVG must have:

```xml
<path class="land" id="FR" title="France" d="M...Z"/>
```

| Attribute | Required | Notes |
|-----------|----------|-------|
| `id` | Yes | ISO 3166-1 alpha-2 for countries (e.g. `FR`, `DE`), or `US-CA` style for states |
| `title` | Yes | Human-readable name shown as label |
| `d` | Yes | SVG path data |
| `class="land"` | No | Used for base CSS styling; harmless if absent |

The SVG's `viewBox` can be anything — Borderline computes a tight crop at runtime using `computeViewBox()`.

**Good source:** [amcharts SVG Map Generator](https://dojo.amcharts.com/svg-map-generator) — generates compliant SVGs with `id` + `title` on every path.

---

## Step-by-Step: Adding a New Region

### 1. Add the SVG

Copy your SVG to:
```
public/images/maps/<your-map-name>.svg
```

Naming convention: `region_world_<region>Low.svg` for world regions, or `<country>Low.svg` for state/province maps.

### 2. Add or Reuse an Adjacency File

Borderline uses three adjacency files:

| File | Covers |
|------|--------|
| `public/data/adjacency.json` | All world countries (ISO 3166-1 alpha-2) |
| `public/data/us_states_adjacency.json` | US states (`US-XX` codes) |
| `public/data/india_states_adjacency.json` | Indian states (`IN-XX` codes) |

**If your region's countries already exist in `adjacency.json`** (e.g. a sub-region like the Balkans or the Caucasus) — you don't need a new file; just reuse `adjacency.json`.

**If you're adding a new country subdivision** (e.g. French regions, Brazilian states), create a new JSON file following this schema:

```json
{
  "FR-IDF": {
    "name": "Île-de-France",
    "neighbors": ["FR-HDF", "FR-GES", "FR-BFC", "FR-CVL", "FR-NOR"]
  },
  ...
}
```

Place it at `public/data/<your-adjacency>.json`.

### 3. Register the Region in `regionConfig.ts`

Open `src/data/regionConfig.ts` and add an entry to `REGION_CONFIG`:

```typescript
'balkans': {
  label: 'Balkans',
  svgMap: '/images/maps/region_world_balkansLow.svg',
  adjacencyUrl: '/data/adjacency.json',   // reuse world adjacency
  group: 'world',
},
```

For state/province maps, use `group: 'states'` — this puts it under the "States / Provinces" optgroup in the dropdown.

That's all. The region will now appear in the Home page dropdown and work with all 5 difficulty levels.

---

## Verifying a New Map

Run the dev server and open the browser console:

```bash
npm run dev
```

1. Select your region in Puzzle mode and start a puzzle.
2. If the map renders blank, open DevTools → Network and check whether the SVG loaded (404 = wrong path in `regionConfig.ts`).
3. If puzzles fail to generate ("Could not generate puzzles"), the adjacency file's ISO codes don't match the SVG `id` attributes — cross-check a few entries.
4. Check that country names appear in the label overlay — if they show as ISO codes (e.g. "FR" instead of "France"), the `title` attribute is missing from the SVG paths.

---

## Replacing an Existing Map

Drop the new SVG file into `public/images/maps/` with the **same filename**. No code changes needed.

- **Dev server**: picks up the file immediately on the next page load (no restart needed).
- **Production**: run `npm run build` and redeploy.

---

## Current Map Inventory

| Region key | SVG file | Adjacency |
|------------|----------|-----------|
| `europe` | `region_world_europeLow.svg` | `adjacency.json` |
| `africa` | `region_world_africaLow.svg` | `adjacency.json` |
| `asia` | `region_world_asiaLow.svg` | `adjacency.json` |
| `caribbean` | `region_world_caribbeanLow.svg` | `adjacency.json` |
| `central-america` | `region_world_centralAmericaLow.svg` | `adjacency.json` |
| `latin-america` | `region_world_latinAmericaLow.svg` | `adjacency.json` |
| `middle-east` | `region_world_middleEastLow.svg` | `adjacency.json` |
| `north-america` | `region_world_northAmericaLow.svg` | `adjacency.json` |
| `oceania` | `region_world_oceaniaLow.svg` | `adjacency.json` |
| `south-america` | `region_world_southAmericaLow.svg` | `adjacency.json` |
| `usa-states` | `usaAlbersLow.svg` | `us_states_adjacency.json` |
| `india-states` | `indiaLow.svg` | `india_states_adjacency.json` |

Unused SVGs currently in `public/images/maps/` (not wired up): `worldChinaLow.svg`, `region_world_middleEast-Zoom.svg`, `region_world_northAmericaLow (1).svg`.
