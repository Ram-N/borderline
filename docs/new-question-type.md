
## Core Idea

Use the map itself as the question.

Players infer answers from **spatial context** instead of reading a prompt.

---

## Variant 1: “Find the Hidden Country” (Easiest)

**What player sees**

* A cluster of countries (all neighbors)
* Each neighbor is labeled
* The central country is:

  * Highlighted shape (or silhouette)
  * Name hidden

**Task**

* Identify the central country

**Example**

* Show: Argentina, Peru, Colombia, Venezuela, Bolivia, Paraguay, Uruguay
* Hidden center → Brazil

**Why this works**

* Pure pattern recognition
* No trick wording
* Very intuitive entry point

**Difficulty controls**

* Easy: distinctive shapes (Italy, India)
* Medium: less distinctive (Zambia, Belarus)
* Hard: small or complex regions (Balkans, West Africa)

---

## Variant 2: “Missing Neighbor(s)”

**What player sees**

* One country clearly labeled (e.g., Brazil)
* Some neighbors shown and labeled
* 1–2 neighbors missing (empty shapes or faded)

**Task**

* Identify the missing neighbor(s)

**Example**

* Show Brazil with Argentina, Peru, Colombia, Venezuela visible
* Missing → Bolivia, Paraguay

**Why this works**

* Tests completeness of mental map
* Encourages elimination reasoning

**Difficulty controls**

* Number of missing neighbors
* Whether shapes are visible or fully hidden
* Region complexity

---

## Important Design Choices

### 1. Labeling

* Keep labels minimal and clean
* Use hover or tap for mobile to reveal names if needed

### 2. Visual Encoding

* Central country:

  * Solid color or outline
* Missing neighbors:

  * Dashed border or faded fill
* Known neighbors:

  * Neutral tone with labels

### 3. Zoom Level

This is key to variety:

* Full region (South America)
* Sub-region (West Africa cluster)
* Tight zoom (3–5 countries only)

---

## Question Generation Logic (this is the real engine)

You already have coordinates. Now you need adjacency.

### Step 1: Build adjacency graph (DONE!)

Each country → list of neighbors

Example:

```
Brazil → [Argentina, Bolivia, Peru, Colombia, Venezuela, Guyana, Suriname, Uruguay, Paraguay, France (French Guiana)]
```

### Step 2: Generate puzzles

**Variant 1**

* Pick a country C
* Fetch neighbors N
* Render N with labels
* Hide C

**Variant 2**

* Pick country C
* Pick subset of neighbors N_visible
* Hide N_missing

---

## What makes this powerful

You can now create:

* Infinite questions
* Difficulty scaling
* Daily puzzles
* Region-based modes

---

## Extensions (later, but natural next steps)

* “Which country is NOT a neighbor?” (trap option)
* “Shortest path between two countries”
* “Guess the country from coastline only”
* Timed mode vs relaxed exploration

---

## One suggestion to improve your idea

Add **progressive reveal**

Example:

* Start with just shapes
* Then reveal labels after 5 seconds
* Then show multiple choice

This keeps both beginners and advanced players engaged.


# 1. Data Model (JSONC)

Goal: keep it simple, fast, and derived from your SVG.

You need **three layers**:

* country metadata
* adjacency graph
* puzzle definition (generated, not stored)

### countries.jsonc

```jsonc
{
  "countries": {
    "BRA": {
      "name": "Brazil",
      "svgId": "BRA",        // must match SVG path id
      "region": "South America",
      "neighbors": ["ARG", "BOL", "PER", "COL", "VEN", "GUY", "SUR", "URY", "PRY", "FRA"]
    },
    "ARG": {
      "name": "Argentina",
      "svgId": "ARG",
      "region": "South America",
      "neighbors": ["BRA", "CHL", "BOL", "PRY", "URY"]
    }
  }
}
```

Notes:

* `svgId` is critical → direct mapping to `<Path id="BRA" />`
* Include edge cases like `FRA` for French Guiana
* Keep this flat and fast, no nesting

---

### optional: regions.jsonc (for zoom control)

```jsonc
{
  "regions": {
    "south_america": {
      "countries": ["BRA", "ARG", "PER", "COL", "VEN", "BOL", "PRY", "URY", "GUY", "SUR"],
      "defaultZoom": 1.2
    }
  }
}
```

---

### puzzle object (generated at runtime)

