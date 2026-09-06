import pytest
from backend.agents.lead_investigator import LeadInvestigator
from backend.models.schemas import AgentResponse, RiskLevel, WeightConfig

def test_risk_scoring_weights_calculation():
    investigator = LeadInvestigator()
    weights = WeightConfig(
        weight_financial=0.30,
        weight_progress=0.25,
        weight_anomaly=0.25,
        weight_geographic=0.20
    )

    responses = {
        "financial_agent": AgentResponse(agent="financial_agent", risk_level=RiskLevel.HIGH, score=80.0),
        "progress_agent": AgentResponse(agent="progress_agent", risk_level=RiskLevel.LOW, score=20.0),
        "anomaly_agent": AgentResponse(agent="anomaly_agent", risk_level=RiskLevel.HIGH, score=80.0),
        "geographic_agent": AgentResponse(agent="geographic_agent", risk_level=RiskLevel.LOW, score=20.0)
    }

    # Expected: (80 * 0.3) + (20 * 0.25) + (80 * 0.25) + (20 * 0.20) = 24 + 5 + 20 + 4 = 53.0
    score = investigator.calculate_risk_score(responses, weights)
    assert score == 53.0
    level = investigator.determine_risk_level(score, weights)
    assert level == RiskLevel.MEDIUM

def test_risk_tier_boundaries():
    investigator = LeadInvestigator()
    weights = WeightConfig()

    assert investigator.determine_risk_level(25.0, weights) == RiskLevel.LOW
    assert investigator.determine_risk_level(30.0, weights) == RiskLevel.LOW
    assert investigator.determine_risk_level(31.5, weights) == RiskLevel.MEDIUM
    assert investigator.determine_risk_level(60.0, weights) == RiskLevel.MEDIUM
    assert investigator.determine_risk_level(65.0, weights) == RiskLevel.HIGH
    assert investigator.determine_risk_level(80.0, weights) == RiskLevel.HIGH
    assert investigator.determine_risk_level(85.0, weights) == RiskLevel.CRITICAL

def test_confidence_calculation():
    investigator = LeadInvestigator()
    work = {
        "sanctioned_amount": 1000000.0,
        "released_amount": 1000000.0,
        "expenditure": 900000.0,
        "sanction_date": "2023-01-01",
        "work_type": "Road",
        "latitude": 19.5,
        "longitude": 73.5
    }
    responses = {
        "financial_agent": AgentResponse(agent="financial_agent", risk_level=RiskLevel.LOW, score=20.0, confidence=0.9),
        "progress_agent": AgentResponse(agent="progress_agent", risk_level=RiskLevel.LOW, score=20.0, confidence=0.9),
        "anomaly_agent": AgentResponse(agent="anomaly_agent", risk_level=RiskLevel.LOW, score=20.0, confidence=0.9),
        "geographic_agent": AgentResponse(agent="geographic_agent", risk_level=RiskLevel.LOW, score=20.0, confidence=0.9)
    }
    conf = investigator.calculate_confidence(work, responses)
    assert 70.0 <= conf <= 98.0
