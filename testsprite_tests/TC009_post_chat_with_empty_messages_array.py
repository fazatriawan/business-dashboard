import requests

BASE_URL = "http://localhost:3001"

def test_post_chat_with_empty_messages_array():
    url = f"{BASE_URL}/api/chat"
    headers = {"Content-Type": "application/json"}
    payload = {
        "messages": [],
        "task": "chat"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 400, f"Expected status code 400, got {response.status_code}"
    try:
        resp_json = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"
    assert "error" in resp_json, "Response JSON does not contain 'error' key"
    assert resp_json["error"] == "messages array is required", f"Expected error message 'messages array is required', got '{resp_json['error']}'"

test_post_chat_with_empty_messages_array()