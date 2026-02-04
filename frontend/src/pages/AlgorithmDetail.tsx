import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function AlgorithmDetail() {
  const { algoName } = useParams()
  const [algo, setAlgo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`http://localhost:8000/api/algorithm/${algoName}`)
      .then(res => res.json())
      .then(data => {
        setAlgo(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [algoName])

  if (loading) {
    return <div style={{ minHeight: '100vh', background: '#0B0F1C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>Loading...</div>
  }

  if (!algo) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B0F1C', padding: '40px 16px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '32px', marginBottom: '16px' }}>Algorithm Not Found</h1>
        <Link to="/" style={{ color: '#00E5FF', textDecoration: 'none' }}>← Back to Home</Link>
      </div>
    )
  }

  const connectionString = `hashbrotherhood.com:${algo.stratum_port}`

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F1C', padding: '40px 16px' }}>
      <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link to="/" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            ← Back to Home
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>{algo.name}</h1>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ padding: '6px 16px', background: 'rgba(0, 229, 255, 0.15)', color: '#00E5FF', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                  {algo.hardware_type}
                </span>
                <span style={{ color: '#9CA3AF', fontSize: '14px' }}>{algo.hash_unit}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Details */}
        <div style={{ background: '#141825', border: '2px solid #00E5FF', borderRadius: '16px', padding: '32px', marginBottom: '32px', boxShadow: '0 8px 24px rgba(0, 229, 255, 0.15)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '24px' }}>
            ⚡ Start Mining Now
          </h2>

          <div style={{ background: '#1E2330', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#9CA3AF', fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>SERVER</label>
              <div style={{ color: 'white', fontSize: '16px', fontFamily: 'monospace', background: '#0B0F1C', padding: '12px', borderRadius: '6px' }}>
                {connectionString}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#9CA3AF', fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>USERNAME FORMAT</label>
              <div style={{ color: 'white', fontSize: '16px', fontFamily: 'monospace', background: '#0B0F1C', padding: '12px', borderRadius: '6px' }}>
                YOUR_BEP20_WALLET.worker01
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#9CA3AF', fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>PASSWORD</label>
              <div style={{ color: 'white', fontSize: '16px', fontFamily: 'monospace', background: '#0B0F1C', padding: '12px', borderRadius: '6px' }}>
                x
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <button 
              onClick={() => navigator.clipboard.writeText(connectionString)}
              style={{ padding: '14px', background: 'rgba(0, 229, 255, 0.1)', border: '1px solid #00E5FF', color: '#00E5FF', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
              📋 Copy Server
            </button>
            <Link to="/guide" style={{ textDecoration: 'none' }}>
              <button style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #00E5FF, #00B8CC)', color: '#0B0F1C', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                📚 Setup Guide
              </button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div style={{ background: '#141825', border: '1px solid #374151', borderRadius: '12px', padding: '24px' }}>
            <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '8px' }}>Port</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00E5FF' }}>{algo.stratum_port}</div>
          </div>
          <div style={{ background: '#141825', border: '1px solid #374151', borderRadius: '12px', padding: '24px' }}>
            <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '8px' }}>Min Payout</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10B981' }}>10 USDT</div>
          </div>
          <div style={{ background: '#141825', border: '1px solid #374151', borderRadius: '12px', padding: '24px' }}>
            <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '8px' }}>Network</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8B5CF6' }}>BEP20</div>
          </div>
        </div>

        {/* Recommended Miners */}
        <div style={{ background: '#141825', border: '1px solid #374151', borderRadius: '16px', padding: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '24px' }}>
            💻 Recommended Miner Software
          </h2>
          
          {algo.hardware_type === 'CPU' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ background: '#1E2330', padding: '20px', borderRadius: '10px', border: '1px solid #374151' }}>
                <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '8px', fontWeight: 'bold' }}>XMRig</h3>
                <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '12px' }}>Best CPU miner for RandomX algorithm</p>
                <a href="https://github.com/xmrig/xmrig/releases" target="_blank" style={{ color: '#00E5FF', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                  Download →
                </a>
              </div>
            </div>
          )}

          {algo.hardware_type === 'GPU' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ background: '#1E2330', padding: '20px', borderRadius: '10px', border: '1px solid #374151' }}>
                <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '8px', fontWeight: 'bold' }}>T-Rex Miner</h3>
                <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '12px' }}>Popular NVIDIA GPU miner</p>
                <a href="https://github.com/trexminer/T-Rex/releases" target="_blank" style={{ color: '#00E5FF', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                  Download →
                </a>
              </div>
              <div style={{ background: '#1E2330', padding: '20px', borderRadius: '10px', border: '1px solid #374151' }}>
                <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '8px', fontWeight: 'bold' }}>lolMiner</h3>
                <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '12px' }}>Works on both AMD and NVIDIA</p>
                <a href="https://github.com/Lolliedieb/lolMiner-releases/releases" target="_blank" style={{ color: '#00E5FF', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                  Download →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
