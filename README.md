# ⛏️ HashMarket — Mining Hashrate Marketplace

**Rent or sell mining hashpower with escrow protection, real-time proxy verification, and USDT payments.**

The first mining marketplace with built-in escrow, stratum proxy verification, and automatic dispute resolution.

---

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Frontend   │────▶│  FastAPI      │────▶│  PostgreSQL     │
│   React/TS   │     │  Backend      │     │  Database       │
│   Port 3000  │     │  Port 8000    │     │  Port 5432      │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
                    ┌──────┴───────┐
                    │ Stratum      │
                    │ Proxy        │◀──── Seller's Mining Rig
                    │ Port 3333    │────▶ Buyer's Pool
                    └──────────────┘
```

## 🔑 Key Features

| Feature | Description |
|---------|-------------|
| **Escrow** | USDT locked until admin verifies delivery |
| **Proxy Verification** | Every share logged through stratum proxy |
| **Real-time Monitoring** | Live hashrate, shares, uptime tracking |
| **USDT Payments** | Stablecoin on BEP20 (BSC) — no volatility |
| **Seller Ratings** | Multi-factor: accuracy + uptime + reviews |
| **Dispute System** | Structured process with proxy data as evidence |
| **Admin Approval** | Full/partial payout or refund control |
| **Zero Friction** | Seller just changes pool address to proxy |

## 📁 Project Structure

```
hashbrotherhood/
├── main.py                  # FastAPI backend (40+ endpoints)
├── create_database.sql      # PostgreSQL schema (13 tables)
├── stratum_proxy.py         # Marketplace stratum proxy
├── requirements.txt         # Python dependencies
├── .env.example             # Environment variables template
├── .gitignore
│
└── frontend/
    ├── index.html           # Vite entry
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── App.tsx          # Router (9 pages)
        ├── index.css
        ├── context/
        │   └── WalletContext.tsx
        ├── services/
        │   └── api.ts       # API client
        ├── components/
        │   ├── Navigation.tsx
        │   └── Footer.tsx
        └── pages/
            ├── Home.tsx           # Landing page
            ├── Marketplace.tsx    # Browse listings
            ├── ListingDetail.tsx  # Listing + order form
            ├── CreateListing.tsx  # Sell hashrate
            ├── MyOrders.tsx       # Order history
            ├── OrderDetail.tsx    # Order monitoring + chat
            ├── Dashboard.tsx      # User dashboard
            ├── Profile.tsx        # Profile settings
            └── AdminPanel.tsx     # Admin: review, disputes, users
```

## 🚀 Quick Start

### 1. Database

```bash
# Create database
createdb hashbrotherhood

# Run schema
psql hashbrotherhood < create_database.sql
```

### 2. Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment
cp .env.example .env

# Start API
python3 main.py
# → http://localhost:8000
# → Docs: http://localhost:8000/docs
```

### 3. Frontend

```bash
cd frontend

# Install
npm install

# Start dev server
npm run dev
# → http://localhost:3000
```

### 4. Stratum Proxy

```bash
# Start proxy (EU region)
python3 stratum_proxy.py --port 3333 --api http://localhost:8000 --region eu
```

## 📡 API Endpoints (40+)

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/connect` | Connect wallet (register/login) |
| GET | `/api/auth/me/{wallet}` | Get user info |
| PUT | `/api/auth/profile/{wallet}` | Update profile |

### Balance
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/balance/{wallet}` | Get balance |
| POST | `/api/balance/deposit/{wallet}` | Confirm deposit |
| POST | `/api/balance/withdraw/{wallet}` | Request withdrawal |

### Listings
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/listings` | Browse marketplace |
| GET | `/api/listings/{id}` | Listing detail |
| POST | `/api/listings` | Create listing |
| PUT | `/api/listings/{id}` | Update listing |
| GET | `/api/my-listings/{wallet}` | My listings |

### Orders
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/orders` | Create order (locks escrow) |
| GET | `/api/orders/{id}` | Order detail |
| GET | `/api/my-orders/{wallet}` | My orders |
| POST | `/api/orders/{id}/confirm` | Buyer confirms |
| POST | `/api/orders/{id}/dispute` | Open dispute |
| POST | `/api/orders/{id}/rate` | Rate order |
| GET | `/api/orders/{id}/messages` | Get messages |
| POST | `/api/orders/{id}/messages` | Send message |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/dashboard` | Platform stats |
| GET | `/api/admin/orders/review` | Review queue |
| POST | `/api/admin/orders/{id}/action` | Approve/reject/partial |
| GET | `/api/admin/disputes` | Open disputes |
| POST | `/api/admin/disputes/{id}/resolve` | Resolve dispute |
| GET | `/api/admin/users` | User list |
| POST | `/api/admin/users/{id}/ban` | Ban user |

### Proxy Callbacks
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/proxy/order/{worker_id}` | Get order for proxy |
| POST | `/api/proxy/connect` | Worker connected |
| POST | `/api/proxy/share` | Share submitted |
| POST | `/api/proxy/hashrate` | Periodic hashrate report |
| POST | `/api/proxy/disconnect` | Worker disconnected |

## 🔄 Order Flow

```
1. Buyer creates order → USDT locked in escrow
2. Seller gets notification with proxy info
3. Seller points miner to: eu.hashbrotherhood.com:3333 -u hb_ord_XXXXX
4. Proxy connects → forwards shares to buyer's pool
5. Proxy logs everything: hashrate, shares, uptime
6. Duration ends → order goes to admin review
7. Admin sees proxy data → approves/rejects/partial
8. Escrow released: seller gets paid, buyer gets refund if partial
```

## 💰 Fee Structure

- **Platform Commission:** 3% (charged to buyer)
- **Withdrawal Fee:** 0.50 USDT (fixed)
- **Minimum Order:** None
- **Payment:** USDT on BEP20 (BSC)

## 🖥️ Deploy (OVH VPS)

```bash
# SSH into server
ssh root@your-server-ip

# Install dependencies
apt update && apt install -y postgresql nodejs npm python3 python3-pip

# Clone
git clone https://github.com/burak0220/hashbrotherhood.git
cd hashbrotherhood

# Setup DB
sudo -u postgres createdb hashbrotherhood
psql hashbrotherhood < create_database.sql

# Backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings

# Start with systemd or screen
screen -S api
python3 main.py
# Ctrl+A, D to detach

screen -S proxy
python3 stratum_proxy.py --port 3333 --region eu
# Ctrl+A, D to detach

# Frontend
cd frontend
npm install
npm run build
# Serve dist/ with nginx
```

## 🛡️ vs Competition

| Feature | NiceHash | MiningRigRentals | **HashMarket** |
|---------|----------|------------------|----------------|
| Escrow | ❌ | ❌ | ✅ |
| Real-time Verify | ~ | ~ | ✅ Proxy logs |
| USDT Payment | ❌ BTC only | ❌ Multi | ✅ Stablecoin |
| Auto Refund | ❌ | ❌ Manual 12h | ✅ Admin instant |
| Anti-Reselling | ❌ | ❌ | ✅ Proxy detects |
| Dispute System | Tickets | Tickets | ✅ Structured |

## 📋 Tech Stack

- **Backend:** Python, FastAPI, PostgreSQL, psycopg2
- **Frontend:** React 18, TypeScript, Vite, React Router
- **Proxy:** Python asyncio, aiohttp
- **Payments:** USDT on BSC (BEP20)
- **Hosting:** OVH VPS (€7/month)

---

**HashMarket** — Mining hashrate marketplace with trust. ⛏️
