import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { useWallet } from '../context/WalletContext'

export default function Dashboard() {
  const { user, wallet, isConnected, refreshUser } = useWallet()
  const [listings, setListings] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    if (!wallet) return
    api.getMyListings(wallet).then(setListings).catch(() => {})
    api.getNotifications(wallet, true).then(setNotifications).catch(() => {})
  }, [wallet])

  if (!isConnected || !user) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
        <h2 style={{ color: '#fff' }}>Connect Wallet</h2>
        <p style={{ color: '#666' }}>Connect your wallet to see your dashboard.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 24px' }}>Dashboard</h1>

      {/* Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Available', value: user.balance_available, color: '#22c55e', icon: '💰' },
          { label: 'In Escrow', value: user.balance_escrow, color: '#eab308', icon: '🔒' },
          { label: 'Total Earned', value: user.total_earned, color: '#ffb400', icon: '📈' },
          { label: 'Total Spent', value: user.total_spent, color: '#3b82f6', icon: '📉' },
        ].map((card, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#555', fontSize: 12 }}>{card.label}</span>
              <span style={{ fontSize: 18 }}>{card.icon}</span>
            </div>
            <div style={{ color: card.color, fontSize: 24, fontWeight: 700 }}>
              ${Number(card.value || 0).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Orders (Buyer)', value: user.total_orders_as_buyer },
          { label: 'Orders (Seller)', value: user.total_orders_as_seller },
          { label: 'Seller Rating', value: `${(user.seller_rating || 0).toFixed(1)} ★` },
          { label: 'Buyer Rating', value: `${(user.buyer_rating || 0).toFixed(1)} ★` },
          { label: 'Disputes Won', value: user.disputes_won },
          { label: 'Status', value: user.is_verified ? '✅ Verified' : '⏳ Unverified' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8, padding: 14, textAlign: 'center',
          }}>
            <div style={{ color: '#555', fontSize: 11 }}>{s.label}</div>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* My Listings */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ color: '#fff', fontSize: 16, margin: 0 }}>My Listings</h3>
            <Link to="/sell" style={{ color: '#ffb400', fontSize: 13, textDecoration: 'none' }}>+ New</Link>
          </div>
          {listings.length === 0 ? (
            <p style={{ color: '#555', fontSize: 13 }}>No listings yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {listings.slice(0, 5).map((l: any) => (
                <Link to={`/listing/${l.id}`} key={l.id} style={{
                  textDecoration: 'none', display: 'flex', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.02)',
                }}>
                  <div>
                    <span style={{ color: '#fff', fontSize: 13 }}>{l.title}</span>
                    <span style={{ color: '#555', fontSize: 11, marginLeft: 8 }}>{l.algorithm}</span>
                  </div>
                  <span style={{
                    color: l.status === 'active' ? '#22c55e' : l.status === 'rented' ? '#eab308' : '#888',
                    fontSize: 11, textTransform: 'uppercase',
                  }}>{l.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: 20,
        }}>
          <h3 style={{ color: '#fff', fontSize: 16, margin: '0 0 16px' }}>
            Notifications {notifications.length > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 11, marginLeft: 8 }}>
                {notifications.length}
              </span>
            )}
          </h3>
          {notifications.length === 0 ? (
            <p style={{ color: '#555', fontSize: 13 }}>No new notifications</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {notifications.slice(0, 8).map((n: any) => (
                <div key={n.id} style={{
                  padding: '8px 12px', borderRadius: 6, background: 'rgba(255,180,0,0.03)',
                  borderLeft: '3px solid #ffb400',
                }}>
                  <div style={{ color: '#fff', fontSize: 13 }}>{n.title}</div>
                  <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>{n.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <Link to="/marketplace" style={{
          flex: 1, textAlign: 'center', padding: '14px 20px', borderRadius: 10,
          background: 'linear-gradient(135deg, #ffb400, #ff6b00)',
          color: '#000', fontWeight: 600, textDecoration: 'none',
        }}>Browse Marketplace</Link>
        <Link to="/orders" style={{
          flex: 1, textAlign: 'center', padding: '14px 20px', borderRadius: 10,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff', fontWeight: 600, textDecoration: 'none',
        }}>View Orders</Link>
      </div>
    </div>
  )
}
