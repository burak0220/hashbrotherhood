import { useState, useEffect } from 'react'
import { api } from '../services/api'

export default function AdminPanel() {
  const [tab, setTab] = useState<'dashboard' | 'review' | 'disputes' | 'orders' | 'users'>('dashboard')
  const [stats, setStats] = useState<any>(null)
  const [reviewQueue, setReviewQueue] = useState<any[]>([])
  const [disputes, setDisputes] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [actionNote, setActionNote] = useState('')
  const [partialPercent, setPartialPercent] = useState(100)

  const refresh = () => {
    api.adminDashboard().then(setStats).catch(() => {})
    api.adminReviewQueue().then(setReviewQueue).catch(() => {})
    api.adminDisputes('open').then(setDisputes).catch(() => {})
    api.adminOrders().then(setOrders).catch(() => {})
    api.adminUsers().then(setUsers).catch(() => {})
  }

  useEffect(() => { refresh() }, [])

  const handleOrderAction = async (orderId: number, action: string) => {
    try {
      await api.adminOrderAction(orderId, {
        action,
        payout_percent: action === 'partial' ? partialPercent : undefined,
        note: actionNote || undefined,
      })
      setActionNote('')
      refresh()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDisputeResolve = async (disputeId: number, resolution: string) => {
    try {
      await api.adminResolveDispute(disputeId, {
        resolution,
        payout_percent: resolution === 'partial' ? partialPercent : undefined,
        note: actionNote || undefined,
      })
      setActionNote('')
      refresh()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const tabStyle = (t: string) => ({
    background: tab === t ? 'rgba(255,180,0,0.15)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${tab === t ? 'rgba(255,180,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
    borderRadius: 8, padding: '8px 20px', fontSize: 13, cursor: 'pointer' as const,
    color: tab === t ? '#ffb400' : '#888',
  })

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 24px' }}>⚙️ Admin Panel</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['dashboard', 'review', 'disputes', 'orders', 'users'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>
            {t === 'review' ? `Review (${reviewQueue.length})` :
             t === 'disputes' ? `Disputes (${disputes.length})` :
             t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* DASHBOARD TAB */}
      {tab === 'dashboard' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { label: 'Active Orders', value: stats.active_orders, color: '#22c55e' },
            { label: 'Pending Review', value: stats.pending_review, color: '#eab308' },
            { label: 'Open Disputes', value: stats.open_disputes, color: '#f97316' },
            { label: "Today's Commission", value: `$${Number(stats.today_commission || 0).toFixed(2)}`, color: '#ffb400' },
            { label: 'Total Users', value: stats.total_users, color: '#3b82f6' },
            { label: 'Total Volume', value: `$${Number(stats.total_volume || 0).toFixed(2)}`, color: '#a855f7' },
            { label: 'Pending Withdrawals', value: stats.pending_withdrawals, color: '#ef4444' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: 20,
            }}>
              <div style={{ color: '#555', fontSize: 12 }}>{s.label}</div>
              <div style={{ color: s.color, fontSize: 28, fontWeight: 700, marginTop: 4 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* REVIEW TAB */}
      {tab === 'review' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reviewQueue.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>No orders pending review</div>
          ) : reviewQueue.map((order: any) => (
            <div key={order.id} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{order.order_code}</span>
                  <span style={{ color: '#666', marginLeft: 12 }}>{order.listing_title}</span>
                </div>
                <span style={{ color: '#ffb400', fontWeight: 600 }}>${Number(order.total_paid).toFixed(2)}</span>
              </div>

              {/* Proxy stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { l: 'Hashrate', v: `${Number(order.avg_hashrate || 0).toFixed(2)} ${order.hashrate_unit}` },
                  { l: 'Accuracy', v: `${Number(order.hashrate_accuracy || 0).toFixed(1)}%` },
                  { l: 'Uptime', v: `${Number(order.uptime_percent || 0).toFixed(1)}%` },
                  { l: 'Accepted', v: order.shares_accepted || 0 },
                  { l: 'Rejected', v: order.shares_rejected || 0 },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ color: '#555', fontSize: 10 }}>{s.l}</div>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* Buyer / Seller */}
              <div style={{ display: 'flex', gap: 24, marginBottom: 16, fontSize: 12 }}>
                <div>
                  <span style={{ color: '#555' }}>Buyer: </span>
                  <span style={{ color: '#3b82f6' }}>{order.buyer_name || order.buyer_wallet?.slice(0, 10)}</span>
                </div>
                <div>
                  <span style={{ color: '#555' }}>Seller: </span>
                  <span style={{ color: '#22c55e' }}>{order.seller_name || order.seller_wallet?.slice(0, 10)}</span>
                </div>
              </div>

              {/* Action area */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input placeholder="Admin note (optional)" value={actionNote}
                  onChange={e => setActionNote(e.target.value)}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#fff', outline: 'none',
                  }}
                />
                <input type="number" placeholder="%" value={partialPercent} min={0} max={100}
                  onChange={e => setPartialPercent(Number(e.target.value))}
                  style={{
                    width: 60, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6, padding: '8px', fontSize: 12, color: '#fff', textAlign: 'center', outline: 'none',
                  }}
                />
                <button onClick={() => handleOrderAction(order.id, 'approve')} style={{
                  background: '#22c55e', border: 'none', borderRadius: 6,
                  padding: '8px 16px', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}>✅ Approve</button>
                <button onClick={() => handleOrderAction(order.id, 'partial')} style={{
                  background: '#eab308', border: 'none', borderRadius: 6,
                  padding: '8px 16px', color: '#000', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}>⚖️ Partial</button>
                <button onClick={() => handleOrderAction(order.id, 'reject')} style={{
                  background: '#ef4444', border: 'none', borderRadius: 6,
                  padding: '8px 16px', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}>❌ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DISPUTES TAB */}
      {tab === 'disputes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {disputes.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>No open disputes</div>
          ) : disputes.map((d: any) => (
            <div key={d.id} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(249,115,22,0.15)',
              borderRadius: 12, padding: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#f97316', fontWeight: 600 }}>Dispute #{d.id} — {d.order_code}</span>
                <span style={{ color: '#888', fontSize: 12 }}>Opened by: {d.opened_by_name}</span>
              </div>
              <div style={{ color: '#fff', marginBottom: 8 }}>Reason: <span style={{ color: '#f97316' }}>{d.reason}</span></div>
              {d.description && <div style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>{d.description}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                <div><div style={{ color: '#555', fontSize: 10 }}>Avg Hashrate</div><div style={{ color: '#fff', fontSize: 13 }}>{Number(d.proxy_avg_hashrate || 0).toFixed(2)}</div></div>
                <div><div style={{ color: '#555', fontSize: 10 }}>Uptime</div><div style={{ color: '#fff', fontSize: 13 }}>{Number(d.proxy_uptime_percent || 0).toFixed(1)}%</div></div>
                <div><div style={{ color: '#555', fontSize: 10 }}>Total Shares</div><div style={{ color: '#fff', fontSize: 13 }}>{d.proxy_total_shares || 0}</div></div>
                <div><div style={{ color: '#555', fontSize: 10 }}>Order Total</div><div style={{ color: '#ffb400', fontSize: 13 }}>${Number(d.total_paid || 0).toFixed(2)}</div></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleDisputeResolve(d.id, 'full_refund')} style={{
                  background: '#3b82f6', border: 'none', borderRadius: 6, padding: '8px 14px',
                  color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}>Full Refund</button>
                <button onClick={() => handleDisputeResolve(d.id, 'full_payout')} style={{
                  background: '#22c55e', border: 'none', borderRadius: 6, padding: '8px 14px',
                  color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}>Full Payout</button>
                <button onClick={() => handleDisputeResolve(d.id, 'partial')} style={{
                  background: '#eab308', border: 'none', borderRadius: 6, padding: '8px 14px',
                  color: '#000', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}>Partial ({partialPercent}%)</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ORDERS TAB */}
      {tab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {orders.map((o: any) => (
            <div key={o.id} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8, padding: '12px 16px',
              display: 'grid', gridTemplateColumns: '120px 1fr 100px 80px 80px 80px',
              alignItems: 'center', gap: 12, fontSize: 13,
            }}>
              <span style={{ color: '#fff', fontWeight: 600 }}>{o.order_code}</span>
              <span style={{ color: '#888' }}>{o.listing_title}</span>
              <span style={{ color: '#ffb400' }}>${Number(o.total_paid).toFixed(2)}</span>
              <span style={{ color: '#fff' }}>{o.algorithm}</span>
              <span style={{ color: '#fff' }}>{o.hours}h</span>
              <span style={{
                color: o.status === 'completed' ? '#22c55e' : o.status === 'active' ? '#3b82f6' : '#888',
                textTransform: 'uppercase', fontSize: 11, fontWeight: 600,
              }}>{o.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* USERS TAB */}
      {tab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {users.map((u: any) => (
            <div key={u.id} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8, padding: '12px 16px',
              display: 'grid', gridTemplateColumns: '40px 1fr 100px 100px 80px 80px',
              alignItems: 'center', gap: 12, fontSize: 13,
            }}>
              <span style={{ color: '#555' }}>#{u.id}</span>
              <div>
                <span style={{ color: '#fff' }}>{u.username || u.wallet_address?.slice(0, 14) + '...'}</span>
                {u.is_verified && <span style={{ marginLeft: 6 }}>✅</span>}
                {u.is_banned && <span style={{ color: '#ef4444', marginLeft: 6 }}>BANNED</span>}
              </div>
              <span style={{ color: '#22c55e' }}>${Number(u.balance_available || 0).toFixed(2)}</span>
              <span style={{ color: '#ffb400' }}>★ {Number(u.seller_rating || 0).toFixed(1)}</span>
              <span style={{ color: '#888' }}>{u.total_orders_as_buyer}B / {u.total_orders_as_seller}S</span>
              {!u.is_banned ? (
                <button onClick={() => api.adminBanUser(u.id, 'Admin ban').then(refresh)} style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 4, padding: '4px 8px', color: '#ef4444', fontSize: 11, cursor: 'pointer',
                }}>Ban</button>
              ) : (
                <span style={{ color: '#ef4444', fontSize: 11 }}>Banned</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
