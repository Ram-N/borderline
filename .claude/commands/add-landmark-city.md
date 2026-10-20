Add a new city to the LandMark game. The user will tell you which city to add, or it may be in the arguments to this command.

## What you need from the user
If not already provided, ask for:
1. **City name and ID** — e.g. "Tokyo", id `tokyo`
2. **Game group** — usually "World Cities"; could be "Indian Cities" or a new group
3. **Landmark suggestions** — optional; you can propose 8–10 if they don't have a list

## Pipeline (follow these steps in order)

### Step 1 — Get a neighborhoods GeoJSON
Find and download a GeoJSON file of the city's neighborhoods, districts, arrondissements, or boroughs. Good sources:
- Code for America click-that-hood: `https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/{city-slug}.geojson`
- DataSF / city open-data portals
- OpenStreetMap exports (Overpass API)

Save to: `scripts/geo-data/cities/{id}_neighborhoods.geojson`

After downloading, inspect the GeoJSON to find:
- Number of features
- The property key that holds the neighborhood name (e.g. `"name"`, `"NAME"`, `"l_aroff"`)
- Actual geographic bounds (min/max lat/lon)

```bash
python3 -c "
import json
with open('scripts/geo-data/cities/{id}_neighborhoods.geojson') as f:
    d = json.load(f)
print('Features:', len(d['features']))
print('Props:', list(d['features'][0]['properties'].keys()))
lons, lats = [], []
def collect(c):
    if isinstance(c[0], list):
        for x in c: collect(x)
    else:
        lons.append(c[0]); lats.append(c[1])
for feat in d['features']:
    collect(feat['geometry']['coordinates'])
print(f'lat [{min(lats):.4f}, {max(lats):.4f}]  lon [{min(lons):.4f}, {max(lons):.4f}]')
"
```

### Step 2 — Create the landmark stub file
Create `public/data/landmarks/{id}.json` with bounds slightly padded (~0.01°) beyond the GeoJSON extents, an empty landmarks array, and the standard 800×700 viewBox:

```json
{
  "id": "{id}",
  "name": "{City Name}",
  "bounds": {
    "minLat": ...,
    "maxLat": ...,
    "minLon": ...,
    "maxLon": ...
  },
  "viewBox": "0 0 800 700",
  "landmarks": []
}
```

### Step 3 — Add the manifest entry
Add to the `"cities"` array in `scripts/geo-data/manifest.json`, after the last entry in the target group:

```json
{
  "id": "{id}",
  "label": "{City Name}",
  "geojson": "scripts/geo-data/cities/{id}_neighborhoods.geojson",
  "featureNameProp": "{name-prop-from-step-1}",
  "fills": {},
  "palette": null,
  "tolerance": 2,
  "strokeWidth": null,
  "maxLabels": null,
  "suppressFeatureLabels": false,
  "customLabels": null,
  "group": "{World Cities | Indian Cities | ...}",
  "gameModes": ["pinpoint", "match-the-map"],
  "defaultDifficulty": 1,
  "diagonalKm": null
}
```

Tolerance guidance:
- `2` for cities with large districts/boroughs (NYC, London, SF)
- `1` for denser maps with many small wards (Paris, Delhi, Bangalore)

Use `"strokeWidth": 0.5` and `"maxLabels": 15` for maps with 100+ features.

### Step 4 — Generate the SVG maps
```bash
npm run landmark:maps -- --map {id}
```

This reads bounds from the stub file and the GeoJSON, and writes:
- `public/images/maps/{id}_labeled.svg`
- `public/images/maps/{id}_blank.svg`

If the map looks wrong (features missing, wrong projection), check that `featureNameProp` is correct and that bounds are accurate.

### Step 5 — Choose landmarks and get SVG coordinates
Pick 8–10 iconic, well-spread landmarks. Then run:

```bash
npm run landmark:maps -- --map {id} --print-pins \
  {lat1},{lon1} \
  {lat2},{lon2} \
  ...
```

This prints `svgX` and `svgY` for each lat/lon pair.

**Check for clustering:** Scan the resulting coordinates and flag any two landmarks whose svgX and svgY are both within ~30px of each other — they will overlap as pins on the map and make the game unfair. Common causes:
- Two landmarks that are genuinely adjacent (e.g. Opera House and Harbour Bridge in Sydney)
- A landmark that falls outside the map bounds (svgX > canvas width or negative)

If any pins are too close or out of bounds, drop one and substitute a better-spread alternative, then rerun `--print-pins` for the replacement.

### Step 6 — Populate landmarks in the JSON
Fill in `public/data/landmarks/{id}.json` with the full landmarks array:

```json
{
  "id": "landmark-slug",
  "name": "Landmark Name",
  "lat": ...,
  "lon": ...,
  "svgX": ...,
  "svgY": ...,
  "hint": "A short clue that describes the landmark without naming it"
}
```

Hint writing guidelines:
- One sentence, ~10–15 words
- Describe what it *is* or what it's known for — not its name
- Avoid being so vague it could apply to anything

### Step 7 — Rebuild the registry
```bash
npm run geo:build
```

This regenerates `src/generated/geoRegistry.ts`, which is what the app actually reads. The new city will appear in its group on the LandMark home screen.

### Step 8 — Verify
Check that the new city appears in the UI group and that the SVG map renders cleanly. If neighborhood labels overlap badly, consider adding `"maxLabels"` or `"suppressFeatureLabels": true` with `"customLabels"` to the manifest entry, then re-run from Step 4.
