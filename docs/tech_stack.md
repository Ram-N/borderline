## Tech stack (MVP)

* **Frontend:** React + Vite
* **Styling:** Tailwind (optional) or minimal CSS
* **State:** React hooks (no Redux)
* **Data:** Local JSON files referencing local images
* **Optional backend (later):** FastAPI
* **Optional DB (later):** Supabase (scores, sessions, users)

---

## Repo directory structure

```
borderline/
├─ README.md
├─ package.json
├─ vite.config.ts
├─ .gitignore
├─ public/
│  ├─ favicon.ico
│  ├─ images/
│  │  ├─ maps/
│  │  │  ├─ europe/
│  │  │  │  ├─ france_neighbors_v1.png
│  │  │  │  ├─ germany_neighbors_v2.png
│  │  │  ├─ africa/
│  │  │  │  ├─ kenya_neighbors_v1.png
│  │  │  └─ ... (other regions)
│  │  └─ thumbs/ (optional smaller previews)
│  └─ data/
│     ├─ questions.index.json          # Manifest listing all question files
│     ├─ questions/
│     │  ├─ europe_france_set01.json
│     │  ├─ europe_germany_set01.json
│     │  ├─ africa_kenya_set01.json
│     │  └─ ...
├─ src/
│  ├─ App.tsx
│  ├─ main.tsx
│  ├─ routes/
│  │  ├─ Home.tsx
│  │  ├─ Play.tsx
│  │  ├─ Results.tsx
│  │  └─ About.tsx
│  ├─ components/
│  │  ├─ MapCard.tsx                   # shows the image, label legend (A-D or 1-4)
│  │  ├─ MultipleChoice.tsx            # MC options & selection state
│  │  ├─ ProgressBar.tsx
│  │  ├─ ScorePanel.tsx
│  │  ├─ RegionPicker.tsx              # pick region/set
│  │  ├─ StartPanel.tsx                # pick quiz length, shuffle, etc.
│  │  └─ Footer.tsx
│  ├─ hooks/
│  │  ├─ useQuizEngine.ts              # loads questions, tracks index/score
│  ├─ lib/
│  │  ├─ shuffle.ts
│  │  ├─ scoring.ts
│  │  └─ persist.ts                    # localStorage helpers for session-only saves
│  ├─ types/
│  │  └─ question.ts
│  ├─ styles/
│  │  └─ index.css
│  └─ config/
│     └─ featureFlags.ts               # toggle future features (Elo, Supabase, etc.)
└─ server/                              # (Later) FastAPI backend
   ├─ app.py
   ├─ requirements.txt
   └─ README.md
```

---
