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

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}