"""
generate_crop_data.py
=====================
Generates ~1000 dummy historical crop records for Erode and Karur districts
(Tamil Nadu, India) for the year 2025 and inserts them into MongoDB.

Usage:
    pip install pymongo python-dotenv
    python generate_crop_data.py

The script reads MONGODB_URI from the server's .env file (one level up).
If .env is not found, it defaults to  mongodb://localhost:27017/electrathon
"""

import random
import json
import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent / ".env"
    load_dotenv(dotenv_path=env_path)
except ImportError:
    print("[WARN] python-dotenv not installed — using default MongoDB URI")

try:
    from pymongo import MongoClient
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False
    print("[WARN] pymongo not installed — data will be saved to JSON only")
    print("       Install with: pip install pymongo")

# ─────────────────────────────────────────────
#  Village / Location Data
# ─────────────────────────────────────────────

ERODE_VILLAGES = [
    {"name": "Erode",              "taluk": "Erode",              "lat": 11.3410, "lng": 77.7172},
    {"name": "Gobichettipalayam",  "taluk": "Gobichettipalayam",  "lat": 11.4545, "lng": 77.4351},
    {"name": "Bhavani",            "taluk": "Bhavani",            "lat": 11.4447, "lng": 77.6840},
    {"name": "Perundurai",         "taluk": "Erode",              "lat": 11.2745, "lng": 77.5871},
    {"name": "Sathyamangalam",     "taluk": "Sathyamangalam",     "lat": 11.5037, "lng": 77.2387},
    {"name": "Anthiyur",           "taluk": "Gobichettipalayam",  "lat": 11.5753, "lng": 77.5948},
    {"name": "Nambiyur",           "taluk": "Gobichettipalayam",  "lat": 11.4673, "lng": 77.3651},
    {"name": "Kodumudi",           "taluk": "Erode",              "lat": 11.1765, "lng": 77.8641},
    {"name": "Kavundapadi",        "taluk": "Erode",              "lat": 11.2297, "lng": 77.6217},
    {"name": "Thalavadi",          "taluk": "Sathyamangalam",     "lat": 11.7067, "lng": 77.1765},
    {"name": "Sivagiri",           "taluk": "Erode",              "lat": 11.2437, "lng": 77.8219},
    {"name": "Kolathur",           "taluk": "Gobichettipalayam",  "lat": 11.4667, "lng": 77.5833},
    {"name": "Ammapet",            "taluk": "Erode",              "lat": 11.3167, "lng": 77.7500},
    {"name": "Chithode",           "taluk": "Erode",              "lat": 11.3167, "lng": 77.6583},
    {"name": "Ingur",              "taluk": "Bhavani",            "lat": 11.4167, "lng": 77.7000},
]

KARUR_VILLAGES = [
    {"name": "Karur",              "taluk": "Karur",              "lat": 10.9601, "lng": 78.0766},
    {"name": "Kulithalai",         "taluk": "Kulithalai",         "lat": 10.9333, "lng": 78.4167},
    {"name": "Aravakurichi",       "taluk": "Aravakurichi",       "lat": 10.8024, "lng": 78.1450},
    {"name": "Pugalur",            "taluk": "Karur",              "lat": 11.0167, "lng": 78.2167},
    {"name": "K. Paramathi",       "taluk": "Paramathi-Velur",    "lat": 10.9833, "lng": 77.9500},
    {"name": "Manmangalam",        "taluk": "Karur",              "lat": 10.8833, "lng": 77.9833},
    {"name": "Thanthoni",          "taluk": "Karur",              "lat": 10.9333, "lng": 77.9167},
    {"name": "Uppidamangalam",     "taluk": "Karur",              "lat": 10.9000, "lng": 78.1500},
    {"name": "Nattham",            "taluk": "Aravakurichi",       "lat": 10.8333, "lng": 78.0500},
    {"name": "Karuppati",          "taluk": "Karur",              "lat": 10.7833, "lng": 78.0167},
    {"name": "Velayuthampalayam",  "taluk": "Karur",              "lat": 10.8667, "lng": 78.1167},
    {"name": "Krishnarayapuram",   "taluk": "Krishnarayapuram",   "lat": 10.8167, "lng": 78.3000},
    {"name": "Vengamedu",          "taluk": "Karur",              "lat": 10.9500, "lng": 78.0833},
    {"name": "Vangal",             "taluk": "Karur",              "lat": 11.0333, "lng": 78.1167},
    {"name": "Thiru T Patti",      "taluk": "Kulithalai",         "lat": 10.9167, "lng": 78.1500},
]

# ─────────────────────────────────────────────
#  Crop Definitions (name, varieties, yield range, relative weight)
# ─────────────────────────────────────────────

ERODE_CROPS = [
    {
        "name": "Turmeric",
        "varieties": ["Erode Local", "Alleppey Finger", "BSR-1", "IISR Pragati", "Suguna"],
        "yield_min": 25.0, "yield_max": 40.0,   # quintals / acre
        "weight": 35,
    },
    {
        "name": "Cotton",
        "varieties": ["MCU-5", "DCH-32", "CO-15", "LRA-5166"],
        "yield_min": 6.0,  "yield_max": 12.0,
        "weight": 25,
    },
    {
        "name": "Sugarcane",
        "varieties": ["Co-86032", "Co-0238", "Co-62175", "Co-99004"],
        "yield_min": 250.0, "yield_max": 380.0,
        "weight": 15,
    },
    {
        "name": "Maize",
        "varieties": ["DHM-117", "Pioneer 3396", "NK-6240", "PAC-999"],
        "yield_min": 15.0, "yield_max": 28.0,
        "weight": 15,
    },
    {
        "name": "Banana",
        "varieties": ["Grand Naine", "Nendran", "Karpooravalli", "Robusta"],
        "yield_min": 60.0, "yield_max": 120.0,
        "weight": 10,
    },
]

