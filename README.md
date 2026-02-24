**CVector Take Home Test for Jeff Xie**

The CVector Take Home Test for Jeff Xie was to build an industrial dashboard showing various metrics of facilities and assets. This README file will show the instructions for building and setup of the software.

First, activate the virtual environment.

```
source .venv/bin/activate
```

Download FastAPI, Alembic, Uvicorn, and any other necessary dependencies:

```
pip install "fastapi[standard]" alembic uvicorn sqlalchemy sqlmodel aiosqlite
```

Initialize alembic through:

```
alembic init
```

Create an alembic revision through:

```
alembic revision -m "initial"
```

Initialize the database and schema through the init_db.py file:

```
python init_db.py
```

Activate the FastAPI server:

```
fastapi dev app.py
```

You can test out the API for yourself in the browser through the Swagger UI site at

127.0.0.1:8000/docs

There are 10 API endpoints

```
POST /v1/facilities # create_facility
POST /v1/assets # create_asset
POST /v1/sensors # create_sensor_reading
GET /v1/facilities # get_facilities
GET /v1/facilities/{facility_id} # get_facility
GET /v1/facilities/{facility_id}/assets # get_facility_assets
GET /v1/facilities/{facility_id}/assets/{asset_id} # get_facility_asset
GET /v1/sensors/{sensor_id}/reading # get_individual_sensor_reading
GET /v1/sensors # get_sensor_readings
GET /v1/facilities/{facility_id}/status # get_facility_status
```

used to generate the website and the various data necessary to run the dashboard.

In order to generate the website you need to go to the frontend folder titled "cvector-take-home-test" through

```
cd cvector-take-home-test
npm install antd
npm run dev
```

Both actions will allow the website to work properly.
