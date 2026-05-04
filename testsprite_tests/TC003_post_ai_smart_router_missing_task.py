import requests

BASE_URL = "http://localhost:3001"

def test_post_ai_smart_router_missing_task():
    url = f"{BASE_URL}/api/router"
    headers = {
        "Content-Type": "application/json"
    }
    # Body missing 'task' field intentionally
    payload = {
        "payload": {"text": "Some text"}
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

    assert "error" in json_resp, "Response JSON missing 'error' key"
    assert json_resp["error"] == "task and payload are required", (
        f"Expected error message 'task and payload are required', got '{json_resp['error']}'"
    )

test_post_ai_smart_router_missing_task()