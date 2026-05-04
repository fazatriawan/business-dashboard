import requests

def test_post_chat_with_empty_messages_array():
    url = "http://localhost:3001/api/chat"
    headers = {"Content-Type": "application/json"}
    payload = {
        "messages": [],
        "task": "chat"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 400, f"Expected status code 400 but got {response.status_code}"
    try:
        error_response = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert "error" in error_response, f"Response JSON does not contain 'error' field: {error_response}"
    assert error_response["error"] == "messages array is required", f"Expected error message 'messages array is required' but got '{error_response['error']}'"

test_post_chat_with_empty_messages_array()