import os
import json
from typing import Dict, Any, List, Optional
from backend.config import settings

class LLMService:
    def __init__(self):
        self.provider = settings.DEFAULT_LLM_PROVIDER
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY

    def generate_investigation_narrative(
        self,
        work: Dict[str, Any],
        agent_findings: Dict[str, Any],
        risk_score: float,
        confidence: float
    ) -> Dict[str, Any]:
        """
        Attempts to synthesize findings using configured LLM API (Gemini / OpenAI),
        or falls back to high-fidelity deterministic grounded synthesis.
        """
        if self.gemini_key and (self.provider in ("auto", "gemini")):
            try:
                res = self._call_gemini(work, agent_findings, risk_score, confidence)
                if res:
                    return res
            except Exception as e:
                print(f"[LLMService] Gemini call failed, falling back to local synthesizer: {e}")

        if self.openai_key and (self.provider in ("auto", "openai")):
            try:
                res = self._call_openai(work, agent_findings, risk_score, confidence)
                if res:
                    return res
            except Exception as e:
                print(f"[LLMService] OpenAI call failed, falling back to local synthesizer: {e}")

        # Local deterministic evidence-grounded synthesizer (Default & Reliable Fallback)
        return self._local_grounded_synthesis(work, agent_findings, risk_score, confidence)

    def _call_gemini(self, work: Dict[str, Any], agent_findings: Dict[str, Any], risk_score: float, confidence: float) -> Optional[Dict[str, Any]]:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.gemini_key)
            prompt = self._build_synthesis_prompt(work, agent_findings, risk_score, confidence)
            
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                )
            )
            data = json.loads(response.text)
            return data
        except Exception as err:
            print(f"[LLMService] Gemini error: {err}")
            return None

    def _call_openai(self, work: Dict[str, Any], agent_findings: Dict[str, Any], risk_score: float, confidence: float) -> Optional[Dict[str, Any]]:
        try:
            import openai
            client = openai.OpenAI(api_key=self.openai_key)
            prompt = self._build_synthesis_prompt(work, agent_findings, risk_score, confidence)

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are the Lead Investigator AI for TransTrack 2. Output strictly JSON matching the required schema."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            return json.loads(response.choices[0].message.content)
        except Exception as err:
            print(f"[LLMService] OpenAI error: {err}")
            return None

    def _build_synthesis_prompt(self, work: Dict[str, Any], agent_findings: Dict[str, Any], risk_score: float, confidence: float) -> str:
        return f"""
You are the Lead Investigator AI in TransTrack 2 (MPLADS Risk & Audit Prioritization System).
Review these structured findings from specialist agents for Work ID '{work.get("work_id")}'.

CRITICAL DIRECTIVES:
1. NEVER declare corruption, fraud, or wrongdoing. Use decision-support language: "anomaly detected", "risk indicator", "requires physical verification".
2. NEVER invent facts. Base every sentence strictly on the structured evidence supplied.
3. If evidence is insufficient, state "Insufficient evidence".

WORK DETAILS:
- Work ID: {work.get("work_id")}
- Work Description: {work.get("work_description")}
- Type: {work.get("work_type")}
- Location: {work.get("village")}, {work.get("block")}, {work.get("district")}, {work.get("state")}
- Sanctioned: INR {work.get("sanctioned_amount")}
- Expenditure: INR {work.get("expenditure")}
- Status: {work.get("work_status")}
- Computed Risk Score: {risk_score}/100
- Computed Confidence: {confidence}%

AGENT FINDINGS:
{json.dumps(agent_findings, indent=2)}

Respond with a JSON object matching this schema:
{{
  "executive_summary": "1-2 concise paragraphs summarizing the multi-agent findings without making accusations.",
  "key_findings": ["Bullet 1", "Bullet 2", ...],
  "corroborating_evidence": ["Evidence where multiple agents or metrics reinforce each other"],
  "contradictory_evidence": ["Mitigating factors or areas where data appears normal or inconsistent"],
  "geographic_analysis": "Summary of spatial density, village allocation, or agency clustering",
  "recommendation": "Specific audit recommendation: Routine monitoring / Additional review / Priority human verification / Immediate verification",
  "requires_physical_verification": true/false
}}
"""

    def _local_grounded_synthesis(
        self,
        work: Dict[str, Any],
        agent_findings: Dict[str, Any],
        risk_score: float,
        confidence: float
    ) -> Dict[str, Any]:
        """
        High-fidelity deterministic synthesis engine that extracts cross-agent corroboration
        and contradictory evidence directly from the structured findings.
        """
        work_id = work.get("work_id", "Unknown")
        work_type = work.get("work_type", "Work")
        district = work.get("district", "Unknown")
        sanctioned = float(work.get("sanctioned_amount", 0.0) or 0.0)
        expenditure = float(work.get("expenditure", 0.0) or 0.0)
        status = work.get("work_status", "Unknown")

        fin_findings = agent_findings.get("financial_agent", {}).get("findings", [])
        prog_findings = agent_findings.get("progress_agent", {}).get("findings", [])
        geo_findings = agent_findings.get("geographic_agent", {}).get("findings", [])
        ml_findings = agent_findings.get("anomaly_agent", {}).get("findings", [])
        dq_flags = agent_findings.get("data_quality_agent", {}).get("findings", [])

        key_findings = []
        corroborating = []
        contradictory = []

        # Extract high severity findings
        all_high = []
        for agent_name, agent_data in agent_findings.items():
            for f in agent_data.get("findings", []):
                sev = f.get("severity", "MEDIUM")
                if sev in ("HIGH", "CRITICAL") and "within expected" not in f.get("title", "").lower():
                    all_high.append((agent_name, f))
                    key_findings.append(f"{f.get('title')}: {f.get('description')}")

        # Check for corroboration patterns
        has_fin_cost = any("cost" in f.get("title", "").lower() for f in fin_findings)
        has_ml_outlier = any("outlier" in f.get("title", "").lower() or "deviation" in f.get("title", "").lower() for f in ml_findings)
        has_fast_prog = any("brief duration" in f.get("title", "").lower() or "fast" in f.get("title", "").lower() for f in prog_findings)
        has_delay = any("delay" in f.get("title", "").lower() for f in prog_findings)
        has_geo_cluster = any("cluster" in f.get("title", "").lower() or "concentration" in f.get("title", "").lower() for f in geo_findings)

        if has_fin_cost and has_ml_outlier:
            corroborating.append(
                "Financial Agent peer cost deviation is corroborated by Unsupervised Isolation Forest classifying "
                "the project as a high multidimensional statistical outlier."
            )
        if has_fin_cost and has_fast_prog:
            corroborating.append(
                "Unusually high project cost coincides with an exceptionally brief execution window, "
                "presenting mutually reinforcing risk indicators on project execution velocity."
            )
        if has_delay and any("utilization" in f.get("title", "").lower() for f in fin_findings):
            corroborating.append(
                "Progress timeline delays correlate directly with low fund utilization despite substantial initial release."
            )
        if has_geo_cluster and any("agency" in f.get("title", "").lower() for f in geo_findings):
            corroborating.append(
                "Geographic allocation concentration aligns with a single implementing agency executing the majority of cluster works."
            )

        if not corroborating and all_high:
            corroborating.append("Single-domain high risk indicator flagged without direct cross-agent corroboration.")

        # Check for contradictory or mitigating factors
        if risk_score > 60:
            normal_agents = [
                name for name, data in agent_findings.items()
                if data.get("score", 0) < 35 and name != "data_quality_agent"
            ]
            if normal_agents:
                contradictory.append(
                    f"While high risk indicators were flagged, the following analytical areas exhibited normal parameters: "
                    f"{', '.join(agent.replace('_', ' ').title() for agent in normal_agents)}."
                )
            if not dq_flags:
                contradictory.append("No underlying data hygiene or record corruption issues detected; records are syntactically well-formed.")
        else:
            contradictory.append("No conflicting evidence identified; metrics across all agent evaluations remain within expected distribution bounds.")

        # Geographic analysis text
        geo_high = [f for f in geo_findings if f.get("severity") in ("HIGH", "CRITICAL")]
        if geo_high:
            geo_summary = geo_high[0].get("description", "Localized geographic clustering detected.")
        else:
            geo_summary = (
                f"Work is situated in {work.get('village') or 'rural block'}, {work.get('block')}, {district}. "
                "Spatial allocation and executing agency diversity align with district baseline distributions."
            )

        # Recommendation based on score
        if risk_score >= 81.0:
            recommendation = (
                "Immediate on-site physical verification recommended. Prioritize inspection of physical asset completion, "
                "material specifications, and measurement book (MB) records against disbursed vouchers."
            )
            req_phys = True
        elif risk_score >= 61.0:
            recommendation = (
                "Priority human audit recommended. Conduct desk-based verification of tender awards and milestone completion "
                "certificates; schedule targeted field inspection if physical verification is required."
            )
            req_phys = True
        elif risk_score >= 31.0:
            recommendation = (
                "Additional administrative review recommended. Verify ongoing milestone reporting and reconcile fund utilization "
                "with the Nodal District Authority."
            )
            req_phys = False
        else:
            recommendation = "Routine monitoring recommended. All current parameters satisfy standard MPLADS operational norms."
            req_phys = False

        if not key_findings:
            key_findings = ["All analyzed parameters (financial, timeline, geographic, statistical) are within normal operational limits."]

        # Executive summary
        exec_summary = (
            f"TransTrack 2 multi-agent analysis for Work ID '{work_id}' ({work_type}, {district}) generated an overall "
            f"Risk Score of {risk_score}/100 with an Evidence Confidence rating of {confidence}%. "
            f"The assessment synthesizes structured findings from Financial, Progress, Geographic, and Anomaly Detection agents. "
        )
        if all_high:
            exec_summary += (
                f"The system flagged {len(all_high)} significant risk indicator(s) requiring auditor attention, "
                f"principally concerning {all_high[0][1].get('title').lower()}. "
            )
        else:
            exec_summary += "No significant anomalies or deviations were observed across the examined operational dimensions. "
        exec_summary += f"{recommendation}"

        return {
            "executive_summary": exec_summary,
            "key_findings": key_findings,
            "corroborating_evidence": corroborating,
            "contradictory_evidence": contradictory,
            "geographic_analysis": geo_summary,
            "recommendation": recommendation,
            "requires_physical_verification": req_phys
        }
