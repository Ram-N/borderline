
To keep the game **Borderline** addictive, we need to balance the amount of information (labels) with the quality of the options (distractors).
My goal is to move from "visual recognition" to "spatial deduction." 

Here is a 5-level difficulty framework tailored for you to implement.

---

### Level 1: The Tourist (Very Easy)
**Goal:** Basic recognition with high-contrast help.
* **Visuals:** Large-scale zoom (entire sub-continent visible). All neighbors are labeled clearly.
* **Target:** The central country is highlighted with a distinct color.
* **Player Vibe:** Impossible to fail if you have a general sense of the world map.

### Level 2: The Traveler (Easy)
**Goal:** Regional familiarity.
* **Visuals:** Regional zoom (e.g., South America). Most neighbors are labeled, but one or two primary neighbors are "occluded" (no label, just borders).
* **Target:** One of the occluded neighbors or the central country.
* **MCQ Logic:** Distractors are from the same continent but a different region. If the target is Peru, distractors might be Suriname, Uruguay, or Panama.
* **Player Vibe:** Requires you to know which part of the continent you are looking at.

### Level 3: The Explorer (Medium)
**Goal:** Boundary deduction.
* **Visuals:** Tight zoom. Only the target and its immediate neighbors are visible.
* **Target:** One neighbor is highlighted. Only **half** of the other neighbors are labeled.
* **MCQ Logic:** Distractors are "Regional Neighbors." If the target is Peru, the choices are Bolivia, Paraguay, Ecuador, and Colombia.
* **Player Vibe:** You can't just guess by continent; you have to know which country fits that specific "puzzle piece" shape.

### Level 4: The Cartographer (Hard)
**Goal:** Pure spatial memory.
* **Visuals:** Deep zoom. No labels are provided for any country shown.
* **Target:** A specific country is highlighted. The player must deduce the location based purely on the shapes of the borders and the "Borderline" configuration.
* **MCQ Logic:** High-difficulty distractors. All choices are countries that share a similar shape or size, or are in the immediate vicinity (e.g., choosing between Togo, Benin, and Ghana).
* **Player Vibe:** You are looking at naked borders. You have to recognize the "outline" of the region.

### Level 5: The Diplomat (Expert)
**Goal:** Absolute mastery.
* **Visuals:** Extreme zoom (Fragmented view). You might only see the "tri-point" where three borders meet (e.g., the junction of Israel, Lebanon, and Syria).
* **Target:** No highlighting. A small arrow points to a region.
* **Input Method:** **No MCQs.** The player must type the name.
* **Fuzzy Matching:** Use `fuse.js` here to ensure "Kyrgyzstan" is accepted even with a typo.
* **Player Vibe:** No safety net. You either know the map at a granular level or you don't.

---

### Implementation Table for your AI Agent

| Level | Zoom Level | Labels Shown | MCQ Type | Input Type |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Continental | 100% | Spoilers | MCQ |
| **2** | Regional | 75% | Continental | MCQ |
| **3** | Neighborhood | 50% | Local Neighbors | MCQ |
| **4** | Tight | 0% | Local Neighbors | MCQ |
| **5** | Extreme | 0% | N/A | Text Input |

---

### Suggestions for the Distractor Logic
use the `adjacency.json` we created for distractors
* **For Level 3 & 4:** Distractors = `Target.neighbors`.
* **For Level 2 & 1:** Distractors = Random countries from the same `continent` field in your GeoJSON.

