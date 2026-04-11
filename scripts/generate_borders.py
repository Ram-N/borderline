import geopandas as gpd
import json

gdf = gpd.read_file("public/data/ne_50m_shapefile/ne_50m_admin_0_countries.shp")
gdf = gdf[['NAME', 'ADM0_A3', 'ISO_A2', 'ISO_A2_EH', 'geometry']]

def get_iso(row):
    iso = row['ISO_A2']
    if not iso or iso == '-99':
        iso = row['ISO_A2_EH']
    if not iso or iso == '-99':
        return None
    return iso

adjacency_list = {}

for i, country_a in gdf.iterrows():
    country_id = get_iso(country_a)
    if not country_id:
        continue

    adjacency_list[country_id] = {
        "name": country_a['NAME'],
        "neighbors": []
    }

    for j, country_b in gdf.iterrows():
        if i == j:
            continue
        target_id = get_iso(country_b)
        if not target_id:
            continue

        if country_a['geometry'].buffer(0.01).intersects(country_b['geometry']):
            adjacency_list[country_id]["neighbors"].append(target_id)

with open("public/data/adjacency.json", "w") as f:
    json.dump(adjacency_list, f, indent=2)

print(f"Done. {len(adjacency_list)} countries written to public/data/adjacency.json")
