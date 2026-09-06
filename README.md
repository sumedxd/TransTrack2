# TransTrack 2 — AI-Powered MPLADS Risk & Investigation System

> **Statutory Notice**: TransTrack 2 is a decision-support and audit-prioritization platform for monitoring the Members of Parliament Local Area Development Scheme (MPLADS). The system identifies statistical anomalies, financial variances, and progress irregularities based on available administrative data. It does **NOT** establish or declare fraud, corruption, or legal wrongdoing. All outputs prioritize human audit review and on-site physical verification.

---

## 1. What is TransTrack 2?

TransTrack 2 is an audit intelligence system designed to monitor, analyze, and prioritize MPLADS works across India. Unlike legacy auditing tools that output arbitrary black-box "fraud scores", TransTrack 2 utilizes a **multi-agent analytical architecture** backed by real statistical methods (Isolation Forest unsupervised learning, peer-group deviations, Z-score rankings) and specialized specialist agents.

Findings from every agent are aggregated into an auditable **Central Evidence Object** and evaluated by a **Lead Investigator AI** to synthesize clear, evidence-grounded reports recommending targeted human/physical verification.

---

## 2. Problem Being Solved

The MPLADS scheme entitles Members of Parliament (MPs) to recommend developmental works in their constituencies (approx. ₹5 Crore annually). With tens of thousands of active works spread across remote districts, monitoring authorities face key hurdles:
1. **Auditor Overload**: Manual field audits cannot inspect 100% of works; inspection prioritization is often ad-hoc.
2. **Black-Box AI Skepticism**: Auditors reject unexplainable "probability of fraud" predictions without backing data.
3. **Decoupled Progress & Spending**: Works frequently display near 100% disbursement while physical stages lag behind, or completed status is marked with anomalous speed.
4. **Micro-Geographic Clustering**: Funds are occasionally concentrated into specific hamlets or awarded overwhelmingly to single executing agencies.

---

## 3. Multi-Agent System Architecture

```
                                 MPLADS Dataset
                          (CSV / Excel / JSON Ingestion)
                                        │
                                        ▼
                         Normalized SQLite Work Entity
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             ▼                          ▼                          ▼
     ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
     │  Peer Group  │           │ Data Quality │           │  ML Feature  │
     │  Comparison  │           │    Agent     │           │  Extractor   │
     └───────┬──────┘           └───────┬──────┘           └───────┬──────┘
             │                          │                          │
             └──────────────────┬───────┴──────────────────────────┘
                                ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         SPECIALIST ANALYTICAL AGENTS                        │
 │                                                                             │
 │  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────┐  │
 │  │   Financial Agent    │  │    Progress Agent    │  │  Geographic Agent │  │
 │  │  • Utilization rate  │  │  • Duration vs peer  │  │  • Spatial density│  │
 │  │  • Over-expenditure  │  │  • Fast completion   │  │  • Fund cluster % │  │
 │  │  • Unspent balance   │  │  • Decoupled progress│  │  • Agency monopoly│  │
 │  └──────────┬───────────┘  └──────────┬───────────┘  └─────────┬─────────┘  │
 │             │                         │                        │            │
 │             └───────────────────┬─────┴────────────────────────┘            │
 │                                 ▼                                           │
 │                    ┌─────────────────────────┐                              │
 │                    │ Anomaly Detection Agent │                              │
 │                    │   • Isolation Forest    │                              │
 │                    │   • Z-Scores & %-tiles  │                              │
 │                    └────────────┬────────────┘                              │
 └─────────────────────────────────┼───────────────────────────────────────────┘
                                   │
                                   ▼
                      Central Evidence Package
                         (Structured JSON)
                                   │
                                   ▼
                       Configurable Risk Scoring
                       (Score 0-100 & Conf. %)
                                   │
                                   ▼
                         Lead Investigator AI
                       • Corroborating Evidence
                       • Contradictory Evidence
                       • Audit Recommendation
                                   │
                                   ▼
                   FastAPI REST API & React Dashboard
```

---

## 4. Specialist Analytical Agents

