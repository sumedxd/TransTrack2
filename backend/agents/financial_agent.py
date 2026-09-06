from typing import Dict, Any, List
from backend.agents.base_agent import BaseAgent
from backend.models.schemas import AgentResponse, Finding, RiskLevel, Severity

class FinancialAgent(BaseAgent):
    def __init__(self):
        super().__init__("financial_agent")

    def analyze(self, work: Dict[str, Any], context: Dict[str, Any]) -> AgentResponse:
        findings: List[Finding] = []
        sanctioned = float(work.get("sanctioned_amount", 0.0) or 0.0)
        released = float(work.get("released_amount", 0.0) or 0.0)
        expenditure = float(work.get("expenditure", 0.0) or 0.0)
        balance = float(work.get("balance_amount", 0.0) or 0.0)
        status = str(work.get("work_status", "")).strip()

        utilization_pct = (expenditure / sanctioned * 100.0) if sanctioned > 0 else 0.0
        release_utilization_pct = (expenditure / released * 100.0) if released > 0 else 0.0

        peer_stats = context.get("peer_stats")
        peer_median = peer_stats.median_cost if peer_stats and peer_stats.median_cost > 0 else sanctioned
        cost_deviation_pct = peer_stats.cost_deviation_pct if peer_stats else 0.0

        score = 15.0  # baseline normal risk

        # 1. Over-expenditure beyond sanctioned sanction limit
        if expenditure > sanctioned:
            excess = expenditure - sanctioned
            excess_pct = (excess / sanctioned * 100.0) if sanctioned > 0 else 100.0
            score = max(score, 90.0)
            findings.append(Finding(
                title="Expenditure exceeds administrative sanction limit",
                description=(
                    f"Cumulative expenditure (₹{expenditure:,.2f}) exceeds the sanctioned budget "
                    f"(₹{sanctioned:,.2f}) by ₹{excess:,.2f} ({excess_pct:.1f}% overrun). "
                    "In MPLADS guidelines, expenditures exceeding sanction require formal revised administrative approval."
                ),
                evidence=[
                    f"Sanctioned amount: ₹{sanctioned:,.2f}",
                    f"Expenditure incurred: ₹{expenditure:,.2f}",
                    f"Overrun amount: ₹{excess:,.2f} ({excess_pct:.1f}%)"
                ],
                confidence=0.98,
                severity=Severity.CRITICAL,
                metric="expenditure_overrun",
                observed_value=expenditure,
                expected_value=sanctioned
            ))

        # 2. Extreme peer cost outlier
        if peer_stats and peer_stats.peer_count >= 3:
            ratio = sanctioned / peer_median if peer_median > 0 else 1.0
            if ratio >= 3.0:
                score = max(score, 88.0)
                findings.append(Finding(
                    title="Substantial project cost deviation from peer median",
                    description=(
                        f"Sanctioned amount (₹{sanctioned:,.2f}) is {ratio:.1f}× the median cost "
                        f"(₹{peer_median:,.2f}) for comparable {peer_stats.peer_group_name}. "
                        f"Deviation is +{cost_deviation_pct:.1f}% (Z-Score: +{peer_stats.cost_z_score:.2f})."
                    ),
                    evidence=[
                        f"Sanctioned amount: ₹{sanctioned:,.2f}",
                        f"Peer median cost: ₹{peer_median:,.2f}",
                        f"Peer comparison group: {peer_stats.peer_group_name} (n={peer_stats.peer_count})",
                        f"Percentile rank: {peer_stats.cost_percentile:.1f}th percentile"
                    ],
                    confidence=0.92,
                    severity=Severity.HIGH,
                    metric="peer_cost_ratio",
                    observed_value=sanctioned,
                    expected_value=peer_median
                ))
            elif ratio >= 1.8:
                score = max(score, 65.0)
                findings.append(Finding(
                    title="Elevated project cost relative to peer group",
                    description=(
                        f"Sanctioned amount is {ratio:.1f}× higher than the peer median "
                        f"(₹{peer_median:,.2f}) for {peer_stats.peer_group_name}."
                    ),
                    evidence=[
                        f"Sanctioned: ₹{sanctioned:,.2f}",
                        f"Peer median: ₹{peer_median:,.2f}",
                        f"Deviation: +{cost_deviation_pct:.1f}%"
                    ],
                    confidence=0.85,
                    severity=Severity.MEDIUM,
                    metric="peer_cost_ratio",
                    observed_value=sanctioned,
                    expected_value=peer_median
                ))

        # 3. Very low utilization despite full fund release
        if released >= (sanctioned * 0.8) and released > 500000.0:
            if utilization_pct < 10.0 and status in ("In Progress", "Sanctioned"):
                score = max(score, 72.0)
                findings.append(Finding(
                    title="Minimal fund utilization despite substantial release",
                    description=(
                        f"Funds of ₹{released:,.2f} have been disbursed to the implementing agency, "
                        f"but only {utilization_pct:.1f}% (₹{expenditure:,.2f}) has been expended. "
                        f"Unutilized balance stands at ₹{balance:,.2f}."
                    ),
                    evidence=[
                        f"Released amount: ₹{released:,.2f} ({released/sanctioned*100:.1f}% of sanction)",
                        f"Expenditure: ₹{expenditure:,.2f}",
                        f"Utilization rate: {utilization_pct:.1f}%",
                        f"Idle balance: ₹{balance:,.2f}"
                    ],
                    confidence=0.90,
                    severity=Severity.HIGH,
                    metric="utilization_pct",
                    observed_value=utilization_pct,
                    expected_value=75.0
                ))

        # 4. Completed status with significant locked balance
        if status == "Completed" and balance > (sanctioned * 0.25) and balance > 200000.0:
            score = max(score, 55.0)
            findings.append(Finding(
                title="Substantial unspent balance on completed work",
                description=(
                    f"Work is marked Completed, yet an unspent balance of ₹{balance:,.2f} "
                    f"({(balance/released*100.0 if released > 0 else 0):.1f}% of released funds) remains. "
                    "Under MPLADS rules, unspent balances on completed works should be surrendered to the Nodal District."
                ),
                evidence=[
                    f"Status: {status}",
                    f"Released: ₹{released:,.2f}",
                    f"Expenditure: ₹{expenditure:,.2f}",
                    f"Unsurrendered balance: ₹{balance:,.2f}"
                ],
                confidence=0.88,
                severity=Severity.MEDIUM,
                metric="unspent_balance",
                observed_value=balance,
                expected_value=0.0
            ))

        # 5. Normal healthy profile if no anomalies
        if not findings:
            findings.append(Finding(
                title="Financial metrics within expected normal parameters",
                description=(
                    f"Utilization ({utilization_pct:.1f}%) and expenditure (₹{expenditure:,.2f}) "
                    "conform to standard peer distributions and sanction limits."
                ),
                evidence=[
                    f"Sanctioned: ₹{sanctioned:,.2f}",
                    f"Expenditure: ₹{expenditure:,.2f}",
                    f"Utilization: {utilization_pct:.1f}%",
                    f"Peer group median: ₹{peer_median:,.2f}"
                ],
                confidence=0.92,
                severity=Severity.LOW,
                metric="financial_health",
                observed_value=utilization_pct,
                expected_value=utilization_pct
            ))

        # Determine risk level
        if score >= 81.0:
            level = RiskLevel.CRITICAL
        elif score >= 61.0:
            level = RiskLevel.HIGH
        elif score >= 31.0:
            level = RiskLevel.MEDIUM
        else:
            level = RiskLevel.LOW

        avg_conf = sum(f.confidence for f in findings) / len(findings) if findings else 0.85

        return AgentResponse(
            agent=self.name,
            risk_level=level,
            score=round(score, 1),
            confidence=round(avg_conf, 2),
            findings=findings
        )
