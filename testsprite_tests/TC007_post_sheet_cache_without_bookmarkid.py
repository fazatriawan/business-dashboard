import requests

BASE_URL = "http://localhost:3001"

def test_post_sheet_cache_without_bookmarkid():
    url = f"{BASE_URL}/api/db/cache"
    headers = {
        "Content-Type": "application/json"
    }
    # Missing 'bookmarkId' in the body per test case
    payload = {
        "sheetName": "Data Ads",
        "sheetType": "ads",
        "data": [ { "Tanggal": "01/05/2026", "Lead": "50" } ]
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 400, f"Expected status code 400, got {response.status_code}"
    try:
        json_resp = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"

    assert "error" in json_resp or "message" in json_resp, "Response JSON does not contain error or message field"
    error_message = json_resp.get("error") or json_resp.get("message") or ""
    expected_messages = [
        "invalid request body",
        "bookmarkid is required",
        "bookmarkId is required",
        "invalid request",
        "bookmarkId, sheetName, sheetType, dan data wajib diisi"
    ]
    assert any(msg.lower() == error_message.lower() for msg in expected_messages), \
        f"Unexpected error message: {error_message}"

test_post_sheet_cache_without_bookmarkid()
