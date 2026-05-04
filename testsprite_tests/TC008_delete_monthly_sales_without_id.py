import requests

def test_delete_monthly_sales_without_id():
    base_url = "http://localhost:3001"
    url = f"{base_url}/api/db/monthly-sales"
    try:
        response = requests.delete(url, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 400, f"Expected status code 400 but got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not in JSON format"

    assert "error" in data, "Response JSON does not contain 'error' key"
    assert data["error"].lower() == "id required", f"Expected error message 'ID required' but got {data['error']}"

test_delete_monthly_sales_without_id()