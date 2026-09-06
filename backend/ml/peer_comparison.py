import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from backend.models.schemas import PeerStats

class PeerComparisonEngine:
    def __init__(self, all_works: List[Dict[str, Any]]):
        self.df = pd.DataFrame(all_works) if all_works else pd.DataFrame()
        self._prepare_features()

    def _prepare_features(self):
        if self.df.empty:
            return

        # Ensure numeric fields
        self.df["sanctioned_amount"] = pd.to_numeric(self.df["sanctioned_amount"], errors="coerce").fillna(0.0)
        self.df["expenditure"] = pd.to_numeric(self.df["expenditure"], errors="coerce").fillna(0.0)
        
        # Calculate duration for completed works
        durations = []
        for _, row in self.df.iterrows():
            s_date = str(row.get("sanction_date", "")).strip()
            c_date = str(row.get("completion_date", "")).strip()
            if s_date and c_date and s_date != "None" and c_date != "None":
                try:
                    d1 = pd.to_datetime(s_date)
                    d2 = pd.to_datetime(c_date)
                    delta = (d2 - d1).days
                    durations.append(max(0, delta))
                except Exception:
                    durations.append(np.nan)
            else:
                durations.append(np.nan)
        self.df["duration_days"] = durations

    def get_peer_group(self, work: Dict[str, Any]) -> Tuple[pd.DataFrame, str]:
        if self.df.empty:
            return pd.DataFrame(), "Global"

        w_type = work.get("work_type", "")
        district = work.get("district", "")
        state = work.get("state", "")

        # 1. Try (work_type, district)
        subset = self.df[(self.df["work_type"] == w_type) & (self.df["district"] == district)]
        if len(subset) >= 4:
            return subset, f"{w_type} in {district} District"

        # 2. Try (work_type, state)
        subset = self.df[(self.df["work_type"] == w_type) & (self.df["state"] == state)]
        if len(subset) >= 4:
            return subset, f"{w_type} in {state} State"

        # 3. Try (work_type)
        subset = self.df[self.df["work_type"] == w_type]
        if len(subset) >= 3:
            return subset, f"{w_type} (State-wide / All Districts)"

        # 4. Fallback to all works
        return self.df, "All MPLADS Works"

    def compute_peer_stats(self, work: Dict[str, Any]) -> PeerStats:
        peers_df, group_name = self.get_peer_group(work)
        costs = peers_df["sanctioned_amount"].dropna().values

        work_cost = float(work.get("sanctioned_amount", 0.0))
        if len(costs) == 0:
            return PeerStats(
                peer_group_name=group_name,
                peer_count=0,
                median_cost=work_cost,
                mean_cost=work_cost,
                p25_cost=work_cost,
                p75_cost=work_cost,
                p90_cost=work_cost,
                median_duration=None,
                cost_deviation_pct=0.0,
                cost_z_score=0.0,
                cost_percentile=50.0
            )

        median_cost = float(np.median(costs))
        mean_cost = float(np.mean(costs))
        std_cost = float(np.std(costs)) if len(costs) > 1 else 0.0
        p25_cost = float(np.percentile(costs, 25))
        p75_cost = float(np.percentile(costs, 75))
        p90_cost = float(np.percentile(costs, 90))

        # Completed duration
        valid_durations = peers_df["duration_days"].dropna().values
        median_dur = float(np.median(valid_durations)) if len(valid_durations) > 0 else None

        # Metrics for this work
        dev_pct = ((work_cost - median_cost) / median_cost * 100.0) if median_cost > 0 else 0.0
        z_score = ((work_cost - mean_cost) / std_cost) if std_cost > 0 else 0.0
        percentile = float(np.sum(costs <= work_cost) / len(costs) * 100.0)

        return PeerStats(
            peer_group_name=group_name,
            peer_count=len(costs),
            median_cost=round(median_cost, 2),
            mean_cost=round(mean_cost, 2),
            p25_cost=round(p25_cost, 2),
            p75_cost=round(p75_cost, 2),
            p90_cost=round(p90_cost, 2),
            median_duration=round(median_dur, 1) if median_dur is not None else None,
            cost_deviation_pct=round(dev_pct, 1),
            cost_z_score=round(z_score, 2),
            cost_percentile=round(percentile, 1)
        )
