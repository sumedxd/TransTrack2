from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from backend.database import get_db
from backend.models.orm_models import WorkModel
from backend.models.schemas import WorkRead, DashboardSummary
from backend.services.pipeline_service import pipeline_service

router = APIRouter(prefix="/works", tags=["works"])

@router.get("/summary", response_model=DashboardSummary)
def get_summary(db: Session = Depends(get_db)):
    return pipeline_service.get_dashboard_summary(db)

@router.get("", response_model=Dict[str, Any])
def list_works(
    search: Optional[str] = Query(None, description="Search by ID, MP, description, village"),
    district: Optional[str] = Query(None, description="Filter by district"),
    status: Optional[str] = Query(None, description="Filter by work_status"),
    risk_level: Optional[str] = Query(None, description="Filter by risk_level: LOW, MEDIUM, HIGH, CRITICAL"),
    work_type: Optional[str] = Query(None, description="Filter by work_type"),
    sort_by: str = Query("risk_score", description="Column to sort by: risk_score, sanctioned_amount, expenditure, sanction_date"),
    sort_order: str = Query("desc", description="Sort direction: asc or desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(WorkModel)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (WorkModel.work_id.ilike(s)) |
            (WorkModel.work_description.ilike(s)) |
            (WorkModel.mp_name.ilike(s)) |
            (WorkModel.village.ilike(s)) |
            (WorkModel.block.ilike(s)) |
            (WorkModel.district.ilike(s))
        )

    if district:
        query = query.filter(WorkModel.district == district)
    if status:
        query = query.filter(WorkModel.work_status == status)
    if risk_level:
        query = query.filter(WorkModel.risk_level == risk_level)
    if work_type:
        query = query.filter(WorkModel.work_type == work_type)

    total = query.count()

    # Sorting
    col_map = {
        "risk_score": WorkModel.risk_score,
        "sanctioned_amount": WorkModel.sanctioned_amount,
        "expenditure": WorkModel.expenditure,
        "sanction_date": WorkModel.sanction_date,
        "work_id": WorkModel.work_id
    }
    sort_col = col_map.get(sort_by, WorkModel.risk_score)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    offset = (page - 1) * limit
    db_items = query.offset(offset).limit(limit).all()

    items = []
    for item in db_items:
        util_pct = (item.expenditure / item.sanctioned_amount * 100.0) if item.sanctioned_amount > 0 else 0.0
        w_read = WorkRead(
            id=item.id,
            work_id=item.work_id,
            mp_name=item.mp_name,
            mp_house=item.mp_house,
            constituency=item.constituency,
            state=item.state,
            district=item.district,
            block=item.block,
            village=item.village,
            implementing_agency=item.implementing_agency,
            work_type=item.work_type,
            work_description=item.work_description,
            sanctioned_amount=item.sanctioned_amount,
            released_amount=item.released_amount,
            expenditure=item.expenditure,
            balance_amount=item.balance_amount,
            work_status=item.work_status,
            recommendation_date=item.recommendation_date,
            sanction_date=item.sanction_date,
            completion_date=item.completion_date,
            financial_year=item.financial_year,
            latitude=item.latitude,
            longitude=item.longitude,
            is_demo=item.is_demo,
            risk_score=item.risk_score,
            risk_level=item.risk_level,
            top_finding=item.top_finding,
            utilization_percentage=round(util_pct, 1)
        )
        items.append(w_read)

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit > 0 else 1,
        "items": items
    }

@router.get("/{work_id}", response_model=WorkRead)
def get_work(work_id: str, db: Session = Depends(get_db)):
    item = db.query(WorkModel).filter(WorkModel.work_id == work_id).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"Work '{work_id}' not found.")
    util_pct = (item.expenditure / item.sanctioned_amount * 100.0) if item.sanctioned_amount > 0 else 0.0
    return WorkRead(
        id=item.id,
        work_id=item.work_id,
        mp_name=item.mp_name,
        mp_house=item.mp_house,
        constituency=item.constituency,
        state=item.state,
        district=item.district,
        block=item.block,
        village=item.village,
        implementing_agency=item.implementing_agency,
        work_type=item.work_type,
        work_description=item.work_description,
        sanctioned_amount=item.sanctioned_amount,
        released_amount=item.released_amount,
        expenditure=item.expenditure,
        balance_amount=item.balance_amount,
        work_status=item.work_status,
        recommendation_date=item.recommendation_date,
        sanction_date=item.sanction_date,
        completion_date=item.completion_date,
        financial_year=item.financial_year,
        latitude=item.latitude,
        longitude=item.longitude,
        is_demo=item.is_demo,
        risk_score=item.risk_score,
        risk_level=item.risk_level,
        top_finding=item.top_finding,
        utilization_percentage=round(util_pct, 1)
    )
