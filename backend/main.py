from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import requests

app = FastAPI(title="HashBrotherhood API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    return psycopg2.connect(
        dbname="hashbrotherhood",
        user="u0_a307",
        host="localhost"
    )

# 2MINERS ENDPOINTS
TWOMINERS_POOLS = {
    'RVN': 'https://rvn.2miners.com/api/stats',
    'ETC': 'https://etc.2miners.com/api/stats',
    'LTC': 'https://ltc.2miners.com/api/stats'
}

# CONSERVATIVE FALLBACK (XMR, BTC, ERG - %80 değerler)
FALLBACK_NETWORK = {
    'XMR': {
        'hashrate': 2_280_000_000,  # 2.28 GH/s
        'block_reward': 0.6,
        'block_time': 120
    },
    'BTC': {
        'hashrate': 496_000_000_000_000_000_000,  # 496 EH/s
        'block_reward': 3.125,
        'block_time': 600
    },
    'ERG': {
        'hashrate': 49_600_000_000_000,  # 49.6 TH/s
    'LTC': {
        'hashrate': 680_000_000_000_000,  # 680 TH/s
        'block_reward': 12.5,
        'block_time': 150
    },
        'block_reward': 67.5,
        'block_time': 120
    }
}

def get_network_data(coin_symbol):
    """Fetch network data from 2Miners or fallback"""
    
    # Try 2Miners first
    pool_url = TWOMINERS_POOLS.get(coin_symbol)
    if pool_url:
        try:
            res = requests.get(pool_url, timeout=5)
            data = res.json()
            
            # Extract network data
            nodes = data.get('nodes', [])
            if nodes and len(nodes) > 0:
                node = nodes[0]
                network_hashrate = float(node.get('networkhashps', 0))
                block_time = float(node.get('avgBlockTime', 60))
                
                # Block rewards (hardcoded - değişmiyor)
                block_rewards = {'RVN': 2500, 'ETC': 2.56, 'LTC': 12.5}
                block_reward = block_rewards.get(coin_symbol, 0)
                
                if network_hashrate > 0 and block_reward > 0:
                    return {
                        'hashrate': network_hashrate,
                        'block_reward': block_reward,
                        'block_time': block_time,
                        'source': '2Miners'
                    }
        except Exception as e:
            print(f"2Miners error for {coin_symbol}: {e}")
    
    # Fallback to conservative values
    fallback = FALLBACK_NETWORK.get(coin_symbol)
    if fallback:
        return {**fallback, 'source': 'Conservative'}
    
    return None

@app.get("/")
async def root():
    return {
        "status": "online",
        "platform": "HashBrotherhood",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        return {"status": "healthy", "database": "connected"}
    except:
        return {"status": "unhealthy", "database": "disconnected"}

@app.get("/api/algorithms")
async def get_algorithms():
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        SELECT a.*, p.pool_host, p.pool_port
        FROM algorithms a
        LEFT JOIN pool_configs p ON a.id = p.algorithm_id
        WHERE a.active = TRUE
        ORDER BY a.id
    """)
    
    algorithms = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return {"algorithms": algorithms}

@app.get("/api/algorithm/{name}")
async def get_algorithm(name: str):
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        SELECT a.*, p.pool_host, p.pool_port
        FROM algorithms a
        LEFT JOIN pool_configs p ON a.id = p.algorithm_id
        WHERE LOWER(a.name) = LOWER(%s) AND a.active = TRUE
    """, (name,))
    
    algo = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not algo:
        return {"error": "Algorithm not found"}
    
    return algo

