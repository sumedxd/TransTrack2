import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.orm_models import SystemConfigModel
from backend.models.schemas import WeightConfig
from backend.services.pipeline_service import pipeline_service

router = APIRouter(prefix="/config", tags=["configuration"])

@router.get("", response_model=WeightConfig)
def get_config(db: Session = Depends(get_db)):
    record = db.query(SystemConfigModel).filter(SystemConfigModel.key == "weights").first()
    if record:
        try:
            return WeightConfig(**json.loads(record.value))
        except Exception:
            pass
    return WeightConfig()

@router.post("", response_model=WeightConfig)
def update_config(config: WeightConfig, db: Session = Depends(get_db)):
    # Validate sum of weights
    total_w = config.weight_financial + config.weight_progress + config.weight_anomaly + config.weight_geographic
    if abs(total_w - 1.0) > 0.01:
        raise HTTPException(status_code=400, detail=f"Weights must sum to 1.0 (current sum: {total_w:.2f})")

    record = db.query(SystemConfigModel).filter(SystemConfigModel.key == "weights").first()
    if not record:
        record = SystemConfigModel(key="weights", value=config.model_dump_json())
        db.add(record)
    else:
        record.value = config.model_dump_json()

    db.commit()

    # Re-run batch scoring with new weights
    pipeline_service.batch_process_all_works(db)

    return config
