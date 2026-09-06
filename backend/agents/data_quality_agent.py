from typing import Dict, Any, List, Tuple
from datetime import datetime
import pandas as pd
from backend.agents.base_agent import BaseAgent
from backend.models.schemas import AgentResponse, Finding, DataQualityFlag, RiskLevel, Severity

class DataQualityAgent(BaseAgent):
    def __init__(self):
        super().__init__("data_quality_agent")

    def analyze(self, work: Dict[str, Any], context: Dict[str, Any]) -> Tuple[List[DataQualityFlag], AgentResponse]:
        flags: List[DataQualityFlag] = []
        all_works = context.get("all_works", [])

        work_id = str(work.get("work_id", "")).strip()
        sanctioned = float(work.get("sanctioned_amount", 0.0) or 0.0)
        released = float(work.get("released_amount", 0.0) or 0.0)
        expenditure = float(work.get("expenditure", 0.0) or 0.0)
        balance = float(work.get("balance_amount", 0.0) or 0.0)
        status = str(work.get("work_status", "")).strip()

        s_date_str = str(work.get("sanction_date", "")).strip()
        c_date_str = str(work.get("completion_date", "")).strip()

        lat = work.get("latitude")
        lng = work.get("longitude")

        # 1. Negative amounts or negative balance
        if expenditure < 0:
            flags.append(DataQualityFlag(
                field="expenditure",
                issue_type="negative_value",
                severity=Severity.HIGH,
                message=f"Expenditure cannot be negative (observed: ₹{expenditure:,.2f})",
                value=expenditure
            ))
        if sanctioned < 0:
            flags.append(DataQualityFlag(
                field="sanctioned_amount",
                issue_type="negative_value",
                severity=Severity.HIGH,
                message=f"Sanctioned amount cannot be negative (observed: ₹{sanctioned:,.2f})",
                value=sanctioned
            ))
        if balance < 0:
            flags.append(DataQualityFlag(
                field="balance_amount",
                issue_type="negative_balance",
                severity=Severity.HIGH,
                message=f"Negative balance detected (₹{balance:,.2f}). Expenditure exceeds available released funds.",
                value=balance
            ))

        # 2. Expenditure exceeding sanctioned amount
        if expenditure > sanctioned and sanctioned > 0:
            flags.append(DataQualityFlag(
                field="expenditure",
                issue_type="exceeds_sanction",
                severity=Severity.MEDIUM,
                message=f"Expenditure (₹{expenditure:,.2f}) exceeds sanctioned budget (₹{sanctioned:,.2f}).",
                value=expenditure
            ))

        # 3. Impossible dates (Completion before Sanction)
        if s_date_str and c_date_str and s_date_str != "None" and c_date_str != "None":
            try:
                s_dt = pd.to_datetime(s_date_str)
                c_dt = pd.to_datetime(c_date_str)
                if c_dt < s_dt:
                    flags.append(DataQualityFlag(
                        field="completion_date",
                        issue_type="chronological_inversion",
                        severity=Severity.CRITICAL,
                        message=(
                            f"Chronological impossibility: Completion date ({c_date_str}) precedes "
                            f"Sanction date ({s_date_str})."
                        ),
                        value=c_date_str
                    ))
            except Exception:
                pass

        # 4. Inconsistent status vs dates
        if status == "Completed" and (not c_date_str or c_date_str in ("None", "nan", "")):
            flags.append(DataQualityFlag(
                field="completion_date",
                issue_type="missing_completion_date",
                severity=Severity.LOW,
                message="Work is marked as 'Completed' but completion date is missing.",
                value=None
            ))
        elif status == "Sanctioned" and c_date_str and c_date_str not in ("None", "nan", ""):
            flags.append(DataQualityFlag(
                field="work_status",
                issue_type="status_date_mismatch",
                severity=Severity.MEDIUM,
                message=f"Work status is 'Sanctioned' (unstarted) but completion date ({c_date_str}) is recorded.",
                value=status
            ))

        # 5. Invalid Coordinates (India Bounding Box: Lat 6 to 38, Lng 68 to 98)
        if lat is not None and lng is not None:
            if not (6.0 <= float(lat) <= 38.5 and 68.0 <= float(lng) <= 98.5):
                flags.append(DataQualityFlag(
                    field="coordinates",
                    issue_type="invalid_geo_coordinates",
                    severity=Severity.MEDIUM,
                    message=f"Coordinates ({lat}, {lng}) fall outside standard Indian territory bounds.",
                    value=f"{lat}, {lng}"
                ))

        # 6. Check duplicate work IDs in dataset
        if all_works:
            match_count = sum(1 for w in all_works if str(w.get("work_id", "")).strip() == work_id)
            if match_count > 1:
                flags.append(DataQualityFlag(
                    field="work_id",
                    issue_type="duplicate_work_id",
                    severity=Severity.HIGH,
                    message=f"Work ID '{work_id}' appears {match_count} times in the database.",
                    value=work_id
                ))

        # Build agent response summary
        penalty_score = min(100.0, len(flags) * 25.0)
        findings = [
            Finding(
                title=f"Data Quality Issue: {fl.issue_type}",
                description=fl.message,
                evidence=[f"Field: {fl.field}", f"Severity: {fl.severity.value}", f"Value: {fl.value}"],
                confidence=0.99,
                severity=fl.severity,
                metric=fl.issue_type,
                observed_value=fl.value,
                expected_value="Valid format"
            )
            for fl in flags
        ]

        agent_response = AgentResponse(
            agent=self.name,
            risk_level=RiskLevel.HIGH if penalty_score >= 50 else RiskLevel.LOW,
            score=penalty_score,
            confidence=0.95,
            findings=findings
        )

        return flags, agent_response
