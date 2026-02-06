import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../services/api'
import { useWallet } from '../context/WalletContext'

export default function OrderDetail() {
  const { id } = useParams()
  const { wallet } = useWallet()
  const [order, setOrder] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [msgInput, setMsgInput] = useState('')
  const [loading, setLoading] = useState(true)
  const msgRef = useRef<HTMLDivElement>(null)

  const fetchOrder = () => {
    if (!id || !wallet) return
    api.getOrder(Number(id), wallet).then(setOrder).catch(() => {})
    api.getMessages(Number(id), wallet).then(setMessages).catch(() => {})
  }

  useEffect(() => {
    fetchOrder()
    setLoading(false)
    const interval = setInterval(fetchOrder, 15000)
    return () => clearInterval(interval)
  }, [id, wallet])

  useEffect(() => {
    msgRef.current?.scrollTo(0, msgRef.current.scrollHeight)
  }, [messages])

  const sendMessage = async () => {
    if (!wallet || !id || !msgInput.trim()) return
    await api.sendMessage(Number(id), msgInput, wallet)
    setMsgInput('')
    fetchOrder()
  }

  const confirmOrder = async () => {
    if (!wallet || !id) return
    await api.confirmOrder(Number(id), wallet)
    fetchOrder()
  }

  if (!order) return <div style={{ padding: 80, textAlign: 'center', color: '#555' }}>Loading...</div>

  const isBuyer = wallet?.toLowerCase() === order.buyer_wallet?.toLowerCase()
  const isSeller = wallet?.toLowerCase() === order.seller_wallet?.toLowerCase()

  const statusColor: Record<string, string> = {
    pending: '#888', paid: '#3b82f6', active: '#22c55e', delivering: '#eab308',
    completed: '#22c55e', cancelled: '#ef4444', dispute: '#f97316',
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>
            Order {order.order_code}
          </h1>
          <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>{order.listing_title}</div>
        </div>
        <span style={{
          background: `${statusColor[order.status] || '#888'}20`,
          color: statusColor[order.status] || '#888',
          padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          textTransform: 'uppercase',
        }}>{order.status}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Left Column */}
        <div>
          {/* Proxy Status */}
          {order.status === 'active' && (
            <div style={{
              background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)',
              borderRadius: 12, padding: 20, marginBottom: 16,
            }}>
              <h3 style={{ color: '#22c55e', fontSize: 14, margin: '0 0 12px' }}>⚡ Mining Active</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div>
                  <div style={{ color: '#555', fontSize: 11 }}>Current Hashrate</div>
                  <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>
                    {Number(order.current_hashrate || 0).toFixed(2)}
                    <span style={{ fontSize: 12, color: '#888' }}> {order.hashrate_unit}</span>
                  </div>
                </div>
                <div>
                  <div style={{ color: '#555', fontSize: 11 }}>Accuracy</div>
                  <div style={{
                    fontSize: 20, fontWeight: 700,
                    color: (order.hashrate_accuracy || 0) >= 90 ? '#22c55e' :
                           (order.hashrate_accuracy || 0) >= 70 ? '#eab308' : '#ef4444'
                  }}>
                    {Number(order.hashrate_accuracy || 0).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div style={{ color: '#555', fontSize: 11 }}>Uptime</div>
                  <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>
                    {Number(order.uptime_percent || 0).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 12 }}>
                <div>
                  <div style={{ color: '#555', fontSize: 11 }}>Shares Accepted</div>
                  <div style={{ color: '#22c55e', fontSize: 16, fontWeight: 600 }}>{order.shares_accepted || 0}</div>
                </div>
                <div>
                  <div style={{ color: '#555', fontSize: 11 }}>Shares Rejected</div>
                  <div style={{ color: '#ef4444', fontSize: 16, fontWeight: 600 }}>{order.shares_rejected || 0}</div>
                </div>
                <div>
                  <div style={{ color: '#555', fontSize: 11 }}>Last Share</div>
                  <div style={{ color: '#888', fontSize: 13 }}>
                    {order.last_share_at ? new Date(order.last_share_at).toLocaleTimeString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Proxy Connection Info (for seller) */}
          {isSeller && order.status === 'paid' && (
            <div style={{
              background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)',
              borderRadius: 12, padding: 20, marginBottom: 16,
            }}>
              <h3 style={{ color: '#3b82f6', fontSize: 14, margin: '0 0 12px' }}>🔌 Connect Your Rig</h3>
              <p style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>
                Point your miner to the proxy address below:
              </p>
              <div style={{
                background: '#000', borderRadius: 8, padding: 14, fontFamily: 'monospace', fontSize: 13,
              }}>
                <div><span style={{ color: '#888' }}>Pool: </span><span style={{ color: '#22c55e' }}>{order.proxy_server}:{order.proxy_port}</span></div>
                <div><span style={{ color: '#888' }}>Worker: </span><span style={{ color: '#ffb400' }}>{order.proxy_worker_id}</span></div>
                <div><span style={{ color: '#888' }}>Password: </span><span style={{ color: '#fff' }}>x</span></div>
              </div>
            </div>
          )}

          {/* Order Details */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: 20, marginBottom: 16,
          }}>
            <h3 style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>
              Order Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Algorithm', order.algorithm],
                ['Hashrate', `${order.hashrate_ordered} ${order.hashrate_unit}`],
                ['Duration', `${order.hours} hours`],
                ['Price/Hour', `$${Number(order.price_per_hour).toFixed(4)}`],
                ['Subtotal', `$${Number(order.subtotal).toFixed(2)}`],
                ['Commission (3%)', `$${Number(order.commission).toFixed(2)}`],
                ['Total Paid', `$${Number(order.total_paid).toFixed(2)}`],
                ['Pool', `${order.pool_host}:${order.pool_port}`],
              ].map(([label, value], i) => (
                <div key={i}>
                  <div style={{ color: '#555', fontSize: 11 }}>{label}</div>
                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
            {order.admin_action && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color: '#555', fontSize: 11 }}>Admin Decision</div>
                <div style={{ color: '#ffb400', fontSize: 14, fontWeight: 600 }}>{order.admin_action}</div>
                {order.admin_note && <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{order.admin_note}</div>}
                {order.payout_amount > 0 && <div style={{ color: '#22c55e', fontSize: 13 }}>Payout: ${Number(order.payout_amount).toFixed(2)}</div>}
                {order.refund_amount > 0 && <div style={{ color: '#3b82f6', fontSize: 13 }}>Refund: ${Number(order.refund_amount).toFixed(2)}</div>}
              </div>
            )}
          </div>

          {/* Actions */}
          {isBuyer && order.status === 'active' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={confirmOrder} style={{
                flex: 1, background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                border: 'none', borderRadius: 10, padding: '12px 20px',
                color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>✅ Confirm & Submit for Review</button>
            </div>
          )}
        </div>

        {/* Right: Messages */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, display: 'flex', flexDirection: 'column', height: 480,
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: '#fff', fontSize: 14, margin: 0 }}>Messages</h3>
          </div>
          <div ref={msgRef} style={{
            flex: 1, overflowY: 'auto', padding: 16,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {messages.map((msg: any) => (
              <div key={msg.id} style={{
                background: msg.is_system ? 'rgba(255,180,0,0.05)' : 'rgba(255,255,255,0.03)',
                borderRadius: 8, padding: '8px 12px',
                alignSelf: msg.sender_wallet?.toLowerCase() === wallet?.toLowerCase() ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}>
                <div style={{ color: msg.is_system ? '#ffb400' : '#888', fontSize: 10, marginBottom: 4 }}>
                  {msg.is_system ? 'System' : msg.sender_name || msg.sender_wallet?.slice(0, 8)}
                </div>
                <div style={{ color: '#ddd', fontSize: 13 }}>{msg.content}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
            <input value={msgInput} onChange={e => setMsgInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                padding: '8px 12px', fontSize: 13, color: '#fff', outline: 'none',
              }}
            />
            <button onClick={sendMessage} style={{
              background: '#ffb400', border: 'none', borderRadius: 8,
              padding: '8px 16px', color: '#000', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}>Send</button>
          </div>
        </div>
      </div>
    </div>
  )
}
