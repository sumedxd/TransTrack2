from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime
from datetime import datetime
from backend.database import Base

class WorkModel(Base):
    __tablename__ = "works"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    work_id = Column(String(64), unique=True, index=True, nullable=False)
    mp_name = Column(String(128), index=True, nullable=False)
    mp_house = Column(String(32), default="Lok Sabha")
    constituency = Column(String(128), index=True, nullable=False)
    state = Column(String(64), index=True, nullable=False)
    district = Column(String(64), index=True, nullable=False)
    block = Column(String(64), nullable=True)
    village = Column(String(64), nullable=True)
    implementing_agency = Column(String(128), index=True, nullable=False)
    work_type = Column(String(64), index=True, nullable=False)
    work_description = Column(Text, nullable=False)
    sanctioned_amount = Column(Float, nullable=False)
    released_amount = Column(Float, nullable=False)
    expenditure = Column(Float, nullable=False)
    balance_amount = Column(Float, nullable=False)
    work_status = Column(String(32), index=True, nullable=False)
    recommendation_date = Column(String(16), nullable=True)
    sanction_date = Column(String(16), nullable=True)
    completion_date = Column(String(16), nullable=True)
    financial_year = Column(String(16), index=True, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_demo = Column(Boolean, default=True)

    # Analytical cache fields
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(16), default="LOW")
    top_finding = Column(String(256), nullable=True)
    analysis_cache = Column(Text, nullable=True)  # Stored JSON string of cached analysis
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SystemConfigModel(Base):
    __tablename__ = "system_config"

    key = Column(String(64), primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
