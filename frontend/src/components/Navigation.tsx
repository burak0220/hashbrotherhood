import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'

export default function Navigation() {
  const { user, isConnected, connect, disconnect } = useWallet()
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [walletInput, setWalletInput] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)
  const location = useLocation()

  const handleConnect = async () => {
    if (walletInput.length === 42 && walletInput.startsWith('0x')) {
      await connect(walletInput)
      setShowWalletModal(false)
      setWalletInput('')
    }
  }

  const navLinks = [
    { path: '/marketplace', label: 'Marketplace' },
    { path: '/sell', label: 'Sell Hashrate' },
    { path: '/orders', label: 'My Orders' },
    { path: '/dashboard', label: 'Dashboard' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <nav style={{
        background: 'rgba(10,10,15,0.95)',
        borderBottom: '1px solid rgba(255,180,0,0.15)',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'linear-gradient(135deg, #ffb400, #ff6b00)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 18, color: '#000',
            }}>H</div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>
              Hash<span style={{ color: '#ffb400' }}>Market</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {navLinks.map(link => (
              <Link key={link.path} to={link.path} style={{
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                color: isActive(link.path) ? '#ffb400' : '#888',
                background: isActive(link.path) ? 'rgba(255,180,0,0.1)' : 'transparent',
                transition: 'all 0.2s',
              }}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Wallet */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isConnected && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  background: 'rgba(255,180,0,0.1)',
                  border: '1px solid rgba(255,180,0,0.2)',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 13,
                  color: '#ffb400',
                  fontWeight: 600,
                }}>
                  {Number(user.balance_available).toFixed(2)} USDT
                </div>
                <button onClick={disconnect} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 13,
                  color: '#aaa',
                  cursor: 'pointer',
                }}>
                  {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                </button>
              </div>
            ) : (
              <button onClick={() => setShowWalletModal(true)} style={{
                background: 'linear-gradient(135deg, #ffb400, #ff6b00)',
                border: 'none',
                borderRadius: 8,
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 600,
                color: '#000',
                cursor: 'pointer',
              }}>
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Wallet Modal */}
      {showWalletModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowWalletModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#151520',
            border: '1px solid rgba(255,180,0,0.2)',
            borderRadius: 16,
            padding: 32,
            width: '90%',
            maxWidth: 420,
          }}>
            <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: 20 }}>Connect Wallet</h3>
            <p style={{ color: '#888', margin: '0 0 24px', fontSize: 14 }}>
              Enter your BEP20 (BSC) wallet address
            </p>
            <input
              value={walletInput}
              onChange={e => setWalletInput(e.target.value)}
              placeholder="0x..."
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '12px 16px',
                fontSize: 15,
                color: '#fff',
                marginBottom: 16,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
            <button
              onClick={handleConnect}
              disabled={walletInput.length !== 42}
              style={{
                width: '100%',
                background: walletInput.length === 42 
                  ? 'linear-gradient(135deg, #ffb400, #ff6b00)' 
                  : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 8,
                padding: '12px 20px',
                fontSize: 15,
                fontWeight: 600,
                color: walletInput.length === 42 ? '#000' : '#555',
                cursor: walletInput.length === 42 ? 'pointer' : 'not-allowed',
              }}
            >
              Connect
            </button>
          </div>
        </div>
      )}
    </>
  )
}
