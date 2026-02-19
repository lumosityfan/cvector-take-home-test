from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
app = FastAPI()

class Facility(BaseModel):
    facility_name: str
    facility_id: int

class Asset(BaseModel):
    asset_name: str
    asset_id: int
    facility_id: int

class SensorReading(BaseModel):
    sensor_name: str
    sensor_id: int
    asset_id: int
    facility_id: int
    timestamp: datetime
    temperature: float
    pressure: float
    power_consumption: float
    production_output: float

dummy_facilities = [
    Facility(facility_name="Factory A", facility_id=1),
    Facility(facility_name="Factory B", facility_id=2)
]

dummy_assets = [
    Asset(asset_name="Machine 1", asset_id=1, facility_id=1),
    Asset(asset_name="Machine 2", asset_id=2, facility_id=1),
    Asset(asset_name="Machine 3", asset_id=3, facility_id=2)
]

dummy_sensor_readings = [
    SensorReading(sensor_name="Sensor 1", sensor_id=1, asset_id=1, facility_id=1, timestamp=datetime.now(), temperature=75.0, pressure=1.0, power_consumption=100.0, production_output=50.0),
    SensorReading(sensor_name="Sensor 2", sensor_id=2, asset_id=2, facility_id=1, timestamp=datetime.now(), temperature=80.0, pressure=1.2, power_consumption=150.0, production_output=60.0),
    SensorReading(sensor_name="Sensor 3", sensor_id=3, asset_id=3, facility_id=2, timestamp=datetime.now(), temperature=70.0, pressure=0.8, power_consumption=120.0, production_output=55.0)
]

## Will update API endpoints once connection to database has been established. For now, these endpoints return dummy data for testing purposes.

@app.get("/")
def read_root():
    return {"message": "Welcome to the Manufacturing Facility API"}

@app.get("/v1/facilities")
def get_facilities():
    return dummy_facilities

@app.get("/v1/facilities/{facility_id}")
def get_facility(facility_id: int):
    for facility in dummy_facilities:
        if facility.facility_id == facility_id:
            return facility
    return {"error": "Facility not found"}

@app.get("/v1/facilities/{facility_id}/assets")
def get_facility_assets(facility_id: int):
    assets = [asset for asset in dummy_assets if asset.facility_id == facility_id]
    return assets

@app.get("/v1/facilities/{facility_id}/assets/{asset_id}")
def get_asset(facility_id: int, asset_id: int):
    for asset in dummy_assets:
        if asset.facility_id == facility_id and asset.asset_id == asset_id:
            return asset
    return {"error": "Asset not found"}

@app.get("/v1/sensors/{sensor_id}/readings")
def get_sensor_readings(sensor_id: int):
    readings = [reading for reading in dummy_sensor_readings if reading.sensor_id == sensor_id]
    return readings

@app.get("/v1/sensors")
def get_sensors():
    sensors = [{"sensor_id": reading.sensor_id, "sensor_name": reading.sensor_name} for reading in dummy_sensor_readings]
    return sensors

@app.get("/v1/facilities/{facility_id}/status")
def get_facility_status(facility_id: int):
    assets = [asset for asset in dummy_assets if asset.facility_id == facility_id]
    if not assets:
        return {"error": "Facility not found"}
    
    status = {
        "facility_id": facility_id,
        "assets": []
    }
    
    for asset in assets:
        asset_readings = [reading for reading in dummy_sensor_readings if reading.asset_id == asset.asset_id]
        asset_status = {
            "asset_id": asset.asset_id,
            "asset_name": asset.asset_name,
            "latest_reading": asset_readings[-1] if asset_readings else None
        }
        status["assets"].append(asset_status)
    
    return status
