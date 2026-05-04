import requests

BASE_URL = "http://localhost:3001"


def test_post_entity_drill_down_with_missing_entityname():
    url = f"{BASE_URL}/api/drill-down"
    payload = {
        "entityType": "adv",
        # "entityName" is intentionally missing
        "availableSheets": ["ads", "spend", "orders"]
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        assert response.status_code == 400, f"Expected status 400 but got {response.status_code}"
        json_resp = response.json()
        expected_error = "entityType, entityName, and availableSheets required"
        assert "error" in json_resp, "Response JSON missing 'error' field"
        assert json_resp["error"] == expected_error, f"Expected error message '{expected_error}' but got '{json_resp['error']}'"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"


test_post_entity_drill_down_with_missing_entityname()