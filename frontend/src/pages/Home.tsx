import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

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
      {/* HERO SECTION - LOGO + START MINING */}
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
        {/* Background Animation */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(0, 229, 255, 0.1) 0%, transparent 50%)',
          animation: 'pulse 4s ease-in-out infinite'
        }} />

        {/* LOGO - BÜYÜK */}
        <div style={{ 
          position: 'relative',
          zIndex: 2,
          marginBottom: '40px',
          animation: 'fadeInDown 1s ease-out'
        }}>
          <img 
            src="/logo.png" 
            alt="HashBrotherhood" 
            style={{ 
              width: '200px', 
              height: '200px',
              borderRadius: '30px',
              boxShadow: '0 20px 60px rgba(0, 229, 255, 0.4), 0 0 100px rgba(0, 229, 255, 0.2)',
              filter: 'drop-shadow(0 0 30px rgba(0, 229, 255, 0.5))',
              animation: 'float 3s ease-in-out infinite'
            }} 
          />
        </div>

        {/* TITLE */}
        <h1 style={{ 
          fontSize: '56px', 
          fontWeight: 'bold', 
          background: 'linear-gradient(135deg, #00E5FF, #00B8CC, #8B5CF6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '24px',
          letterSpacing: '-2px',
          position: 'relative',
          zIndex: 2,
          animation: 'fadeInUp 1s ease-out 0.2s backwards'
        }}>
          HashBrotherhood
        </h1>

        <p style={{ 
          fontSize: '24px', 
          color: '#9CA3AF',
          marginBottom: '48px',
          maxWidth: '600px',
          position: 'relative',
          zIndex: 2,
          animation: 'fadeInUp 1s ease-out 0.4s backwards'
        }}>
          Mine Any Algorithm, Earn USDT Automatically
        </p>

        {/* START MINING BUTTON - BÜYÜK */}
        <Link 
          to="/calculator"
          style={{
            textDecoration: 'none',
            padding: '24px 64px',
            fontSize: '28px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #00E5FF, #00B8CC)',
            color: '#0B0F1C',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0, 229, 255, 0.4), 0 0 60px rgba(0, 229, 255, 0.2)',
            transition: 'all 0.3s ease',
            position: 'relative',
            zIndex: 2,
            animation: 'fadeInUp 1s ease-out 0.6s backwards, pulse 2s ease-in-out infinite',
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

        {/* STATS */}
        <div style={{ 
          display: 'flex', 
          gap: '48px', 
          marginTop: '64px',
          position: 'relative',
          zIndex: 2,
          animation: 'fadeInUp 1s ease-out 0.8s backwards'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#00E5FF', marginBottom: '8px' }}>
              {algorithms.length}
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Algorithms
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#8B5CF6', marginBottom: '8px' }}>
              10 USDT
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Min Payout
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10B981', marginBottom: '8px' }}>
              BEP20
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Network
            </div>
          </div>
        </div>
      </div>

      {/* ALGORITHM GRID */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '80px 20px' }}>
        <h2 style={{ 
          fontSize: '40px', 
          fontWeight: 'bold', 
          textAlign: 'center',
          marginBottom: '64px',
          background: 'linear-gradient(135deg, #FFFFFF, #9CA3AF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Choose Your Algorithm
        </h2>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '32px' 
        }}>
          {algorithms.map((algo, index) => (
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
                e.currentTarget.style.borderColor = '#00E5FF'
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 229, 255, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = '#374151'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Glow effect */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(0, 229, 255, 0.1) 0%, transparent 70%)',
                opacity: 0,
                transition: 'opacity 0.3s'
              }} className="glow" />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
                      {algo.name}
                    </h3>
                    <span style={{ 
                      fontSize: '13px', 
                      padding: '6px 16px', 
                      background: 'rgba(0, 229, 255, 0.15)', 
                      color: '#00E5FF', 
                      borderRadius: '20px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      {algo.hardware_type}
                    </span>
                  </div>
                  <div style={{ fontSize: '40px' }}>
                    {algo.hardware_type === 'CPU' ? '💻' : algo.hardware_type === 'GPU' ? '🎮' : '⚙️'}
                  </div>
                </div>

                <div style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: '2', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Port:</span>
                    <span style={{ color: '#00E5FF', fontFamily: 'monospace', fontWeight: 'bold' }}>{algo.stratum_port}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Unit:</span>
                    <span style={{ color: '#8B5CF6', fontWeight: 'bold' }}>{algo.hash_unit}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Pool:</span>
                    <span style={{ color: '#10B981', fontWeight: 'bold' }}>{algo.pool_host?.split('.')[0] || 'N/A'}</span>
                  </div>
                </div>

                <div style={{
                  padding: '16px',
                  background: 'rgba(0, 229, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 229, 255, 0.2)',
                  textAlign: 'center',
                  color: '#00E5FF',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>
                  Start Mining →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ANIMATIONS */}
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        a:hover .glow {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  )
}
