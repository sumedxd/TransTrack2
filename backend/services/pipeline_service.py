import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.models.orm_models import WorkModel, SystemConfigModel
from backend.models.schemas import (
    WorkRead,
    WorkInvestigationResult,
    EvidencePackage,
    AgentResponse,
    DashboardSummary,
    WeightConfig,
    RiskLevel,
    DataQualityFlag
)
from backend.ml.peer_comparison import PeerComparisonEngine
from backend.ml.isolation_forest import AnomalyModel
from backend.agents.financial_agent import FinancialAgent
from backend.agents.progress_agent import ProgressAgent
from backend.agents.geographic_agent import GeographicAgent
from backend.agents.anomaly_agent import AnomalyAgent
from backend.agents.data_quality_agent import DataQualityAgent
from backend.agents.lead_investigator import LeadInvestigator
from backend.services.llm_service import LLMService

class PipelineService:
    def __init__(self):
        self.financial_agent = FinancialAgent()
        self.progress_agent = ProgressAgent()
        self.geographic_agent = GeographicAgent()
        self.data_quality_agent = DataQualityAgent()
        self.llm_service = LLMService()
        self.lead_investigator = LeadInvestigator(self.llm_service)

        self.peer_engine: Optional[PeerComparisonEngine] = None
        self.anomaly_model: Optional[AnomalyModel] = None
        self.anomaly_agent = AnomalyAgent()

        self._cached_works_data: List[Dict[str, Any]] = []

    def _get_weights(self, db: Session) -> WeightConfig:
        config_record = db.query(SystemConfigModel).filter(SystemConfigModel.key == "weights").first()
        if config_record:
            try:
                data = json.loads(config_record.value)
                return WeightConfig(**data)
            except Exception:
                pass
        return WeightConfig()

    def refresh_models(self, db: Session):
        db_works = db.query(WorkModel).all()
        self._cached_works_data = [
            {
                "id": w.id,
                "work_id": w.work_id,
                "mp_name": w.mp_name,
                "mp_house": w.mp_house,
                "constituency": w.constituency,
                "state": w.state,
                "district": w.district,
                "block": w.block,
                "village": w.village,
                "implementing_agency": w.implementing_agency,
                "work_type": w.work_type,
                "work_description": w.work_description,
                "sanctioned_amount": w.sanctioned_amount,
                "released_amount": w.released_amount,
                "expenditure": w.expenditure,
                "balance_amount": w.balance_amount,
                "work_status": w.work_status,
                "recommendation_date": w.recommendation_date,
                "sanction_date": w.sanction_date,
                "completion_date": w.completion_date,
                "financial_year": w.financial_year,
                "latitude": w.latitude,
                "longitude": w.longitude,
                "is_demo": w.is_demo
            }
            for w in db_works
        ]

        self.peer_engine = PeerComparisonEngine(self._cached_works_data)
        self.anomaly_model = AnomalyModel(self._cached_works_data, self.peer_engine)
        self.anomaly_agent.set_model(self.anomaly_model)

    def _generate_why_flagged(
        self,
        work: Dict[str, Any],
        agent_responses: Dict[str, AgentResponse],
        evidence_package: EvidencePackage
    ) -> List[str]:
        bullets = []

        # 1. Peer cost comparison
        p_stats = evidence_package.peer_stats
        sanctioned = float(work.get("sanctioned_amount", 0.0) or 0.0)
        if p_stats and p_stats.median_cost > 0:
            ratio = sanctioned / p_stats.median_cost
            if ratio >= 1.7:
                bullets.append(f"Sanctioned cost (₹{sanctioned:,.0f}) is {ratio:.1f}× the peer median (₹{p_stats.median_cost:,.0f})")
            elif p_stats.cost_percentile >= 90.0:
                bullets.append(f"Project cost ranks in the {p_stats.cost_percentile:.0f}th percentile among comparable {p_stats.peer_group_name}")

        # 2. Financial specific
        fin_resp = agent_responses.get("financial_agent")
        if fin_resp:
            for f in fin_resp.findings:
                if f.severity in ("HIGH", "CRITICAL") and "within" not in f.title.lower():
                    if "overrun" in f.metric or "exceeds" in f.title.lower():
                        bullets.append(f"Cumulative expenditure exceeds sanctioned budget by ₹{f.observed_value - f.expected_value:,.0f}")
                    elif "utilization" in f.metric:
                        bullets.append(f"Fund utilization is only {f.observed_value:.1f}% despite substantial fund release")

        # 3. Progress specific
        prog_resp = agent_responses.get("progress_agent")
        if prog_resp:
            for f in prog_resp.findings:
                if f.severity in ("HIGH", "CRITICAL") and "conforms" not in f.title.lower():
                    if "brief duration" in f.title.lower():
                        bullets.append(f"Civil work recorded completed unusually rapidly in {f.observed_value} days from sanction")
                    elif "delay" in f.title.lower():
                        bullets.append(f"Project elapsed duration is {f.observed_value} days, exceeding the 365-day MPLADS guideline")
                    elif "decoupled" in f.title.lower():
                        bullets.append(f"Disbursed {f.observed_value:.0f}% of budget while physical status remains marked 'Sanctioned'")

        # 4. ML Anomaly specific
        anom_resp = agent_responses.get("anomaly_agent")
        if anom_resp:
            for f in anom_resp.findings:
                if f.severity in ("HIGH", "CRITICAL") and "conforms" not in f.title.lower():
                    if "isolation_forest" in f.metric:
                        bullets.append(f"Unsupervised Isolation Forest algorithm flagged multidimensional operational outlier (score {f.observed_value}/100)")

        # 5. Geographic specific
        geo_resp = agent_responses.get("geographic_agent")
        if geo_resp:
            for f in geo_resp.findings:
                if f.severity in ("HIGH", "CRITICAL") and "balanced" not in f.title.lower():
                    if "concentration" in f.title.lower():
                        bullets.append(f"Village accounts for {f.observed_value:.0f}% of block funds, indicating high spatial concentration")
                    elif "agency" in f.title.lower():
                        bullets.append(f"Single implementing agency executes {f.observed_value:.0f}% of works in this localized cluster")

        # 6. Data quality warnings
        if evidence_package.data_quality_flags:
            crit_dq = [fl for fl in evidence_package.data_quality_flags if fl.severity in ("HIGH", "CRITICAL")]
            if crit_dq:
                bullets.append(f"Data quality warning: {crit_dq[0].message}")

        if not bullets:
            bullets.append("All observed metrics conform to normal peer and operational distributions.")

        return bullets

    def analyze_single_work(
        self,
        work_dict: Dict[str, Any],
        weights: WeightConfig
    ) -> WorkInvestigationResult:
        if self.peer_engine is None or self.anomaly_model is None:
            raise RuntimeError("Pipeline models not initialized. Call refresh_models first.")

        peer_stats = self.peer_engine.compute_peer_stats(work_dict)

        context = {
            "all_works": self._cached_works_data,
            "peer_stats": peer_stats
        }

        # Run Specialist Agents
        fin_response = self.financial_agent.analyze(work_dict, context)
        prog_response = self.progress_agent.analyze(work_dict, context)
        geo_response = self.geographic_agent.analyze(work_dict, context)
        anom_response = self.anomaly_agent.analyze(work_dict, context)
        dq_flags, dq_response = self.data_quality_agent.analyze(work_dict, context)

        agent_responses = {
            "financial_agent": fin_response,
            "progress_agent": prog_response,
            "geographic_agent": geo_response,
            "anomaly_agent": anom_response,
            "data_quality_agent": dq_response
        }

        # Central Evidence Package
        evidence_package = EvidencePackage(
            work_id=str(work_dict.get("work_id", "")),
            financial_findings=fin_response.findings,
            progress_findings=prog_response.findings,
            geographic_findings=geo_response.findings,
            anomaly_findings=anom_response.findings,
            data_quality_flags=dq_flags,
            peer_stats=peer_stats
        )

        # Synthesize with Lead Investigator
        report = self.lead_investigator.synthesize(work_dict, agent_responses, weights)

        # Generate "Why Flagged?" explainability points
        why_flagged = self._generate_why_flagged(work_dict, agent_responses, evidence_package)

        # Build WorkRead
        sanctioned = float(work_dict.get("sanctioned_amount", 0.0) or 0.0)
        expenditure = float(work_dict.get("expenditure", 0.0) or 0.0)
        util_pct = (expenditure / sanctioned * 100.0) if sanctioned > 0 else 0.0

        top_f = why_flagged[0] if why_flagged else "Normal parameters"

        work_read = WorkRead(
            id=work_dict.get("id", 0),
            work_id=work_dict.get("work_id", ""),
            mp_name=work_dict.get("mp_name", ""),
            mp_house=work_dict.get("mp_house", "Lok Sabha"),
            constituency=work_dict.get("constituency", ""),
            state=work_dict.get("state", ""),
            district=work_dict.get("district", ""),
            block=work_dict.get("block", ""),
            village=work_dict.get("village", ""),
            implementing_agency=work_dict.get("implementing_agency", ""),
            work_type=work_dict.get("work_type", ""),
            work_description=work_dict.get("work_description", ""),
            sanctioned_amount=sanctioned,
            released_amount=float(work_dict.get("released_amount", 0.0) or 0.0),
            expenditure=expenditure,
            balance_amount=float(work_dict.get("balance_amount", 0.0) or 0.0),
            work_status=work_dict.get("work_status", ""),
            recommendation_date=work_dict.get("recommendation_date"),
            sanction_date=work_dict.get("sanction_date"),
            completion_date=work_dict.get("completion_date"),
            financial_year=work_dict.get("financial_year", "2023-24"),
            latitude=work_dict.get("latitude"),
            longitude=work_dict.get("longitude"),
            is_demo=bool(work_dict.get("is_demo", True)),
            risk_score=report.risk_score,
            risk_level=report.overall_risk.value,
            top_finding=top_f,
            utilization_percentage=round(util_pct, 1)
        )

        return WorkInvestigationResult(
            work=work_read,
            evidence_package=evidence_package,
            agent_responses=agent_responses,
            report=report,
            why_flagged=why_flagged,
            peer_comparison=peer_stats
        )

    def batch_process_all_works(self, db: Session) -> int:
        self.refresh_models(db)
        weights = self._get_weights(db)
        
        db_works = db.query(WorkModel).all()
        updated_count = 0

        for work in db_works:
            work_dict = {
                "id": work.id,
                "work_id": work.work_id,
                "mp_name": work.mp_name,
                "mp_house": work.mp_house,
                "constituency": work.constituency,
                "state": work.state,
                "district": work.district,
                "block": work.block,
                "village": work.village,
                "implementing_agency": work.implementing_agency,
                "work_type": work.work_type,
                "work_description": work.work_description,
                "sanctioned_amount": work.sanctioned_amount,
                "released_amount": work.released_amount,
                "expenditure": work.expenditure,
                "balance_amount": work.balance_amount,
                "work_status": work.work_status,
                "recommendation_date": work.recommendation_date,
                "sanction_date": work.sanction_date,
                "completion_date": work.completion_date,
                "financial_year": work.financial_year,
                "latitude": work.latitude,
                "longitude": work.longitude,
                "is_demo": work.is_demo
            }

            result = self.analyze_single_work(work_dict, weights)
            work.risk_score = result.report.risk_score
            work.risk_level = result.report.overall_risk.value
            work.top_finding = result.why_flagged[0] if result.why_flagged else None
            work.analysis_cache = result.model_dump_json()
            updated_count += 1

        db.commit()
        return updated_count

    def investigate_work(self, work_id: str, db: Session, force_refresh: bool = False) -> WorkInvestigationResult:
        work = db.query(WorkModel).filter(WorkModel.work_id == work_id).first()
        if not work:
            raise ValueError(f"Work with ID '{work_id}' not found.")

        if self.peer_engine is None or not self._cached_works_data:
            self.refresh_models(db)

        weights = self._get_weights(db)

        if not force_refresh and work.analysis_cache:
            try:
                cached_data = json.loads(work.analysis_cache)
                return WorkInvestigationResult(**cached_data)
            except Exception:
                pass

        work_dict = {
            "id": work.id,
            "work_id": work.work_id,
            "mp_name": work.mp_name,
            "mp_house": work.mp_house,
            "constituency": work.constituency,
            "state": work.state,
            "district": work.district,
            "block": work.block,
            "village": work.village,
            "implementing_agency": work.implementing_agency,
            "work_type": work.work_type,
            "work_description": work.work_description,
            "sanctioned_amount": work.sanctioned_amount,
            "released_amount": work.released_amount,
            "expenditure": work.expenditure,
            "balance_amount": work.balance_amount,
            "work_status": work.work_status,
            "recommendation_date": work.recommendation_date,
            "sanction_date": work.sanction_date,
            "completion_date": work.completion_date,
            "financial_year": work.financial_year,
            "latitude": work.latitude,
            "longitude": work.longitude,
            "is_demo": work.is_demo
        }

        result = self.analyze_single_work(work_dict, weights)
        work.risk_score = result.report.risk_score
        work.risk_level = result.report.overall_risk.value
        work.top_finding = result.why_flagged[0] if result.why_flagged else None
        work.analysis_cache = result.model_dump_json()
        db.commit()

        return result

    def get_dashboard_summary(self, db: Session) -> DashboardSummary:
        works = db.query(WorkModel).all()
        total_works = len(works)
        total_sanctioned = sum(w.sanctioned_amount for w in works)
        total_expenditure = sum(w.expenditure for w in works)
        overall_util = (total_expenditure / total_sanctioned * 100.0) if total_sanctioned > 0 else 0.0

        completed = sum(1 for w in works if w.work_status == "Completed")
        in_progress = sum(1 for w in works if w.work_status == "In Progress")
        sanctioned = sum(1 for w in works if w.work_status == "Sanctioned")
        stalled = sum(1 for w in works if w.work_status == "Stalled")

        critical_c = sum(1 for w in works if w.risk_level == "CRITICAL")
        high_c = sum(1 for w in works if w.risk_level == "HIGH")
        med_c = sum(1 for w in works if w.risk_level == "MEDIUM")
        low_c = sum(1 for w in works if w.risk_level == "LOW")

        risk_distribution = [
            {"tier": "CRITICAL", "count": critical_c, "color": "#dc2626", "action": "Immediate Verification"},
            {"tier": "HIGH", "count": high_c, "color": "#ea580c", "action": "Priority Review"},
            {"tier": "MEDIUM", "count": med_c, "color": "#eab308", "action": "Additional Review"},
            {"tier": "LOW", "count": low_c, "color": "#16a34a", "action": "Routine Monitoring"}
        ]

        status_distribution = [
            {"status": "Completed", "count": completed, "color": "#2563eb"},
            {"status": "In Progress", "count": in_progress, "color": "#06b6d4"},
            {"status": "Sanctioned", "count": sanctioned, "color": "#f59e0b"},
            {"status": "Stalled", "count": stalled, "color": "#ef4444"}
        ]

        # District summary
        district_map: Dict[str, Dict[str, Any]] = {}
        for w in works:
            d = w.district
            if d not in district_map:
                district_map[d] = {"district": d, "state": w.state, "works_count": 0, "sanctioned": 0.0, "expenditure": 0.0, "high_risk_count": 0}
            district_map[d]["works_count"] += 1
            district_map[d]["sanctioned"] += w.sanctioned_amount
            district_map[d]["expenditure"] += w.expenditure
            if w.risk_level in ("HIGH", "CRITICAL"):
                district_map[d]["high_risk_count"] += 1

        district_summary = sorted(district_map.values(), key=lambda x: x["sanctioned"], reverse=True)

        # Work type summary
        wt_map: Dict[str, Dict[str, Any]] = {}
        for w in works:
            wt = w.work_type
            if wt not in wt_map:
                wt_map[wt] = {"work_type": wt, "count": 0, "sanctioned": 0.0, "expenditure": 0.0}
            wt_map[wt]["count"] += 1
            wt_map[wt]["sanctioned"] += w.sanctioned_amount
            wt_map[wt]["expenditure"] += w.expenditure

        work_type_summary = sorted(wt_map.values(), key=lambda x: x["count"], reverse=True)

        return DashboardSummary(
            total_works=total_works,
            total_sanctioned=round(total_sanctioned, 2),
            total_expenditure=round(total_expenditure, 2),
            overall_utilization=round(overall_util, 1),
            completed_works=completed,
            in_progress_works=in_progress,
            sanctioned_works=sanctioned,
            stalled_works=stalled,
            critical_risk_count=critical_c,
            high_risk_count=high_c,
            medium_risk_count=med_c,
            low_risk_count=low_c,
            risk_distribution=risk_distribution,
            status_distribution=status_distribution,
            district_summary=district_summary,
            work_type_summary=work_type_summary
        )

pipeline_service = PipelineService()
