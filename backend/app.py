from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import engine, Base, SessionLocal
from backend.models.orm_models import WorkModel
from backend.data.ingestion import load_initial_demo_data
from backend.services.pipeline_service import pipeline_service

from backend.api.routes_works import router as works_router
from backend.api.routes_investigate import router as investigate_router
from backend.api.routes_ingest import router as ingest_router
from backend.api.routes_config import router as config_router

SAMPLE_CSV_PATH = Path(__file__).resolve().parent / "data" / "sample_mplads_data.csv"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        count = db.query(WorkModel).count()
        if count == 0:
            print("[TransTrack 2] Database is empty. Loading demo dataset...")
            if not SAMPLE_CSV_PATH.exists():
                from backend.data.generator import generate_demo_dataset
                generate_demo_dataset(target_count=250, output_path=str(SAMPLE_CSV_PATH))
            load_initial_demo_data(db, str(SAMPLE_CSV_PATH))
            print("[TransTrack 2] Running initial multi-agent batch analysis & scoring...")
            pipeline_service.batch_process_all_works(db)
            print("[TransTrack 2] Multi-agent analysis complete. Ready.")
        else:
            # Refresh models in pipeline
            pipeline_service.refresh_models(db)
            print(f"[TransTrack 2] Loaded {count} works from database.")
    finally:
        db.close()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Decision-support and audit-prioritization multi-agent platform for MPLADS works.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(works_router, prefix=settings.API_V1_STR)
app.include_router(investigate_router, prefix=settings.API_V1_STR)
app.include_router(ingest_router, prefix=settings.API_V1_STR)
app.include_router(config_router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "TransTrack 2 — AI-Powered MPLADS Risk & Investigation System",
        "version": settings.VERSION,
        "disclaimer": "Decision-support aid; does not establish legal wrongdoing."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)