KARUR_CROPS = [
    {
        "name": "Cotton",
        "varieties": ["MCU-5", "DCH-32", "K-10", "SB-26", "SVPR-2"],
        "yield_min": 6.0,  "yield_max": 12.0,
        "weight": 30,
    },
    {
        "name": "Paddy",
        "varieties": ["ADT-36", "CO-47", "IR-36", "MDU-5", "TRY-3"],
        "yield_min": 18.0, "yield_max": 28.0,
        "weight": 25,
    },
    {
        "name": "Groundnut",
        "varieties": ["TMV-2", "CO-3", "VRI-2", "TMV-7"],
        "yield_min": 8.0,  "yield_max": 14.0,
        "weight": 20,
    },
    {
        "name": "Sugarcane",
        "varieties": ["Co-86032", "Co-0238", "Co-2001"],
        "yield_min": 250.0, "yield_max": 380.0,
        "weight": 10,
    },
    {
        "name": "Tomato",
        "varieties": ["PKM-1", "CO-3", "Bhagyalakshmi", "Sakthi"],
        "yield_min": 40.0, "yield_max": 80.0,
        "weight": 8,
    },
    {
        "name": "Onion",
        "varieties": ["CO-3", "CO-4", "Bellary Red", "Arka Niketan"],
        "yield_min": 30.0, "yield_max": 60.0,
        "weight": 7,
    },
]

SEASONS = ["Kharif", "Rabi", "Zaid"]


# ─────────────────────────────────────────────
#  Helper functions
# ─────────────────────────────────────────────

def weighted_choice(crops: list) -> dict:
    """Pick a crop dict by weight."""
    total = sum(c["weight"] for c in crops)
    r = random.uniform(0, total)
    cumulative = 0
    for c in crops:
        cumulative += c["weight"]
        if r <= cumulative:
            return c
    return crops[-1]


def perturb_location(lat: float, lng: float, radius: float = 0.05) -> tuple:
    """Add a small random jitter to represent individual farm positions."""
    dlat = random.uniform(-radius, radius)
    dlng = random.uniform(-radius, radius)
    return round(lat + dlat, 6), round(lng + dlng, 6)


# ─────────────────────────────────────────────
#  Generate Records
# ─────────────────────────────────────────────

random.seed(42)
records = []

DISTRICTS = [
    ("Erode", ERODE_VILLAGES, ERODE_CROPS, 500),
    ("Karur", KARUR_VILLAGES, KARUR_CROPS, 500),
]

for district_name, villages, crop_list, target_count in DISTRICTS:
    for _ in range(target_count):
        village     = random.choice(villages)
        crop        = weighted_choice(crop_list)
        variety     = random.choice(crop["varieties"])
        acres       = round(random.uniform(1.0, 18.0), 2)
        yield_pa    = round(random.uniform(crop["yield_min"], crop["yield_max"]), 2)
        # Actual yield is 85–100 % of the theoretical maximum
        quintals    = round(acres * yield_pa * random.uniform(0.85, 1.00), 2)
        lat, lng    = perturb_location(village["lat"], village["lng"])
        season      = random.choice(SEASONS)

        records.append({
            "cropName":         crop["name"],
            "variety":          variety,
            "acres":            acres,
            "quintalsProduced": quintals,
            "yieldPerAcre":     yield_pa,
            "village":          village["name"],
            "taluk":            village["taluk"],
            "district":         district_name,
            "state":            "Tamil Nadu",
            "lat":              lat,
            "lng":              lng,
            "season":           season,
            "year":             2025,
        })

print(f"✅ Generated {len(records)} records ({len([r for r in records if r['district']=='Erode'])} Erode, "
      f"{len([r for r in records if r['district']=='Karur'])} Karur)")

# ─────────────────────────────────────────────
#  Save to JSON (always)
# ─────────────────────────────────────────────

out_path = Path(__file__).parent / "crop_data_2025.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(records, f, indent=2)
print(f"📄 Saved to {out_path}")

# ─────────────────────────────────────────────
#  Insert into MongoDB
# ─────────────────────────────────────────────

if not PYMONGO_AVAILABLE:
    print("\n❌ pymongo not available — skipping MongoDB insertion.")
    print("   Install with:  pip install pymongo python-dotenv")
    sys.exit(0)

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/electrathon")

# Parse DB name from URI
db_name = MONGO_URI.rstrip("/").split("/")[-1].split("?")[0] or "electrathon"

print(f"\n🔌 Connecting to MongoDB: {MONGO_URI[:40]}... (db: {db_name})")

try:
    client     = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.server_info()          # force connection
    db         = client[db_name]
    collection = db["historicalcropdata"]

    collection.drop()             # clear any previous dummy data
    result = collection.insert_many(records)

    # Create indexes for fast hotspot queries
    collection.create_index([("cropName", 1)])
    collection.create_index([("district", 1)])
    collection.create_index([("year", 1), ("cropName", 1)])
    collection.create_index([("cropName", 1), ("variety", 1), ("district", 1)])

    print(f"✅ Inserted {len(result.inserted_ids)} records into '{db_name}.historicalcropdata'")
    client.close()

except Exception as exc:
    print(f"\n❌ MongoDB insertion failed: {exc}")
    print("   Data has been saved to crop_data_2025.json")
    print("   You can seed it manually with mongoimport:")
    print(f"   mongoimport --uri \"$MONGODB_URI\" --collection historicalcropdata --file crop_data_2025.json --jsonArray")
