from typing import Dict, Any, List
from datetime import datetime
import pandas as pd
from backend.agents.base_agent import BaseAgent
from backend.models.schemas import AgentResponse, Finding, RiskLevel, Severity

class ProgressAgent(BaseAgent):
    def __init__(self):
        super().__init__("progress_agent")

    def analyze(self, work: Dict[str, Any], context: Dict[str, Any]) -> AgentResponse:
        findings: List[Finding] = []
        sanctioned = float(work.get("sanctioned_amount", 0.0) or 0.0)
        expenditure = float(work.get("expenditure", 0.0) or 0.0)
        status = str(work.get("work_status", "")).strip()
        
        utilization_pct = (expenditure / sanctioned * 100.0) if sanctioned > 0 else 0.0

        s_date_str = str(work.get("sanction_date", "")).strip()
        c_date_str = str(work.get("completion_date", "")).strip()

        days_to_completion = None
        days_since_sanction = None

        now = datetime.now()

        if s_date_str and s_date_str not in ("", "None", "nan"):
            try:
                s_dt = pd.to_datetime(s_date_str)
                days_since_sanction = max(0, (now - s_dt).days)
            except Exception:
                pass

        if s_date_str and c_date_str and c_date_str not in ("", "None", "nan") and s_date_str not in ("", "None", "nan"):
            try:
                s_dt = pd.to_datetime(s_date_str)
                c_dt = pd.to_datetime(c_date_str)
                days_to_completion = max(0, (c_dt - s_dt).days)
            except Exception:
                pass

        score = 15.0

        # 1. Unusually fast completion for substantial infrastructure
        if status == "Completed" and days_to_completion is not None:
            w_type = str(work.get("work_type", ""))
            # Major works like Community Hall, Rural Road, Health Center taking under 25 days
            if days_to_completion < 25 and sanctioned > 1000000.0:
                score = max(score, 82.0)
                findings.append(Finding(
                    title="Work marked completed with unusually brief duration",
                    description=(
                        f"Work of type '{w_type}' with sanctioned budget ₹{sanctioned:,.2f} "
                        f"was recorded as completed in just {days_to_completion} days from sanction. "
                        "Government civil procurement, tendering, execution, and curing typically require multiple months."
                    ),
                    evidence=[
                        f"Sanction date: {s_date_str}",
                        f"Completion date: {c_date_str}",
                        f"Elapsed execution duration: {days_to_completion} days",
                        f"Sanctioned amount: ₹{sanctioned:,.2f}"
                    ],
                    confidence=0.92,
                    severity=Severity.HIGH,
                    metric="days_to_completion",
                    observed_value=days_to_completion,
                    expected_value=120
                ))

        # 2. Prolonged pending duration beyond statutory guideline
        if status in ("In Progress", "Sanctioned", "Stalled") and days_since_sanction is not None:
            if days_since_sanction > 500:
                score = max(score, 78.0)
                findings.append(Finding(
                    title="Severe project delay exceeding MPLADS statutory guideline",
                    description=(
                        f"Work was sanctioned {days_since_sanction} days ago ({days_since_sanction/365.25:.1f} years). "
                        "MPLADS guidelines stipulate execution within 12 months (365 days). "
                        f"Current status remains '{status}' with {utilization_pct:.1f}% fund utilization."
                    ),
                    evidence=[
                        f"Sanction date: {s_date_str}",
                        f"Elapsed days: {days_since_sanction} days",
                        f"Statutory target: <= 365 days",
                        f"Current status: {status}",
                        f"Utilization: {utilization_pct:.1f}%"
                    ],
                    confidence=0.95,
                    severity=Severity.HIGH,
                    metric="days_since_sanction",
                    observed_value=days_since_sanction,
                    expected_value=365
                ))
            elif days_since_sanction > 365:
                score = max(score, 50.0)
                findings.append(Finding(
                    title="Work timeline exceeds standard 1-year completion guideline",
                    description=(
                        f"Work has been in progress for {days_since_sanction} days, exceeding the "
                        "recommended 365-day schedule."
                    ),
                    evidence=[
                        f"Sanction date: {s_date_str}",
                        f"Elapsed days: {days_since_sanction} days",
                        f"Current status: {status}"
                    ],
                    confidence=0.88,
                    severity=Severity.MEDIUM,
                    metric="days_since_sanction",
                    observed_value=days_since_sanction,
                    expected_value=365
                ))

        # 3. High expenditure but status still marked "Sanctioned"
        if status == "Sanctioned" and utilization_pct >= 70.0:
            score = max(score, 80.0)
            findings.append(Finding(
                title="Decoupled physical status and financial disbursement",
                description=(
                    f"Work physical status is recorded as 'Sanctioned' (unstarted), "
                    f"yet {utilization_pct:.1f}% of funds (₹{expenditure:,.2f}) have already been disbursed. "
                    "Indicates either delay in eSAKSHI physical stage reporting or premature vendor payment."
                ),
                evidence=[
                    f"Physical status: {status}",
                    f"Expenditure: ₹{expenditure:,.2f}",
                    f"Utilization rate: {utilization_pct:.1f}%"
                ],
                confidence=0.91,
                severity=Severity.HIGH,
                metric="status_expenditure_mismatch",
                observed_value=utilization_pct,
                expected_value=0.0
            ))

        # 4. Completed status with zero or nominal expenditure
        if status == "Completed" and expenditure < 1000.0:
            score = max(score, 65.0)
            findings.append(Finding(
                title="Completed status recorded without financial expenditure",
                description=(
                    f"Work status is marked 'Completed', yet recorded cumulative expenditure is ₹{expenditure:,.2f}. "
                    "Suggests administrative closure without finalized vendor settlements or missing ledger entries."
                ),
                evidence=[
                    f"Status: {status}",
                    f"Sanctioned amount: ₹{sanctioned:,.2f}",
                    f"Recorded expenditure: ₹{expenditure:,.2f}"
                ],
                confidence=0.90,
                severity=Severity.MEDIUM,
                metric="completed_zero_spend",
                observed_value=expenditure,
                expected_value=sanctioned
            ))

        # 5. Normal healthy progress
        if not findings:
            findings.append(Finding(
                title="Progress and timeline metrics conform to expected schedule",
                description=(
                    f"Work timeline ({days_to_completion or days_since_sanction or 'N/A'} days) "
                    f"and physical status ('{status}') are consistent with project execution norms."
                ),
                evidence=[
                    f"Status: {status}",
                    f"Sanction date: {s_date_str or 'Recorded'}",
                    f"Completion date: {c_date_str or 'Pending'}",
                    f"Utilization: {utilization_pct:.1f}%"
                ],
                confidence=0.90,
                severity=Severity.LOW,
                metric="progress_health",
                observed_value=status,
                expected_value=status
            ))

        # Map to RiskLevel
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
