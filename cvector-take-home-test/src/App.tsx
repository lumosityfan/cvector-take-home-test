import { useState, useEffect } from 'react'
import './App.css'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

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

interface FacilityStatus {
  latest_reading_time: string
  latest_temperature: number
  latest_pressure: number
  total_power_consumption: number
  total_production_output: number
}

function App() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([])
  const [selectedFacility, setSelectedFacility] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facilityStatus, setFacilityStatus] = useState<FacilityStatus | null>(null)

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
    const response = await fetch(`${API_BASE_URL}/sensors?facility_id=${selectedFacility}`)
    if (!response.ok) throw new Error('Failed to fetch sensor readings')
    return response.json()
  }

  const fetchFacilityStatus = async (facilityId: number) => {
    const response = await fetch(`${API_BASE_URL}/facilities/${facilityId}/status`)
    if (!response.ok) throw new Error('Failed to fetch facility status')
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
        const [assetData, sensorData, facilityStatus] = await Promise.all([
          fetchAssets(selectedFacility),
          fetchSensorReadings(),
          fetchFacilityStatus(selectedFacility)
        ])
        setAssets(assetData)
        setSensorReadings(sensorData)
        setFacilityStatus(facilityStatus)
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
        <h2>Facility</h2>
        {facilities.length === 0 && !loading ? (
          <p>No facilities found.</p>
        ) : (
          <ul>
            {facilities.map(facility => (
              <table>
                <tr>
                  <th>
                    <button onClick={() => setSelectedFacility(facility.facility_id)}>
                      {facility.facility_name}
                    </button>
                  </th>
                  <td><p>Facility id: {facility.facility_id}</p></td>
                </tr>
              </table>
            ))}
          </ul>
        )}
      </section>

      {(selectedFacility !== null) && (
        <>
          <section>
            <h2>Facility Status for {facilities.find(f => f.facility_id === selectedFacility)?.facility_name}</h2>
            {facilityStatus ? (
              <table>
                <thead>
                  <tr>
                    <th>Latest Reading Time</th>
                    <th>Latest Temperature</th>
                    <th>Latest Pressure</th>
                    <th>Total Power Consumption</th>
                    <th>Total Production Output</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{new Date(facilityStatus.latest_reading_time).toLocaleString()}</td>
                    <td>{facilityStatus.latest_temperature}</td>
                    <td>{facilityStatus.latest_pressure}</td>
                    <td>{facilityStatus.total_power_consumption}</td>
                    <td>{facilityStatus.total_production_output}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p>No facility status data available.</p>
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
          <section>
            <h2>Sensor Readings Chart</h2>
            {sensorReadings.length > 0 && <SensorChart readings={sensorReadings} />}
          </section>
        </>
      )}
    </>
  )
}

function SensorChart({ readings }: { readings: SensorReading[] }) {
  const chartData = readings
    .map(r => ({
      time: new Date(r.timestamp).getTime(), // numeric ms for proper time axis
      displayTime: new Date(r.timestamp).toLocaleTimeString(),
      temperature: r.temperature,
      pressure: r.pressure,
      power_consumption: r.power_consumption,
      production_output: r.production_output,
    }))
    .sort((a, b) => a.time - b.time) // ensure chronological order

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="displayTime" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="temperature" stroke="#e74c3c" dot={false} />
        <Line type="monotone" dataKey="pressure" stroke="#3498db" dot={false} />
        <Line type="monotone" dataKey="power_consumption" stroke="#2ecc71" dot={false} />
        <Line type="monotone" dataKey="production_output" stroke="#f39c12" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default App