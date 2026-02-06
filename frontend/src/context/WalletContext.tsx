import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../services/api'

interface User {
  id: number
  wallet_address: string
  username: string | null
  email: string | null
  balance_available: number
  balance_escrow: number
  balance_pending: number
  total_earned: number
  total_spent: number
  seller_rating: number
  buyer_rating: number
  is_verified: boolean
  is_banned: boolean
}

interface WalletContextType {
  user: User | null
  wallet: string | null
  isConnected: boolean
  connect: (address: string) => Promise<void>
  disconnect: () => void
  refreshUser: () => Promise<void>
}

const WalletContext = createContext<WalletContextType>({
  user: null,
  wallet: null,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
  refreshUser: async () => {},
})

export function WalletProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [wallet, setWallet] = useState<string | null>(
    localStorage.getItem('hm_wallet')
  )

  const connect = async (address: string) => {
    try {
      const res = await api.post('/auth/connect', { wallet_address: address })
      setUser(res.user)
      setWallet(address)
      localStorage.setItem('hm_wallet', address)
    } catch (err) {
      console.error('Connect failed:', err)
      throw err
    }
  }

  const disconnect = () => {
    setUser(null)
    setWallet(null)
    localStorage.removeItem('hm_wallet')
  }

  const refreshUser = async () => {
    if (!wallet) return
    try {
      const res = await api.get(`/auth/me/${wallet}`)
      setUser(res)
    } catch {
      disconnect()
    }
  }

  useEffect(() => {
    if (wallet) refreshUser()
  }, [wallet])

  return (
    <WalletContext.Provider value={{ user, wallet, isConnected: !!user, connect, disconnect, refreshUser }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => useContext(WalletContext)
