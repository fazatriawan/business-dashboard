import requests

def test_delete_bookmark_without_id():
    url = "http://localhost:3001/api/db/bookmarks"
    try:
        response = requests.delete(url, timeout=30)
        assert response.status_code == 400, f"Expected status 400, got {response.status_code}"
        json_resp = response.json()
        assert "error" in json_resp, "Response JSON must contain 'error' key"
        assert json_resp["error"] == "ID required", f"Expected error message 'ID required', got '{json_resp['error']}'"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_delete_bookmark_without_id()