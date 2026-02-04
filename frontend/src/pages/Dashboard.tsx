import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [wallet, setWallet] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = async () => {
    if (!wallet || wallet.length < 10) return
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:8000/api/miner/${wallet}`)
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Error:', error)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F1C', padding: '40px 16px' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '40px', fontWeight: 'bold', marginBottom: '16px', color: 'white' }}>
          Mining Dashboard
        </h1>
        <p style={{ color: '#9CA3AF', marginBottom: '48px', fontSize: '16px' }}>
          Track your mining statistics and earnings
        </p>

        <div style={{ background: '#141825', border: '1px solid #374151', borderRadius: '16px', padding: '32px', marginBottom: '32px' }}>
          <label style={{ display: 'block', color: '#9CA3AF', marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
            Enter Your BEP20 Wallet Address
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x..."
              style={{ flex: 1, padding: '14px', background: '#1E2330', border: '1px solid #374151', borderRadius: '8px', color: 'white', fontSize: '16px' }}
            />
            <button 
              onClick={fetchStats}
              disabled={loading}
              style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #00E5FF, #00B8CC)', color: '#0B0F1C', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
              {loading ? 'Loading...' : 'View Stats'}
            </button>
          </div>
        </div>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            {[
              { label: 'Current Balance', value: `${stats.balance} USDT`, icon: '💰', color: '#00E5FF' },
              { label: 'Hashrate', value: `${stats.hashrate} H/s`, icon: '⚡', color: '#8B5CF6' },
              { label: 'Active Workers', value: stats.workers, icon: '👷', color: '#10B981' },
              { label: 'Est. Daily', value: `$${stats.estimated_daily}`, icon: '📊', color: '#F59E0B' }
            ].map((item, index) => (
              <div key={index} style={{ background: '#141825', border: '1px solid #374151', borderRadius: '12px', padding: '24px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{item.icon}</div>
                <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px' }}>{item.label}</div>
                <div style={{ color: item.color, fontSize: '28px', fontWeight: 'bold' }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {!stats && !loading && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9CA3AF' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
            <p style={{ fontSize: '18px' }}>Enter your wallet address to view your mining statistics</p>
          </div>
        )}
      </div>
    </div>
  )
}
