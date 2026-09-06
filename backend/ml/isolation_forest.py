import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from sklearn.ensemble import IsolationForest
from backend.ml.peer_comparison import PeerComparisonEngine

class AnomalyModel:
    def __init__(self, all_works: List[Dict[str, Any]], peer_engine: PeerComparisonEngine = None):
        self.all_works = all_works
        self.peer_engine = peer_engine or PeerComparisonEngine(all_works)
        self.model = IsolationForest(n_estimators=100, contamination=0.08, random_state=42)
        self.feature_names = [
            "sanctioned_amount",
            "expenditure",
            "utilization_rate",
            "duration_days",
            "cost_peer_ratio",
            "daily_spend_rate"
        ]
        self.is_fitted = False
        self._fit()

    def _extract_row_features(self, work: Dict[str, Any]) -> List[float]:
        sanctioned = float(work.get("sanctioned_amount", 0.0) or 0.0)
        expenditure = float(work.get("expenditure", 0.0) or 0.0)
        utilization = (expenditure / sanctioned) if sanctioned > 0 else 0.0
        
        # Duration
        s_date = str(work.get("sanction_date", "")).strip()
        c_date = str(work.get("completion_date", "")).strip()
        duration = 180.0  # default prior
        if s_date and c_date and s_date != "None" and c_date != "None":
            try:
                d1 = pd.to_datetime(s_date)
                d2 = pd.to_datetime(c_date)
                duration = float(max(1, (d2 - d1).days))
            except Exception:
                duration = 180.0
        elif s_date and s_date != "None":
            try:
                d1 = pd.to_datetime(s_date)
                duration = float(max(1, (pd.to_datetime("today") - d1).days))
            except Exception:
                duration = 180.0

        # Cost peer ratio
        p_stats = self.peer_engine.compute_peer_stats(work)
        peer_median = p_stats.median_cost if p_stats.median_cost > 0 else (sanctioned or 1.0)
        cost_peer_ratio = sanctioned / peer_median

        daily_spend = expenditure / max(1.0, duration)

        return [sanctioned, expenditure, utilization, duration, cost_peer_ratio, daily_spend]

    def _fit(self):
        if len(self.all_works) < 10:
            self.is_fitted = False
            return

        matrix = [self._extract_row_features(w) for w in self.all_works]
        X = np.array(matrix)
        # Handle nan / inf
        X = np.nan_to_num(X, nan=0.0, posinf=1e9, neginf=0.0)
        
        self.model.fit(X)
        self.is_fitted = True

    def score_work(self, work: Dict[str, Any]) -> Tuple[bool, float, Dict[str, Any]]:
        feats = self._extract_row_features(work)
        p_stats = self.peer_engine.compute_peer_stats(work)
        
        if not self.is_fitted:
            # Fallback heuristic if not enough works to fit forest
            is_outlier = (p_stats.cost_deviation_pct > 150.0) or (p_stats.cost_percentile >= 95.0)
            score = 75.0 if is_outlier else 15.0
            return is_outlier, score, {"method": "heuristic"}

        X_single = np.array([feats])
        X_single = np.nan_to_num(X_single, nan=0.0, posinf=1e9, neginf=0.0)

        # IsolationForest decision_function: negative is anomalous, positive is normal
        raw_score = float(self.model.decision_function(X_single)[0])
        prediction = int(self.model.predict(X_single)[0])  # -1 is anomaly, 1 is normal
        is_anomaly = (prediction == -1)

        # Map decision score to 0 - 100 risk score
        # raw_score typically ranges between -0.3 and +0.3
        # raw_score <= -0.1 is severe anomaly; raw_score >= 0.15 is very typical
        norm_score = (0.25 - raw_score) / 0.50 * 100.0
        ml_score = float(np.clip(norm_score, 5.0, 98.0))

        # Adjust with peer percentile
        if p_stats.cost_percentile >= 95.0 and ml_score < 70.0:
            ml_score = max(ml_score, 70.0)

        meta = {
            "is_anomaly": is_anomaly,
            "raw_decision_score": round(raw_score, 4),
            "features": dict(zip(self.feature_names, [round(f, 2) for f in feats])),
            "peer_stats": p_stats.model_dump()
        }

        return is_anomaly, round(ml_score, 1), meta
