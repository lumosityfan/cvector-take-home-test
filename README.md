**CVector Take Home Test for Jeff Xie**

The CVector Take Home Test for Jeff Xie was to build an industrial dashboard showing various metrics of facilities and assets. This README file will show the instructions for building and setup of the software.

First, activate the virtual environment.

source .venv/bin/activate

Download FastAPI:

pip install "fastapi[standard]"

Activate the FastAPI server:

fastapi dev app.py

You can test out the API for yourself in the browser through the Swagger UI site at

127.0.0.1:8000/docs

There are 8 API endpoints

GET /
GET /v1/facilities
GET /v1/facilities/{facility_id}
GET /v1/facilities/{facility_id}/assets
GET /v1/facilities/{facility_id}/assets/{asset_id}
GET /v1/sensors/{sensor_id}/readings
GET /v1/sensors
GET /v1/facilities/{facility_id}/status

used to generate the website and the various data necessary to run the dashboard.