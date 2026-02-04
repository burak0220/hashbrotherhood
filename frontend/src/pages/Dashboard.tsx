import { useState } from 'react'

export default function Dashboard() {
  const [wallet, setWallet] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = async () => {
    if (!wallet || wallet.length < 10) return
    setLoading(true)
    try {
      const [balanceRes, hashrateRes] = await Promise.all([
        fetch(`http://localhost:8000/api/miner/${wallet}/balance`),
        fetch(`http://localhost:8000/api/hashrate/${wallet}`)
      ])
      
      const balanceData = await balanceRes.json()
      const hashrateData = await hashrateRes.json()
      
      setStats({
        ...balanceData,
        hashrate: hashrateData.hashrate,
        hashrate_unit: hashrateData.unit
      })
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
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              <div style={{ background: '#141825', border: '1px solid #374151', borderRadius: '12px', padding: '24px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
                <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px' }}>Current Balance</div>
                <div style={{ color: '#00E5FF', fontSize: '28px', fontWeight: 'bold' }}>{stats.balance} USDT</div>
              </div>

              <div style={{ background: '#141825', border: '1px solid #374151', borderRadius: '12px', padding: '24px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚡</div>
                <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px' }}>Hashrate</div>
                <div style={{ color: '#8B5CF6', fontSize: '28px', fontWeight: 'bold' }}>
                  {stats.hashrate || 0} {stats.hashrate_unit || 'H/s'}
                </div>
              </div>

              <div style={{ background: '#141825', border: '1px solid #374151', borderRadius: '12px', padding: '24px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>👷</div>
                <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px' }}>Total Shares</div>
                <div style={{ color: '#10B981', fontSize: '28px', fontWeight: 'bold' }}>{stats.total_shares || 0}</div>
              </div>

              <div style={{ background: '#141825', border: '1px solid #374151', borderRadius: '12px', padding: '24px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
                <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px' }}>Est. Daily</div>
                <div style={{ color: '#F59E0B', fontSize: '28px', fontWeight: 'bold' }}>${stats.estimated_daily || 0}</div>
              </div>
            </div>

            <div style={{ background: '#141825', border: '1px solid #374151', borderRadius: '16px', padding: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '24px' }}>
                Payout Information
              </h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#1E2330', borderRadius: '8px' }}>
                  <span style={{ color: '#9CA3AF' }}>Minimum Payout</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{stats.min_payout} USDT</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#1E2330', borderRadius: '8px' }}>
                  <span style={{ color: '#9CA3AF' }}>Network</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{stats.network}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#1E2330', borderRadius: '8px' }}>
                  <span style={{ color: '#9CA3AF' }}>Progress to Payout</span>
                  <span style={{ color: '#00E5FF', fontWeight: 'bold' }}>{stats.payout_progress}%</span>
                </div>
              </div>

              <div style={{ marginTop: '24px', background: '#1E2330', borderRadius: '999px', height: '12px', overflow: 'hidden' }}>
                <div style={{ 
                  background: 'linear-gradient(90deg, #00E5FF, #00B8CC)', 
                  height: '100%', 
                  width: `${Math.min(stats.payout_progress, 100)}%`,
                  transition: 'width 0.5s'
                }} />
              </div>
            </div>
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
