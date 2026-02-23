from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Field, Session, SQLModel, create_engine, select
from datetime import datetime
from typing import Annotated

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

class FacilityBase(SQLModel):
    facility_name: str = Field(index=True, unique=True)

class Facility(FacilityBase, table=True):
    facility_id: int | None = Field(default=None, primary_key=True)

class AssetBase(SQLModel):
    asset_name: str = Field(index=True)
    facility_id: int | None = Field(default=None, foreign_key="facility.facility_id")

class Asset(AssetBase, table=True):
    asset_id: int | None = Field(default=None, primary_key=True)

class SensorReadingBase(SQLModel):
    sensor_name: str = Field(index=True)
    asset_id: int | None = Field(default=None, foreign_key="asset.asset_id")
    facility_id: int | None = Field(default=None, foreign_key="facility.facility_id")
    timestamp: datetime
    temperature: float
    pressure: float
    power_consumption: float
    production_output: float

class SensorReading(SensorReadingBase, table=True):
    sensor_id: int | None = Field(default=None, primary_key=True)

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.post("/v1/facilities", response_model=Facility)
def create_facility(facility: FacilityBase, session: SessionDep):
    db_hero = Facility.model_validate(facility)
    if session.exec(select(Facility).where(Facility.facility_name == facility.facility_name)).first():
        raise HTTPException(status_code=400, detail="Facility already exists")
    session.add(db_hero)
    session.commit()
    session.refresh(db_hero)
    return db_hero

@app.post("/v1/assets", response_model=Asset)
def create_asset(asset: AssetBase, session: SessionDep):
    db_asset = Asset.model_validate(asset)
    if not session.get(Facility, asset.facility_id):
        raise HTTPException(status_code=400, detail="Facility not found")
    session.add(db_asset)
    session.commit()
    session.refresh(db_asset)
    return db_asset

@app.post("/v1/sensor_readings", response_model=SensorReading)
def create_sensor_reading(sensor_reading: SensorReadingBase, session: SessionDep):
    db_sensor_reading = SensorReading.model_validate(sensor_reading)
    if not session.get(Facility, sensor_reading.facility_id):
        raise HTTPException(status_code=400, detail="Facility not found")
    if not session.get(Asset, sensor_reading.asset_id):
        raise HTTPException(status_code=400, detail="Asset not found")
    session.add(db_sensor_reading)
    session.commit()
    session.refresh(db_sensor_reading)
    return db_sensor_reading

@app.get("/v1/facilities")
def get_facilities(session: SessionDep):
    return session.exec(select(Facility)).all()

@app.get("/v1/facilities/{facility_id}")
def get_facility(facility_id: int, session: SessionDep):
    facility = session.get(Facility, facility_id)
    if not facility:
        return {"error": "Facility not found"}
    return facility

@app.get("/v1/facilities/{facility_id}/assets")
def get_facility_assets(facility_id: int, session: SessionDep):
    assets = session.exec(select(Asset).where(Asset.facility_id == facility_id)).all()
    return assets

@app.get("/v1/facilities/{facility_id}/assets/{asset_id}")
def get_facility_asset(facility_id: int, asset_id: int, session: SessionDep):
    asset = session.get(Asset, asset_id)
    if not asset or asset.facility_id != facility_id:
        return {"error": "Asset not found"}
    return asset

@app.get("/v1/assets")
def get_assets(session: SessionDep):
    return session.exec(select(Asset)).all()

@app.get("/v1/sensors/{sensor_id}/readings")
def get_sensor_readings(sensor_id: int, session: SessionDep):
    readings = session.exec(select(SensorReading).where(SensorReading.sensor_id == sensor_id)).all()
    return readings


@app.get("/v1/sensors")
def get_sensors(
    session: SessionDep,
    facility_id: int | None = Query(default=None),
    asset_id: int | None = Query(default=None),
    start_time: datetime | None = Query(default=None),
    end_time: datetime | None = Query(default=None),
):
    query = select(SensorReading)

    if facility_id is not None:
        query = query.where(SensorReading.facility_id == facility_id)
    if asset_id is not None:
        query = query.where(SensorReading.asset_id == asset_id)
    if start_time is not None:
        query = query.where(SensorReading.timestamp >= start_time)
    if end_time is not None:
        query = query.where(SensorReading.timestamp <= end_time)

    return session.exec(query).all()

@app.get("/v1/facilities/{facility_id}/status")
def get_facility_status(facility_id: int, session: SessionDep):
    sensor_readings = session.exec(select(SensorReading).where(SensorReading.facility_id == facility_id)).all()
    if not sensor_readings:
        return {"error": "Facility readings not found"}
    sensor_readings.sort(key=lambda r: r.timestamp, reverse=True)
    
    status = {
        "facility_id": facility_id,
        "latest_reading_time": sensor_readings[0].timestamp,
        "latest_temperature": sensor_readings[0].temperature,
        "latest_pressure": sensor_readings[0].pressure,
        "total_power_consumption": sum(reading.power_consumption for reading in sensor_readings),
        "total_production_output": sum(reading.production_output for reading in sensor_readings),
    }

    return status
