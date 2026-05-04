import requests

def test_post_retur_csv_upload_with_invalid_file():
    url = "http://localhost:3001/api/db/retur/upload"
    # Prepare an invalid CSV file content (empty file)
    files = {
        'file': ('invalid.csv', '', 'text/csv')
    }
    try:
        response = requests.post(url, files=files, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 400, f"Expected status code 400, got {response.status_code}"
    # The error message is expected to include 'Invalid file or empty CSV' or localized equivalent
    try:
        data = response.json()
        error_msg = data.get('error') or str(data)
    except Exception:
        error_msg = response.text
    assert ('Invalid file or empty CSV' in error_msg) or ('CSV kosong atau tidak valid' in error_msg), \
        f"Expected error message 'Invalid file or empty CSV' or 'CSV kosong atau tidak valid' in response, got: {error_msg}"

test_post_retur_csv_upload_with_invalid_file()