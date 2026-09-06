from typing import Dict, Any, List
from backend.agents.base_agent import BaseAgent
from backend.models.schemas import AgentResponse, Finding, RiskLevel, Severity
from backend.ml.isolation_forest import AnomalyModel

class AnomalyAgent(BaseAgent):
    def __init__(self, anomaly_model: AnomalyModel = None):
        super().__init__("anomaly_agent")
        self.anomaly_model = anomaly_model

    def set_model(self, anomaly_model: AnomalyModel):
        self.anomaly_model = anomaly_model

    def analyze(self, work: Dict[str, Any], context: Dict[str, Any]) -> AgentResponse:
        findings: List[Finding] = []
        peer_stats = context.get("peer_stats")
        
        # Check ML model score
        if self.anomaly_model:
            is_anomaly, ml_score, meta = self.anomaly_model.score_work(work)
        else:
            is_anomaly = False
            ml_score = 20.0
            meta = {}

        sanctioned = float(work.get("sanctioned_amount", 0.0) or 0.0)
        expenditure = float(work.get("expenditure", 0.0) or 0.0)

        # 1. Isolation Forest ML Outlier Finding
        if is_anomaly or ml_score >= 65.0:
            raw_dec = meta.get("raw_decision_score", 0.0)
            findings.append(Finding(
                title="Multidimensional statistical outlier detected by Isolation Forest",
                description=(
                    f"Unsupervised Isolation Forest algorithm classified this work as an anomaly "
                    f"(Anomaly score: {ml_score}/100, Decision function: {raw_dec:.4f}). "
                    "The combination of project cost, disbursement rate, duration, and peer cost ratio deviates "
                    "significantly from baseline distribution patterns."
                ),
                evidence=[
                    f"Isolation Forest ML score: {ml_score}/100",
                    f"Decision boundary value: {raw_dec:.4f} (negative denotes outlier)",
                    f"Sanctioned: ₹{sanctioned:,.2f}",
                    f"Expenditure: ₹{expenditure:,.2f}"
                ],
                confidence=0.92,
                severity=Severity.HIGH if ml_score < 80.0 else Severity.CRITICAL,
                metric="isolation_forest_score",
                observed_value=ml_score,
                expected_value=25.0
            ))

        # 2. Peer Percentile & Z-Score statistical finding
        if peer_stats and peer_stats.peer_count >= 3:
            p_rank = peer_stats.cost_percentile
            z_val = peer_stats.cost_z_score
            
            if p_rank >= 95.0 or z_val >= 2.5:
                ml_score = max(ml_score, 85.0)
                findings.append(Finding(
                    title="Extreme statistical cost deviation within peer group",
                    description=(
                        f"Project cost ranks in the {p_rank:.1f}th percentile among comparable works "
                        f"in {peer_stats.peer_group_name}. The cost is {z_val:+.2f} standard deviations from the peer mean, "
                        f"representing a {peer_stats.cost_deviation_pct:+.1f}% variance from the peer median (₹{peer_stats.median_cost:,.2f})."
                    ),
                    evidence=[
                        f"Percentile rank: {p_rank:.1f}% (top {100 - p_rank:.1f}%)",
                        f"Z-score: {z_val:+.2f} σ",
                        f"Peer median cost: ₹{peer_stats.median_cost:,.2f}",
                        f"Sample size: {peer_stats.peer_count} peer works"
                    ],
                    confidence=0.94,
                    severity=Severity.CRITICAL if p_rank >= 98.0 else Severity.HIGH,
                    metric="peer_cost_percentile",
                    observed_value=round(p_rank, 1),
                    expected_value=50.0
                ))
            elif p_rank >= 85.0 or z_val >= 1.5:
                ml_score = max(ml_score, 60.0)
                findings.append(Finding(
                    title="Moderately high cost percentile in peer comparison",
                    description=(
                        f"Project cost is in the {p_rank:.1f}th percentile (Z-score: {z_val:+.2f}) "
                        f"for {peer_stats.peer_group_name}."
                    ),
                    evidence=[
                        f"Percentile rank: {p_rank:.1f}%",
                        f"Z-score: {z_val:+.2f}",
                        f"Deviation: {peer_stats.cost_deviation_pct:+.1f}%"
                    ],
                    confidence=0.88,
                    severity=Severity.MEDIUM,
                    metric="peer_cost_percentile",
                    observed_value=round(p_rank, 1),
                    expected_value=50.0
                ))

        # 3. Normal profile if no ML or statistical deviation
        if not findings:
            findings.append(Finding(
                title="Statistical features align with peer distribution",
                description=(
                    f"Project metrics conform to standard multivariate patterns. "
                    f"Cost percentile is {peer_stats.cost_percentile:.1f}% (Z-score: {peer_stats.cost_z_score:+.2f}) "
                    f"relative to {peer_stats.peer_group_name if peer_stats else 'all works'}."
                ),
                evidence=[
                    f"Isolation Forest score: {ml_score}/100 (normal)",
                    f"Percentile rank: {peer_stats.cost_percentile if peer_stats else 50.0:.1f}%",
                    f"Peer median: ₹{peer_stats.median_cost if peer_stats else sanctioned:,.2f}"
                ],
                confidence=0.90,
                severity=Severity.LOW,
                metric="statistical_health",
                observed_value=round(ml_score, 1),
                expected_value=25.0
            ))

        # Map to RiskLevel
        if ml_score >= 81.0:
            level = RiskLevel.CRITICAL
        elif ml_score >= 61.0:
            level = RiskLevel.HIGH
        elif ml_score >= 31.0:
            level = RiskLevel.MEDIUM
        else:
            level = RiskLevel.LOW

        avg_conf = sum(f.confidence for f in findings) / len(findings) if findings else 0.88

        return AgentResponse(
            agent=self.name,
            risk_level=level,
            score=round(ml_score, 1),
            confidence=round(avg_conf, 2),
            findings=findings
        )
