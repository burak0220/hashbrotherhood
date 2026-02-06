import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useWallet } from '../context/WalletContext'

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, wallet, isConnected } = useWallet()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    hours: 1,
    pool_host: '',
    pool_port: 3333,
    pool_wallet: '',
    pool_worker: '',
    pool_password: 'x',
  })

  useEffect(() => {
    if (id) {
      api.getListing(Number(id))
        .then(setListing)
        .catch(() => setError('Listing not found'))
        .finally(() => setLoading(false))
    }
  }, [id])

  const subtotal = listing ? (listing.price_per_hour * form.hours) : 0
  const commission = subtotal * 0.03
  const total = subtotal + commission

  const handleOrder = async () => {
    if (!wallet) return
    if (!form.pool_host || !form.pool_wallet) {
      setError('Pool host and wallet are required')
      return
    }

    setOrdering(true)
    setError('')
    try {
      const res = await api.createOrder({
        listing_id: Number(id),
        hours: form.hours,
        pool_host: form.pool_host,
        pool_port: form.pool_port,
        pool_wallet: form.pool_wallet,
        pool_worker: form.pool_worker || undefined,
        pool_password: form.pool_password,
      }, wallet)
      navigate(`/order/${res.order.id}`)
    } catch (err: any) {
      setError(err.message || 'Order failed')
    } finally {
      setOrdering(false)
    }
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: '#555' }}>Loading...</div>
  if (!listing) return <div style={{ padding: 80, textAlign: 'center', color: '#555' }}>Listing not found</div>

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 14,
    color: '#fff',
    boxSizing: 'border-box' as const,
    outline: 'none',
  }

  const labelStyle = { color: '#888', fontSize: 12, marginBottom: 6, display: 'block' }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
        {/* Left: Listing Info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{
              background: 'rgba(255,180,0,0.1)', color: '#ffb400',
              padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            }}>{listing.algorithm}</span>
            {listing.is_online && (
              <span style={{ color: '#22c55e', fontSize: 12 }}>● Online</span>
            )}
            {listing.verification_status === 'verified' && (
              <span style={{ color: '#22c55e', fontSize: 12 }}>✓ Verified</span>
            )}
          </div>

          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>{listing.title}</h1>
          {listing.description && (
            <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6 }}>{listing.description}</p>
          )}

          {/* Stats Grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: 20,
          }}>
            {[
              { label: 'Hashrate', value: `${listing.hashrate} ${listing.hashrate_unit}` },
              { label: 'Price/Hour', value: `$${Number(listing.price_per_hour).toFixed(4)}` },
              { label: 'Duration', value: `${listing.min_hours}h - ${listing.max_hours}h` },
              { label: 'Rentals', value: listing.total_rentals || 0 },
              { label: 'Avg Uptime', value: `${listing.avg_uptime_percent || 0}%` },
              { label: 'Hardware', value: listing.hardware_info || 'Not specified' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ color: '#555', fontSize: 11 }}>{s.label}</div>
                <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginTop: 4 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Seller Info */}
          <div style={{
            marginTop: 20, background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: 20,
          }}>
            <h3 style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>Seller</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(255,180,0,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ffb400', fontWeight: 700, fontSize: 16,
              }}>{(listing.seller_name || 'U')[0].toUpperCase()}</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 600 }}>
                  {listing.seller_name || listing.seller_wallet?.slice(0, 12) + '...'}
                  {listing.seller_verified && ' ✅'}
                </div>
                <div style={{ color: '#ffb400', fontSize: 13 }}>
                  {'★'.repeat(Math.round(listing.seller_rating || 0))}
                  {'☆'.repeat(5 - Math.round(listing.seller_rating || 0))}
                  <span style={{ color: '#555', marginLeft: 6 }}>({listing.seller_rating_count || 0} reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Form */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: 24,
          position: 'sticky',
          top: 80,
        }}>
          <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600, margin: '0 0 20px' }}>Rent This Rig</h3>

          {/* Hours */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Duration (hours)</label>
            <input type="number" min={listing.min_hours} max={listing.max_hours}
              value={form.hours}
              onChange={e => setForm(f => ({ ...f, hours: Number(e.target.value) }))}
              style={inputStyle}
            />
            <div style={{ color: '#555', fontSize: 11, marginTop: 4 }}>
              Min {listing.min_hours}h — Max {listing.max_hours}h
            </div>
          </div>

          {/* Pool Host */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Pool Host *</label>
            <input placeholder="stratum+tcp://btc.f2pool.com"
              value={form.pool_host}
              onChange={e => setForm(f => ({ ...f, pool_host: e.target.value }))}
              style={inputStyle}
            />
          </div>

          {/* Pool Port */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Pool Port</label>
            <input type="number" value={form.pool_port}
              onChange={e => setForm(f => ({ ...f, pool_port: Number(e.target.value) }))}
              style={inputStyle}
            />
          </div>

          {/* Wallet */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Mining Wallet Address *</label>
            <input placeholder="Your mining wallet for this coin"
              value={form.pool_wallet}
              onChange={e => setForm(f => ({ ...f, pool_wallet: e.target.value }))}
              style={inputStyle}
            />
          </div>

          {/* Worker (optional) */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Worker Name (optional)</label>
            <input placeholder="worker1"
              value={form.pool_worker}
              onChange={e => setForm(f => ({ ...f, pool_worker: e.target.value }))}
              style={inputStyle}
            />
          </div>

          {/* Price Breakdown */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#888', fontSize: 13 }}>Subtotal ({form.hours}h × ${Number(listing.price_per_hour).toFixed(4)})</span>
              <span style={{ color: '#fff', fontSize: 13 }}>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#888', fontSize: 13 }}>Platform Fee (3%)</span>
              <span style={{ color: '#fff', fontSize: 13 }}>${commission.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)',
            }}>
              <span style={{ color: '#ffb400', fontSize: 15, fontWeight: 700 }}>Total</span>
              <span style={{ color: '#ffb400', fontSize: 15, fontWeight: 700 }}>${total.toFixed(2)} USDT</span>
            </div>
          </div>

          {/* Balance check */}
          {isConnected && user && (
            <div style={{
              fontSize: 12, marginBottom: 12,
              color: user.balance_available >= total ? '#22c55e' : '#ef4444',
            }}>
              Balance: ${Number(user.balance_available).toFixed(2)} USDT
              {user.balance_available < total && ' — Insufficient funds'}
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, padding: '8px 12px', marginBottom: 12,
              color: '#ef4444', fontSize: 13,
            }}>{error}</div>
          )}

          <button
            onClick={handleOrder}
            disabled={!isConnected || ordering || (user ? user.balance_available < total : true)}
            style={{
              width: '100%',
              background: isConnected ? 'linear-gradient(135deg, #ffb400, #ff6b00)' : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 10,
              padding: '14px 20px',
              fontSize: 16,
              fontWeight: 700,
              color: isConnected ? '#000' : '#555',
              cursor: isConnected ? 'pointer' : 'not-allowed',
            }}
          >
            {!isConnected ? 'Connect Wallet First' : ordering ? 'Processing...' : `Rent for $${total.toFixed(2)} USDT`}
          </button>

          <p style={{ color: '#555', fontSize: 11, textAlign: 'center', marginTop: 12 }}>
            🔒 USDT held in escrow until admin approval
          </p>
        </div>
      </div>
    </div>
  )
}
