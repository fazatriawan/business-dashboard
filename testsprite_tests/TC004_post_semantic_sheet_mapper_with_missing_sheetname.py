import requests

def test_post_semantic_sheet_mapper_with_missing_sheetname():
    base_url = "http://localhost:3001"
    url = f"{base_url}/api/semantic-map"
    headers = {
        "Content-Type": "application/json"
    }
    # Prepare payload missing sheetName and with empty headers and sampleRows
    payload = {
        "headers": [],
        "sampleRows": []
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 400, f"Expected status code 400, got {response.status_code}"
    try:
        error_response = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"

    assert "error" in error_response, "Error key missing in response JSON"
    assert error_response["error"] == "sheetName and headers required", f"Unexpected error message: {error_response['error']}"

test_post_semantic_sheet_mapper_with_missing_sheetname()