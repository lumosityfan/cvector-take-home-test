import { useState, useEffect } from 'react'
import './App.css'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
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
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([])
  const [selectedFacility, setSelectedFacility] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facilityStatuses, setFacilityStatuses] = useState<Map<number, FacilityStatus>>(new Map())
  const API_BASE_URL = 'http://localhost:8000/v1'

  const fetchFacilities = async (): Promise<Facility[]> => {
    const response = await fetch(`${API_BASE_URL}/facilities`)
    if (!response.ok) throw new Error('Failed to fetch facilities')
    return response.json()
  }

  const fetchSensorReadings = async (facilityId: number): Promise<SensorReading[]> => {
    const response = await fetch(`${API_BASE_URL}/sensors?facility_id=${facilityId}`)
    if (!response.ok) throw new Error('Failed to fetch sensor readings')
    return response.json()
  }

  const fetchFacilityStatus = async (facilityId: number) => {
    const response = await fetch(`${API_BASE_URL}/facilities/${facilityId}/status`)
    if (!response.ok) throw new Error('Failed to fetch facility status')
    return response.json()
  }

  const fetchFacilityAssets = async (facilityId: number): Promise<Asset[]> => {
    const response = await fetch(`${API_BASE_URL}/facilities/${facilityId}/assets`)
    if (!response.ok) throw new Error('Failed to fetch facility assets')
    return response.json()
  }

  const generateSensorReadings = async () => {
    try {
      for (const facility of facilities) {
        const facilityAssets = await fetchFacilityAssets(facility.facility_id)
        for (const asset of facilityAssets) {
          const sensorReading = {
            sensor_name: `Sensor for ${asset.asset_name} at ${facility.facility_name}`,
            asset_id: asset.asset_id,
            facility_id: facility.facility_id,
            timestamp: new Date().toISOString(),
            temperature: Math.random() * 100,
            pressure: Math.random() * 100,
            power_consumption: Math.random() * 100,
            production_output: Math.random() * 100
          }
          await fetch(`${API_BASE_URL}/sensors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sensorReading)
          })
        }
      }
      // After posting new reading, refresh data
      if (selectedFacility === null) return
      const [facilityData, sensorData] = await Promise.all([
        fetchFacilities(),
        fetchSensorReadings(selectedFacility),
      ])
      setSensorReadings(sensorData)
      // Fetch all statuses at once
        const statusEntries = await Promise.all(
          facilityData.map(async (f) => {
            const status = await fetchFacilityStatus(f.facility_id)
            return [f.facility_id, status] as [number, FacilityStatus]
          })
        )
        setFacilityStatuses(new Map(statusEntries))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch facilities, assets, and facility statuses on page load
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [facilityData] = await Promise.all([
          fetchFacilities(),
        ])
        setFacilities(facilityData)

        // Fetch all statuses at once
        const statusEntries = await Promise.all(
          facilityData.map(async (f) => {
            const status = await fetchFacilityStatus(f.facility_id)
            return [f.facility_id, status] as [number, FacilityStatus]
          })
        )
        setFacilityStatuses(new Map(statusEntries))
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Fetch sensor readings when a facility is selected
  useEffect(() => {
    if (selectedFacility === null) return
    const load = async () => {
      try {
        const [sensorData] = await Promise.all([
          fetchSensorReadings(selectedFacility),
        ])
        setSensorReadings(sensorData)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedFacility])

  // Poll results inputted into dashboard
  useEffect(() => {
    generateSensorReadings()

    const intervalId = setInterval(generateSensorReadings, 5000);

    return () => clearInterval(intervalId);
  }, [])

  // Add these column definitions inside your App component (or just above the return)

  const facilityColumns: ColumnsType<Facility & { status?: FacilityStatus }> = [
    {
      title: 'Facility',
      dataIndex: 'facility_name',
      key: 'facility_name',
      render: (name: string, record) => (
        <button onClick={() => setSelectedFacility(record.facility_id)}>{name}</button>
      ),
    },
    {
      title: 'Latest Reading Time',
      key: 'latest_reading_time',
      render: (_, record) =>
        record.status ? new Date(record.status.latest_reading_time).toLocaleString() : '—',
    },
    {
      title: 'Latest Temperature',
      key: 'latest_temperature',
      render: (_, record) => record.status?.latest_temperature ?? '—',
    },
    {
      title: 'Latest Pressure',
      key: 'latest_pressure',
      render: (_, record) => record.status?.latest_pressure ?? '—',
    },
    {
      title: 'Total Power Consumption',
      key: 'total_power_consumption',
      render: (_, record) => record.status?.total_power_consumption ?? '—',
    },
    {
      title: 'Total Production Output',
      key: 'total_production_output',
      render: (_, record) => record.status?.total_production_output ?? '—',
    },
  ]

  const sensorColumns: ColumnsType<SensorReading> = [
    { title: 'Sensor', dataIndex: 'sensor_name', key: 'sensor_name' },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (ts: string) => new Date(ts).toLocaleString(),
    },
    { title: 'Temperature', dataIndex: 'temperature', key: 'temperature' },
    { title: 'Pressure', dataIndex: 'pressure', key: 'pressure' },
    { title: 'Power', dataIndex: 'power_consumption', key: 'power_consumption' },
    { title: 'Output', dataIndex: 'production_output', key: 'production_output' },
  ]

  return (
    <>
      <h1>Manufacturing Facility Dashboard</h1>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

    <section>
      <h2>Facility Status</h2>
      <Table
        rowKey="facility_id"
        columns={facilityColumns}
        dataSource={facilities.map(f => ({ ...f, status: facilityStatuses.get(f.facility_id) }))}
        loading={loading}
        pagination={false}
      />
    </section>

      {(selectedFacility !== null) && (
        <>
          <section>
            <h2>Sensor Readings</h2>
            <Table
              rowKey="sensor_id"
              columns={sensorColumns}
              dataSource={sensorReadings}
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
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

function SensorChart({ readings = [] }: { readings?: SensorReading[] }) {
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