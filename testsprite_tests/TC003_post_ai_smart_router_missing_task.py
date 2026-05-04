import requests

BASE_URL = "http://localhost:3001"


def test_post_ai_smart_router_missing_task():
    url = f"{BASE_URL}/api/router"
    headers = {"Content-Type": "application/json"}
    # Payload missing 'task' field but includes 'payload'
    payload = {
        "payload": {"text": "Sample text for AI processing"}
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 400, f"Expected status code 400 but got {response.status_code}"
    try:
        json_response = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert "error" in json_response, "Response JSON does not contain 'error' key"
    assert json_response["error"] == "task and payload are required", \
        f"Expected error message 'task and payload are required' but got '{json_response['error']}'"


test_post_ai_smart_router_missing_task()