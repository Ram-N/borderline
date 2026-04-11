# Borderline (MVP)

Image-first geography quiz using pre-edited map images and multiple choice answers per labeled neighbor.

## Run
```bash
npm i
npm run dev
```

## Add a new set
1. Put the edited image in `public/images/maps/<region>/<file>.png`.
2. Create a new JSON under `public/data/questions/` with `questions: []`.
3. Add an entry to `public/data/questions.index.json` with its path.
4. Start the app, pick the set on Home, and play.
```

---

### Notes
- Keep options plausible but fair.
- Stick to 5–10 prompts per set for quick plays.
- When you’re ready, we can add difficulty toggles, hints, Supabase, and FastAPI APIs without ref