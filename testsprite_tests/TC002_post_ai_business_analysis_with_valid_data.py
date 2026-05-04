import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_post_ai_business_analysis_with_valid_data():
    url = f"{BASE_URL}/api/analyze"
    payload = {
        "bulan": "Mei 2026",
        "summary": {
            "totalRevenue": 1000000,
            "totalOrders": 100,
            "totalAdSpend": 200000,
            "roas": 5.0
        },
        "rawData": [
            {"date": "2026-05-01", "revenue": 50000, "orders": 5},
            {"date": "2026-05-02", "revenue": 45000, "orders": 4}
        ],
        "csData": [
            {"date": "2026-05-01", "tickets": 10, "resolved": 8},
            {"date": "2026-05-02", "tickets": 12, "resolved": 10}
        ],
        "advData": [
            {"campaign": "Campaign A", "clicks": 1000, "conversions": 50},
            {"campaign": "Campaign B", "clicks": 800, "conversions": 30}
        ],
        "advSpend": [
            {"campaign": "Campaign A", "spend": 120000},
            {"campaign": "Campaign B", "spend": 80000}
        ],
        "kpiBenchmarks": [
            {"kpi": "roas", "benchmark": 4.0},
            {"kpi": "conversionRate", "benchmark": 0.05}
        ],
        "csDaily": [
            {"date": "2026-05-01", "csTickets": 10},
            {"date": "2026-05-02", "csTickets": 12}
        ],
        "dashboardCS": [
            {"metric": "csSatisfaction", "value": 90},
            {"metric": "csResponseTime", "value": 5}
        ],
        "growth": [
            {"month": "April 2026", "growthRate": 0.1},
            {"month": "May 2026", "growthRate": 0.15}
        ],
        "errorReport": "Tidak ada"
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    json_response = None
    try:
        json_response = response.json()
    except ValueError:
        assert False, "Response is not in JSON format"

    # Validate that 'quick' is present and is an object (not None)
    assert "quick" in json_response, "'quick' field missing in response"
    assert isinstance(json_response["quick"], (dict, type(None))) and json_response["quick"] is not None, "'quick' should be an object and not None"

    # Validate 'analysis' field is present and is either None or string (but for this test - expecting null)
    assert "analysis" in json_response, "'analysis' field missing in response"
    
    # Validate 'provider' field exists and is a non-empty string
    assert "provider" in json_response, "'provider' field missing in response"
    assert isinstance(json_response["provider"], str) and json_response["provider"], "'provider' should be a non-empty string"

test_post_ai_business_analysis_with_valid_data()