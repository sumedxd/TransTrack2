import os
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.orm_models import WorkModel
from backend.data.ingestion import ingest_file_content, load_initial_demo_data
from backend.data.generator import generate_demo_dataset
from backend.services.pipeline_service import pipeline_service

router = APIRouter(prefix="/ingest", tags=["ingestion"])

SAMPLE_CSV_PATH = Path(__file__).resolve().parent.parent / "data" / "sample_mplads_data.csv"

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    try:
        inserted, updated = ingest_file_content(contents, file.filename, db, is_demo=False)
        # Re-train models & update scores
        pipeline_service.batch_process_all_works(db)
        return {
            "status": "success",
            "filename": file.filename,
            "inserted": inserted,
            "updated": updated,
            "total_processed": inserted + updated
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File ingestion failed: {str(e)}")

@router.post("/reset-demo")
def reset_to_demo(db: Session = Depends(get_db)):
    try:
        # Clear existing works
        db.query(WorkModel).delete()
        db.commit()

        # Regenerate demo dataset to ensure fresh state
        generate_demo_dataset(target_count=250, output_path=str(SAMPLE_CSV_PATH))

        # Load fresh demo data
        load_initial_demo_data(db, str(SAMPLE_CSV_PATH))

        # Re-score all works through the multi-agent pipeline
        count = pipeline_service.batch_process_all_works(db)

        return {
            "status": "success",
            "message": f"Database successfully reset to official demo dataset with {count} works analyzed.",
            "disclaimer": "DEMO DATA — NOT OFFICIAL MPLADS DATA (FOR DEMONSTRATION PURPOSES ONLY)"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")

@router.get("/sample-template")
def download_sample_template():
    if not SAMPLE_CSV_PATH.exists():
        generate_demo_dataset(target_count=250, output_path=str(SAMPLE_CSV_PATH))
    return FileResponse(
        path=str(SAMPLE_CSV_PATH),
        filename="mplads_demo_dataset.csv",
        media_type="text/csv"
    )