Each agent operates as an independent module returning structured JSON adhering to the canonical schema:

### 1. Financial Agent (`backend/agents/financial_agent.py`)
- **Analyzes**: Sanctioned amount, released amount, expenditure, utilization percentage, unspent balance, peer cost ratios.
- **Key Checks**:
  - Over-expenditure: Cumulative expenditure exceeds administrative sanction limit (`expenditure > sanctioned`).
  - Extreme Peer Cost Outlier: Project cost is $\ge 1.8\times$ to $3.0\times$ the median cost of comparable works.
  - Low Utilization with Substantial Release: $\ge 80\%$ funds disbursed but $< 10\%$ expended after prolonged duration.
  - Locked Unsurrendered Balance: Completed works retaining $> 25\%$ unspent funds.

### 2. Progress Agent (`backend/agents/progress_agent.py`)
- **Analyzes**: Sanction date, completion date, elapsed duration, execution velocity, status vs fund disbursement.
- **Key Checks**:
  - Unusually Fast Completion: Major civil infrastructure ($> ₹10\text{ Lakhs}$) recorded completed in $< 25\text{ days}$.
  - Prolonged Timeline Delays: Projects exceeding the standard statutory 365-day completion window ($> 500\text{ days}$).
  - Decoupled Status & Spending: Physical status marked "Sanctioned" (unstarted) while $> 70\%$ of budget is expended.

### 3. Geographic Agent (`backend/agents/geographic_agent.py`)
- **Analyzes**: Spatial distribution, village/ward fund share, implementing agency clustering, GPS proximity.
- **Key Checks**:
  - Village Fund Concentration: Single village/ward absorbing $> 60\%$ of total block funding across $\ge 5$ works.
  - Agency Monopoly in Cluster: Single contractor or executing agency executing $\ge 75\%$ of works within a micro-cluster.
  - Spatial Density: High density of identical works within a 1.0 km radius (checking boundary/asset overlap).

### 4. Anomaly Detection Agent (`backend/agents/anomaly_agent.py`)
- **Machine Learning**: Unsupervised `IsolationForest` (Scikit-Learn) trained on multidimensional features:
  $$\mathbf{X} = [\text{sanctioned}, \text{expenditure}, \text{utilization\_rate}, \text{duration\_days}, \text{cost\_to\_peer\_median}, \text{daily\_spend\_rate}]$$
- **Statistical Benchmark**: Peer group percentile rank ($95\text{th}$ to $99\text{th}$ percentile) and standardized Z-scores ($+2.5\sigma$ to $+4.0\sigma$).
- **Explainability**: Outputs plain-language context (e.g. *"Project cost is in the 98th percentile among comparable Community Halls in Pune District"*).

### 5. Data Quality Agent (`backend/agents/data_quality_agent.py`)
- **Validates**: Chronological impossibility (completion date before sanction date), negative expenditure, negative balance, missing dates, coordinates outside India bounding box (`Lat 6°-38°`, `Lng 68°-98°`), duplicate work IDs.

---

## 5. Peer Comparison Methodology

Rather than applying a single arbitrary global threshold, works are dynamically benchmarked against local peers:
1. **Primary Cluster**: `(work_type, district)`
2. **Fallback Cluster 1**: `(work_type, state)` if group size $< 4$
3. **Fallback Cluster 2**: `(work_type)` state-wide
For each peer group, the engine computes:
- $\text{Median Cost}$, $\text{Mean Cost}$, $\text{IQR (Q1, Q3)}$, $\text{P90 Cost}$
- Standardized Cost Z-Score: $Z = \frac{\text{Cost} - \mu_{\text{peer}}}{\sigma_{\text{peer}}}$
- Cost Deviation Percentage: $\Delta\% = \frac{\text{Cost} - \text{Median}_{\text{peer}}}{\text{Median}_{\text{peer}}} \times 100$

---

## 6. Risk Scoring & Tiers

The overall **Risk Priority Score** (0–100) is calculated via a transparent weighted formula:

