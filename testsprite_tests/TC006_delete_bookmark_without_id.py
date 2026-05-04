import requests

BASE_URL = "http://localhost:3001"


def test_delete_bookmark_without_id():
    url = f"{BASE_URL}/api/db/bookmarks"
    try:
        response = requests.delete(url, timeout=30)
    except requests.RequestException as e:
        raise AssertionError(f"Request failed: {e}")

    assert response.status_code == 400, f"Expected status 400 but got {response.status_code}"
    try:
        json_response = response.json()
    except ValueError:
        raise AssertionError("Response is not valid JSON")

    assert "error" in json_response, "Response JSON does not contain 'error' field"
    assert json_response["error"].lower() == "id required", f"Expected error message 'ID required' but got '{json_response['error']}'"


test_delete_bookmark_without_id()