@app.get("/api/coin-info/{algorithm}")
async def get_coin_info(algorithm: str):
    """Get coin info with logo and live price"""
    
    coin_data = {
        'RandomX': {
            'symbol': 'XMR',
            'name': 'Monero',
            'logo': 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png',
            'binance_symbol': 'XMRUSDT'
        },
        'KawPow': {
            'symbol': 'RVN',
            'name': 'Ravencoin',
            'logo': 'https://assets.coingecko.com/coins/images/3412/large/ravencoin.png',
            'binance_symbol': 'RVNUSDT'
        },
        'Etchash': {
            'symbol': 'ETC',
            'name': 'Ethereum Classic',
            'logo': 'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png',
            'binance_symbol': 'ETCUSDT'
        },
        'Scrypt': {
            'symbol': 'LTC',
            'name': 'Litecoin',
            'logo': 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
            'binance_symbol': 'LTCUSDT'
        },
        'SHA256': {
            'symbol': 'BTC',
            'name': 'Bitcoin',
            'logo': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
            'binance_symbol': 'BTCUSDT'
        },
        'Autolykos': {
            'symbol': 'ERG',
            'name': 'Ergo',
            'logo': 'https://assets.coingecko.com/coins/images/13383/large/ergo_logo.png',
            'binance_symbol': None
        }
    }
    
    info = coin_data.get(algorithm)
    if not info:
        return {"error": "Unknown algorithm"}
    
    # Get price from Binance
    price = 0
    if info['binance_symbol']:
        try:
            res = requests.get(
                f"https://api.binance.com/api/v3/ticker/price?symbol={info['binance_symbol']}",
                timeout=5
            )
            data = res.json()
            price = float(data['price'])
        except:
            pass
    
    # Fallback CoinGecko for ERG
    if price == 0 and info['symbol'] == 'ERG':
        try:
            res = requests.get(
                "https://api.coingecko.com/api/v3/simple/price?ids=ergo&vs_currencies=usd",
                timeout=5
            )
            data = res.json()
            price = data['ergo']['usd']
        except:
            pass
    
    return {
        **info,
        'price': price
    }

@app.get("/api/calculator/realtime")
async def calculate_realtime(algorithm: str, hashrate: float, unit: str):
    """Mining calculator with 2Miners live data + Binance prices"""
    
    coin_map = {
        'RandomX': 'XMR',
        'KawPow': 'RVN',
        'Etchash': 'ETC',
        'Scrypt': 'LTC',
        'SHA256': 'BTC',
        'Autolykos': 'ERG'
    }
    
    coin_symbol = coin_map.get(algorithm)
    if not coin_symbol:
        return {"error": "Unknown algorithm"}
    
    # Get network data (2Miners or fallback)
    network = get_network_data(coin_symbol)
    if not network:
        return {"error": "Network data not available"}
    
    # Get live price from Binance
    binance_symbols = {
        'XMR': 'XMRUSDT',
        'RVN': 'RVNUSDT',
        'ETC': 'ETCUSDT',
        'LTC': 'LTCUSDT',
        'BTC': 'BTCUSDT'
    }
    
    coin_price = 0
    binance_symbol = binance_symbols.get(coin_symbol)
    
    if binance_symbol:
        try:
            res = requests.get(
                f"https://api.binance.com/api/v3/ticker/price?symbol={binance_symbol}",
                timeout=5
            )
            data = res.json()
            coin_price = float(data['price'])
        except:
            pass
    
    # Fallback for ERG
    if coin_price == 0 and coin_symbol == 'ERG':
        try:
            res = requests.get(
                "https://api.coingecko.com/api/v3/simple/price?ids=ergo&vs_currencies=usd",
                timeout=5
            )
            data = res.json()
            coin_price = data['ergo']['usd']
        except:
            pass
    
    if coin_price == 0:
        return {"error": "Could not fetch price"}
    
    # Convert hashrate to H/s
    multipliers = {
        'H/s': 1,
        'KH/s': 1000,
        'MH/s': 1000000,
        'GH/s': 1000000000,
        'TH/s': 1000000000000,
        'PH/s': 1000000000000000,
        'EH/s': 1000000000000000000
    }
    
    user_hashrate_hs = hashrate * multipliers.get(unit, 1)
    
    # Calculate earnings
    blocks_per_day = 86400 / network['block_time']
    user_share = user_hashrate_hs / network['hashrate']
    daily_coins = blocks_per_day * network['block_reward'] * user_share
    
    # Convert to USDT with hidden 2.5% platform fee
    gross_usdt = daily_coins * coin_price
    net_usdt = gross_usdt * 0.975
    
    return {
        "hourly": round(net_usdt / 24, 6),
        "daily": round(net_usdt, 4),
        "weekly": round(net_usdt * 7, 2),
        "monthly": round(net_usdt * 30, 2),
        "coin_price": round(coin_price, 4),
        "coins_per_day": round(daily_coins, 8),
        "network_hashrate": network['hashrate'],
        "data_source": network.get('source', 'Unknown'),
        "estimated": True
    }

