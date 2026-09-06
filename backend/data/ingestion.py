import io
import re
import json
import pandas as pd
from datetime import datetime
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from backend.models.orm_models import WorkModel

ALIAS_MAP = {
    "work_id": ["work_id", "work id", "workid", "project_id", "id", "work code"],
    "mp_name": ["mp_name", "mp name", "hon'ble mp", "member of parliament", "mp"],
    "mp_house": ["mp_house", "mp house", "house", "sabha"],
    "constituency": ["constituency", "constituency name", "parliamentary constituency"],
    "state": ["state", "state name"],
    "district": ["district", "district name"],
    "block": ["block", "block name", "tehsil", "taluk", "sub-district"],
    "village": ["village", "village name", "gram panchayat", "locality", "ward"],
    "implementing_agency": ["implementing_agency", "implementing agency", "agency", "ia", "executing agency"],
    "work_type": ["work_type", "work type", "work category", "category", "sector"],
    "work_description": ["work_description", "work description", "description", "name of work", "work detail"],
    "sanctioned_amount": ["sanctioned_amount", "sanctioned amount", "amount sanctioned", "cost", "sanction amount", "sanctioned cost"],
    "released_amount": ["released_amount", "released amount", "amount released", "funds released"],
    "expenditure": ["expenditure", "expenditure incurred", "amount spent", "actual expenditure", "utilization amount"],
    "balance_amount": ["balance_amount", "balance amount", "balance", "unspent balance", "unspent amount"],
    "work_status": ["work_status", "work status", "status", "stage", "physical status"],
    "recommendation_date": ["recommendation_date", "recommendation date", "date of recommendation"],
    "sanction_date": ["sanction_date", "sanction date", "date of sanction"],
    "completion_date": ["completion_date", "completion date", "date of completion"],
    "financial_year": ["financial_year", "financial year", "fy", "year"],
    "latitude": ["latitude", "lat"],
    "longitude": ["longitude", "long", "lng"]
}

def clean_currency(val: Any) -> float:
    if pd.isna(val) or val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).strip()
    s = re.sub(r"[₹$,\s]", "", s)
    try:
        return float(s)
    except ValueError:
        return 0.0

def clean_date(val: Any) -> str:
    if pd.isna(val) or val is None or str(val).strip() in ("", "None", "nan", "NaT"):
        return ""
    s = str(val).strip()
    # Try parsing common formats
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%d.%m.%Y", "%Y-%m-%d %H:%M:%S"):
        try:
            dt = datetime.strptime(s.split("T")[0].split(" ")[0], fmt.split(" ")[0])
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return s[:10]

def normalize_column_name(col: str) -> str:
    raw = str(col).lower().strip()
    col_clean = re.sub(r"[\s_]+", " ", raw)
    
    # 1. Exact match on canonical or alias
    for canonical, aliases in ALIAS_MAP.items():
        if col_clean == canonical.replace("_", " "):
            return canonical
        for alias in aliases:
            if col_clean == alias.replace("_", " "):
                return canonical
                
    # 2. Match with word boundaries
    for canonical, aliases in ALIAS_MAP.items():
        for alias in aliases:
            alias_clean = alias.replace("_", " ")
            if len(alias_clean) >= 3 and re.search(r"\b" + re.escape(alias_clean) + r"\b", col_clean):
                return canonical

    return col.strip()

