import pytest
from backend.agents.data_quality_agent import DataQualityAgent
from backend.models.schemas import Severity

def test_data_quality_impossible_dates():
    agent = DataQualityAgent()
    work = {
        "work_id": "TEST-DQ-001",
        "sanctioned_amount": 1000000.0,
        "released_amount": 1000000.0,
        "expenditure": 900000.0,
        "balance_amount": 100000.0,
        "work_status": "Completed",
        "sanction_date": "2023-09-15",
        "completion_date": "2023-03-10"  # Precedes sanction!
    }
    flags, resp = agent.analyze(work, {})
    inv_flag = next((fl for fl in flags if fl.issue_type == "chronological_inversion"), None)
    assert inv_flag is not None
    assert inv_flag.severity == Severity.CRITICAL

def test_data_quality_negative_values():
    agent = DataQualityAgent()
    work = {
        "work_id": "TEST-DQ-002",
        "sanctioned_amount": 1000000.0,
        "released_amount": 1000000.0,
        "expenditure": 1500000.0,
        "balance_amount": -500000.0,  # Negative balance
        "work_status": "Completed"
    }
    flags, resp = agent.analyze(work, {})
    assert any(fl.issue_type == "negative_balance" for fl in flags)

def test_data_quality_duplicate_work_ids():
    agent = DataQualityAgent()
    work = {"work_id": "MPLADS-DUP-01", "sanctioned_amount": 100.0, "released_amount": 100.0, "expenditure": 50.0, "balance_amount": 50.0}
    context = {"all_works": [work, work, work]}  # Appears 3 times
    flags, resp = agent.analyze(work, context)
    dup_flag = next((fl for fl in flags if fl.issue_type == "duplicate_work_id"), None)
    assert dup_flag is not None

def test_data_quality_invalid_coordinates():
    agent = DataQualityAgent()
    work = {
        "work_id": "TEST-DQ-004",
        "sanctioned_amount": 1000.0,
        "released_amount": 1000.0,
        "expenditure": 500.0,
        "balance_amount": 500.0,
        "latitude": 85.0,  # North Pole! Outside India
        "longitude": -150.0
    }
    flags, resp = agent.analyze(work, {})
    geo_flag = next((fl for fl in flags if fl.issue_type == "invalid_geo_coordinates"), None)
    assert geo_flag is not None
