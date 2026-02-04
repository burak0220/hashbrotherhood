import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

interface Algorithm {
  id: number
  name: string
  stratum_port: number
  hardware_type: string
  hash_unit: string
  pool_host: string
}

export default function Home() {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:8000/api/algorithms')
      .then(res => res.json())
      .then(data => {
        setAlgorithms(data.algorithms)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero */}
      <section style={{ padding: '64px 16px', textAlign: 'center', background: 'linear-gradient(180deg, #0B0F1C 0%, #1a1f2e 100%)' }}>
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '56px', fontWeight: 'bold', marginBottom: '24px', lineHeight: '1.2' }}>
            <span style={{ color: 'white' }}>Mine Any Algorithm,</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg, #00E5FF, #00B8CC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Earn USDT</span>
          </h1>
          <p style={{ fontSize: '22px', color: '#9CA3AF', marginBottom: '40px' }}>
            Professional mining platform • Snapshot pricing • 10 USDT minimum payout
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/calculator" style={{ textDecoration: 'none' }}>
              <button style={{ background: 'linear-gradient(135deg, #00E5FF, #00B8CC)', color: '#0B0F1C', padding: '16px 40px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 20px rgba(0,229,255,0.3)' }}>
                Calculate Earnings →
              </button>
            </Link>
            <Link to="/guide" style={{ textDecoration: 'none' }}>
              <button style={{ border: '2px solid #00E5FF', color: '#00E5FF', padding: '16px 40px', borderRadius: '12px', fontWeight: 'bold', background: 'transparent', cursor: 'pointer', fontSize: '16px' }}>
                How to Mine
              </button>
            </Link>
          </div>
          <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#00E5FF' }}>6</div>
              <div style={{ fontSize: '14px', color: '#9CA3AF' }}>Algorithms</div>
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#00E5FF' }}>10 USDT</div>
              <div style={{ fontSize: '14px', color: '#9CA3AF' }}>Min Payout</div>
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#00E5FF' }}>BEP20</div>
              <div style={{ fontSize: '14px', color: '#9CA3AF' }}>Fast Network</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 16px', background: '#0B0F1C' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '40px', fontWeight: 'bold', textAlign: 'center', marginBottom: '64px', color: 'white' }}>
            Why HashBrotherhood?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📸</div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>Snapshot Pricing</h3>
              <p style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: '1.6' }}>Price locked at share submission. No volatility risk for miners.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>Fast Payouts</h3>
              <p style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: '1.6' }}>Only 10 USDT minimum. BEP20 network, low fees.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>Real-time Stats</h3>
              <p style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: '1.6' }}>Live balance updates every 15 seconds via WebSocket.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>Transparent</h3>
              <p style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: '1.6' }}>What you see is what you get. No hidden surprises.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Algorithms */}
      <section style={{ padding: '80px 16px', background: '#141825' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '40px', fontWeight: 'bold', textAlign: 'center', marginBottom: '48px', color: 'white' }}>
            Available Algorithms
          </h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px' }}>Loading algorithms...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {algorithms.map(algo => (
                <Link key={algo.id} to={`/mine/${algo.name.toLowerCase()}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#1E2330', border: '1px solid #374151', borderRadius: '16px', padding: '32px', transition: 'all 0.3s', cursor: 'pointer' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00E5FF'
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,229,255,0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#374151'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{algo.name}</h3>
                      <span style={{ fontSize: '13px', padding: '6px 14px', background: 'rgba(0, 229, 255, 0.15)', color: '#00E5FF', borderRadius: '20px', fontWeight: '600' }}>
                        {algo.hardware_type}
                      </span>
                    </div>
                    <div style={{ marginBottom: '24px', fontSize: '14px', color: '#9CA3AF', lineHeight: '2' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Port:</span>
                        <span style={{ color: '#00E5FF', fontFamily: 'monospace', fontWeight: '600' }}>{algo.stratum_port}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Unit:</span>
                        <span style={{ color: 'white', fontWeight: '500' }}>{algo.hash_unit}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Pool:</span>
                        <span style={{ color: 'white', fontSize: '12px', fontWeight: '500' }}>{algo.pool_host.split('.')[0]}</span>
                      </div>
                    </div>
                    <button style={{ width: '100%', background: 'rgba(0, 229, 255, 0.1)', border: '2px solid #00E5FF', color: '#00E5FF', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', transition: 'all 0.3s' }}>
                      Start Mining →
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
