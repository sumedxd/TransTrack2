import pytest
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "TransTrack" in data["system"]

def test_works_summary_endpoint():
    response = client.get("/api/works/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_works" in data
    assert data["total_works"] >= 200
    assert "risk_distribution" in data
    assert "status_distribution" in data

def test_works_list_and_filters():
    response = client.get("/api/works?limit=10&page=1")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 10
    assert data["total"] >= 200

    # Test filtering by status
    comp_resp = client.get("/api/works?status=Completed&limit=5")
    assert comp_resp.status_code == 200
    comp_data = comp_resp.json()
    for item in comp_data["items"]:
        assert item["work_status"] == "Completed"

def test_investigate_work_endpoint():
    # First get any work ID from the list
    works_resp = client.get("/api/works?limit=1")
    work_id = works_resp.json()["items"][0]["work_id"]

    inv_resp = client.get(f"/api/investigate/{work_id}")
    assert inv_resp.status_code == 200
    data = inv_resp.json()
    assert "report" in data
    assert "evidence_package" in data
    assert "agent_responses" in data
    assert "why_flagged" in data
    assert data["report"]["risk_score"] >= 0.0

def test_config_endpoint():
    cfg_resp = client.get("/api/config")
    assert cfg_resp.status_code == 200
    cfg = cfg_resp.json()
    assert "weight_financial" in cfg
    assert "threshold_high" in cfg
