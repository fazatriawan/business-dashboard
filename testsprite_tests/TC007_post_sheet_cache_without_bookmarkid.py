import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_post_sheet_cache_without_bookmarkid():
    url = f"{BASE_URL}/api/db/cache"
    headers = {
        "Content-Type": "application/json"
    }
    # Body missing required bookmarkId
    payload = {
        "sheetName": "Data Ads",
        "sheetType": "ads",
        "data": [ { "Tanggal": "01/05/2026", "Lead": "50" } ]
    }

    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)

    assert response.status_code == 400, f"Expected status code 400 but got {response.status_code}"
    try:
        error_json = response.json()
    except Exception:
        error_json = None

    assert error_json is not None, "Response body should be JSON"
    # The exact error message is not specified, so just confirm presence of error key or generic reason
    assert "error" in error_json or "message" in error_json, "Response JSON should contain an error message"

test_post_sheet_cache_without_bookmarkid()