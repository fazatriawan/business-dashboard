import requests

def test_post_semantic_sheet_mapper_with_missing_sheetname():
    url = "http://localhost:3001/api/semantic-map"
    headers = {
        "Content-Type": "application/json"
    }
    # Missing 'sheetName' and headers empty to trigger 400 error
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
        json_response = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"
    assert "error" in json_response, "Response JSON missing 'error' key"
    assert json_response["error"] == "sheetName and headers required", f"Expected error message 'sheetName and headers required', got '{json_response['error']}'"

test_post_semantic_sheet_mapper_with_missing_sheetname()