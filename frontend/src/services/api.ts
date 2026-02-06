const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

class ApiService {
  private base: string

  constructor(base: string) {
    this.base = base
  }

  private async request(method: string, path: string, body?: any, params?: Record<string, string>) {
    const url = new URL(`${this.base}${path}`)
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, v)
      })
    }

    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    }
    if (body) options.body = JSON.stringify(body)

    const res = await fetch(url.toString(), options)
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || 'API Error')
    }
    return res.json()
  }

  get(path: string, params?: Record<string, string>) {
    return this.request('GET', path, undefined, params)
  }

  post(path: string, body?: any, params?: Record<string, string>) {
    return this.request('POST', path, body, params)
  }

  put(path: string, body?: any, params?: Record<string, string>) {
    return this.request('PUT', path, body, params)
  }

  delete(path: string, params?: Record<string, string>) {
    return this.request('DELETE', path, undefined, params)
  }

  // === AUTH ===
  connectWallet(address: string) {
    return this.post('/auth/connect', { wallet_address: address })
  }

  getMe(wallet: string) {
    return this.get(`/auth/me/${wallet}`)
  }

  // === LISTINGS ===
  getListings(params?: Record<string, string>) {
    return this.get('/listings', params)
  }

  getListing(id: number) {
    return this.get(`/listings/${id}`)
  }

  createListing(data: any, wallet: string) {
    return this.post('/listings', data, { wallet })
  }

  updateListing(id: number, data: any, wallet: string) {
    return this.put(`/listings/${id}`, data, { wallet })
  }

  getMyListings(wallet: string) {
    return this.get(`/my-listings/${wallet}`)
  }

  // === ORDERS ===
  createOrder(data: any, wallet: string) {
    return this.post('/orders', data, { wallet })
  }

  getOrder(id: number, wallet: string) {
    return this.get(`/orders/${id}`, { wallet })
  }

  getMyOrders(wallet: string, role?: string, status?: string) {
    const params: Record<string, string> = { wallet }
    if (role) params.role = role
    if (status) params.status = status
    return this.get(`/my-orders/${wallet}`, params)
  }

  confirmOrder(orderId: number, wallet: string) {
    return this.post(`/orders/${orderId}/confirm`, undefined, { wallet })
  }

  openDispute(orderId: number, data: any, wallet: string) {
    return this.post(`/orders/${orderId}/dispute`, data, { wallet })
  }

  rateOrder(orderId: number, data: any, wallet: string) {
    return this.post(`/orders/${orderId}/rate`, data, { wallet })
  }

  // === MESSAGES ===
  getMessages(orderId: number, wallet: string) {
    return this.get(`/orders/${orderId}/messages`, { wallet })
  }

  sendMessage(orderId: number, content: string, wallet: string) {
    return this.post(`/orders/${orderId}/messages`, { content }, { wallet })
  }

  // === BALANCE ===
  getBalance(wallet: string) {
    return this.get(`/balance/${wallet}`)
  }

  // === NOTIFICATIONS ===
  getNotifications(wallet: string, unreadOnly?: boolean) {
    return this.get(`/notifications/${wallet}`, { unread_only: unreadOnly ? 'true' : 'false' })
  }

  markNotificationsRead(wallet: string) {
    return this.put(`/notifications/read/${wallet}`)
  }

  // === STATS ===
  getAlgorithmStats() {
    return this.get('/stats/algorithms')
  }

  getPlatformStats() {
    return this.get('/stats/platform')
  }

  // === ADMIN ===
  adminDashboard() {
    return this.get('/admin/dashboard')
  }

  adminOrders(status?: string) {
    return this.get('/admin/orders', status ? { status } : undefined)
  }

  adminReviewQueue() {
    return this.get('/admin/orders/review')
  }

  adminOrderAction(orderId: number, data: any) {
    return this.post(`/admin/orders/${orderId}/action`, data)
  }

  adminDisputes(status?: string) {
    return this.get('/admin/disputes', { status: status || 'open' })
  }

  adminResolveDispute(disputeId: number, data: any) {
    return this.post(`/admin/disputes/${disputeId}/resolve`, data)
  }

  adminUsers() {
    return this.get('/admin/users')
  }

  adminBanUser(userId: number, reason: string) {
    return this.post(`/admin/users/${userId}/ban`, undefined, { reason })
  }
}

export const api = new ApiService(API_BASE)
