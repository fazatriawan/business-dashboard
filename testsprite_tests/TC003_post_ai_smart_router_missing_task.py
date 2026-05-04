import requests

def test_post_ai_smart_router_missing_task():
    url = "http://localhost:3001/api/router"
    headers = {
        "Content-Type": "application/json"
    }
    # Missing 'task' field, only 'payload' is sent
    payload = {
        "payload": {"text": "Example text"}
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 400, f"Expected status code 400, got {response.status_code}"
    try:
        json_resp = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    expected_error = "task and payload are required"
    assert "error" in json_resp, "Response JSON does not contain 'error' key"
    assert json_resp["error"] == expected_error, f"Expected error message '{expected_error}', got '{json_resp['error']}'"

test_post_ai_smart_router_missing_task()