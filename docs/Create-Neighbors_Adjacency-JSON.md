To get your adjacency data from Natural Earth into your **Borderline** project, follow these steps. This workflow uses a Python environment to process the spatial data into a simple JSON file your React Native app can read.

### Step 1: Download the Data
1.  Go to the [Natural Earth Downloads](https://www.naturalearthdata.com/downloads/) page.
2.  Select **Cultural** under the **1:50m Medium Scale** (or 1:110m for a smaller file size).
3.  Download the **Admin 0 – Countries** zip file. 
4.  Extract the files into a folder. You specifically need the `.shp`, `.shx`, and `.dbf` files for the next step.

### Step 2: Prepare Your Python Environment
You need a few libraries to handle the spatial math. Open your terminal and install them:

```bash
pip install geopandas shapely
```

### Step 3: Run the Adjacency Script
Create a script (e.g., `generate_borders.py`) and use the following logic. This version includes a small "buffer" to ensure that countries separated by a tiny digital gap are still counted as neighbors.

```python
import geopandas as gpd
import json

# 1. Load the Natural Earth Shapefile
# Point this to the .shp file you downloaded
gdf = gpd.read_file("ne_50m_admin_0_countries.shp")

# 2. Filter for necessary columns to keep the file light
# ADM0_A3 is the 3-letter code, ISO_A2 is the 2-letter code
gdf = gdf[['NAME', 'ADM0_A3', 'ISO_A2', 'geometry']]

adjacency_list = {}

# 3. Iterate through each country
for i, country_a in gdf.iterrows():
    # Use ISO_A2 to match your amCharts IDs
    country_id = country_a['ISO_A2']
    
    # Some small territories might not have an ISO_A2, skip or handle them
    if not country_id or country_id == "-99":
        continue

    # Create an entry
    adjacency_list[country_id] = {
        "name": country_a['NAME'],
        "neighbors": []
    }

    # 4. Compare against all other countries
    for j, country_b in gdf.iterrows():
        if i == j:
            continue
        
        target_id = country_b['ISO_A2']
        if not target_id or target_id == "-99":
            continue

    

        # Use a tiny buffer (0.01 degrees) to catch near-touches
        # This solves data misalignment issues
        if country_a['geometry'].buffer(0.01).intersects(country_b['geometry']):
            adjacency_list[country_id]["neighbors"].append(target_id)

# 5. Export to JSON
with open("adjacency.json", "w") as f:
    json.dump(adjacency_list, f, indent=2)

print("Adjacency file created successfully.")
```

### Step 4: Verify the ID Mapping
Your amCharts SVGs likely use the 2-letter ISO code (e.g., "US", "IN"). The script above pulls the `ISO_A2` column from Natural Earth to match. 

If you find that an amCharts ID does not match, you can add a manual "Correction Map" in your Python script:
```python
corrections = {"FRANCE": "FR", "INDIA": "IN"}
# If ISO_A2 is missing, use the correction map
```

### Step 5: Integration in Borderline
Now that you have `adjacency.json`, move it into your React Native project. In your game logic, when the user is at a certain level:
1.  Import the JSON: `import adjacencyData from './adjacency.json'`.
2.  Pick a random key (the Target Country).
3.  Access `adjacencyData[targetID].neighbors`.
4.  Loop through those neighbor IDs and set their state to `HIGHLIGHTED` on your SVG map.

This creates the visual "occlusion" effect where the player sees the neighbors but must guess the empty space in the middle.