

## Question JSON format (MVP)

Each image gives you several **neighbor slots**, each mapped to a multiple-choice list. Keep all proper nouns in **straight single quotes** in code.

```json
{
  "id": "europe_france_set01_v1",
  "region": "Europe",
  "countryOfInterest": "France",
  "image": "/images/maps/europe/france_neighbors_v1.png",
  "labelStyle": "numbers", 
  "neighbors": [
    {
      "label": "1",
      "prompt": "Bordering country number 1 is:",
      "options": ["Belgium", "Spain", "Italy", "Switzerland"],
      "answer": "Belgium"
    },
    {
      "label": "2",
      "prompt": "Bordering country number 2 is:",
      "options": ["Germany", "Luxembourg", "Andorra", "Monaco"],
      "answer": "Luxembourg"
    }
    // ... add labels 3, 4, 5, etc.
  ],
  "meta": {
    "difficulty": "easy",
    "source": "Edited from web map; names masked",
    "notes": "Neighbors labeled on image; names hidden"
  }
}
```

* Use **`labelStyle: 'numbers'`** or `'letters'` to match the overlay (1–n or A–D).
* Keep sets small (5–10 questions) for quick sessions.



**questions.index.json**

```json
{
  "sets": [
    { "id": "europe_france_set01_v1", "path": "/data/questions/europe_france_set01.json" },
    { "id": "europe_germany_set01_v1", "path": "/data/questions/europe_germany_set01.json" },
    { "id": "africa_kenya_set01_v1", "path": "/data/questions/africa_kenya_set01.json" }
  ]
}
```
