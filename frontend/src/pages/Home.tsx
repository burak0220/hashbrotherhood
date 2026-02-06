import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

// SVG Hardware Icons
const CpuIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
    <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="15" x2="23" y2="15" />
    <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="15" x2="4" y2="15" />
  </svg>
)

const GpuIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="7" cy="12" r="2.5" />
    <circle cx="14" cy="12" r="2.5" />
    <line x1="19" y1="9" x2="19" y2="15" />
    <line x1="5" y1="3" x2="5" y2="6" /><line x1="9" y1="3" x2="9" y2="6" />
    <line x1="13" y1="3" x2="13" y2="6" /><line x1="17" y1="3" x2="17" y2="6" />
  </svg>
)

const AsicIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="5" width="22" height="14" rx="2" />
    <circle cx="6" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="18" cy="12" r="2" />
    <line x1="4" y1="2" x2="4" y2="5" /><line x1="8" y1="2" x2="8" y2="5" />
    <line x1="12" y1="2" x2="12" y2="5" /><line x1="16" y1="2" x2="16" y2="5" /><line x1="20" y1="2" x2="20" y2="5" />
    <line x1="6" y1="19" x2="6" y2="22" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="18" y1="19" x2="18" y2="22" />
  </svg>
)

const ALGO_INFO: any = {
  'RandomX': {
    coin: 'Monero (XMR)',
    hardware: 'CPU / ASIC',
    icons: ['cpu', 'asic'],
    color: '#FF6600',
    badgeColor: 'rgba(255, 102, 0, 0.15)',
    badgeText: '#FF6600'
  },
  'KawPow': {
    coin: 'Ravencoin (RVN)',
    hardware: 'GPU',
    icons: ['gpu'],
    color: '#8B5CF6',
    badgeColor: 'rgba(139, 92, 246, 0.15)',
    badgeText: '#8B5CF6'
  },
  'Etchash': {
    coin: 'Ethereum Classic (ETC)',
    hardware: 'ASIC',
    icons: ['asic'],
    color: '#3AB83A',
    badgeColor: 'rgba(58, 184, 58, 0.15)',
    badgeText: '#3AB83A'
  },
  'Scrypt': {
    coin: 'Litecoin (LTC)',
    hardware: 'ASIC',
    icons: ['asic'],
    color: '#345D9D',
    badgeColor: 'rgba(52, 93, 157, 0.15)',
    badgeText: '#345D9D'
  },
  'SHA256': {
    coin: 'Bitcoin (BTC)',
    hardware: 'ASIC',
    icons: ['asic'],
    color: '#F7931A',
    badgeColor: 'rgba(247, 147, 26, 0.15)',
    badgeText: '#F7931A'
  },
  'Autolykos': {
    coin: 'Ergo (ERG)',
    hardware: 'GPU',
    icons: ['gpu'],
    color: '#FF5722',
    badgeColor: 'rgba(255, 87, 34, 0.15)',
    badgeText: '#FF5722'
  }
}

const renderIcon = (type: string) => {
  if (type === 'cpu') return <CpuIcon />
  if (type === 'gpu') return <GpuIcon />
  if (type === 'asic') return <AsicIcon />
  return null
}

