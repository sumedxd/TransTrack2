from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.schemas import WorkInvestigationResult
from backend.services.pipeline_service import pipeline_service

router = APIRouter(prefix="/investigate", tags=["investigate"])

@router.get("/{work_id}", response_model=WorkInvestigationResult)
def investigate_work(
    work_id: str,
    refresh: bool = Query(False, description="Force re-running multi-agent analysis"),
    db: Session = Depends(get_db)
):
    try:
        result = pipeline_service.investigate_work(work_id, db, force_refresh=refresh)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Investigation pipeline error: {str(e)}")

@router.post("/batch-score")
def batch_score_all(db: Session = Depends(get_db)):
    try:
        count = pipeline_service.batch_process_all_works(db)
        return {"status": "success", "message": f"Successfully processed and updated risk scores for {count} works."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch scoring error: {str(e)}")
