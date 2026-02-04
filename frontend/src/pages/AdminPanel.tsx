import { useState, useEffect } from 'react'

export default function AdminPanel() {
  const [pools, setPools] = useState<any[]>([])
  const [algorithms, setAlgorithms] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPool, setEditingPool] = useState<any>(null)
  const [completingPayment, setCompletingPayment] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [poolsRes, algosRes, paymentsRes] = await Promise.all([
        fetch('http://localhost:8001/admin/pools'),
        fetch('http://localhost:8001/admin/algorithms'),
        fetch('http://localhost:8001/admin/payments/pending')
      ])
      
      const poolsData = await poolsRes.json()
      const algosData = await algosRes.json()
      const paymentsData = await paymentsRes.json()
      
      setPools(poolsData.pools || [])
      setAlgorithms(algosData.algorithms || [])
      setPayments(paymentsData.payments || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching admin data:', error)
      setLoading(false)
    }
  }

  const updatePool = async (poolId: number, data: any) => {
    try {
      await fetch(`http://localhost:8001/admin/pool/${poolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      alert('Pool updated successfully!')
      fetchData()
      setEditingPool(null)
    } catch (error) {
      alert('Error updating pool')
    }
  }

  const approvePayment = async (paymentId: number) => {
    if (!confirm('Approve this payment?')) return
    
    try {
      await fetch(`http://localhost:8001/admin/payment/${paymentId}/approve`, {
        method: 'POST'
      })
      alert('Payment approved!')
      fetchData()
    } catch (error) {
      alert('Error approving payment')
    }
  }

  const completePayment = async (paymentId: number, txHash: string) => {
    try {
      await fetch(`http://localhost:8001/admin/payment/${paymentId}/complete?tx_hash=${txHash}`, {
        method: 'POST'
      })
      alert('Payment completed!')
      fetchData()
      setCompletingPayment(null)
    } catch (error) {
      alert('Error completing payment')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B0F1C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
          <div>Loading Admin Panel...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F1C', padding: '40px 16px' }}>
      <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '40px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
            ⚙️ Admin Panel
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '16px' }}>Manage algorithms, pools, and payments</p>
        </div>

        {/* Pending Payments */}
        {payments.length > 0 && (
          <div style={{ marginBottom: '48px', background: '#141825', border: '2px solid #F59E0B', borderRadius: '16px', padding: '32px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#F59E0B', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              💰 Pending Payments ({payments.length})
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              {payments.map(payment => (
                <div key={payment.id} style={{ background: '#1E2330', border: '1px solid #374151', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', fontFamily: 'monospace' }}>
                      {payment.miner_wallet?.substring(0, 20)}...
                    </div>
                    <div style={{ color: '#9CA3AF', fontSize: '14px' }}>
                      Amount: <strong style={{ color: '#10B981' }}>${payment.amount_usdt} USDT</strong> • 
                      Created: {new Date(payment.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => approvePayment(payment.id)}
                      style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                      ✅ Approve
                    </button>
                    <button 
                      onClick={() => setCompletingPayment(payment)}
                      style={{ padding: '10px 20px', background: 'rgba(0, 229, 255, 0.1)', border: '1px solid #00E5FF', color: '#00E5FF', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                      🔗 Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Algorithms Overview */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '24px' }}>
            📊 Algorithms Overview
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {algorithms.map(algo => (
              <div key={algo.id} style={{ background: '#141825', border: '1px solid #374151', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>{algo.name}</h3>
                    <span style={{ fontSize: '13px', padding: '4px 12px', background: 'rgba(0, 229, 255, 0.15)', color: '#00E5FF', borderRadius: '12px' }}>
                      {algo.hardware_type}
                    </span>
                  </div>
                  <div style={{ fontSize: '24px' }}>{algo.active ? '🟢' : '🔴'}</div>
                </div>
                <div style={{ fontSize: '14px', color: '#9CA3AF', lineHeight: '2' }}>
                  <div><strong>Port:</strong> {algo.stratum_port}</div>
                  <div><strong>Unit:</strong> {algo.hash_unit}</div>
                  <div><strong>Pool:</strong> {algo.pool_host?.split('.')[0] || 'N/A'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pool Management */}
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '24px' }}>
            🏊 Pool Management
          </h2>
          <div style={{ background: '#141825', border: '1px solid #374151', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1E2330', borderBottom: '1px solid #374151' }}>
                    <th style={{ padding: '16px', textAlign: 'left', color: '#9CA3AF', fontSize: '13px', fontWeight: '600' }}>ALGORITHM</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: '#9CA3AF', fontSize: '13px', fontWeight: '600' }}>POOL</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: '#9CA3AF', fontSize: '13px', fontWeight: '600' }}>PORT</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: '#9CA3AF', fontSize: '13px', fontWeight: '600' }}>WALLET</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: '#9CA3AF', fontSize: '13px', fontWeight: '600' }}>STATUS</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: '#9CA3AF', fontSize: '13px', fontWeight: '600' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {pools.map(pool => (
                    <tr key={pool.id} style={{ borderBottom: '1px solid #374151' }}>
                      <td style={{ padding: '16px', color: 'white', fontWeight: '500' }}>{pool.algorithm_name}</td>
                      <td style={{ padding: '16px', color: '#9CA3AF', fontSize: '14px', fontFamily: 'monospace' }}>{pool.pool_host}</td>
                      <td style={{ padding: '16px', color: '#9CA3AF' }}>{pool.pool_port}</td>
                      <td style={{ padding: '16px', color: '#9CA3AF', fontSize: '12px', fontFamily: 'monospace', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {pool.wallet_address?.substring(0, 20)}...
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ padding: '4px 12px', background: pool.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: pool.active ? '#10B981' : '#EF4444', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                          {pool.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <button 
                          onClick={() => setEditingPool(pool)}
                          style={{ padding: '8px 16px', background: 'rgba(0, 229, 255, 0.1)', border: '1px solid #00E5FF', color: '#00E5FF', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Edit Pool Modal */}
        {editingPool && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
            <div style={{ background: '#141825', border: '1px solid #374151', borderRadius: '16px', padding: '32px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '24px' }}>
                Edit Pool Configuration
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                updatePool(editingPool.id, {
                  algorithm_id: editingPool.algorithm_id,
                  pool_host: formData.get('pool_host'),
                  pool_port: Number(formData.get('pool_port')),
                  wallet_address: formData.get('wallet_address'),
                  worker_name: formData.get('worker_name'),
                  password: formData.get('password'),
                  vardiff_min: Number(formData.get('vardiff_min')),
                  vardiff_max: Number(formData.get('vardiff_max'))
                })
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>Pool Host</label>
                  <input name="pool_host" defaultValue={editingPool.pool_host} style={{ width: '100%', padding: '12px', background: '#1E2330', border: '1px solid #374151', borderRadius: '8px', color: 'white', fontSize: '14px' }} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>Pool Port</label>
                  <input name="pool_port" type="number" defaultValue={editingPool.pool_port} style={{ width: '100%', padding: '12px', background: '#1E2330', border: '1px solid #374151', borderRadius: '8px', color: 'white', fontSize: '14px' }} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>Wallet Address</label>
                  <input name="wallet_address" defaultValue={editingPool.wallet_address} style={{ width: '100%', padding: '12px', background: '#1E2330', border: '1px solid #374151', borderRadius: '8px', color: 'white', fontSize: '14px', fontFamily: 'monospace' }} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>Worker Name</label>
                  <input name="worker_name" defaultValue={editingPool.worker_name} style={{ width: '100%', padding: '12px', background: '#1E2330', border: '1px solid #374151', borderRadius: '8px', color: 'white', fontSize: '14px' }} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>Password</label>
                  <input name="password" defaultValue={editingPool.password} style={{ width: '100%', padding: '12px', background: '#1E2330', border: '1px solid #374151', borderRadius: '8px', color: 'white', fontSize: '14px' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>Vardiff Min</label>
                    <input name="vardiff_min" type="number" defaultValue={editingPool.vardiff_min} style={{ width: '100%', padding: '12px', background: '#1E2330', border: '1px solid #374151', borderRadius: '8px', color: 'white', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>Vardiff Max</label>
                    <input name="vardiff_max" type="number" defaultValue={editingPool.vardiff_max} style={{ width: '100%', padding: '12px', background: '#1E2330', border: '1px solid #374151', borderRadius: '8px', color: 'white', fontSize: '14px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #00E5FF, #00B8CC)', color: '#0B0F1C', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                    Save Changes
                  </button>
                  <button type="button" onClick={() => setEditingPool(null)} style={{ flex: 1, padding: '14px', background: '#1E2330', border: '1px solid #374151', color: '#9CA3AF', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Complete Payment Modal */}
        {completingPayment && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
            <div style={{ background: '#141825', border: '1px solid #374151', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '100%' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '24px' }}>
                Complete Payment
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const txHash = formData.get('tx_hash') as string
                completePayment(completingPayment.id, txHash)
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: '#9CA3AF', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>Transaction Hash (BEP20)</label>
                  <input 
                    name="tx_hash" 
                    placeholder="0x..." 
                    required
                    style={{ width: '100%', padding: '12px', background: '#1E2330', border: '1px solid #374151', borderRadius: '8px', color: 'white', fontSize: '14px', fontFamily: 'monospace' }} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                    Complete Payment
                  </button>
                  <button type="button" onClick={() => setCompletingPayment(null)} style={{ flex: 1, padding: '14px', background: '#1E2330', border: '1px solid #374151', color: '#9CA3AF', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
