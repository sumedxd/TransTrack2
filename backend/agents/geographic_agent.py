import math
from typing import Dict, Any, List
from backend.agents.base_agent import BaseAgent
from backend.models.schemas import AgentResponse, Finding, RiskLevel, Severity

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Earth radius in kilometers
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class GeographicAgent(BaseAgent):
    def __init__(self):
        super().__init__("geographic_agent")

    def analyze(self, work: Dict[str, Any], context: Dict[str, Any]) -> AgentResponse:
        findings: List[Finding] = []
        all_works = context.get("all_works", [])

        district = str(work.get("district", "")).strip()
        block = str(work.get("block", "")).strip()
        village = str(work.get("village", "")).strip()
        work_type = str(work.get("work_type", "")).strip()
        agency = str(work.get("implementing_agency", "")).strip()
        sanctioned = float(work.get("sanctioned_amount", 0.0) or 0.0)
        
        lat = work.get("latitude")
        lng = work.get("longitude")

        score = 15.0

        # Filter works in same district & block
        district_works = [w for w in all_works if str(w.get("district", "")).strip() == district]
        block_works = [w for w in district_works if str(w.get("block", "")).strip() == block]
        village_works = [w for w in block_works if str(w.get("village", "")).strip() == village]

        total_block_count = len(block_works)
        village_count = len(village_works)
        
        total_block_funds = sum(float(w.get("sanctioned_amount", 0.0) or 0.0) for w in block_works)
        village_funds = sum(float(w.get("sanctioned_amount", 0.0) or 0.0) for w in village_works)

        # 1. Extreme Village Fund Concentration
        if total_block_count >= 5 and village_count >= 5:
            village_share_pct = (village_funds / total_block_funds * 100.0) if total_block_funds > 0 else 0.0
            if village_share_pct >= 60.0 or village_count >= 8:
                score = max(score, 78.0)
                findings.append(Finding(
                    title="High spatial clustering of works and fund concentration",
                    description=(
                        f"Village/Ward '{village}' in block '{block}' contains {village_count} works "
                        f"accounting for {village_share_pct:.1f}% (₹{village_funds:,.2f}) of the entire block's "
                        f"sanctioned MPLADS allocation (₹{total_block_funds:,.2f}). "
                        "Indicates strong localized concentration compared to equitable constituency spread."
                    ),
                    evidence=[
                        f"Village: {village}, Block: {block}",
                        f"Works in village: {village_count} / {total_block_count} in block",
                        f"Fund concentration: {village_share_pct:.1f}% (₹{village_funds:,.2f})",
                        f"Block total allocation: ₹{total_block_funds:,.2f}"
                    ],
                    confidence=0.91,
                    severity=Severity.HIGH,
                    metric="village_fund_concentration_pct",
                    observed_value=round(village_share_pct, 1),
                    expected_value=25.0
                ))
            elif village_share_pct >= 35.0:
                score = max(score, 50.0)
                findings.append(Finding(
                    title="Moderate geographic concentration in village",
                    description=(
                        f"Village '{village}' accounts for {village_share_pct:.1f}% of block funds across {village_count} works."
                    ),
                    evidence=[
                        f"Village share: {village_share_pct:.1f}%",
                        f"Works in village: {village_count}"
                    ],
                    confidence=0.85,
                    severity=Severity.MEDIUM,
                    metric="village_fund_concentration_pct",
                    observed_value=round(village_share_pct, 1),
                    expected_value=25.0
                ))

        # 2. Implementing Agency / Contractor Monopoly in Cluster
        if village_count >= 4 and agency:
            same_agency_count = sum(1 for w in village_works if str(w.get("implementing_agency", "")).strip() == agency)
            agency_share = (same_agency_count / village_count * 100.0)
            if same_agency_count >= 4 and agency_share >= 75.0:
                score = max(score, 74.0)
                findings.append(Finding(
                    title="Implementing agency concentration in localized cluster",
                    description=(
                        f"Agency '{agency}' is assigned {same_agency_count} of {village_count} works "
                        f"({agency_share:.1f}%) within village '{village}'. "
                        "Substantial concentration with a single executing entity warrants audit verification of competitive award processes."
                    ),
                    evidence=[
                        f"Implementing Agency: {agency}",
                        f"Cluster works assigned: {same_agency_count} / {village_count} ({agency_share:.1f}%)",
                        f"Cluster location: {village}, {block}"
                    ],
                    confidence=0.88,
                    severity=Severity.HIGH,
                    metric="agency_cluster_share_pct",
                    observed_value=round(agency_share, 1),
                    expected_value=40.0
                ))

        # 3. Spatial Proximity Clustering (if GPS coordinates present)
        if lat is not None and lng is not None:
            nearby_1km = 0
            for other in district_works:
                if other.get("work_id") == work.get("work_id"):
                    continue
                o_lat = other.get("latitude")
                o_lng = other.get("longitude")
                if o_lat is not None and o_lng is not None:
                    dist_km = haversine_km(lat, lng, o_lat, o_lng)
                    if dist_km <= 1.0:
                        nearby_1km += 1

            if nearby_1km >= 6:
                score = max(score, 65.0)
                findings.append(Finding(
                    title="High density spatial proximity cluster",
                    description=(
                        f"Identified {nearby_1km} other MPLADS works within a 1.0 km radius "
                        f"(GPS: {lat:.4f}, {lng:.4f}). Verify no asset duplication or overlapping physical boundaries."
                    ),
                    evidence=[
                        f"Coordinates: {lat:.4f}, {lng:.4f}",
                        f"Works within 1 km: {nearby_1km}",
                        f"Work type: {work_type}"
                    ],
                    confidence=0.90,
                    severity=Severity.MEDIUM,
                    metric="nearby_1km_count",
                    observed_value=nearby_1km,
                    expected_value=2
                ))

        # 4. Normal geographic spread
        if not findings:
            findings.append(Finding(
                title="Geographic distribution and allocation density balanced",
                description=(
                    f"Work is located in {village or 'rural area'}, {block}, {district}. "
                    "Spatial allocation density and agency diversification align with standard district distribution."
                ),
                evidence=[
                    f"District: {district}",
                    f"Block: {block or 'N/A'}",
                    f"Village works: {village_count} / {total_block_count or 1} in block"
                ],
                confidence=0.88,
                severity=Severity.LOW,
                metric="geographic_health",
                observed_value=village_count,
                expected_value=village_count
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