def normalize_dataframe(df: pd.DataFrame, is_demo: bool = False) -> List[Dict[str, Any]]:
    # Rename columns to canonical names
    rename_dict = {}
    for col in df.columns:
        canonical = normalize_column_name(str(col))
        rename_dict[col] = canonical
    df = df.rename(columns=rename_dict)

    records = []
    for idx, row in df.iterrows():
        work_id = str(row.get("work_id", "")).strip()
        if not work_id or work_id in ("nan", "None", ""):
            work_id = f"MPLADS-GEN-{idx+1:04d}"

        sanctioned = clean_currency(row.get("sanctioned_amount", 0.0))
        released = clean_currency(row.get("released_amount", sanctioned))
        expenditure = clean_currency(row.get("expenditure", 0.0))
        
        balance = row.get("balance_amount")
        if pd.isna(balance) or balance is None:
            balance = released - expenditure
        else:
            balance = clean_currency(balance)

        lat = row.get("latitude")
        lng = row.get("longitude")
        try:
            lat = float(lat) if (lat is not None and not pd.isna(lat)) else None
        except (ValueError, TypeError):
            lat = None
        try:
            lng = float(lng) if (lng is not None and not pd.isna(lng)) else None
        except (ValueError, TypeError):
            lng = None

        record = {
            "work_id": work_id,
            "mp_name": str(row.get("mp_name", "Unknown MP")).strip(),
            "mp_house": str(row.get("mp_house", "Lok Sabha")).strip(),
            "constituency": str(row.get("constituency", "General Constituency")).strip(),
            "state": str(row.get("state", "India")).strip(),
            "district": str(row.get("district", "General District")).strip(),
            "block": str(row.get("block", "")).strip() if not pd.isna(row.get("block")) else "",
            "village": str(row.get("village", "")).strip() if not pd.isna(row.get("village")) else "",
            "implementing_agency": str(row.get("implementing_agency", "District Authority")).strip(),
            "work_type": str(row.get("work_type", "General Development")).strip(),
            "work_description": str(row.get("work_description", f"Work {work_id}")).strip(),
            "sanctioned_amount": sanctioned,
            "released_amount": released,
            "expenditure": expenditure,
            "balance_amount": balance,
            "work_status": str(row.get("work_status", "Sanctioned")).strip(),
            "recommendation_date": clean_date(row.get("recommendation_date")),
            "sanction_date": clean_date(row.get("sanction_date")),
            "completion_date": clean_date(row.get("completion_date")),
            "financial_year": str(row.get("financial_year", "2023-24")).strip(),
            "latitude": lat,
            "longitude": lng,
            "is_demo": bool(is_demo or row.get("is_demo", False))
        }
        records.append(record)
    return records

def ingest_file_content(content: bytes, filename: str, db: Session, is_demo: bool = False) -> Tuple[int, int]:
    filename_lower = filename.lower()
    if filename_lower.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(content))
    elif filename_lower.endswith((".xlsx", ".xls")):
        df = pd.read_excel(io.BytesIO(content))
    elif filename_lower.endswith(".json"):
        raw_data = json.loads(content.decode("utf-8"))
        if isinstance(raw_data, list):
            df = pd.DataFrame(raw_data)
        elif isinstance(raw_data, dict) and "works" in raw_data:
            df = pd.DataFrame(raw_data["works"])
        else:
            df = pd.DataFrame([raw_data])
    else:
        raise ValueError("Unsupported file format. Please upload CSV, Excel (.xlsx), or JSON.")

    normalized_records = normalize_dataframe(df, is_demo=is_demo)
    inserted = 0
    updated = 0

    for rec in normalized_records:
        existing = db.query(WorkModel).filter(WorkModel.work_id == rec["work_id"]).first()
        if existing:
            for k, v in rec.items():
                setattr(existing, k, v)
            updated += 1
        else:
            db_obj = WorkModel(**rec)
            db.add(db_obj)
            inserted += 1

    db.commit()
    return inserted, updated

def load_initial_demo_data(db: Session, sample_csv_path: str):
    count = db.query(WorkModel).count()
    if count == 0:
        df = pd.read_csv(sample_csv_path)
        normalized = normalize_dataframe(df, is_demo=True)
        for rec in normalized:
            db_obj = WorkModel(**rec)
            db.add(db_obj)
        db.commit()
        print(f"Loaded {len(normalized)} records from demo CSV into database.")