@app.get("/api/miner/{wallet}/balance")
async def get_miner_balance(wallet: str):
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        SELECT 
            COALESCE(SUM(net_usdt_earned), 0) as balance,
            COUNT(*) as total_shares,
            MIN(timestamp) as first_share,
            MAX(timestamp) as last_share
        FROM revenue_snapshots
        WHERE miner_wallet = %s AND paid = FALSE
    """, (wallet,))
    
    balance_data = cursor.fetchone()
    
    cursor.execute("""
        SELECT COALESCE(SUM(amount_usdt), 0) as total_paid
        FROM payments
        WHERE miner_wallet = %s AND status = 'paid'
    """, (wallet,))
    
    paid_data = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    balance = float(balance_data['balance'] or 0)
    total_paid = float(paid_data['total_paid'] or 0)
    total_shares = balance_data['total_shares'] or 0
    
    if balance_data['last_share'] and balance_data['first_share']:
        time_diff = (balance_data['last_share'] - balance_data['first_share']).total_seconds()
        estimated_daily = balance * (86400 / max(time_diff, 1))
    else:
        estimated_daily = 0
    
    return {
        "wallet": wallet,
        "balance": round(balance, 8),
        "total_paid": round(total_paid, 2),
        "total_earned": round(balance + total_paid, 2),
        "total_shares": total_shares,
        "estimated_daily": round(estimated_daily, 4),
        "min_payout": 10.0,
        "network": "BEP20",
        "payout_progress": round((balance / 10.0) * 100, 1) if balance < 10 else 100.0
    }

@app.get("/api/hashrate/{wallet}")
async def get_miner_hashrate(wallet: str):
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        SELECT difficulty, timestamp
        FROM revenue_snapshots
        WHERE miner_wallet = %s 
        AND timestamp > NOW() - INTERVAL '5 minutes'
        ORDER BY timestamp DESC
    """, (wallet,))
    
    shares = cursor.fetchall()
    cursor.close()
    conn.close()
    
    if not shares or len(shares) < 2:
        return {"wallet": wallet, "hashrate": 0, "unit": "H/s"}
    
    total_difficulty = sum(float(s['difficulty']) for s in shares)
    time_span = (shares[0]['timestamp'] - shares[-1]['timestamp']).total_seconds()
    
    if time_span > 0:
        hashrate = total_difficulty / time_span
    else:
        hashrate = 0
    
    return {
        "wallet": wallet,
        "hashrate": round(hashrate, 2),
        "unit": "H/s",
        "shares_count": len(shares)
    }

@app.get("/api/workers/{wallet}")
async def get_active_workers(wallet: str):
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        SELECT 
            worker_name,
            COUNT(*) as shares,
            MAX(timestamp) as last_share,
            SUM(difficulty) as total_difficulty
        FROM revenue_snapshots
        WHERE miner_wallet = %s 
        AND timestamp > NOW() - INTERVAL '10 minutes'
        AND worker_name IS NOT NULL
        GROUP BY worker_name
        ORDER BY last_share DESC
    """, (wallet,))
    
    workers = cursor.fetchall()
    cursor.close()
    conn.close()
    
    active_count = len([w for w in workers if w['last_share'] and (datetime.now() - w['last_share']).seconds < 300])
    
    return {
        "wallet": wallet,
        "active_workers": active_count,
        "total_workers": len(workers),
        "workers": workers
    }

@app.get("/api/payments/{wallet}")
async def get_payments(wallet: str):
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        SELECT id, amount_usdt, status, tx_hash, created_at, paid_at
        FROM payments
        WHERE miner_wallet = %s
        ORDER BY created_at DESC
        LIMIT 50
    """, (wallet,))
    
    payments = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return {"payments": payments}

@app.get("/api/miner/{wallet}")
async def get_miner_stats(wallet: str):
    return {
        "wallet": wallet,
        "balance": 0.0,
        "hashrate": 0,
        "workers": 0,
        "estimated_daily": 0.0,
        "min_payout": 10.0,
        "network": "BEP20"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
