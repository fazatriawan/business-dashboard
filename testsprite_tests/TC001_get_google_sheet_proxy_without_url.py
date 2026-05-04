import requests

def test_get_google_sheet_proxy_without_url():
    base_url = "http://localhost:3001"
    url = f"{base_url}/api/sheet"
    try:
        response = requests.get(url, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 400, f"Expected status code 400, got {response.status_code}"
    try:
        json_resp = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"
    assert "error" in json_resp, "'error' key not found in response JSON"
    assert json_resp["error"] == "URL diperlukan", f"Expected error message 'URL diperlukan', got '{json_resp['error']}'"

test_get_google_sheet_proxy_without_url()