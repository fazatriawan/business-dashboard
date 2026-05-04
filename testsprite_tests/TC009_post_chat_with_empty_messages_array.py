import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_post_chat_with_empty_messages_array():
    url = f"{BASE_URL}/api/chat"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "messages": [],
        "task": "chat"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 400, f"Expected status 400 but got {response.status_code}"
    try:
        resp_json = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"

    assert "error" in resp_json, "Response JSON does not contain 'error' key"
    assert resp_json["error"] == "messages array is required", f"Unexpected error message: {resp_json['error']}"

test_post_chat_with_empty_messages_array()