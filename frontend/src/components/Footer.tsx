import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.05)',
      padding: '40px 24px',
      background: '#0a0a0f',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 32,
      }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
            Hash<span style={{ color: '#ffb400' }}>Market</span>
          </div>
          <p style={{ color: '#555', fontSize: 13, maxWidth: 280 }}>
            Mining hashrate marketplace. Rent or sell hashpower with escrow protection.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 48 }}>
          <div>
            <h4 style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Platform</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/marketplace" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>Marketplace</Link>
              <Link to="/sell" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>Sell Hashrate</Link>
              <Link to="/dashboard" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>Dashboard</Link>
            </div>
          </div>
          <div>
            <h4 style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Info</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ color: '#666', fontSize: 13 }}>Fee: 3%</span>
              <span style={{ color: '#666', fontSize: 13 }}>Payment: USDT (BEP20)</span>
              <span style={{ color: '#666', fontSize: 13 }}>Escrow Protected</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{
        maxWidth: 1280,
        margin: '24px auto 0',
        paddingTop: 24,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        textAlign: 'center',
        color: '#333',
        fontSize: 12,
      }}>
        © 2025 HashMarket. All rights reserved.
      </div>
    </footer>
  )
}