$$\text{Risk Score} = w_{\text{fin}} S_{\text{fin}} + w_{\text{prog}} S_{\text{prog}} + w_{\text{anom}} S_{\text{anom}} + w_{\text{geo}} S_{\text{geo}}$$

- **Default Weights**:
  - Financial: $30\%$
  - Progress: $25\%$
  - ML Anomaly: $25\%$
  - Geographic: $20\%$
- **Data Quality Adjustment**: Scaled up for severe data integrity violations (e.g., negative balance or chronological date inversion).

### Risk Score vs. Evidence Confidence
- **Risk Score (0–100)**: *How strongly do the analytical findings indicate that this work deserves audit review?*
- **Evidence Confidence (0–100%)**: *How complete, consistent, and corroborated is the underlying administrative record?*

### Configurable Risk Tiers
| Tier | Score Range | Action Directive |
| :--- | :---: | :--- |
| **LOW** | $0 - 30$ | Routine monitoring |
| **MEDIUM** | $31 - 60$ | Additional desk review recommended |
| **HIGH** | $61 - 80$ | Priority human review recommended |
| **CRITICAL** | $81 - 100$ | Immediate on-site physical verification recommended |

---

## 7. Lead Investigator AI

The Lead Investigator synthesizes findings from all 5 specialist agents into an auditable dossier:
- **Corroborating Evidence**: Identifies where multiple analytical domains reinforce each other (e.g., cost outlier corroborated by unsupervised Isolation Forest + quick completion velocity).
- **Contradictory / Mitigating Evidence**: Identifies areas where metrics are normal or explainable.
- **Audit Verification Recommendation**: Directly advises whether field-level physical inspection of asset completion is warranted.
- **LLM Service Abstraction**:
  - Supports Google Gemini API (`GEMINI_API_KEY`) and OpenAI (`OPENAI_API_KEY`).
  - Includes a **deterministic local grounded synthesizer fallback** that operates 100% offline out-of-the-box without requiring any API keys.
  - **Zero Hallucination Guarantee**: Strictly reasons over structured findings and never invents facts.

---

## 8. Demo Dataset & Pre-Seeded Anomalies

The platform ships with 250 realistic demo works across 5 states (Maharashtra, Karnataka, Uttar Pradesh, Tamil Nadu, West Bengal) clearly marked:
`DEMO DATA — NOT OFFICIAL MPLADS DATA (FOR DEMONSTRATION PURPOSES ONLY)`

### Key Pre-Seeded Audit Anomalies:
1. **`MPLADS-2023-MH-042`** *(High Financial Outlier & Fast Completion)*:
   - Community Hall in Pune (Baramati block, Village Karhati).
   - Sanctioned: ₹92.50 Lakhs (4.2× peer median of ₹22.10 Lakhs).
   - Completed in 15 days from sanction.
   - Flagged by: Financial Agent, Progress Agent, Isolation Forest ML (99th percentile).
2. **`MPLADS-2023-KA-088`** *(Severe Timeline Delay & Low Utilization)*:
   - Primary Health Sub-Center in Mysuru (Hunsur block, Village Bilikere).
   - Sanctioned: ₹46.00 Lakhs in Aug 2022 ($> 2\text{ years}$ elapsed, guideline is 1 year).
   - 100% funds released, only 4.8% expended. Status: In Progress.
   - Flagged by: Progress Agent (severe delay), Financial Agent (idle balance).
3. **`MPLADS-2023-TN-164`** *(Data Quality & Negative Balance)*:
   - Rural Road in Coimbatore (Pollachi block).
   - Sanctioned: ₹25.00 Lakhs; Expended: ₹32.50 Lakhs (₹7.5L over-expenditure, negative balance).
   - Completion date (2023-03-10) precedes Sanction date (2023-09-15).
   - Flagged by: Data Quality Agent (chronological inversion), Financial Agent (budget overrun).
4. **`MPLADS-2023-UP-CL01` to `CL10`** *(Geographic & Agency Concentration)*:
   - 10 Solar Street Light installations in Varanasi clustered in Village Kashi-Puram.
   - All 10 awarded to a single vendor: "M/s Purvanchal InfraTech Services".
   - Flagged by: Geographic Agent (spatial concentration & agency monopoly).
