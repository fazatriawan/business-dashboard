import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_post_ai_business_analysis_with_valid_data():
    url = f"{BASE_URL}/api/analyze"
    payload = {
        "bulan": "Mei 2026",
        "summary": {
            "totalRevenue": 1000000,
            "newCustomers": 150,
            "churnRate": 0.05
        },
        "rawData": [
            {"date": "2026-05-01", "revenue": 20000, "orders": 25},
            {"date": "2026-05-02", "revenue": 25000, "orders": 30}
        ],
        "csData": [
            {"csRep": "CS1", "tickets": 10},
            {"csRep": "CS2", "tickets": 15}
        ],
        "advData": [
            {"campaign": "Campaign A", "impressions": 100000},
            {"campaign": "Campaign B", "impressions": 150000}
        ],
        "advSpend": [
            {"campaign": "Campaign A", "amount": 5000},
            {"campaign": "Campaign B", "amount": 7000}
        ],
        "kpiBenchmarks": [
            {"kpi": "roas", "benchmark": 3.0},
            {"kpi": "ctr", "benchmark": 0.05}
        ],
        "csDaily": [
            {"date": "2026-05-01", "resolvedTickets": 8},
            {"date": "2026-05-02", "resolvedTickets": 9}
        ],
        "dashboardCS": [
            {"metric": "satisfaction", "value": 4.5},
            {"metric": "responseTime", "value": 2.3}
        ],
        "growth": [
            {"month": "April", "revenueGrowth": 0.1},
            {"month": "May", "revenueGrowth": 0.15}
        ],
        "errorReport": "Tidak ada"
    }
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"

    try:
        json_data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate expected keys and types in response JSON
    assert "quick" in json_data, "'quick' key missing in response"
    assert "provider" in json_data, "'provider' key missing in response"
    # quick should be an object (dict) and not None
    assert json_data["quick"] is not None and isinstance(json_data["quick"], dict), "'quick' should be a non-null object"
    # analysis should be null in this success scenario
    assert json_data.get("analysis") is None, "'analysis' should be null"

    # provider should be a non-empty string
    assert isinstance(json_data["provider"], str) and json_data["provider"], "'provider' should be a non-empty string"

test_post_ai_business_analysis_with_valid_data()