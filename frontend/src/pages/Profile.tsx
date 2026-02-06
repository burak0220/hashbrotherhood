import { useState } from 'react'
import { api } from '../services/api'
import { useWallet } from '../context/WalletContext'

export default function Profile() {
  const { user, wallet, isConnected, refreshUser } = useWallet()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', bio: '' })

  const startEdit = () => {
    if (user) setForm({ username: user.username || '', email: user.email || '', bio: '' })
    setEditing(true)
  }

  const saveProfile = async () => {
    if (!wallet) return
    await api.put(`/auth/profile/${wallet}`, form)
    await refreshUser()
    setEditing(false)
  }

  if (!isConnected || !user) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <h2 style={{ color: '#fff' }}>Connect Wallet</h2>
      </div>
    )
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    padding: '10px 14px', fontSize: 14, color: '#fff',
    boxSizing: 'border-box' as const, outline: 'none',
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 24px' }}>Profile</h1>

      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, padding: 28,
      }}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #ffb400, #ff6b00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: '#000',
          }}>
            {(user.username || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 600 }}>
              {user.username || 'Anonymous'}
              {user.is_verified && ' ✅'}
            </div>
            <div style={{ color: '#666', fontSize: 13, fontFamily: 'monospace' }}>
              {user.wallet_address}
            </div>
          </div>
        </div>

        {editing ? (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 6 }}>Username</label>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 6 }}>Email</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveProfile} style={{
                background: '#ffb400', border: 'none', borderRadius: 8,
                padding: '10px 24px', color: '#000', fontWeight: 600, cursor: 'pointer',
              }}>Save</button>
              <button onClick={() => setEditing(false)} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '10px 24px', color: '#888', cursor: 'pointer',
              }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { l: 'Seller Rating', v: `${(user.seller_rating || 0).toFixed(1)} ★ (${user.seller_rating_count})` },
                { l: 'Buyer Rating', v: `${(user.buyer_rating || 0).toFixed(1)} ★ (${user.buyer_rating_count})` },
                { l: 'Orders (Buyer)', v: user.total_orders_as_buyer },
                { l: 'Orders (Seller)', v: user.total_orders_as_seller },
                { l: 'Total Earned', v: `$${Number(user.total_earned || 0).toFixed(2)}` },
                { l: 'Total Spent', v: `$${Number(user.total_spent || 0).toFixed(2)}` },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ color: '#555', fontSize: 11 }}>{s.l}</div>
                  <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginTop: 4 }}>{s.v}</div>
                </div>
              ))}
            </div>
            <button onClick={startEdit} style={{
              marginTop: 20, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
              padding: '10px 24px', color: '#fff', cursor: 'pointer',
            }}>Edit Profile</button>
          </div>
        )}
      </div>
    </div>
  )
}
