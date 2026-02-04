import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

export default function Navigation() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const links = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/calculator', label: 'Calculator', icon: '🧮' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/guide', label: 'Guide', icon: '📚' },
    { path: '/admin', label: 'Admin', icon: '⚙️' }
  ]

  return (
    <nav style={{ background: 'linear-gradient(180deg, #141825 0%, #1a1f2e 100%)', borderBottom: '1px solid #374151', padding: '16px 0', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px', transition: 'transform 0.3s' }} 
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <img 
              src="/logo.png" 
              alt="HashBrotherhood" 
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 229, 255, 0.4)',
                objectFit: 'cover'
              }} 
            />
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', background: 'linear-gradient(135deg, #00E5FF, #00B8CC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>HashBrotherhood</div>
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '500', letterSpacing: '0.5px' }}>PROFESSIONAL MINING</div>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div style={{ display: 'none', gap: '4px', alignItems: 'center', background: '#1E2330', padding: '6px', borderRadius: '12px', border: '1px solid #374151' }} className="desktop-menu">
            {links.map(link => (
              <Link 
                key={link.path}
                to={link.path}
                style={{
                  textDecoration: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: location.pathname === link.path ? '#00E5FF' : '#9CA3AF',
                  background: location.pathname === link.path ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                  boxShadow: location.pathname === link.path ? '0 2px 8px rgba(0, 229, 255, 0.2)' : 'none'
                }}>
                <span style={{ fontSize: '16px' }}>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            style={{ 
              display: 'none', 
              background: mobileMenuOpen ? 'rgba(0, 229, 255, 0.1)' : '#1E2330', 
              border: '1px solid #374151', 
              color: '#00E5FF', 
              fontSize: '24px', 
              cursor: 'pointer', 
              padding: '10px 14px',
              borderRadius: '8px',
              transition: 'all 0.3s'
            }}>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #374151' }}>
            {links.map(link => (
              <Link 
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  textDecoration: 'none',
                  padding: '16px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: location.pathname === link.path ? '#00E5FF' : '#9CA3AF',
                  background: location.pathname === link.path ? 'rgba(0, 229, 255, 0.15)' : '#1E2330',
                  border: location.pathname === link.path ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid #374151'
                }}>
                <span style={{ fontSize: '20px' }}>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-menu { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
        @media (max-width: 767px) {
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  )
}
