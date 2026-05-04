import requests

def test_delete_bookmark_without_id():
    base_url = "http://localhost:3001"
    url = f"{base_url}/api/db/bookmarks"
    try:
        response = requests.delete(url, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 400, f"Expected status code 400, got {response.status_code}"
    try:
        json_resp = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"
    assert "error" in json_resp, "Response JSON does not contain 'error' key"
    assert json_resp["error"] == "ID required", f"Expected error 'ID required', got {json_resp['error']}"

test_delete_bookmark_without_id()