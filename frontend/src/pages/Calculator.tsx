import { useState, useEffect } from 'react'

export default function Calculator() {
  const [algorithms, setAlgorithms] = useState<any[]>([])
  const [selectedAlgo, setSelectedAlgo] = useState<any>(null)
  const [hashrate, setHashrate] = useState('100')
  const [unit, setUnit] = useState('MH/s')
  const [earnings, setEarnings] = useState<any>(null)
  const [coinInfo, setCoinInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const getUnitsForAlgo = (algoName: string) => {
    const unitMap: any = {
      'RandomX': ['H/s', 'KH/s', 'MH/s'],
      'KawPow': ['MH/s', 'GH/s'],
      'Etchash': ['MH/s', 'GH/s', 'TH/s'],
      'Scrypt': ['MH/s', 'GH/s', 'TH/s'],
      'SHA256': ['TH/s', 'PH/s', 'EH/s'],
      'Autolykos': ['MH/s', 'GH/s']
    }
    return unitMap[algoName] || ['MH/s']
  }

  const [availableUnits, setAvailableUnits] = useState<string[]>(['MH/s'])

  // 1. Load algorithms on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/algorithms')
      .then(res => res.json())
      .then(data => {
        setAlgorithms(data.algorithms || [])
        if (data.algorithms?.length > 0) {
          const first = data.algorithms[0]
          setSelectedAlgo(first)
          const units = getUnitsForAlgo(first.name)
          setAvailableUnits(units)
          setUnit(units[0])
        }
      })
  }, []) // Only on mount

  // 2. When algorithm changes - fetch coin info
  useEffect(() => {
    if (!selectedAlgo) return
    
    const units = getUnitsForAlgo(selectedAlgo.name)
    setAvailableUnits(units)
    setUnit(units[0])
    
    // Fetch coin info
    fetch(`http://localhost:8000/api/coin-info/${selectedAlgo.name}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setCoinInfo(data)
        }
      })
      .catch(err => console.error(err))
      
  }, [selectedAlgo?.id]) // Only when algo ID changes

  // 3. When hashrate or unit changes - calculate
  useEffect(() => {
    if (!selectedAlgo || !hashrate || parseFloat(hashrate) <= 0) {
      setEarnings(null)
      return
    }

    const timer = setTimeout(() => {
      calculateEarnings()
    }, 500)
    
    return () => clearTimeout(timer)
  }, [hashrate, unit, selectedAlgo?.id]) // Only these 3

  const calculateEarnings = async () => {
    const hashrateNum = parseFloat(hashrate)
    if (!selectedAlgo || !hashrateNum || hashrateNum <= 0) return

    setLoading(true)
    try {
      const res = await fetch(
        `http://localhost:8000/api/calculator/realtime?algorithm=${selectedAlgo.name}&hashrate=${hashrateNum}&unit=${encodeURIComponent(unit)}`
      )
      const data = await res.json()
      
      if (data.error) {
        console.error(data.error)
        setEarnings(null)
      } else {
        setEarnings({
          hourly: Number(data.hourly) || 0,
          daily: Number(data.daily) || 0,
          weekly: Number(data.weekly) || 0,
          monthly: Number(data.monthly) || 0,
          coin_price: Number(data.coin_price) || 0,
          coins_per_day: Number(data.coins_per_day) || 0
        })
        
        // Update coin price in coinInfo
        if (coinInfo) {
          setCoinInfo(prev => ({...prev, price: Number(data.coin_price)}))
        }
      }
    } catch (error) {
      console.error('Calculator error:', error)
      setEarnings(null)
    }
    setLoading(false)
  }

  const handleHashrateChange = (value: string) => {
    if (value.startsWith('0') && value.length > 1 && value[1] !== '.') {
      value = value.replace(/^0+/, '')
    }
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setHashrate(value)
    }
  }

  const formatCurrency = (value: number, decimals: number = 2) => {
    if (value < 0.01) {
      return value.toFixed(6)
    }
    return value.toFixed(decimals)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0B0F1C 0%, #141825 100%)', padding: '40px 20px' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            background: 'linear-gradient(135deg, #00E5FF, #8B5CF6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '16px'
          }}>
            🧮 Mining Calculator
          </h1>
          <p style={{ fontSize: '18px', color: '#9CA3AF' }}>
            Real-time estimates with live network data
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div style={{ background: '#141825', border: '1px solid #374151', borderRadius: '20px', padding: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '32px' }}>
              ⚙️ Configuration
            </h2>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#9CA3AF', marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
                Algorithm
              </label>
              <select
                value={selectedAlgo?.id || ''}
                onChange={(e) => {
                  const algo = algorithms.find(a => a.id === parseInt(e.target.value))
                  setSelectedAlgo(algo)
                }}
                style={{ width: '100%', padding: '14px', background: '#1E2330', border: '1px solid #374151', borderRadius: '12px', color: 'white', fontSize: '16px', cursor: 'pointer' }}
              >
                {algorithms.map(algo => (
                  <option key={algo.id} value={algo.id}>
                    {algo.name} ({algo.hardware_type})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', color: '#9CA3AF', marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
                Your Hashrate
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  value={hashrate}
                  onChange={(e) => handleHashrateChange(e.target.value)}
                  placeholder="100"
                  style={{ 
                    flex: 1, 
                    padding: '14px', 
                    background: '#1E2330', 
                    border: '1px solid #374151', 
                    borderRadius: '12px', 
                    color: 'white', 
                    fontSize: '18px',
                    fontWeight: '600'
                  }}
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{ 
                    padding: '14px 20px', 
                    background: '#1E2330', 
                    border: '1px solid #374151', 
                    borderRadius: '12px', 
                    color: '#00E5FF', 
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minWidth: '100px'
                  }}
                >
                  {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {coinInfo && coinInfo.price > 0 && (
              <div style={{ 
                padding: '24px', 
                background: 'rgba(0, 229, 255, 0.1)', 
                border: '1px solid rgba(0, 229, 255, 0.3)', 
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <img 
                  src={coinInfo.logo} 
                  alt={coinInfo.name}
                  style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '50%',
                    background: 'white',
                    padding: '4px'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '4px' }}>
                    {coinInfo.name} ({coinInfo.symbol})
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00E5FF' }}>
                    ${coinInfo.price < 1 ? coinInfo.price.toFixed(4) : coinInfo.price.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                    Live price • CoinGecko
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            {loading && (
              <div style={{ 
                background: '#141825', 
                border: '1px solid #374151', 
                borderRadius: '20px', 
                padding: '100px 40px',
                textAlign: 'center'
              }}>
                <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                <div style={{ color: '#9CA3AF' }}>Calculating...</div>
              </div>
            )}

            {earnings && !loading && (
              <div>
                <div style={{ 
                  background: 'linear-gradient(135deg, #141825, #1E2330)', 
                  border: '2px solid #00E5FF', 
                  borderRadius: '20px', 
                  padding: '40px', 
                  marginBottom: '24px', 
                  boxShadow: '0 20px 60px rgba(0, 229, 255, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-20%',
                    width: '100%',
                    height: '200%',
                    background: 'radial-gradient(circle, rgba(0, 229, 255, 0.15) 0%, transparent 70%)',
                    pointerEvents: 'none'
                  }} />
                  
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                      ESTIMATED DAILY REVENUE
                    </div>
                    <div style={{ fontSize: '56px', fontWeight: 'bold', color: '#00E5FF', marginBottom: '8px' }}>
                      ${formatCurrency(earnings.daily, 4)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>
                      {earnings.coins_per_day.toFixed(8)} {coinInfo?.symbol || 'coins'}/day
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  {[
                    { label: 'Per Hour', value: earnings.hourly, color: '#8B5CF6' },
                    { label: 'Per Day', value: earnings.daily, color: '#00E5FF' },
                    { label: 'Per Week', value: earnings.weekly, color: '#10B981' },
                    { label: 'Per Month', value: earnings.monthly, color: '#F59E0B' }
                  ].map(item => (
                    <div key={item.label} style={{ 
                      background: '#141825', 
                      border: `1px solid ${item.color}40`, 
                      borderRadius: '16px', 
                      padding: '24px',
                      transition: 'all 0.3s'
                    }}>
                      <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '8px', textTransform: 'uppercase' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: item.color }}>
                        ${formatCurrency(item.value, item.label === 'Per Hour' ? 6 : 2)}
                      </div>
                    </div>
                  ))}
                </div>

                <a 
                  href={`/mine/${selectedAlgo?.name.toLowerCase()}`}
                  style={{
                    display: 'block',
                    padding: '20px',
                    background: 'linear-gradient(135deg, #00E5FF, #00B8CC)',
                    color: '#0B0F1C',
                    textAlign: 'center',
                    borderRadius: '16px',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    textDecoration: 'none',
                    boxShadow: '0 10px 30px rgba(0, 229, 255, 0.4)',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)'
                    e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 229, 255, 0.6)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 229, 255, 0.4)'
                  }}
                >
                  ⚡ Start Mining {selectedAlgo?.name}
                </a>
              </div>
            )}

            {!loading && !earnings && hashrate && parseFloat(hashrate) > 0 && (
              <div style={{ 
                background: '#141825', 
                border: '1px solid #374151', 
                borderRadius: '20px', 
                padding: '100px 40px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧮</div>
                <div style={{ color: '#9CA3AF' }}>Enter hashrate to calculate earnings</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ 
          marginTop: '64px', 
          padding: '24px', 
          background: 'rgba(245, 158, 11, 0.1)', 
          border: '1px solid rgba(245, 158, 11, 0.3)', 
          borderRadius: '16px', 
          textAlign: 'center'
        }}>
          <div style={{ color: '#F59E0B', fontSize: '15px', lineHeight: '1.6' }}>
            ⚠️ <strong>Estimated earnings</strong> based on current network difficulty and coin prices.<br/>
            Actual earnings may vary. Platform fee included in displayed amounts.
          </div>
        </div>
      </div>

      <style>{`
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(0, 229, 255, 0.1);
          border-top-color: #00E5FF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
