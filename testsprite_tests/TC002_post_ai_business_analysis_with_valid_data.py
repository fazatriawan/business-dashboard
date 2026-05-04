import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_post_ai_business_analysis_with_valid_data():
    url = f"{BASE_URL}/api/analyze"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "bulan": "Mei 2026",
        "summary": {
            "overview": "Marketing and CS summary",
            "details": {
                "leads": 1500,
                "conversions": 230,
                "customerSatisfaction": 87
            }
        },
        "rawData": [
            {"date": "2026-05-01", "metric": "leads", "value": 50},
            {"date": "2026-05-02", "metric": "leads", "value": 70}
        ],
        "csData": [
            {"agent": "CS1", "tickets": 100, "resolved": 95},
            {"agent": "CS2", "tickets": 80, "resolved": 75}
        ],
        "advData": [
            {"campaign": "Campaign A", "impressions": 10000, "clicks": 500},
            {"campaign": "Campaign B", "impressions": 15000, "clicks": 700}
        ],
        "advSpend": [
            {"campaign": "Campaign A", "spend": 1000000},
            {"campaign": "Campaign B", "spend": 1500000}
        ],
        "kpiBenchmarks": [
            {"kpi": "roas", "benchmark": 3.0},
            {"kpi": "conversionRate", "benchmark": 0.05}
        ],
        "csDaily": [
            {"date": "2026-05-01", "satisfaction": 85},
            {"date": "2026-05-02", "satisfaction": 89}
        ],
        "dashboardCS": [
            {"category": "support", "score": 80},
            {"category": "sales", "score": 90}
        ],
        "growth": [
            {"month": "2026-04", "growthRate": 0.02},
            {"month": "2026-05", "growthRate": 0.03}
        ],
        "errorReport": "Tidak ada"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    
    # According to instructions, if all providers are exhausted, status code is 503
    if response.status_code == 503:
        # All providers failed, test should acknowledge this outcome as per updated fallback logic
        # Assert response contains info about providers failed (not specified in detail, just check JSON)
        try:
            json_resp = response.json()
        except Exception:
            assert False, "Response with status 503 did not return valid JSON"
        assert isinstance(json_resp, dict)
        assert "error" in json_resp or "message" in json_resp
        return

    # For success, expect 200
    assert response.status_code == 200, f"Expected 200 or 503 but got {response.status_code}"
    
    try:
        json_resp = response.json()
    except Exception:
        assert False, "Response did not return valid JSON"

    # Validate response structure
    assert "quick" in json_resp, "Response missing 'quick' key"
    assert "analysis" in json_resp, "Response missing 'analysis' key"
    assert "provider" in json_resp, "Response missing 'provider' key"

    # quick should be object or null
    quick = json_resp["quick"]
    assert quick is None or isinstance(quick, dict), "'quick' should be object or null"

    # analysis should be string or null
    analysis = json_resp["analysis"]
    assert analysis is None or isinstance(analysis, str), "'analysis' should be string or null"

    # provider should be string and non-empty
    provider = json_resp["provider"]
    assert isinstance(provider, str) and provider, "'provider' should be a non-empty string"

test_post_ai_business_analysis_with_valid_data()