import random
import csv
from datetime import datetime, timedelta
from pathlib import Path

# Explicit notice required by guidelines
DEMO_DATASET_DISCLAIMER = "DEMO DATA — NOT OFFICIAL MPLADS DATA (FOR DEMONSTRATION PURPOSES ONLY)"

REGIONS = [
    {
        "state": "Maharashtra",
        "districts": [
            {
                "district": "Pune",
                "constituency": "Pune (Lok Sabha)",
                "mp_name": "Girish Bapat / Successor Rep",
                "blocks": ["Haveli", "Baramati", "Shirur", "Ambegaon", "Maval"],
                "lat": 18.5204, "lng": 73.8567,
                "agencies": ["PWD Pune Division", "Zilla Parishad Pune", "DRDA Pune", "MSEDCL Maharashtra"]
            },
            {
                "district": "Nashik",
                "constituency": "Nashik (Lok Sabha)",
                "mp_name": "Hemant Godse",
                "blocks": ["Nashik Rural", "Dindori", "Sinnar", "Niphad", "Trimbak"],
                "lat": 19.9975, "lng": 73.7898,
                "agencies": ["Nashik Municipal Corp", "Zilla Parishad Nashik", "PWD Nashik", "DRDA Nashik"]
            },
            {
                "district": "Nagpur",
                "constituency": "Nagpur (Lok Sabha)",
                "mp_name": "Nitin Gadkari",
                "blocks": ["Nagpur Rural", "Kamptee", "Hingna", "Katol", "Ramtek"],
                "lat": 21.1458, "lng": 79.0882,
                "agencies": ["Nagpur Improvement Trust", "PWD Nagpur", "Zilla Parishad Nagpur"]
            }
        ]
    },
    {
        "state": "Karnataka",
        "districts": [
            {
                "district": "Bangalore Rural",
                "constituency": "Bangalore Rural (Lok Sabha)",
                "mp_name": "D. K. Suresh",
                "blocks": ["Devanahalli", "Doddaballapura", "Hosakote", "Nelamangala"],
                "lat": 13.2926, "lng": 77.5450,
                "agencies": ["KRIDL Rural Infra", "Zilla Panchayat Bangalore Rural", "PWD Karnataka"]
            },
            {
                "district": "Mysuru",
                "constituency": "Mysore (Lok Sabha)",
                "mp_name": "Prathap Simha",
                "blocks": ["Hunsur", "Nanjangud", "T. Narasipura", "K.R. Nagar", "Heggadadevankote"],
                "lat": 12.2958, "lng": 76.6394,
                "agencies": ["PWD Mysuru", "Zilla Panchayat Mysuru", "Mysore Urban Dev Authority"]
            }
        ]
    },
    {
        "state": "Uttar Pradesh",
        "districts": [
            {
                "district": "Varanasi",
                "constituency": "Varanasi (Lok Sabha)",
                "mp_name": "Narendra Modi",
                "blocks": ["Sevapuri", "Arajiline", "Pindra", "Kashi Vidyapeeth", "Cholapur", "Harahua"],
                "lat": 25.3176, "lng": 82.9739,
                "agencies": ["UP Jal Nigam", "PWD Varanasi", "Rural Engineering Dept UP", "Varanasi Nagar Nigam", "M/s Purvanchal InfraTech Services"]
            },
            {
                "district": "Lucknow",
                "constituency": "Lucknow (Lok Sabha)",
                "mp_name": "Rajnath Singh",
                "blocks": ["Bakshi Ka Talab", "Malihabad", "Sarojini Nagar", "Mohanlalganj"],
                "lat": 26.8467, "lng": 80.9462,
                "agencies": ["Lucknow Development Authority", "UP State Construction Corp", "PWD Lucknow"]
            }
        ]
    },
    {
        "state": "Tamil Nadu",
        "districts": [
            {
                "district": "Coimbatore",
                "constituency": "Coimbatore (Lok Sabha)",
                "mp_name": "P. R. Natarajan",
                "blocks": ["Pollachi", "Sulur", "Mettupalayam", "Annur", "Perur"],
                "lat": 11.0168, "lng": 76.9558,
                "agencies": ["Tamil Nadu PWD", "Coimbatore City Corp", "DRDA Coimbatore"]
            },
            {
                "district": "Madurai",
                "constituency": "Madurai (Lok Sabha)",
                "mp_name": "Su. Venkatesan",
                "blocks": ["Madurai East", "Madurai West", "Melur", "Thiruparankundram", "Vadipatti"],
                "lat": 9.9252, "lng": 78.1198,
                "agencies": ["Madurai Municipal Corp", "PWD Water Resources", "District Rural Dev Agency"]
            }
        ]
    },
    {
        "state": "West Bengal",
        "districts": [
            {
                "district": "Nadia",
                "constituency": "Ranaghat (Lok Sabha)",
                "mp_name": "Jagannath Sarkar",
                "blocks": ["Ranaghat-I", "Ranaghat-II", "Santipur", "Hanskhali", "Chakdaha"],
                "lat": 23.4710, "lng": 88.5565,
                "agencies": ["WB PWD Nadia", "Zilla Parishad Nadia", "Public Health Engineering WB"]
            }
        ]
    }
]

