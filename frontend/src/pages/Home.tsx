import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

export default function Home() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    api.getPlatformStats().then(setStats).catch(() => {})
  }, [])

  const features = [
    { icon: '🔒', title: 'Escrow Protection', desc: 'USDT held in escrow until admin verifies delivery. No risk for buyers.' },
    { icon: '📡', title: 'Real-time Verification', desc: 'Stratum proxy logs every share. Hashrate verified in real-time.' },
    { icon: '⚡', title: 'Low Latency', desc: 'Regional proxy servers (EU/US/Asia). Under 20ms added latency.' },
    { icon: '💰', title: 'USDT Payments', desc: 'Stablecoin payments. No BTC volatility. 3% platform fee.' },
    { icon: '⭐', title: 'Seller Ratings', desc: 'Multi-factor reputation: hashrate accuracy, uptime, buyer reviews.' },
    { icon: '🛡️', title: 'Dispute System', desc: 'Structured dispute process with proxy data as evidence.' },
  ]

  return (
    <div>
      {/* Hero */}
      <section style={{
        padding: '100px 24px 80px',
        textAlign: 'center',
        background: 'radial-gradient(ellipse at center top, rgba(255,180,0,0.08) 0%, transparent 60%)',
      }}>
        <h1 style={{
          color: '#fff',
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 800,
          lineHeight: 1.1,
          margin: '0 auto 20px',
          maxWidth: 700,
        }}>
          Rent Mining Hashrate<br />
          <span style={{ color: '#ffb400' }}>With Escrow Protection</span>
        </h1>
        <p style={{
          color: '#888',
          fontSize: 'clamp(15px, 2vw, 18px)',
          maxWidth: 560,
          margin: '0 auto 40px',
          lineHeight: 1.6,
        }}>
          The first mining marketplace with built-in escrow, real-time proxy verification, 
          and automatic dispute resolution. USDT payments, zero seller friction.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/marketplace" style={{
            background: 'linear-gradient(135deg, #ffb400, #ff6b00)',
            color: '#000',
            padding: '14px 32px',
            borderRadius: 10,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 16,
          }}>
            Browse Hashrate →
          </Link>
          <Link to="/sell" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff',
            padding: '14px 32px',
            borderRadius: 10,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 16,
          }}>
            Sell Your Hashrate
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{
            display: 'flex',
            gap: 32,
            justifyContent: 'center',
            marginTop: 60,
            flexWrap: 'wrap',
          }}>
            {[
              { value: stats.total_listings || 0, label: 'Active Listings' },
              { value: stats.total_completed || 0, label: 'Completed Orders' },
              { value: stats.total_users || 0, label: 'Users' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ color: '#ffb400', fontSize: 32, fontWeight: 800 }}>{s.value}</div>
                <div style={{ color: '#555', fontSize: 13, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section style={{ padding: '60px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 48 }}>
          How It Works
        </h2>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { step: '1', title: 'Browse & Rent', desc: 'Choose a rig by algorithm, hashrate and price. Pay with USDT.' },
            { step: '2', title: 'Escrow Lock', desc: 'Your USDT is held in escrow. Seller connects rig to our proxy.' },
            { step: '3', title: 'Verified Mining', desc: 'Proxy logs every share to your pool. Real-time hashrate tracking.' },
            { step: '4', title: 'Admin Approval', desc: 'Order reviewed. Seller paid on approval, or you get refunded.' },
          ].map((item, i) => (
            <div key={i} style={{
              flex: '1 1 200px',
              maxWidth: 240,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: 24,
              textAlign: 'center',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, #ffb400, #ff6b00)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                fontWeight: 800, fontSize: 18, color: '#000',
              }}>{item.step}</div>
              <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>{item.title}</h3>
              <p style={{ color: '#666', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 24px 80px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 48 }}>
          Why HashMarket?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: 24,
            }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ color: '#666', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section style={{ padding: '40px 24px 80px', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 32 }}>
          vs Competition
        </h2>
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#888' }}>Feature</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', color: '#555' }}>NiceHash</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', color: '#555' }}>MRR</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', color: '#ffb400' }}>HashMarket</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Escrow', '❌', '❌', '✅'],
                ['Real-time Verify', '~', '~', '✅'],
                ['USDT Payment', '❌', '❌', '✅'],
                ['Auto Refund', '❌', '❌', '✅'],
                ['Seller Rating', '❌', 'RPI', '✅'],
                ['Uptime SLA', '❌', '❌', '✅'],
                ['Anti-Reselling', '❌', '❌', '✅'],
                ['Platform Fee', '~2%', '3%', '3%'],
              ].map(([feature, nh, mrr, hm], i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '10px 16px', color: '#aaa' }}>{feature}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: '#666' }}>{nh}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: '#666' }}>{mrr}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>{hm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
