import pytest
from backend.agents.financial_agent import FinancialAgent
from backend.models.schemas import PeerStats, Severity, RiskLevel

def test_financial_utilization_normal():
    agent = FinancialAgent()
    work = {
        "work_id": "TEST-001",
        "sanctioned_amount": 2000000.0,
        "released_amount": 2000000.0,
        "expenditure": 1800000.0,
        "balance_amount": 200000.0,
        "work_status": "Completed"
    }
    context = {"all_works": [work]}
    resp = agent.analyze(work, context)
    assert resp.agent == "financial_agent"
    assert resp.score <= 30.0
    assert resp.risk_level == RiskLevel.LOW

def test_financial_over_expenditure():
    agent = FinancialAgent()
    work = {
        "work_id": "TEST-002",
        "sanctioned_amount": 2500000.0,
        "released_amount": 2500000.0,
        "expenditure": 3250000.0,  # 7.5L overrun
        "balance_amount": -750000.0,
        "work_status": "Completed"
    }
    context = {"all_works": [work]}
    resp = agent.analyze(work, context)
    assert resp.risk_level == RiskLevel.CRITICAL
    assert resp.score >= 85.0
    overrun_finding = next((f for f in resp.findings if f.metric == "expenditure_overrun"), None)
    assert overrun_finding is not None
    assert overrun_finding.severity == Severity.CRITICAL

def test_financial_peer_cost_outlier():
    agent = FinancialAgent()
    peer_stats = PeerStats(
        peer_group_name="Community Hall in Pune",
        peer_count=15,
        median_cost=2000000.0,
        mean_cost=2100000.0,
        p25_cost=1800000.0,
        p75_cost=2400000.0,
        p90_cost=2600000.0,
        cost_deviation_pct=350.0,
        cost_z_score=3.8,
        cost_percentile=99.0
    )
    work = {
        "work_id": "TEST-003",
        "sanctioned_amount": 9000000.0,  # 4.5x peer median
        "released_amount": 9000000.0,
        "expenditure": 9000000.0,
        "balance_amount": 0.0,
        "work_status": "Completed"
    }
    context = {"all_works": [work], "peer_stats": peer_stats}
    resp = agent.analyze(work, context)
    assert resp.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL)
    assert any(f.metric == "peer_cost_ratio" for f in resp.findings)
