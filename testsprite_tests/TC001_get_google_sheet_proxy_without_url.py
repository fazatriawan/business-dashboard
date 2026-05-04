import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_get_google_sheet_proxy_without_url():
    url = f"{BASE_URL}/api/sheet"
    try:
        response = requests.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

    assert response.status_code == 400, f"Expected status code 400 but got {response.status_code}"
    try:
        json_resp = response.json()
    except ValueError:
        assert False, "Response is not JSON as expected for error message"

    assert "error" in json_resp, "Error message key 'error' not found in response"
    assert json_resp["error"] == "URL diperlukan", f"Expected error message 'URL diperlukan' but got '{json_resp['error']}'"

test_get_google_sheet_proxy_without_url()