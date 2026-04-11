# Technical Specification: Borderline

## Project Overview
**Borderline** is a React Native geography trainer focusing on "occlusion learning." Players identify countries or sub-regions by viewing map segments at various zoom levels. The game tests spatial awareness by hiding names and specific regions, requiring the user to identify the "borderline" neighbors or the hidden area itself.

## Tech Stack & Constraints
* **Framework:** React Native (Expo)
* **Rendering:** `react-native-svg`
* **Validation:** `fuse.js` (Fuzzy matching for text input)
* **Styling Rule:** No semi-colons or em-dashes in code comments or documentation.
* **Tone:** Direct, functional, and minimalist.

## 1. Asset Pipeline (amCharts Integration)
The app will consume amCharts SVG files. The AI agent must implement a pattern to handle these:
* **Path Mapping:** Every `<path>` in the SVG has an `id` (ISO code) and a `title` (Name).
* **Data Conversion:** Convert the SVG XML into a JSON object where each entry is a "Region" containing the path data and the display name.
* **Coordinate Integrity:** Use the original `viewBox` from the amCharts file to ensure paths align perfectly when layered.

## 2. The Occlusion Mechanic
The "Game State" determines how a region is rendered:
* **Target Region:** The specific country/state the player must guess. Its `fill` color is set to a "Hidden" color (e.g., solid gray or a deep navy).
* **Context Regions:** The surrounding areas that provide the clues.
* **Label Management:** Do not render `<Text>` components for any region currently in the "Target" or "Hidden" state.

## 3. Implementation Details for the AI Agent

### Dynamic Zooming
Implement a "Focus" mode. When a level starts, the `viewBox` should calculate the bounding box of the Target Region and its immediate neighbors. This creates the "zoomed-in" effect without losing image quality (since it is SVG).

### Input Methods
* **Type-In:** A standard text field. The agent should normalize input (lowercase, trimmed) and compare it against the `title` attribute of the path using `fuse.js`.
* **Multiple Choice:** Generate a list containing the correct name and three distractors from the same map file.

### UI Component: `MapNode.tsx`
```javascript
// Example logic for the AI to follow
const MapNode = ({ pathData, status }) => {
  const colors = {
    hidden: "#444444",
    correct: "#4CAF50",
    wrong: "#F44336",
    default: "#E0E0E0"
  }

  return (
    <Path
      d={pathData.d}
      fill={colors[status]}
      stroke="#FFFFFF"
      strokeWidth="0.5"
    />
  )
}
```

## 4. User Interface Requirements
* **Clean Layout:** Small paragraphs only.
* **No "Flowery" UI:** Use direct labels like "Identify the highlighted region" rather than "Welcome traveler, can you find your way?"
* **Color Palette:** Use high-contrast colors for the occlusion to ensure the player knows exactly what they are guessing.

---

**Instructions for AI Coding Agent:**
1.  Read the provided amCharts SVG files.
2.  Build a parser to extract path IDs and "d" strings.
3.  Create a game loop where one ID is chosen as the "target."
4.  Render the target in a different color and wait for user input.
5.  Ensure all code and UI text follows the "No semi-colons" and "No em-dashes" rule.