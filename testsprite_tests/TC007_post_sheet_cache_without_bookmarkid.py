import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_post_sheet_cache_without_bookmarkid():
    url = f"{BASE_URL}/api/db/cache"
    # Missing bookmarkId in the body intentionally to trigger 400 error
    payload = {
        "sheetName": "Data Ads",
        "sheetType": "ads",
        "data": [ { "Tanggal": "01/05/2026", "Lead": "50" } ]
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 400, f"Expected status code 400, got {response.status_code}"
    try:
        json_resp = response.json()
    except Exception:
        json_resp = None

    # The error may vary, so just check that error key exists and message indicates invalid request body
    assert json_resp is not None, "Response is not a valid JSON"
    assert "error" in json_resp or "message" in json_resp, "Response JSON missing error message"
    error_message = json_resp.get("error") or json_resp.get("message")
    assert error_message and ("invalid" in error_message.lower() or "bookmarkid" in error_message.lower()), \
        f"Unexpected error message: {error_message}"

test_post_sheet_cache_without_bookmarkid()