```jsonc
{
  "type": "hidden_country", // or "missing_neighbor"
  "center": "BRA",
  "visibleNeighbors": ["ARG", "PER", "COL", "VEN"],
  "hiddenNeighbors": ["BOL", "PRY"],
  "choices": ["BRA", "COL", "PER", "ARG"],
  "correctAnswer": "BRA"
}
```

Do NOT store puzzles. Generate them.

---

# 2. Puzzle Generation Logic (Agent Instructions)

### Variant 1: Hidden Country

```
1. Pick random country C
2. Get neighbors N
3. If |N| < 3 → reject (too trivial)
4. visibleNeighbors = N
5. Generate 3–4 distractors:
   - same region preferred
   - similar neighbor count if possible
6. Return puzzle
```

---

### Variant 2: Missing Neighbor

```
1. Pick country C
2. Get neighbors N
3. Randomly remove k neighbors (k = 1 or 2)
4. visibleNeighbors = N - removed
5. hiddenNeighbors = removed
6. Choices = removed + distractors
```

---

# 3. React Native + SVG Interaction Pattern

You do NOT need D3.

Use:

* `react-native-svg`
* optional: `react-native-reanimated` for smooth transitions

---

## Rendering Strategy

### Base Map

* Preload SVG as components
* Each country = `<Path />` with `id`

Example:

```jsx
<Svg>
  {countries.map(c => (
    <Path
      key={c.code}
      id={c.svgId}
      d={paths[c.svgId]}
      fill={getFill(c.code)}
      onPress={() => handlePress(c.code)}
    />
  ))}
</Svg>
```

---

## State Model (important)

```js
{
  centerCountry: "BRA",
  visibleNeighbors: [...],
  hiddenNeighbors: [...],
  selectedAnswer: null,
  phase: "question" | "reveal"
}
```

---

## Styling Logic

```js
function getFill(code) {
  if (code === centerCountry && type === 'hidden_country') {
    return '#444' // hidden but visible shape
  }

  if (visibleNeighbors.includes(code)) {
    return '#ccc'
  }

  if (hiddenNeighbors.includes(code)) {
    return '#eee' // or transparent
  }

  return '#f8f8f8' // rest of world
}
```

---

## Labels

Avoid clutter.

Strategy:

* Only label visible neighbors
* Use centroid of path for text placement

```jsx
<Text
  x={centroid.x}
  y={centroid.y}
>
  {country.name}
</Text>
```

Compute centroids once and cache.

---

# 4. Interaction Flow

## Variant 1 (Hidden Country)

1. Render neighbors labeled
2. Center country visible but unnamed
3. Show choices (bottom sheet)
4. User taps choice
5. Animate:

   * correct → highlight green
   * wrong → flash red + reveal

---

## Variant 2 (Missing Neighbor)

Two options:

### A. Tap on map (better UX)

* User taps empty shape
* That is the answer

### B. Multiple choice (simpler)

* Same as Variant 1

---

# 5. Zoom + Camera

Use:

* `react-native-svg` + `viewBox`
* or wrap in `react-native-gesture-handler`

Basic approach:

* Precompute bounding box of:

  * center + neighbors
* Set SVG `viewBox` to that

---

# 6. Performance Notes

* Do NOT re-render entire SVG on state change
* Memoize paths
* Keep fills as lightweight state updates

---

# 7. Sample Puzzles (for testing)

### Hidden Country

```json
{
  "type": "hidden_country",
  "center": "DEU",
  "visibleNeighbors": ["FRA", "POL", "AUT", "CHE", "BEL", "NLD", "CZE"],
  "choices": ["DEU", "POL", "AUT", "CZE"],
  "correctAnswer": "DEU"
}
```

---

### Missing Neighbor

```json
{
  "type": "missing_neighbor",
  "center": "IND",
  "visibleNeighbors": ["PAK", "CHN", "NPL", "BGD"],
  "hiddenNeighbors": ["MMR", "BTN"],
  "choices": ["MMR", "BTN", "LKA", "AFG"],
  "correctAnswer": ["MMR", "BTN"]
}
```

---

# 8. One Critical Design Insight

Do NOT treat SVG as static.

Treat it as:

* a graph (adjacency)
* a coordinate system (for zoom)
* an interaction surface (tap targets)

Your game engine lives **outside** the SVG.

---

# 9. What to Build First (MVP Order)

1. Hardcode 1 region (South America)
2. Implement Variant 1 only
3. Tap-based selection
4. Then add:

   * missing neighbors
   * zoom logic
   * difficulty tuning
