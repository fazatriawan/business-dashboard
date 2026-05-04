import requests
from io import BytesIO

def test_post_retur_csv_upload_with_invalid_file():
    base_url = "http://localhost:3001"
    url = f"{base_url}/api/db/retur/upload"
    headers = {}
    # Prepare invalid CSV content (empty file)
    files = {
        "file": ("invalid.csv", BytesIO(b""), "text/csv")
    }
    try:
        response = requests.post(url, files=files, headers=headers, timeout=30)
        # Expect HTTP 400 Bad Request for invalid/empty CSV upload
        assert response.status_code == 400, f"Expected status 400, got {response.status_code}"
        content_type = response.headers.get("Content-Type", "")
        # Response body may be JSON with error message or plain text
        try:
            json_body = response.json()
            # Check error message present in JSON
            error_msg = json_body.get("error") or json_body.get("message") or ""
            assert "CSV kosong atau tidak valid" in error_msg, f"Expected error message about invalid or empty CSV, got: {error_msg}"
        except Exception:
            # Fallback to text check if not JSON
            assert "CSV kosong atau tidak valid" in response.text, f"Expected error message in response text, got: {response.text}"
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

test_post_retur_csv_upload_with_invalid_file()
