import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useWallet } from '../context/WalletContext'

const ALGO_OPTIONS = [
  { name: 'SHA256', unit: 'TH/s', hw: 'ASIC' },
  { name: 'RandomX', unit: 'KH/s', hw: 'CPU' },
  { name: 'KawPow', unit: 'MH/s', hw: 'GPU' },
  { name: 'Etchash', unit: 'MH/s', hw: 'GPU' },
  { name: 'Autolykos', unit: 'MH/s', hw: 'GPU' },
  { name: 'Scrypt', unit: 'GH/s', hw: 'ASIC' },
  { name: 'Equihash', unit: 'KSol/s', hw: 'GPU/ASIC' },
]

export default function CreateListing() {
  const navigate = useNavigate()
  const { wallet, isConnected } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    algorithm: 'SHA256',
    hashrate: '',
    price_per_hour: '',
    min_hours: 1,
    max_hours: 720,
    hardware_info: '',
    proxy_region: 'eu',
  })

  const selectedAlgo = ALGO_OPTIONS.find(a => a.name === form.algorithm) || ALGO_OPTIONS[0]

  const handleSubmit = async () => {
    if (!wallet) return
    if (!form.title || !form.hashrate || !form.price_per_hour) {
      setError('Title, hashrate and price are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.createListing({
        ...form,
        hashrate: Number(form.hashrate),
        price_per_hour: Number(form.price_per_hour),
        hashrate_unit: selectedAlgo.unit,
      }, wallet)
      navigate(`/listing/${res.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    padding: '10px 14px', fontSize: 14, color: '#fff',
    boxSizing: 'border-box' as const, outline: 'none',
  }
  const labelStyle = { color: '#888', fontSize: 12, marginBottom: 6, display: 'block' }

  if (!isConnected) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
        <h2 style={{ color: '#fff', fontSize: 24 }}>Connect Wallet</h2>
        <p style={{ color: '#666' }}>You need to connect your wallet to create a listing.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Sell Your Hashrate</h1>
      <p style={{ color: '#666', fontSize: 14, margin: '0 0 32px' }}>
        List your mining rig. Buyers rent it, you mine to their pool via our proxy.
      </p>

      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, padding: 28,
      }}>
        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Listing Title *</label>
          <input placeholder="e.g. 2x Antminer S19 XP" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={inputStyle} />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Description</label>
          <textarea placeholder="Describe your rig..." value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        {/* Algorithm */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Algorithm *</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ALGO_OPTIONS.map(algo => (
              <button key={algo.name} onClick={() => setForm(f => ({ ...f, algorithm: algo.name }))}
                style={{
                  background: form.algorithm === algo.name ? 'rgba(255,180,0,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${form.algorithm === algo.name ? 'rgba(255,180,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
                  color: form.algorithm === algo.name ? '#ffb400' : '#888',
                }}>
                {algo.name}
              </button>
            ))}
          </div>
        </div>

        {/* Hashrate + Price */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Hashrate ({selectedAlgo.unit}) *</label>
            <input type="number" placeholder="e.g. 140" value={form.hashrate}
              onChange={e => setForm(f => ({ ...f, hashrate: e.target.value }))}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Price (USDT/hour) *</label>
            <input type="number" step="0.0001" placeholder="e.g. 0.50" value={form.price_per_hour}
              onChange={e => setForm(f => ({ ...f, price_per_hour: e.target.value }))}
              style={inputStyle} />
          </div>
        </div>

        {/* Duration limits */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Min Hours</label>
            <input type="number" min={1} value={form.min_hours}
              onChange={e => setForm(f => ({ ...f, min_hours: Number(e.target.value) }))}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Max Hours</label>
            <input type="number" value={form.max_hours}
              onChange={e => setForm(f => ({ ...f, max_hours: Number(e.target.value) }))}
              style={inputStyle} />
          </div>
        </div>

        {/* Hardware */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Hardware Info</label>
          <input placeholder="e.g. 2x Antminer S19 XP 140TH" value={form.hardware_info}
            onChange={e => setForm(f => ({ ...f, hardware_info: e.target.value }))}
            style={inputStyle} />
        </div>

        {/* Region */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Proxy Region</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'eu', label: '🇪🇺 Europe' },
              { id: 'us1', label: '🇺🇸 US East' },
              { id: 'us2', label: '🇺🇸 US West' },
              { id: 'asia', label: '🌏 Asia' },
            ].map(r => (
              <button key={r.id} onClick={() => setForm(f => ({ ...f, proxy_region: r.id }))}
                style={{
                  background: form.proxy_region === r.id ? 'rgba(255,180,0,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${form.proxy_region === r.id ? 'rgba(255,180,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer',
                  color: form.proxy_region === r.id ? '#ffb400' : '#888',
                }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8, padding: '8px 12px', marginBottom: 16, color: '#ef4444', fontSize: 13,
          }}>{error}</div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', background: 'linear-gradient(135deg, #ffb400, #ff6b00)',
          border: 'none', borderRadius: 10, padding: '14px 20px',
          fontSize: 16, fontWeight: 700, color: '#000', cursor: 'pointer',
        }}>
          {loading ? 'Creating...' : 'Create Listing'}
        </button>
      </div>

      {/* Info box */}
      <div style={{
        marginTop: 24, background: 'rgba(255,180,0,0.05)',
        border: '1px solid rgba(255,180,0,0.1)', borderRadius: 12, padding: 20,
      }}>
        <h3 style={{ color: '#ffb400', fontSize: 14, margin: '0 0 8px' }}>How Selling Works</h3>
        <ol style={{ color: '#888', fontSize: 13, lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
          <li>Create listing with your rig specs</li>
          <li>When someone rents, you'll get a proxy address + worker ID</li>
          <li>Point your miner to the proxy (just change pool address)</li>
          <li>Proxy forwards your shares to buyer's pool</li>
          <li>After rental ends, admin reviews and releases payment to you</li>
        </ol>
      </div>
    </div>
  )
}
