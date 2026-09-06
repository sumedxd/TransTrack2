import pytest
from backend.agents.lead_investigator import LeadInvestigator
from backend.models.schemas import AgentResponse, Finding, RiskLevel, Severity, WeightConfig

def test_lead_investigator_evidence_grounding():
    investigator = LeadInvestigator()
    work = {
        "work_id": "TEST-LEAD-001",
        "work_type": "Drinking Water RO Plant",
        "district": "Pune",
        "sanctioned_amount": 2000000.0,
        "expenditure": 2000000.0,
        "work_status": "Completed"
    }
    
    findings_fin = [
        Finding(
            title="Substantial project cost deviation from peer median",
            description="Sanctioned amount is 3.5x peer median.",
            evidence=["Cost: 20L", "Peer median: 5.7L"],
            confidence=0.92,
            severity=Severity.HIGH,
            metric="peer_cost_ratio",
            observed_value=2000000.0,
            expected_value=570000.0
        )
    ]

    responses = {
        "financial_agent": AgentResponse(agent="financial_agent", risk_level=RiskLevel.HIGH, score=85.0, findings=findings_fin),
        "progress_agent": AgentResponse(agent="progress_agent", risk_level=RiskLevel.LOW, score=20.0),
        "anomaly_agent": AgentResponse(agent="anomaly_agent", risk_level=RiskLevel.HIGH, score=88.0, findings=[
            Finding(
                title="Multidimensional statistical outlier detected by Isolation Forest",
                description="Isolation Forest classified as outlier.",
                evidence=["Score: 88"],
                confidence=0.9,
                severity=Severity.HIGH
            )
        ]),
        "geographic_agent": AgentResponse(agent="geographic_agent", risk_level=RiskLevel.LOW, score=20.0),
        "data_quality_agent": AgentResponse(agent="data_quality_agent", risk_level=RiskLevel.LOW, score=0.0)
    }

    report = investigator.synthesize(work, responses, WeightConfig())

    # Safety checks: Never accuse of fraud/corruption
    text_corpus = (
        report.executive_summary + " " +
        " ".join(report.key_findings) + " " +
        report.recommendation
    ).lower()

    assert "fraud confirmed" not in text_corpus
    assert "corrupt" not in text_corpus
    assert "bribe" not in text_corpus
    
    # Grounding check: Must reference actual findings
    assert report.risk_score > 50.0
    assert len(report.corroborating_evidence) > 0
    assert report.disclaimer is not None
    assert "MPLADS" in report.disclaimer
