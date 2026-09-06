import pytest
from backend.agents.progress_agent import ProgressAgent
from backend.models.schemas import RiskLevel, Severity

def test_progress_unusually_fast_completion():
    agent = ProgressAgent()
    work = {
        "work_id": "TEST-PROG-001",
        "work_type": "Community Hall",
        "sanctioned_amount": 5000000.0,
        "expenditure": 5000000.0,
        "work_status": "Completed",
        "sanction_date": "2023-05-01",
        "completion_date": "2023-05-12"  # 11 days for a 50L building!
    }
    resp = agent.analyze(work, {})
    assert resp.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL)
    fast_finding = next((f for f in resp.findings if f.metric == "days_to_completion"), None)
    assert fast_finding is not None
    assert fast_finding.observed_value == 11
    assert fast_finding.severity == Severity.HIGH

def test_progress_delayed_work():
    agent = ProgressAgent()
    work = {
        "work_id": "TEST-PROG-002",
        "work_type": "Rural Road",
        "sanctioned_amount": 3000000.0,
        "expenditure": 300000.0,
        "work_status": "In Progress",
        "sanction_date": "2021-01-01",  # Over 500 days ago
        "completion_date": ""
    }
    resp = agent.analyze(work, {})
    assert resp.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL)
    delay_finding = next((f for f in resp.findings if f.metric == "days_since_sanction"), None)
    assert delay_finding is not None
    assert delay_finding.observed_value > 500

def test_progress_decoupled_status_and_expenditure():
    agent = ProgressAgent()
    work = {
        "work_id": "TEST-PROG-003",
        "sanctioned_amount": 2000000.0,
        "expenditure": 1900000.0,  # 95% spent
        "work_status": "Sanctioned",  # Unstarted
        "sanction_date": "2023-06-01"
    }
    resp = agent.analyze(work, {})
    assert resp.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL)
    decouple_finding = next((f for f in resp.findings if f.metric == "status_expenditure_mismatch"), None)
    assert decouple_finding is not None
