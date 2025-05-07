from fastapi import FastAPI, Query
from supabase import create_client, Client
from typing import List
from math import radians, cos, sin, sqrt, atan2

app = FastAPI()

# Replace these with your actual Supabase keys
SUPABASE_URL = "https://xyzcompany.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tZHpza3Z0eHVkeXNpa3ViZXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMjUwNjUsImV4cCI6MjA2MTcwMTA2NX0.7QJNGfFXi2eLUC_-yvAZ0_s-N9ofjRz5R2FeXfDY19s"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def haversine_miles(lat1, lon1, lat2, lon2):
    R = 3958.8  # Radius of Earth in miles
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)**2
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))

@app.get("/restaurants-nearby")
def get_restaurants_nearby(lat: float, lon: float, radius: float = 10):
    res = supabase.from_('restaurants').select('*').execute()
    if res.error:
        return {"error": res.error.message}

    all_places = res.data
    nearby = []

    for r in all_places:
        if not r.get('latitude') or not r.get('longitude'):
            continue
        distance = haversine_miles(lat, lon, r['latitude'], r['longitude'])
        if distance <= radius:
            r['distance'] = round(distance, 2)
            nearby.append(r)

    return {"count": len(nearby), "restaurants": nearby}
