# Todo / Future Extensions

## 1. Microstates

Bring microstates (Monaco, Andorra, San Marino, Liechtenstein, Vatican City, etc.) back as valid puzzle targets.

Currently filtered out because their SVG bounding boxes are too small to identify by shape. To include them meaningfully:
- Zoom in much tighter when a microstate is the target (compute viewBox from the microstate's own bbox with aggressive padding)
- Possibly render a zoomed inset panel alongside the regional map
- Or use a text label hint like "this country is very small" to avoid frustrating players

## 2. Lakes, Seas, and Oceans as Borders

Add water bodies as named neighbors so questions can ask "which sea does France border?" or "which ocean lies to the west?".

Requires:
- A water-bodies dataset (e.g. Natural Earth lakes/oceans) with matching ISO-style codes
- Extending `adjacency.json` to include water neighbor entries (e.g. `"FR": { neighbors: [..., "MED"] }`)
- SVG paths for water bodies (or just colored regions) rendered distinctly (blue fill)
- Puzzle logic update: water bodies can appear as visible context or as the hidden answer
