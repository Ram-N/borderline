# Borderline — MVP Plan

## MVP user flow

1. **Home**: pick region & set (e.g., Europe → France Set 01), choose quiz length (e.g., 5 prompts).
2. **Play**:

   * Show one image with numbered/lettered neighbors.
   * For each label, show MC options.
   * Player selects answers → click ‘Check’.
   * Show correctness per label, update score.
   * ‘Next’ moves to the next prompt.
3. **Results**: session score summary; offer ‘Replay’ or ‘Choose another set’.

---

## Scoring (session-only)

* +1 per correct neighbor slot
* 0 for incorrect (show correct answer after ‘Check’)
* Track total correct / total attempted
* Store to `localStorage` for post-game screen

---

## Components (MVP details)

* **MapCard**

  * Props: `image`, `labelStyle`, optional `legend`
  * Renders PNG; small legend explaining labels A–D or 1–4

* **MultipleChoice**

  * Props: `neighbors[]`
  * Renders per-label MC groups (radio buttons)
  * Emits `{ label, selectedOption }` to parent

* **ScorePanel**

  * Displays current question index, correct so far, total

* **RegionPicker & StartPanel**

  * Reads `questions.index.json`, lists available sets
  * Quiz config: number of prompts, shuffle toggle

* **useQuizEngine (hook)**

  * Loads a set file
  * Manages `currentIndex`, `answers`, `score`, `next()`, `check()`, `reset()`
  * Optional: `shuffle(set.neighbors)` if you want variation

---

## Type definitions (TS suggestion)

```ts
export type NeighborMC = {
  label: string;           // '1' or 'A'
  prompt: string;
  options: string[];
  answer: string;
};

export type Question = {
  id: string;
  region: string;
  countryOfInterest: string;
  image: string;
  labelStyle: 'numbers' | 'letters';
  neighbors: NeighborMC[];
  meta?: {
    difficulty?: 'easy' | 'medium' | 'hard';
    source?: string;
    notes?: string;
  };
};
```
