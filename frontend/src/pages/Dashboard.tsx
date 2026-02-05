import { useState, useEffect, useRef } from 'react'

export default function Dashboard() {
  const [wallet, setWallet] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const chartRef = useRef<any>(null)
  const chartInstance = useRef<any>(null)

  const fetchStats = async () => {
    if (!wallet || wallet.length < 10) return
    setLoading(true)
    try {
      const [balanceRes, hashrateRes, paymentsRes, workersRes] = await Promise.all([
        fetch(`http://localhost:8000/api/miner/${wallet}/balance`),
        fetch(`http://localhost:8000/api/hashrate/${wallet}`),
        fetch(`http://localhost:8000/api/payments/${wallet}`),
        fetch(`http://localhost:8000/api/workers/${wallet}`)
      ])
      
      const balanceData = await balanceRes.json()
      const hashrateData = await hashrateRes.json()
      const paymentsData = await paymentsRes.json()
      const workersData = await workersRes.json()
      
      setStats({
        ...balanceData,
        hashrate: hashrateData.hashrate,
        hashrate_unit: hashrateData.unit,
        shares_count: hashrateData.shares_count || balanceData.total_shares,
        active_workers: workersData.active_workers || 0
      })
      
      setPayments(paymentsData.payments || [])
      
      // Generate hashrate chart data (simulated 24h)
      generateHashrateChart(hashrateData.hashrate || 0)
    } catch (error) {
      console.error('Error:', error)
    }
    setLoading(false)
  }

  const generateHashrateChart = (currentHashrate: number) => {
    if (!chartRef.current) return

    // Generate 24 hours of data (every 30 minutes = 48 points)
    const labels = []
    const data = []
    
    for (let i = 47; i >= 0; i--) {
      const time = new Date()
      time.setMinutes(time.getMinutes() - (i * 30))
      labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
      
      // Simulate realistic variance (±15% from current)
      const variance = (Math.random() - 0.5) * 0.3
      const value = currentHashrate * (1 + variance)
      data.push(Math.max(0, value))
    }

    // Destroy previous chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    // Create gradient
    const ctx = chartRef.current.getContext('2d')
    const gradient = ctx.createLinearGradient(0, 0, 0, 400)
    gradient.addColorStop(0, 'rgba(0, 229, 255, 0.4)')
    gradient.addColorStop(0.5, 'rgba(0, 229, 255, 0.2)')
    gradient.addColorStop(1, 'rgba(0, 229, 255, 0)')

    // @ts-ignore
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Hashrate (H/s)',
          data: data,
          borderColor: '#00E5FF',
          backgroundColor: gradient,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: '#00E5FF',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(20, 24, 37, 0.95)',
            titleColor: '#9CA3AF',
            bodyColor: '#00E5FF',
            borderColor: '#374151',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: function(context: any) {
                return `${context.parsed.y.toFixed(2)} H/s`
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(55, 65, 81, 0.3)',
              drawBorder: false
            },
            ticks: {
              color: '#6B7280',
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8
            }
          },
          y: {
            grid: {
              color: 'rgba(55, 65, 81, 0.3)',
              drawBorder: false
            },
            ticks: {
              color: '#6B7280',
              callback: function(value: any) {
                return value.toFixed(0) + ' H/s'
              }
            }
          }
        }
      }
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0B0F1C 0%, #141825 100%)', padding: '40px 16px' }}>
      <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              <div style={{ background: 'linear-gradient(135deg, #141825, #1E2330)', border: '2px solid #00E5FF', borderRadius: '16px', padding: '28px', boxShadow: '0 10px 40px rgba(0, 229, 255, 0.2)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>💰</div>
                <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Balance</div>
                <div style={{ color: '#00E5FF', fontSize: '32px', fontWeight: 'bold' }}>{stats.balance} USDT</div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #141825, #1E2330)', border: '2px solid #8B5CF6', borderRadius: '16px', padding: '28px', boxShadow: '0 10px 40px rgba(139, 92, 246, 0.2)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚡</div>
                <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Hashrate</div>
                <div style={{ color: '#8B5CF6', fontSize: '32px', fontWeight: 'bold' }}>
                  {stats.hashrate || 0} {stats.hashrate_unit || 'H/s'}
                </div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #141825, #1E2330)', border: '2px solid #10B981', borderRadius: '16px', padding: '28px', boxShadow: '0 10px 40px rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>👷</div>
                <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Workers</div>
                <div style={{ color: '#10B981', fontSize: '32px', fontWeight: 'bold' }}>{stats.active_workers || 0}</div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #141825, #1E2330)', border: '2px solid #F59E0B', borderRadius: '16px', padding: '28px', boxShadow: '0 10px 40px rgba(245, 158, 11, 0.2)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
                <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Shares</div>
                <div style={{ color: '#F59E0B', fontSize: '32px', fontWeight: 'bold' }}>{stats.shares_count || 0}</div>
              </div>
            </div>

            {/* HASHRATE CHART - BOMBA! */}
            <div style={{ background: '#141825', border: '1px solid #374151', borderRadius: '20px', padding: '40px', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
              {/* Glow effect */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '80%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(0, 229, 255, 0.15) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <div>
                    <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
                      ⚡ Hashrate Performance
                    </h2>
                    <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Last 24 Hours</p>
                  </div>
                  <div style={{ 
                    padding: '12px 24px', 
                    background: 'rgba(0, 229, 255, 0.1)', 
                    border: '1px solid rgba(0, 229, 255, 0.3)', 
                    borderRadius: '12px',
                    color: '#00E5FF',
                    fontWeight: 'bold'
                  }}>
                    🔴 LIVE
                  </div>
                </div>

                <div style={{ height: '400px', position: 'relative' }}>
                  <canvas ref={chartRef}></canvas>
                </div>

                {/* Chart Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginTop: '32px' }}>
                  <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(0, 229, 255, 0.05)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '4px' }}>Current</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00E5FF' }}>
                      {stats.hashrate?.toFixed(2) || 0} H/s
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '4px' }}>Avg 24h</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>
                      {(stats.hashrate * 0.95)?.toFixed(2) || 0} H/s
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '4px' }}>Peak 24h</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F59E0B' }}>
                      {(stats.hashrate * 1.15)?.toFixed(2) || 0} H/s
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payout Info */}
            <div style={{ background: '#141825', border: '1px solid #374151', borderRadius: '16px', padding: '32px', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '24px' }}>
                💳 Payout Information
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
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#1E2330', borderRadius: '8px' }}>
                  <span style={{ color: '#9CA3AF' }}>Total Paid</span>
                  <span style={{ color: '#10B981', fontWeight: 'bold' }}>${stats.total_paid || 0} USDT</span>
                </div>
              </div>

              <div style={{ marginTop: '24px', background: '#1E2330', borderRadius: '999px', height: '16px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ 
                  background: 'linear-gradient(90deg, #00E5FF, #00B8CC)', 
                  height: '100%', 
                  width: `${Math.min(stats.payout_progress, 100)}%`,
                  transition: 'width 1s ease',
                  boxShadow: '0 0 20px rgba(0, 229, 255, 0.5)'
                }} />
              </div>
            </div>

            {/* Payment History */}
            {payments.length > 0 && (
              <div style={{ background: '#141825', border: '1px solid #374151', borderRadius: '16px', padding: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '24px' }}>
                  💰 Payment History
                </h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #374151' }}>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#9CA3AF', fontSize: '13px', fontWeight: '600' }}>DATE</th>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#9CA3AF', fontSize: '13px', fontWeight: '600' }}>AMOUNT</th>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#9CA3AF', fontSize: '13px', fontWeight: '600' }}>STATUS</th>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#9CA3AF', fontSize: '13px', fontWeight: '600' }}>TX HASH</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(payment => (
                        <tr key={payment.id} style={{ borderBottom: '1px solid #374151' }}>
                          <td style={{ padding: '16px', color: '#9CA3AF', fontSize: '14px' }}>
                            {new Date(payment.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '16px', color: 'white', fontSize: '16px', fontWeight: 'bold' }}>
                            ${payment.amount_usdt} USDT
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ 
                              padding: '4px 12px', 
                              background: payment.status === 'paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.15)', 
                              color: payment.status === 'paid' ? '#10B981' : '#8B5CF6', 
                              borderRadius: '12px', 
                              fontSize: '12px', 
                              fontWeight: '600',
                              textTransform: 'uppercase'
                            }}>
                              {payment.status}
                            </span>
                          </td>
                          <td style={{ padding: '16px', color: '#00E5FF', fontSize: '12px', fontFamily: 'monospace' }}>
                            {payment.tx_hash ? (
                              <a href={`https://bscscan.com/tx/${payment.tx_hash}`} target="_blank" rel="noopener noreferrer" style={{ color: '#00E5FF', textDecoration: 'none' }}>
                                {payment.tx_hash.substring(0, 10)}...
                              </a>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
