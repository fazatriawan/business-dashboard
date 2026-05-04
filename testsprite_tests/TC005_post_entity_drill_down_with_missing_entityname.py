import requests

def test_post_entity_drill_down_with_missing_entityname():
    base_url = "http://localhost:3001"
    url = f"{base_url}/api/drill-down"
    headers = {
        "Content-Type": "application/json"
    }
    # Missing entityName field
    payload = {
        "entityType": "adv",
        # "entityName" is omitted intentionally to test validation
        "availableSheets": ["ads", "spend", "orders"]
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 400, f"Expected status code 400 but got {response.status_code}"
    try:
        json_resp = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    expected_error = "entityType, entityName, and availableSheets required"
    assert "error" in json_resp, "Response JSON does not contain 'error' key"
    assert json_resp["error"] == expected_error, f"Expected error message '{expected_error}', got '{json_resp['error']}'"

test_post_entity_drill_down_with_missing_entityname()