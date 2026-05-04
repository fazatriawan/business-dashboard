import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_get_google_sheet_proxy_without_url():
    url = f"{BASE_URL}/api/sheet"
    try:
        response = requests.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 400, f"Expected status code 400, got {response.status_code}"
    try:
        json_resp = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"
    assert "error" in json_resp, "Response JSON missing 'error' key"
    assert json_resp["error"] == "URL diperlukan", f"Expected error message 'URL diperlukan', got {json_resp['error']}"

test_get_google_sheet_proxy_without_url()