WORK_TYPES = [
    {
        "type": "Community Hall",
        "cost_min": 1400000,
        "cost_max": 2800000,
        "duration_min": 120,
        "duration_max": 280,
        "templates": [
            "Construction of multipurpose community hall in {village}",
            "Development of public cultural center and community shed at {village}",
            "Renovation and expansion of existing Gram Panchayat auditorium in {village}"
        ]
    },
    {
        "type": "Drinking Water RO Plant",
        "cost_min": 700000,
        "cost_max": 1600000,
        "duration_min": 45,
        "duration_max": 120,
        "templates": [
            "Installation of 1000 LPH RO drinking water filtration unit at {village}",
            "Provision of deep borewell and solar powered community water kiosk in {village}",
            "Upgradation of pipeline distribution and drinking water storage tank at {village}"
        ]
    },
    {
        "type": "Rural Road & Culvert",
        "cost_min": 1800000,
        "cost_max": 4500000,
        "duration_min": 90,
        "duration_max": 240,
        "templates": [
            "Construction of cement concrete (CC) internal village road at {village}",
            "Bituminous road widening and storm-water drainage culvert in {village}",
            "Link road paving connecting main highway to agrarian hamlet of {village}"
        ]
    },
    {
        "type": "School Classroom & Infrastructure",
        "cost_min": 1100000,
        "cost_max": 2400000,
        "duration_min": 75,
        "duration_max": 200,
        "templates": [
            "Construction of two additional smart classrooms in Zilla Parishad School, {village}",
            "Provision of modern science laboratory equipment and student desks at {village}",
            "Installation of rooftop solar panels and clean sanitation facility in Govt High School, {village}"
        ]
    },
    {
        "type": "Solar Street Lighting",
        "cost_min": 450000,
        "cost_max": 1100000,
        "duration_min": 30,
        "duration_max": 90,
        "templates": [
            "Installation of 35 LED solar street lights across major junctions in {village}",
            "Erection of high-mast solar illumination tower near market square in {village}",
            "Comprehensive street lighting and battery energy storage system at {village}"
        ]
    },
    {
        "type": "Primary Health Sub-Center",
        "cost_min": 2200000,
        "cost_max": 5500000,
        "duration_min": 150,
        "duration_max": 330,
        "templates": [
            "Upgradation of primary health sub-center with maternity care room at {village}",
            "Supply of medical diagnostics, cold chain storage and OPD shed in {village}",
            "Civil construction of primary wellness dispensary and staff quarters in {village}"
        ]
    },
    {
        "type": "Sanitation Facility / Public Toilet",
        "cost_min": 550000,
        "cost_max": 1400000,
        "duration_min": 40,
        "duration_max": 110,
        "templates": [
            "Construction of community sanitary complex with bio-toilets for women at {village}",
            "Modern hygiene block with running water and solar lighting near bus stand, {village}",
            "Public sanitation facility and septic disposal system in {village} weekly market"
        ]
    }
]

VILLAGES = [
    "Rampur", "Shivpur", "Khadki", "Chandrapur", "Sundar Nagar", "Devipura", "Kalyanpur",
    "Gopalganj", "Adarsh Nagar", "Navi Vasti", "Hanuman Nagar", "Krishnapuram", "Gandhi Gram",
    "Kaveri Nagar", "Indira Nagar", "Bhavani Peth", "Lakshmipuram", "Green Park", "Patel Nagar",
    "Vikas Nagar", "Shivaji Nagar", "Subhash Nagar", "Nehru Colony", "Surya Nagar"
]

