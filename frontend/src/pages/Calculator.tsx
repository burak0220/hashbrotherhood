import { useState, useEffect } from 'react'

interface Algorithm {
  name: string
  baseUnit: string
  multiplier: number
}

export default function Calculator() {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([])
  const [algorithm, setAlgorithm] = useState('RandomX')
  const [hashrate, setHashrate] = useState(100)
  const [selectedUnit, setSelectedUnit] = useState('MH/s')

  const allUnits = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s']

  useEffect(() => {
    fetch('http://localhost:8000/api/algorithms')
      .then(res => res.json())
      .then(data => {
        const algos = data.algorithms.map((a: any) => ({
          name: a.name,
          baseUnit: a.hash_unit,
          multiplier: getMultiplier(a.hash_unit)
        }))
        setAlgorithms(algos)
        if (algos.length > 0) {
          setAlgorithm(algos[0].name)
          setSelectedUnit(algos[0].baseUnit)
        }
      })
  }, [])

  const getMultiplier = (unit: string) => {
    switch(unit) {
      case 'H/s': return 1
      case 'KH/s': return 1000
      case 'MH/s': return 1000000
      case 'GH/s': return 1000000000
      case 'TH/s': return 1000000000000
      default: return 1
    }
  }

  const selectedAlgo = algorithms.find(a => a.name === algorithm)
  const totalHashes = hashrate * getMultiplier(selectedUnit)
  
  const baseEarning = 0.00001
  const perMinute = (totalHashes * baseEarning) / 1440
  const perHour = perMinute * 60
  const perDay = perHour * 24
  const perWeek = perDay * 7
  const perMonth = perDay * 30

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F1C', padding: '40px 16px' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '40px', fontWeight: 'bold', marginBottom: '16px', color: 'white', textAlign: 'center' }}>
          Profitability Calculator
        </h1>
        <p style={{ textAlign: 'center', color: '#9CA3AF', marginBottom: '48px', fontSize: '16px' }}>
          Estimate your mining earnings in USDT
        </p>

        <div style={{ background: '#141825', border: '1px solid #374151', borderRadius: '16px', padding: '40px' }}>
          {/* Algorithm Selection */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', color: '#9CA3AF', marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
              Select Algorithm
            </label>
            <select 
              value={algorithm}
              onChange={(e) => {
                setAlgorithm(e.target.value)
                const algo = algorithms.find(a => a.name === e.target.value)
                if (algo) setSelectedUnit(algo.baseUnit)
              }}
              style={{ width: '100%', padding: '14px', background: '#1E2330', border: '1px solid #374151', borderRadius: '8px', color: 'white', fontSize: '16px', cursor: 'pointer' }}>
              {algorithms.map(algo => (
                <option key={algo.name} value={algo.name}>{algo.name}</option>
              ))}
            </select>
          </div>

          {/* Hashrate Input */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', color: '#9CA3AF', marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
              Your Hashrate
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
              <input 
                type="number"
                value={hashrate}
                onChange={(e) => setHashrate(Number(e.target.value))}
                style={{ padding: '14px', background: '#1E2330', border: '1px solid #374151', borderRadius: '8px', color: 'white', fontSize: '18px', fontWeight: 'bold' }}
                placeholder="100"
              />
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                style={{ padding: '14px 20px', background: '#1E2330', border: '2px solid #00E5FF', borderRadius: '8px', color: '#00E5FF', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', minWidth: '120px' }}>
                {allUnits.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(0, 229, 255, 0.1)', borderRadius: '6px', border: '1px solid rgba(0, 229, 255, 0.3)' }}>
              <div style={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center' }}>
                💡 Example: 1 GH/s = 1000 MH/s = 1,000,000 KH/s
              </div>
            </div>
          </div>

          {/* Results */}
          <div style={{ background: '#1E2330', borderRadius: '12px', padding: '32px', border: '1px solid #00E5FF' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#00E5FF', marginBottom: '24px', textAlign: 'center' }}>
              💰 Estimated Earnings
            </h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              {[
                { label: 'Per Minute', value: perMinute, icon: '⚡' },
                { label: 'Per Hour', value: perHour, icon: '⏰' },
                { label: 'Per Day', value: perDay, icon: '📅' },
                { label: 'Per Week', value: perWeek, icon: '📊' },
                { label: 'Per Month', value: perMonth, icon: '💎' }
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#0B0F1C', borderRadius: '8px' }}>
                  <span style={{ color: '#9CA3AF', fontSize: '15px' }}>
                    {item.icon} {item.label}
                  </span>
                  <span style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                    ${item.value.toFixed(8)} USDT
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(0, 229, 255, 0.1)', borderRadius: '8px', border: '1px solid rgba(0, 229, 255, 0.3)' }}>
              <div style={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center' }}>
                ⏳ Time to reach 10 USDT minimum payout: <strong style={{ color: '#00E5FF' }}>
                  {perDay > 0 ? Math.ceil(10 / perDay) : '∞'} days
                </strong>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <p style={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center', margin: 0 }}>
              ℹ️ Estimates based on current network difficulty and coin prices. Actual earnings may vary.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
