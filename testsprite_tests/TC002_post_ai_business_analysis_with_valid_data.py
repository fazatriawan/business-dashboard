import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_post_ai_business_analysis_with_valid_data():
    url = f"{BASE_URL}/api/analyze"
    payload = {
        "bulan": "Mei 2026",
        "summary": {
            "totalRevenue": 1000000000,
            "totalOrders": 1500,
            "totalAdSpend": 250000000,
            "roas": 4.0,
            "notes": "Summary notes example"
        },
        "rawData": [{"id": 1, "metric": "sales", "value": 50000}],
        "csData": [{"csPerson": "CS1", "ticketsHandled": 30}],
        "advData": [{"campaign": "Campaign A", "clicks": 200}],
        "advSpend": [{"campaign": "Campaign A", "spend": 100000}],
        "kpiBenchmarks": [{"kpi": "roas", "benchmark": 3.5}],
        "csDaily": [{"date": "2026-05-01", "tickets": 5}],
        "dashboardCS": [{"totalTickets": 150}],
        "growth": [{"month": "April 2026", "growthPercent": 5}],
        "errorReport": "Tidak ada"
    }
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        json_resp = response.json()
        assert "quick" in json_resp, "'quick' field missing in response"
        assert json_resp["quick"] is not None and isinstance(json_resp["quick"], dict), "'quick' should be a non-null object"
        assert "provider" in json_resp, "'provider' field missing in response"
        assert isinstance(json_resp["provider"], str) and json_resp["provider"], "'provider' should be a non-empty string"
        # analysis may be null or string - no explicit assertion since test case expects quick analysis object mainly
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_ai_business_analysis_with_valid_data()