export default function Home() {
  const [algorithms, setAlgorithms] = useState<any[]>([])

  useEffect(() => {
    fetch('http://localhost:8000/api/algorithms')
      .then(res => res.json())
      .then(data => setAlgorithms(data.algorithms || []))
      .catch(err => console.error(err))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0B0F1C 0%, #141825 50%, #1E2330 100%)' }}>
      {/* HERO SECTION */}
      <div style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(0, 229, 255, 0.1) 0%, transparent 50%)',
          animation: 'pulse 4s ease-in-out infinite'
        }} />

        <div style={{
          position: 'relative', zIndex: 2, marginBottom: '40px',
          animation: 'fadeInDown 1s ease-out'
        }}>
          <img src="/logo.png" alt="HashBrotherhood" style={{
            width: '200px', height: '200px', borderRadius: '30px',
            boxShadow: '0 20px 60px rgba(0, 229, 255, 0.4), 0 0 100px rgba(0, 229, 255, 0.2)',
            filter: 'drop-shadow(0 0 30px rgba(0, 229, 255, 0.5))',
            animation: 'float 3s ease-in-out infinite'
          }} />
        </div>

        <h1 style={{
          fontSize: '56px', fontWeight: 'bold',
          background: 'linear-gradient(135deg, #00E5FF, #00B8CC, #8B5CF6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '24px', letterSpacing: '-2px',
          position: 'relative', zIndex: 2,
          animation: 'fadeInUp 1s ease-out 0.2s backwards'
        }}>
          HashBrotherhood
        </h1>

        <p style={{
          fontSize: '24px', color: '#9CA3AF', marginBottom: '48px',
          maxWidth: '600px', position: 'relative', zIndex: 2,
          animation: 'fadeInUp 1s ease-out 0.4s backwards'
        }}>
          Mine Any Algorithm, Earn USDT Automatically
        </p>

        <Link to="/calculator" style={{
          textDecoration: 'none', padding: '24px 64px', fontSize: '28px', fontWeight: 'bold',
          background: 'linear-gradient(135deg, #00E5FF, #00B8CC)', color: '#0B0F1C',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0, 229, 255, 0.4), 0 0 60px rgba(0, 229, 255, 0.2)',
          transition: 'all 0.3s ease', position: 'relative', zIndex: 2,
          animation: 'fadeInUp 1s ease-out 0.6s backwards, glowBtn 2s ease-in-out infinite',
          display: 'inline-block'
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)'
            e.currentTarget.style.boxShadow = '0 15px 50px rgba(0, 229, 255, 0.6), 0 0 80px rgba(0, 229, 255, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 229, 255, 0.4), 0 0 60px rgba(0, 229, 255, 0.2)'
          }}
        >
          ⚡ START MINING NOW
        </Link>

        <div style={{
          display: 'flex', gap: '48px', marginTop: '64px',
          position: 'relative', zIndex: 2,
          animation: 'fadeInUp 1s ease-out 0.8s backwards'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#00E5FF', marginBottom: '8px' }}>{algorithms.length}</div>
            <div style={{ fontSize: '14px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Algorithms</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#8B5CF6', marginBottom: '8px' }}>10 USDT</div>
            <div style={{ fontSize: '14px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Min Payout</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10B981', marginBottom: '8px' }}>BEP20</div>
            <div style={{ fontSize: '14px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Network</div>
          </div>
        </div>
      </div>

      {/* HASHMARKET BANNER */}
      <div style={{
        maxWidth: '600px', margin: '0 auto', padding: '0 20px',
        position: 'relative', zIndex: 3,
        animation: 'fadeInUp 1s ease-out 1s backwards'
      }}>
        <Link to="/hashmarket" style={{
          textDecoration: 'none',
          display: 'block',
          padding: '40px 28px',
          background: 'linear-gradient(135deg, #1A0A3E 0%, #0D1B3E 40%, #0A1628 100%)',
          border: '2px solid rgba(139, 92, 246, 0.4)',
          borderRadius: '24px',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.4s ease',
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(139, 92, 246, 0.2)'
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-6px)'
            e.currentTarget.style.borderColor = '#8B5CF6'
            e.currentTarget.style.boxShadow = '0 30px 80px rgba(139, 92, 246, 0.35), 0 0 60px rgba(0, 229, 255, 0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)'
            e.currentTarget.style.boxShadow = '0 0 30px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(139, 92, 246, 0.2)'
          }}
        >
          {/* Animated background */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle at 30% 40%, rgba(139, 92, 246, 0.2) 0%, transparent 60%), radial-gradient(circle at 70% 60%, rgba(0, 229, 255, 0.15) 0%, transparent 60%)',
            animation: 'marketBg 6s ease-in-out infinite alternate'
          }} />
          <div style={{
            position: 'absolute', top: 0, left: '-100%', width: '300%', height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.08), rgba(0, 229, 255, 0.08), transparent)',
            animation: 'shimmer 4s linear infinite'
          }} />

          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>

            {/* Handshake emoji with glow */}
            <div style={{
              fontSize: '64px', marginBottom: '16px',
              filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.6))',
              animation: 'handshakeBounce 3s ease-in-out infinite'
            }}>
              🤝
            </div>

            {/* Title */}
            <h3 style={{
              fontSize: '36px', fontWeight: '800', margin: '0 0 8px',
              background: 'linear-gradient(135deg, #A78BFA, #00E5FF)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-1px'
            }}>
              ⚡ HashMarket
            </h3>

            {/* Subtitle */}
            <p style={{
              fontSize: '20px', color: '#C4B5FD', margin: '0 0 8px',
              fontWeight: '600'
            }}>
              P2P Hashpower Marketplace
            </p>
            <p style={{
              fontSize: '16px', color: '#8B9CC8', margin: '0 0 24px'
            }}>
              Buy & Sell Mining Power Securely with HBT Token
            </p>

            {/* Feature badges */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '10px',
              marginBottom: '28px', flexWrap: 'wrap'
            }}>
              <span style={{
                fontSize: '14px', padding: '8px 16px',
                background: 'rgba(139, 92, 246, 0.2)', color: '#A78BFA',
                borderRadius: '12px', fontWeight: '600',
                border: '1px solid rgba(139, 92, 246, 0.3)'
              }}>🔒 Escrow</span>
              <span style={{
                fontSize: '14px', padding: '8px 16px',
                background: 'rgba(0, 229, 255, 0.15)', color: '#00E5FF',
                borderRadius: '12px', fontWeight: '600',
                border: '1px solid rgba(0, 229, 255, 0.3)'
              }}>🪙 HBT Token</span>
              <span style={{
                fontSize: '14px', padding: '8px 16px',
                background: 'rgba(16, 185, 129, 0.15)', color: '#10B981',
                borderRadius: '12px', fontWeight: '600',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>⚡ Instant P2P</span>
            </div>

            {/* CTA Button */}
            <div style={{
              display: 'inline-block',
              padding: '20px 56px',
              background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
              borderRadius: '16px',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '22px',
              boxShadow: '0 10px 40px rgba(139, 92, 246, 0.4), 0 0 60px rgba(139, 92, 246, 0.2)',
              animation: 'marketBtnGlow 2s ease-in-out infinite',
              transition: 'all 0.3s'
            }}>
              Explore Market →
            </div>

          </div>
        </Link>
      </div>

      {/* ALGORITHM GRID */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '80px 20px' }}>
        <h2 style={{
          fontSize: '40px', fontWeight: 'bold', textAlign: 'center', marginBottom: '64px',
          background: 'linear-gradient(135deg, #FFFFFF, #9CA3AF)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          Choose Your Algorithm
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px'
        }}>
          {algorithms.map((algo, index) => {
            const info = ALGO_INFO[algo.name] || {}
            const coinColor = info.color || '#00E5FF'

            return (
              <Link
                key={algo.id}
                to={`/mine/${algo.name.toLowerCase()}`}
                style={{
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #141825, #1E2330)',
                  border: '1px solid #374151',
                  borderRadius: '20px',
                  padding: '32px',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s backwards`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px)'
                  e.currentTarget.style.borderColor = coinColor
                  e.currentTarget.style.boxShadow = `0 20px 60px ${coinColor}40`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = '#374151'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* Glow effect */}
                <div style={{
                  position: 'absolute', top: '-50%', left: '-50%',
                  width: '200%', height: '200%',
                  background: `radial-gradient(circle, ${coinColor}15 0%, transparent 70%)`,
                  opacity: 0, transition: 'opacity 0.3s'
                }} className="glow" />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '26px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                        {algo.name}
                      </h3>
                      <div style={{ fontSize: '14px', color: '#9CA3AF' }}>
                        {info.coin || algo.name}
                      </div>
                    </div>

                    {/* Mini Logo with spin animation */}
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '12px',
                      background: 'rgba(0, 229, 255, 0.08)',
                      border: '1px solid rgba(0, 229, 255, 0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      animation: 'logoSpin 8s linear infinite',
                      flexShrink: 0
                    }}>
                      <img src="/logo.png" alt="HB" style={{
                        width: '32px', height: '32px', borderRadius: '8px'
                      }} />
                    </div>
                  </div>

                  {/* Hardware badges */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    {(info.icons || []).map((iconType: string, i: number) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 14px',
                        background: info.badgeColor || 'rgba(0, 229, 255, 0.15)',
                        borderRadius: '20px',
                        fontSize: '13px', fontWeight: '600',
                        color: info.badgeText || '#00E5FF',
                        textTransform: 'uppercase', letterSpacing: '0.5px'
                      }}>
                        {renderIcon(iconType)}
                        <span>{iconType.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Info rows */}
                  <div style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: '2.2', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Port:</span>
                      <span style={{ color: '#00E5FF', fontFamily: 'monospace', fontWeight: 'bold' }}>{algo.stratum_port}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Unit:</span>
                      <span style={{ color: info.badgeText || '#8B5CF6', fontWeight: 'bold' }}>{algo.hash_unit}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Payout:</span>
                      <span style={{ color: '#10B981', fontWeight: 'bold' }}>USDT (BEP20)</span>
                    </div>
                  </div>

                  {/* Start Mining Button */}
                  <div style={{
                    padding: '16px',
                    background: `${coinColor}10`,
                    borderRadius: '12px',
                    border: `1px solid ${coinColor}30`,
                    textAlign: 'center',
                    color: coinColor,
                    fontWeight: 'bold',
                    fontSize: '16px',
                    transition: 'all 0.3s'
                  }}>
                    ⚡ Start Mining →
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ANIMATIONS */}
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes glowBtn {
          0%, 100% { box-shadow: 0 10px 40px rgba(0, 229, 255, 0.4), 0 0 60px rgba(0, 229, 255, 0.2); }
          50% { box-shadow: 0 10px 50px rgba(0, 229, 255, 0.6), 0 0 80px rgba(0, 229, 255, 0.3); }
        }
        @keyframes logoSpin {
          0% { transform: rotateY(0deg); }
          50% { transform: rotateY(180deg); }
          100% { transform: rotateY(360deg); }
        }
        a:hover .glow {
          opacity: 1 !important;
        }
        @keyframes shimmer {
          0% { transform: translateX(-33%); }
          100% { transform: translateX(33%); }
        }
        @keyframes logoPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3); }
          50% { transform: scale(1.06); box-shadow: 0 8px 40px rgba(139, 92, 246, 0.5); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes handshakeGlow {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        }
        @keyframes marketBtnGlow {
          0%, 100% { box-shadow: 0 10px 40px rgba(139, 92, 246, 0.4), 0 0 60px rgba(139, 92, 246, 0.2); }
          50% { box-shadow: 0 10px 50px rgba(139, 92, 246, 0.6), 0 0 80px rgba(139, 92, 246, 0.3); }
        }
        @keyframes newBadgePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, 15px); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-15px, -20px); }
        }
        @keyframes marketBg {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }
        @keyframes handshakeBounce {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(-5deg); }
          75% { transform: scale(1.1) rotate(5deg); }
        }
      `}</style>
    </div>
  )
}