5. **`MPLADS-2023-WB-203`** *(Decoupled Progress & Status)*:
   - Drinking Water RO Plant in Nadia.
   - 98.7% funds disbursed, but physical status remains recorded as "Sanctioned".
   - Flagged by: Progress Agent.

---

## 9. Installation & Running Locally

### Prerequisites
- Python 3.10+ (Tested on Python 3.13)
- Node.js 18+ (Tested on Node v25.2.1)
- npm 9+

### Backend Setup
```bash
# 1. From workspace root:
cd "c:\Users\Victus\Desktop\BTP & SIH\TransTrack2"

# 2. Run backend test suite (optional verification):
python -m pytest backend/tests/ -v

# 3. Launch FastAPI backend server:
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
```
Backend API will be live at: `http://127.0.0.1:8000`  
API Swagger Documentation: `http://127.0.0.1:8000/docs`

### Frontend Setup
```bash
# 1. In a new terminal, navigate to frontend:
cd frontend

# 2. Start Vite development server:
npm run dev
```
Frontend dashboard will be live at: `http://localhost:5173`

---

## 10. Environment Variables (Optional)

Create a `.env` file in the root directory if you wish to configure external LLMs or database paths:

```env
# Optional LLM Keys (Rule-based synthesizer activates automatically if omitted)
GEMINI_API_KEY="your_gemini_api_key_here"
OPENAI_API_KEY="your_openai_api_key_here"
DEFAULT_LLM_PROVIDER="auto" # 'gemini', 'openai', or 'rule_based'

# Database URL (Default: local SQLite database)
DATABASE_URL="sqlite:///backend/transtrack2.db"
```

---

## 11. 3-Minute Demo Walkthrough

1. **Open Executive Dashboard (`http://localhost:5173`)**:
   - Inspect Top KPI Cards: 250 Total Works, ₹49.79 Cr Sanctioned, ₹32.05 Cr Expended (64.4% utilization).
   - View Recharts analytics: Risk Distribution, Execution Stages, District Outlays, Categories.
   - Explore the interactive Leaflet Map displaying color-coded risk markers across India.
2. **Filter the Risk Register**:
   - Click the `"Filter: High Risk Works"` or `"Filter: Critical Risk Works"` buttons.
   - Notice the table filters instantly with search and multi-column sorting.
3. **Open Investigation Dossier**:
   - Click `"Investigate"` on `MPLADS-2023-MH-042` or `MPLADS-2023-TN-164`.
   - Inspect the **Dual Gauge** showing Risk Priority Score vs. Evidence Confidence.
   - Review the clickable **"Why Flagged?"** chips explaining concrete statistical drivers.
4. **Inspect Lead Investigator Synthesis**:
   - Review the Executive Summary, Corroborating Evidence, and Human Verification Recommendation.
   - Click `"Print Report"` to trigger a clean, print-friendly audit report view.
5. **Inspect Specialist Agent Tabs**:
   - Switch to **"Specialist Agent Findings"** to see exact formulas, observed vs expected values, and auditable data bullets for each agent.
   - Switch to **"Peer Group Comparison"** to see the box distribution, quartiles, median, and Z-score relative to other works in the same district.
6. **Data Ingestion & Reset**:
   - Navigate to **"Data Ingestion"** to drag-and-drop your own CSV/Excel file or download the standard CSV template.
   - Click **"Reset to Demo Dataset"** at any time to restore the verified test baseline.

---

## 12. Limitations & Future Enhancements

- **Official MOSPI Scraper**: The official MOSPI eSAKSHI dashboard renders through authenticated state sessions. Future versions could integrate authorized SFTP or direct API integrations with State Nodal Authorities.
- **PostgreSQL / TimescaleDB Migration**: SQLite is utilized for the single-binary prototype; SQLAlchemy models are fully structured for immediate PostgreSQL scaling.
- **Physical MB (Measurement Book) OCR**: Integrating vision models to parse scanned contractor Measurement Books when uploaded alongside payment vouchers.
