import { useState, useEffect } from 'react'

interface Algorithm {
  id: number
  name: string
  stratum_port: number
  hardware_type: string
  hash_unit: string
  pool_host: string
  pool_port: number
}

function App() {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:8000/api/algorithms')
      .then(res => res.json())
      .then(data => {
        setAlgorithms(data.algorithms)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error:', err)
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F1C' }}>
      {/* Header */}
      <header style={{ background: '#141825', borderBottom: '1px solid #374151', padding: '24px 16px' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', background: '#00E5FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#0B0F1C' }}>H</span>
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#00E5FF' }}>HashBrotherhood</h1>
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>Mine Any Algorithm, Earn USDT</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: '64px 16px', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '24px' }}>
            <span style={{ color: 'white' }}>Mine Any Algorithm,</span>
            <br />
            <span style={{ color: '#00E5FF' }}>Earn USDT</span>
          </h2>
          <p style={{ fontSize: '20px', color: '#D1D5DB', marginBottom: '32px' }}>
            Transparent • Simple • Profitable
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={{ background: 'linear-gradient(to right, #00E5FF, #00B8CC)', color: '#0B0F1C', padding: '12px 32px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
              Get Started →
            </button>
            <button style={{ border: '1px solid #00E5FF', color: '#00E5FF', padding: '12px 32px', borderRadius: '8px', fontWeight: 'bold', background: 'transparent', cursor: 'pointer' }}>
              Calculate Earnings
            </button>
          </div>
        </div>
      </section>

      {/* Algorithms */}
      <section style={{ padding: '64px 16px' }}>
        <div className="container">
          <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px', textAlign: 'center' }}>Available Algorithms</h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF' }}>Loading algorithms...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {algorithms.map(algo => (
                <div key={algo.id} style={{ background: '#141825', border: '1px solid #374151', borderRadius: '12px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{algo.name}</h4>
                    <span style={{ fontSize: '12px', padding: '4px 12px', background: 'rgba(0, 229, 255, 0.2)', color: '#00E5FF', borderRadius: '999px' }}>
                      {algo.hardware_type}
                    </span>
                  </div>
                  <div style={{ marginBottom: '16px', fontSize: '14px', color: '#9CA3AF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Port:</span>
                      <span style={{ color: 'white', fontFamily: 'monospace' }}>{algo.stratum_port}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Unit:</span>
                      <span style={{ color: 'white' }}>{algo.hash_unit}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Pool:</span>
                      <span style={{ color: 'white', fontSize: '12px' }}>{algo.pool_host}</span>
                    </div>
                  </div>
                  <button style={{ width: '100%', background: 'rgba(0, 229, 255, 0.1)', border: '1px solid #00E5FF', color: '#00E5FF', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Connect →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#141825', borderTop: '1px solid #374151', padding: '32px 16px', marginTop: '64px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
        <p>© 2026 HashBrotherhood. All rights reserved.</p>
        <p style={{ marginTop: '8px' }}>Minimum payout: 10 USDT (BEP20)</p>
      </footer>
    </div>
  )
}

export default App
