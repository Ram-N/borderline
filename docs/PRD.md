## PRD (MVP: ‘Borderline’ Image Quiz)

**Goal:** Ship a minimal, playable geography quiz that tests knowledge of bordering countries using prepared map images with masked names and overlaid labels.

**User Stories**

* As a player, I want to pick a region and a set so I can start a short quiz.
* As a player, I want to see a country-of-interest image with labeled neighbors and answer multiple choice questions per label.
* As a player, I want immediate feedback on correctness and a simple score at the end.

**Scope (Must-have)**

* Pre-edited images and static JSON set files
* MC selection per neighbor label
* Per-question feedback and session score
* Simple session flow: Home → Play → Results

**Out of Scope (Now)**

* Dynamic maps, autocomplete typing, Elo rating, login
* Historical borders, hints, streak bonuses
* Database, user profiles

**Success Criteria**

* Load any set from `questions.index.json`
* Complete a session of N prompts without page reloads
* See final score and replay

**Risks & Mitigations**

* **Image quality/consistency:** Define naming convention and label style; store region-based folders.
* **Option ambiguity:** Curate MC options per label; include at least one plausible distractor.
* **Scaling sets:** Keep `questions.index.json` as a manifest; add lightweight validation script later.

**Milestones**

1. **Day 1–2:** Scaffolding (Vite + React), routes, stubbed data, UI shell
2. **Day 3–4:** MapCard + MultipleChoice + Quiz engine, scoring
3. **Day 5:** Add 3–5 real sets (images + JSON), polish Results, README

---

## Future phases (fast add-ons)

* **Phase 2:** Difficulty toggles (number of labels, mix of distractors), basic hint, nicer styles
* **Phase 3:** Supabase (users, saved sessions, leaderboard); FastAPI for content serving
* **Phase 4:** Swap images for vector maps; bring back the autocomplete ‘type-ahead’ mode

