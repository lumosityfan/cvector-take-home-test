from sqlmodel import Session
from app import engine, create_db_and_tables, Facility, Asset

def seed():
    create_db_and_tables()

    with Session(engine) as session:
        # Create facilities
        facility1 = Facility(facility_name="Plant A")
        facility2 = Facility(facility_name="Plant B")
        session.add_all([facility1, facility2])
        session.commit()
        session.refresh(facility1)
        session.refresh(facility2)

        # Create assets for each facility
        assets = [
            Asset(asset_name="Boiler 1", facility_id=facility1.facility_id),
            Asset(asset_name="Turbine 1", facility_id=facility1.facility_id),
            Asset(asset_name="Boiler 1", facility_id=facility2.facility_id),
            Asset(asset_name="Turbine 1", facility_id=facility2.facility_id),
        ]
        session.add_all(assets)
        session.commit()
        print("Database seeded successfully.")

if __name__ == "__main__":
    seed()