def generate_demo_dataset(target_count: int = 250, output_path: str = None) -> list:
    random.seed(42)  # Deterministic seed for reproducible testing
    works = []
    
    # 1. SPECIFIC INTENTIONAL ANOMALIES FOR DEMO SCENARIOS
    
    # Anomaly 1: Severe Cost Outlier + Superfast completion
    works.append({
        "work_id": "MPLADS-2023-MH-042",
        "mp_name": "Girish Bapat / Successor Rep",
        "mp_house": "Lok Sabha",
        "constituency": "Pune (Lok Sabha)",
        "state": "Maharashtra",
        "district": "Pune",
        "block": "Baramati",
        "village": "Karhati",
        "implementing_agency": "Zilla Parishad Pune",
        "work_type": "Community Hall",
        "work_description": "Construction of multipurpose community hall in Karhati (DEMO ANOMALY: Cost 4.2x peer median, finished in 15 days)",
        "sanctioned_amount": 9250000.0,
        "released_amount": 9250000.0,
        "expenditure": 9250000.0,
        "balance_amount": 0.0,
        "work_status": "Completed",
        "recommendation_date": "2023-05-15",
        "sanction_date": "2023-06-10",
        "completion_date": "2023-06-25",
        "financial_year": "2023-24",
        "latitude": 18.1524,
        "longitude": 74.5772,
        "is_demo": True
    })

    # Anomaly 2: Stalled Work with High Release & Low Expenditure (Delay Anomaly)
    works.append({
        "work_id": "MPLADS-2023-KA-088",
        "mp_name": "Prathap Simha",
        "mp_house": "Lok Sabha",
        "constituency": "Mysore (Lok Sabha)",
        "state": "Karnataka",
        "district": "Mysuru",
        "block": "Hunsur",
        "village": "Bilikere",
        "implementing_agency": "Zilla Panchayat Mysuru",
        "work_type": "Primary Health Sub-Center",
        "work_description": "Upgradation of primary health sub-center with maternity care room at Bilikere (DEMO ANOMALY: Sanctioned >2 yrs ago, 100% funds released, 4.8% spent)",
        "sanctioned_amount": 4600000.0,
        "released_amount": 4600000.0,
        "expenditure": 220000.0,
        "balance_amount": 4380000.0,
        "work_status": "In Progress",
        "recommendation_date": "2022-07-10",
        "sanction_date": "2022-08-15",
        "completion_date": "",
        "financial_year": "2022-23",
        "latitude": 12.3370,
        "longitude": 76.4380,
        "is_demo": True
    })

    # Anomaly 3: High Expenditure but Status "Sanctioned" (Decoupled Progress/Financial)
    works.append({
        "work_id": "MPLADS-2023-WB-203",
        "mp_name": "Jagannath Sarkar",
        "mp_house": "Lok Sabha",
        "constituency": "Ranaghat (Lok Sabha)",
        "state": "West Bengal",
        "district": "Nadia",
        "block": "Ranaghat-I",
        "village": "Santipur Road",
        "implementing_agency": "Public Health Engineering WB",
        "work_type": "Drinking Water RO Plant",
        "work_description": "Installation of 1000 LPH RO drinking water filtration unit (DEMO ANOMALY: 98.7% expenditure disbursed but status still marked 'Sanctioned')",
        "sanctioned_amount": 1600000.0,
        "released_amount": 1600000.0,
        "expenditure": 1580000.0,
        "balance_amount": 20000.0,
        "work_status": "Sanctioned",
        "recommendation_date": "2023-06-01",
        "sanction_date": "2023-07-15",
        "completion_date": "",
        "financial_year": "2023-24",
        "latitude": 23.2150,
        "longitude": 88.5680,
        "is_demo": True
    })

    # Anomaly 4: Data Quality Issue (Expenditure > Sanctioned & Inverted Dates)
    works.append({
        "work_id": "MPLADS-2023-TN-164",
        "mp_name": "P. R. Natarajan",
        "mp_house": "Lok Sabha",
        "constituency": "Coimbatore (Lok Sabha)",
        "state": "Tamil Nadu",
        "district": "Coimbatore",
        "block": "Pollachi",
        "village": "Annamalai",
        "implementing_agency": "Tamil Nadu PWD",
        "work_type": "Rural Road & Culvert",
        "work_description": "Construction of cement concrete (CC) internal village road (DEMO ANOMALY: Negative balance, expenditure > sanctioned, completion before sanction)",
        "sanctioned_amount": 2500000.0,
        "released_amount": 2500000.0,
        "expenditure": 3250000.0,
        "balance_amount": -750000.0,
        "work_status": "Completed",
        "recommendation_date": "2023-08-01",
        "sanction_date": "2023-09-15",
        "completion_date": "2023-03-10",  # Inverted!
        "financial_year": "2023-24",
        "latitude": 10.6580,
        "longitude": 77.0080,
        "is_demo": True
    })

    # Anomaly 5: Geographic & Agency Monopoly Cluster in Varanasi
    # We will generate 10 works all concentrated in Sevapuri -> Village Kashi-Puram with "M/s Purvanchal InfraTech Services"
    for c_idx in range(1, 11):
        works.append({
            "work_id": f"MPLADS-2023-UP-CL{c_idx:02d}",
            "mp_name": "Narendra Modi",
            "mp_house": "Lok Sabha",
            "constituency": "Varanasi (Lok Sabha)",
            "state": "Uttar Pradesh",
            "district": "Varanasi",
            "block": "Sevapuri",
            "village": "Kashi-Puram",
            "implementing_agency": "M/s Purvanchal InfraTech Services",
            "work_type": "Solar Street Lighting",
            "work_description": f"Installation of high-density solar street illumination cluster unit #{c_idx} in Kashi-Puram (DEMO ANOMALY: Spatial & agency concentration)",
            "sanctioned_amount": 980000.0,
            "released_amount": 980000.0,
            "expenditure": 965000.0,
            "balance_amount": 15000.0,
            "work_status": "Completed",
            "recommendation_date": "2023-07-01",
            "sanction_date": "2023-08-01",
            "completion_date": "2023-10-15",
            "financial_year": "2023-24",
            "latitude": 25.3190 + (c_idx * 0.0005),
            "longitude": 82.9720 + (c_idx * 0.0005),
            "is_demo": True
        })

    # 2. GENERATE REMAINING ~236 REALISTIC WORKS (Normal distribution with natural variance)
    current_count = len(works)
    work_seq = 1

    start_reference = datetime(2023, 4, 1)

    while len(works) < target_count:
        region = random.choice(REGIONS)
        state_name = region["state"]
        dist_info = random.choice(region["districts"])
        district_name = dist_info["district"]
        constituency_name = dist_info["constituency"]
        mp_name = dist_info["mp_name"]
        block = random.choice(dist_info["blocks"])
        agency = random.choice(dist_info["agencies"])
        village = random.choice(VILLAGES)
        
        wt = random.choice(WORK_TYPES)
        wtype = wt["type"]
        template = random.choice(wt["templates"])
        desc = template.format(village=village)
        
        # Base financial calculation with normal variance
        base_cost = random.uniform(wt["cost_min"], wt["cost_max"])
        # Round to nearest ₹10,000 for realistic government DPRs
        sanctioned = round(base_cost / 10000.0) * 10000.0
        
        # Recommendation and sanction dates
        sanction_offset_days = random.randint(15, 60)
        rec_date = start_reference + timedelta(days=random.randint(0, 300))
        sanc_date = rec_date + timedelta(days=sanction_offset_days)
        
        # Status distribution: 55% Completed, 30% In Progress, 12% Sanctioned, 3% Stalled
        status_roll = random.random()
        if status_roll < 0.55:
            status = "Completed"
            released = sanctioned
            # Minor saving or 90-99% expenditure
            exp_pct = random.uniform(0.92, 1.0)
            expenditure = round((sanctioned * exp_pct) / 1000.0) * 1000.0
            duration_days = random.randint(wt["duration_min"], wt["duration_max"])
            comp_date = sanc_date + timedelta(days=duration_days)
            comp_date_str = comp_date.strftime("%Y-%m-%d")
        elif status_roll < 0.85:
            status = "In Progress"
            release_pct = random.choice([0.5, 0.75, 1.0])
            released = round((sanctioned * release_pct) / 1000.0) * 1000.0
            exp_pct = random.uniform(0.3, 0.85)
            expenditure = round((released * exp_pct) / 1000.0) * 1000.0
            comp_date_str = ""
        elif status_roll < 0.97:
            status = "Sanctioned"
            release_pct = random.choice([0.0, 0.25, 0.5])
            released = round((sanctioned * release_pct) / 1000.0) * 1000.0
            expenditure = 0.0
            comp_date_str = ""
        else:
            status = "Stalled"
            released = sanctioned * 0.5
            expenditure = sanctioned * 0.2
            comp_date_str = ""
            
        balance = released - expenditure
        
        # Slight jitter around district coordinates
        lat = dist_info["lat"] + random.uniform(-0.12, 0.12)
        lng = dist_info["lng"] + random.uniform(-0.12, 0.12)
        
        prefix_state = state_name[:2].upper()
        work_id = f"MPLADS-2023-{prefix_state}-{work_seq:04d}"
        work_seq += 1
        
        works.append({
            "work_id": work_id,
            "mp_name": mp_name,
            "mp_house": "Lok Sabha",
            "constituency": constituency_name,
            "state": state_name,
            "district": district_name,
            "block": block,
            "village": village,
            "implementing_agency": agency,
            "work_type": wtype,
            "work_description": desc,
            "sanctioned_amount": sanctioned,
            "released_amount": released,
            "expenditure": expenditure,
            "balance_amount": balance,
            "work_status": status,
            "recommendation_date": rec_date.strftime("%Y-%m-%d"),
            "sanction_date": sanc_date.strftime("%Y-%m-%d"),
            "completion_date": comp_date_str,
            "financial_year": "2023-24",
            "latitude": round(lat, 5),
            "longitude": round(lng, 5),
            "is_demo": True
        })
        
    if output_path:
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        keys = works[0].keys()
        with open(output_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(works)
            
    return works

if __name__ == "__main__":
    out_file = Path(__file__).parent / "sample_mplads_data.csv"
    gen_works = generate_demo_dataset(target_count=250, output_path=str(out_file))
    print(f"Generated {len(gen_works)} demo records at {out_file}")
