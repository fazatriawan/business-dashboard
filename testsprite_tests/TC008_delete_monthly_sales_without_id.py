import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_delete_monthly_sales_without_id():
    url = f"{BASE_URL}/api/db/monthly-sales"
    try:
        response = requests.delete(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 400, f"Expected status code 400 but got {response.status_code}"
    try:
        json_resp = response.json()
    except ValueError:
        assert False, "Response is not in JSON format"

    assert "error" in json_resp, "Response JSON should contain 'error' key"
    assert json_resp["error"] == "ID required", f"Expected error message 'ID required' but got '{json_resp['error']}'"

test_delete_monthly_sales_without_id()