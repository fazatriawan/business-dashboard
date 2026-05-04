import requests

def test_post_retur_csv_upload_with_invalid_file():
    url = "http://localhost:3001/api/db/retur/upload"
    headers = {
        # No auth required and no specific headers described; requests will handle multipart/form-data automatically.
    }

    # Prepare an invalid CSV content: either empty file or invalid file
    # Here, using an empty file to represent empty CSV
    files = {
        "file": ("invalid.csv", "", "text/csv")
    }

    try:
        response = requests.post(url, files=files, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

    # Assert status code 400
    assert response.status_code == 400, f"Expected status code 400 but got {response.status_code}"

    # The response should contain 'CSV kosong atau tidak valid' error message in the response body
    resp_text = response.text if response.text else ""
    assert "CSV kosong atau tidak valid" in resp_text, f"Expected error message 'CSV kosong atau tidak valid' in response but got: {resp_text}"

test_post_retur_csv_upload_with_invalid_file()