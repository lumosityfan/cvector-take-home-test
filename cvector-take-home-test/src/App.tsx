import { useState, useEffect } from 'react'
import './App.css'

interface Facility {
  facility_id: number
  facility_name: string
}

interface Asset {
  asset_id: number
  asset_name: string
  facility_id: number
}

interface SensorReading {
  sensor_id: number
  sensor_name: string
  asset_id: number
  facility_id: number
  timestamp: string
  temperature: number
  pressure: number
  power_consumption: number
  production_output: number
}

function App() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([])
  const [selectedFacility, setSelectedFacility] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = 'http://localhost:8000/v1'

  const fetchFacilities = async (): Promise<Facility[]> => {
    const response = await fetch(`${API_BASE_URL}/facilities`)
    if (!response.ok) throw new Error('Failed to fetch facilities')
    return response.json()
  }

  const fetchAssets = async (facilityId: number): Promise<Asset[]> => {
    const response = await fetch(`${API_BASE_URL}/facilities/${facilityId}/assets`)
    if (!response.ok) throw new Error('Failed to fetch assets')
    return response.json()
  }

  const fetchSensorReadings = async (): Promise<SensorReading[]> => {
    const response = await fetch(`${API_BASE_URL}/sensor_readings`)
    if (!response.ok) throw new Error('Failed to fetch sensor readings')
    return response.json()
  }

  // Fetch facilities on page load
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchFacilities()
        setFacilities(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Fetch assets + sensor readings when a facility is selected
  useEffect(() => {
    if (selectedFacility === null) return
    const load = async () => {
      setLoading(true)
      try {
        const [assetData, sensorData] = await Promise.all([
          fetchAssets(selectedFacility),
          fetchSensorReadings(),
        ])
        setAssets(assetData)
        setSensorReadings(sensorData)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedFacility])

  return (
    <>
      <h1>Manufacturing Facility Dashboard</h1>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <section>
        <h2>Facilities</h2>
        {facilities.length === 0 && !loading ? (
          <p>No facilities found.</p>
        ) : (
          <ul>
            {facilities.map(facility => (
              <li key={facility.facility_id}>
                <button onClick={() => setSelectedFacility(facility.facility_id)}>
                  {facility.facility_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selectedFacility && (
        <>
          <section>
            <h2>Assets for Facility {selectedFacility}</h2>
            {assets.length === 0 ? (
              <p>No assets found.</p>
            ) : (
              <ul>
                {assets.map(asset => (
                  <li key={asset.asset_id}>{asset.asset_name}</li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2>Sensor Readings</h2>
            {sensorReadings.length === 0 ? (
              <p>No sensor readings found.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Sensor</th>
                    <th>Timestamp</th>
                    <th>Temperature</th>
                    <th>Pressure</th>
                    <th>Power</th>
                    <th>Output</th>
                  </tr>
                </thead>
                <tbody>
                  {sensorReadings.map(reading => (
                    <tr key={reading.sensor_id}>
                      <td>{reading.sensor_name}</td>
                      <td>{new Date(reading.timestamp).toLocaleString()}</td>
                      <td>{reading.temperature}</td>
                      <td>{reading.pressure}</td>
                      <td>{reading.power_consumption}</td>
                      <td>{reading.production_output}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </>
  )
}

export default App