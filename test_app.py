from fastapi.testclient import TestClient
from datetime import datetime, timezone
from app import app, get_session

client = TestClient(app)

def test_get_facilities():
    response = client.get("/v1/facilities")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_and_get_facility():
    response = client.post("/v1/facilities", json={"facility_name": "Test Facility"})
    assert response.status_code == 200
    facility = response.json()
    assert facility["facility_name"] == "Test Facility"

    response = client.get(f"/v1/facilities/{facility['facility_id']}")
    assert response.status_code == 200
    assert response.json() == facility

def test_create_and_get_asset():
    response = client.post("/v1/facilities", json={"facility_name": "Asset Test Facility"})
    assert response.status_code == 200
    facility = response.json()

    response = client.post("/v1/assets", json={"asset_name": "Test Asset", "facility_id": facility["facility_id"]})
    assert response.status_code == 200
    asset = response.json()
    assert asset["asset_name"] == "Test Asset"
    assert asset["facility_id"] == facility["facility_id"]

    response = client.get(f"/v1/facilities/{facility['facility_id']}/assets/{asset['asset_id']}")
    assert response.status_code == 200
    assert response.json() == asset

def test_create_and_get_sensor_reading():
    response = client.post("/v1/facilities", json={"facility_name": "Sensor Test Facility"})
    assert response.status_code == 200
    facility = response.json()

    response = client.post("/v1/assets", json={"asset_name": "Sensor Test Asset", "facility_id": facility["facility_id"]})
    assert response.status_code == 200
    asset = response.json()

    response = client.post("/v1/sensors", json={
        "sensor_name": "Test Sensor",
        "asset_id": asset["asset_id"],
        "facility_id": facility["facility_id"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "temperature": 25.5,
        "pressure": 101.3,
        "power_consumption": 500.0,
        "production_output": 120.0
    })
    assert response.status_code == 200
    sensor_reading = response.json()
    assert sensor_reading["asset_id"] == asset["asset_id"]
    assert sensor_reading["facility_id"] == facility["facility_id"]
    assert sensor_reading["temperature"] == 25.5
    assert sensor_reading["pressure"] == 101.3