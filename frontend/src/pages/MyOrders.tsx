import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { useWallet } from '../context/WalletContext'

const STATUS_COLORS: Record<string, string> = {
  pending: '#888', paid: '#3b82f6', active: '#22c55e',
  delivering: '#eab308', completed: '#22c55e', cancelled: '#ef4444',
  dispute: '#f97316',
}

export default function MyOrders() {
  const { wallet, isConnected } = useWallet()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'buyer' | 'seller'>('all')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (!wallet) return
    setLoading(true)
    api.getMyOrders(wallet, tab === 'all' ? undefined : tab, statusFilter || undefined)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [wallet, tab, statusFilter])

  if (!isConnected) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
        <h2 style={{ color: '#fff' }}>Connect Wallet</h2>
        <p style={{ color: '#666' }}>Connect your wallet to see your orders.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 24px' }}>My Orders</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'buyer', 'seller'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? 'rgba(255,180,0,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${tab === t ? 'rgba(255,180,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 8, padding: '8px 20px', fontSize: 13,
            color: tab === t ? '#ffb400' : '#888', cursor: 'pointer', textTransform: 'capitalize',
          }}>{t === 'all' ? 'All Orders' : t === 'buyer' ? 'As Buyer' : 'As Seller'}</button>
        ))}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{
            marginLeft: 'auto', background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
            padding: '6px 12px', fontSize: 13, color: '#888',
          }}>
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="active">Active</option>
          <option value="delivering">Delivering</option>
          <option value="completed">Completed</option>
          <option value="dispute">Dispute</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#555' }}>Loading...</div>
      ) : orders.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ color: '#555' }}>No orders found</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map((order: any) => (
            <Link to={`/order/${order.id}`} key={order.id} style={{
              textDecoration: 'none',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: 20,
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
              alignItems: 'center', gap: 16,
            }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{order.order_code}</div>
                <div style={{ color: '#666', fontSize: 12, marginTop: 2 }}>{order.listing_title}</div>
              </div>
              <div>
                <div style={{ color: '#888', fontSize: 11 }}>Hashrate</div>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                  {order.hashrate_ordered} {order.hashrate_unit}
                </div>
              </div>
              <div>
                <div style={{ color: '#888', fontSize: 11 }}>Total</div>
                <div style={{ color: '#ffb400', fontSize: 14, fontWeight: 600 }}>
                  ${Number(order.total_paid).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ color: '#888', fontSize: 11 }}>Duration</div>
                <div style={{ color: '#fff', fontSize: 14 }}>{order.hours}h</div>
              </div>
              <span style={{
                background: `${STATUS_COLORS[order.status] || '#888'}20`,
                color: STATUS_COLORS[order.status] || '#888',
                padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                textTransform: 'uppercase',
              }}>{order.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
