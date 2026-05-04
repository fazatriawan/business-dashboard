import requests

def test_post_entity_drill_down_with_missing_entityname():
    base_url = "http://localhost:3001"
    url = f"{base_url}/api/drill-down"
    # entityName is missing intentionally
    payload = {
        "entityType": "adv",
        "availableSheets": ["ads", "spend", "orders"]
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 400, f"Expected status 400, got {response.status_code}"
    try:
        error_data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert "error" in error_data, "Response JSON missing 'error' key"
    assert error_data["error"] == "entityType, entityName, and availableSheets required", f"Unexpected error message: {error_data['error']}"

test_post_entity_drill_down_with_missing_entityname()