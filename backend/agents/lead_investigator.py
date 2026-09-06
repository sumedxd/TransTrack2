from typing import Dict, Any, List
from backend.models.schemas import (
    AgentResponse,
    LeadInvestigatorReport,
    RiskLevel,
    WeightConfig
)
from backend.services.llm_service import LLMService

class LeadInvestigator:
    def __init__(self, llm_service: LLMService = None):
        self.llm_service = llm_service or LLMService()

    def calculate_risk_score(
        self,
        agent_responses: Dict[str, AgentResponse],
        weights: WeightConfig
    ) -> float:
        s_fin = agent_responses.get("financial_agent", AgentResponse(agent="financial_agent", risk_level=RiskLevel.LOW, score=0.0)).score
        s_prog = agent_responses.get("progress_agent", AgentResponse(agent="progress_agent", risk_level=RiskLevel.LOW, score=0.0)).score
        s_anom = agent_responses.get("anomaly_agent", AgentResponse(agent="anomaly_agent", risk_level=RiskLevel.LOW, score=0.0)).score
        s_geo = agent_responses.get("geographic_agent", AgentResponse(agent="geographic_agent", risk_level=RiskLevel.LOW, score=0.0)).score

        total_weight = (
            weights.weight_financial +
            weights.weight_progress +
            weights.weight_anomaly +
            weights.weight_geographic
        )
        if total_weight <= 0:
            total_weight = 1.0

        raw_score = (
            (s_fin * weights.weight_financial) +
            (s_prog * weights.weight_progress) +
            (s_anom * weights.weight_anomaly) +
            (s_geo * weights.weight_geographic)
        ) / total_weight

        # Data quality penalty: If data quality is poor, don't ignore it
        dq_resp = agent_responses.get("data_quality_agent")
        if dq_resp and dq_resp.score > 40:
            # Scale risk up slightly for severe data quality violations (e.g. inverted dates or negative balance)
            raw_score = min(100.0, raw_score + (dq_resp.score * 0.15))

        return round(min(100.0, max(0.0, raw_score)), 1)

    def calculate_confidence(
        self,
        work: Dict[str, Any],
        agent_responses: Dict[str, AgentResponse]
    ) -> float:
        # 1. Data completeness score (up to 40 pts)
        completeness = 0.0
        if work.get("sanctioned_amount") and float(work.get("sanctioned_amount")) > 0: completeness += 8.0
        if work.get("released_amount") is not None: completeness += 6.0
        if work.get("expenditure") is not None: completeness += 6.0
        if work.get("sanction_date"): completeness += 8.0
        if work.get("work_type"): completeness += 6.0
        if work.get("latitude") and work.get("longitude"): completeness += 6.0

        # 2. Agent confidence averages (up to 40 pts)
        conf_sum = sum(resp.confidence for resp in agent_responses.values())
        avg_agent_conf = (conf_sum / len(agent_responses)) if agent_responses else 0.8
        agent_conf_pts = avg_agent_conf * 40.0

        # 3. Corroboration bonus (up to 20 pts)
        high_agents = sum(1 for resp in agent_responses.values() if resp.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL))
        corroboration_pts = 10.0 if high_agents <= 1 else 20.0

        total_conf = completeness + agent_conf_pts + corroboration_pts
        return round(min(98.0, max(45.0, total_conf)), 1)

    def determine_risk_level(self, score: float, weights: WeightConfig) -> RiskLevel:
        if score >= weights.threshold_high + 1.0:
            return RiskLevel.CRITICAL
        elif score >= weights.threshold_medium + 1.0:
            return RiskLevel.HIGH
        elif score >= weights.threshold_low + 1.0:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW

    def synthesize(
        self,
        work: Dict[str, Any],
        agent_responses: Dict[str, AgentResponse],
        weights: WeightConfig
    ) -> LeadInvestigatorReport:
        risk_score = self.calculate_risk_score(agent_responses, weights)
        risk_level = self.determine_risk_level(risk_score, weights)
        confidence = self.calculate_confidence(work, agent_responses)

        # Convert agent responses to dict format for LLM synthesis
        agent_findings_payload = {
            agent_name: resp.model_dump()
            for agent_name, resp in agent_responses.items()
        }

        # Evidence Summary Mapping
        evidence_summary = {
            "Financial Agent": agent_responses.get("financial_agent", AgentResponse(agent="financial_agent", risk_level=RiskLevel.LOW, score=0)).risk_level.value,
            "Progress Agent": agent_responses.get("progress_agent", AgentResponse(agent="progress_agent", risk_level=RiskLevel.LOW, score=0)).risk_level.value,
            "Geographic Agent": agent_responses.get("geographic_agent", AgentResponse(agent="geographic_agent", risk_level=RiskLevel.LOW, score=0)).risk_level.value,
            "Anomaly Agent": agent_responses.get("anomaly_agent", AgentResponse(agent="anomaly_agent", risk_level=RiskLevel.LOW, score=0)).risk_level.value,
            "Data Quality": agent_responses.get("data_quality_agent", AgentResponse(agent="data_quality_agent", risk_level=RiskLevel.LOW, score=0)).risk_level.value
        }

        narrative = self.llm_service.generate_investigation_narrative(
            work=work,
            agent_findings=agent_findings_payload,
            risk_score=risk_score,
            confidence=confidence
        )

        return LeadInvestigatorReport(
            work_id=str(work.get("work_id", "")),
            overall_risk=risk_level,
            risk_score=risk_score,
            confidence=confidence,
            executive_summary=narrative.get("executive_summary", "Multi-agent review completed."),
            key_findings=narrative.get("key_findings", []),
            corroborating_evidence=narrative.get("corroborating_evidence", []),
            contradictory_evidence=narrative.get("contradictory_evidence", []),
            geographic_analysis=narrative.get("geographic_analysis", "Geographic analysis completed."),
            recommendation=narrative.get("recommendation", "Routine review."),
            requires_physical_verification=narrative.get("requires_physical_verification", False),
            evidence_summary=evidence_summary
        )
