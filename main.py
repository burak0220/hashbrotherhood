"""
HashMarket API — Marketplace Backend
Mevcut HashBrotherhood API'ye eklenen marketplace endpointleri
"""

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor
import secrets
import json

app = FastAPI(title="HashMarket API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# DATABASE
# ============================================================
DB_CONFIG = {
    "dbname": "hashbrotherhood",
    "user": "u0_a307",
    "host": "localhost"
}

COMMISSION_RATE = Decimal("0.03")  # %3

def get_db():
    conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
    return conn

def db_query(sql, params=None, fetch_one=False):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(sql, params)
        if sql.strip().upper().startswith("SELECT") or "RETURNING" in sql.upper():
            return cur.fetchone() if fetch_one else cur.fetchall()
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def db_execute(sql, params=None):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(sql, params)
        conn.commit()
        if cur.description:
            return cur.fetchone() if cur.rowcount == 1 else cur.fetchall()
        return cur.rowcount
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def db_transaction(queries):
    """Birden fazla sorguyu tek transaction'da çalıştır"""
    conn = get_db()
    try:
        cur = conn.cursor()
        results = []
        for sql, params in queries:
            cur.execute(sql, params)
            if cur.description:
                results.append(cur.fetchone())
            else:
                results.append(cur.rowcount)
        conn.commit()
        return results
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


# ============================================================
# MODELS — Request/Response şemaları
# ============================================================

# --- Auth ---
class WalletAuth(BaseModel):
    wallet_address: str = Field(..., min_length=42, max_length=42)
    username: Optional[str] = None
    email: Optional[str] = None

class UserProfile(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None

# --- Listing ---
class CreateListing(BaseModel):
    title: str = Field(..., max_length=100)
    description: Optional[str] = None
    algorithm: str = Field(..., max_length=50)
    hashrate: float = Field(..., gt=0)
    hashrate_unit: str = Field(..., pattern="^(H/s|KH/s|MH/s|GH/s|TH/s|PH/s)$")
    price_per_hour: float = Field(..., gt=0)
    min_hours: int = Field(default=1, ge=1)
    max_hours: int = Field(default=720, le=8760)
    hardware_info: Optional[str] = None
    proxy_region: Optional[str] = None

class UpdateListing(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price_per_hour: Optional[float] = None
    min_hours: Optional[int] = None
    max_hours: Optional[int] = None
    hardware_info: Optional[str] = None
    status: Optional[str] = None

# --- Order ---
class CreateOrder(BaseModel):
    listing_id: int
    hours: int = Field(..., ge=1)
    pool_host: str
    pool_port: int
    pool_wallet: str
    pool_worker: Optional[str] = None
    pool_password: str = "x"
    backup_pool_host: Optional[str] = None
    backup_pool_port: Optional[int] = None

# --- Admin ---
class AdminOrderAction(BaseModel):
    action: str = Field(..., pattern="^(approve|reject|partial)$")
    payout_percent: Optional[float] = Field(default=100, ge=0, le=100)
    note: Optional[str] = None

class AdminDisputeAction(BaseModel):
    resolution: str = Field(..., pattern="^(full_refund|full_payout|partial|cancelled)$")
    payout_percent: Optional[float] = Field(default=None, ge=0, le=100)
    note: Optional[str] = None

# --- Rating ---
class CreateRating(BaseModel):
    score: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

# --- Message ---
class SendMessage(BaseModel):
    content: str = Field(..., max_length=1000)

# --- Dispute ---
class OpenDispute(BaseModel):
    reason: str = Field(..., pattern="^(low_hashrate|offline|wrong_pool|wrong_wallet|other)$")
    description: Optional[str] = None


# ============================================================
# AUTH ENDPOINTS — Cüzdan bazlı kimlik
# ============================================================

@app.post("/api/auth/connect")
def connect_wallet(data: WalletAuth):
    """Cüzdan bağla = kayıt ol veya giriş yap"""
    wallet = data.wallet_address.lower()
    
    # Mevcut kullanıcı var mı?
    user = db_query(
        "SELECT * FROM users WHERE wallet_address = %s",
        (wallet,), fetch_one=True
    )
    
    if user:
        # Giriş — last_seen güncelle
        db_execute(
            "UPDATE users SET last_seen = NOW() WHERE wallet_address = %s",
            (wallet,)
        )
        return {"status": "login", "user": dict(user)}
    
    # Yeni kullanıcı oluştur
    user = db_query(
        """INSERT INTO users (wallet_address, username, email) 
           VALUES (%s, %s, %s) RETURNING *""",
        (wallet, data.username, data.email), fetch_one=True
    )
    return {"status": "registered", "user": dict(user)}


@app.get("/api/auth/me/{wallet}")
def get_me(wallet: str):
    """Kullanıcı bilgileri"""
    user = db_query(
        "SELECT * FROM users WHERE wallet_address = %s",
        (wallet.lower(),), fetch_one=True
    )
    if not user:
        raise HTTPException(404, "Kullanıcı bulunamadı")
    return dict(user)


@app.put("/api/auth/profile/{wallet}")
def update_profile(wallet: str, data: UserProfile):
    """Profil güncelle"""
    updates = []
    params = []
    
    if data.username is not None:
        updates.append("username = %s")
        params.append(data.username)
    if data.email is not None:
        updates.append("email = %s")
        params.append(data.email)
    if data.bio is not None:
        updates.append("bio = %s")
        params.append(data.bio)
    
    if not updates:
        raise HTTPException(400, "Güncellenecek alan yok")
    
    params.append(wallet.lower())
    user = db_query(
        f"UPDATE users SET {', '.join(updates)} WHERE wallet_address = %s RETURNING *",
        params, fetch_one=True
    )
    return dict(user)


# ============================================================
# BALANCE ENDPOINTS — Bakiye yönetimi
# ============================================================

@app.get("/api/balance/{wallet}")
def get_balance(wallet: str):
    """Kullanıcı bakiye bilgisi"""
    user = db_query(
        """SELECT balance_available, balance_escrow, balance_pending,
                  total_earned, total_spent 
           FROM users WHERE wallet_address = %s""",
        (wallet.lower(),), fetch_one=True
    )
    if not user:
        raise HTTPException(404, "Kullanıcı bulunamadı")
    return dict(user)


@app.post("/api/balance/deposit/{wallet}")
def confirm_deposit(wallet: str, tx_hash: str, amount: float):
    """Deposit onayı (BSC tx doğrulandıktan sonra çağrılır)"""
    wallet = wallet.lower()
    user = db_query(
        "SELECT id, balance_available FROM users WHERE wallet_address = %s",
        (wallet,), fetch_one=True
    )
    if not user:
        raise HTTPException(404, "Kullanıcı bulunamadı")
    
    # Duplicate check
    existing = db_query(
        "SELECT id FROM transactions WHERE tx_hash = %s",
        (tx_hash,), fetch_one=True
    )
    if existing:
        raise HTTPException(400, "Bu işlem zaten kaydedilmiş")
    
    # Bakiye güncelle + transaction kaydet
    balance_before = float(user['balance_available'])
    balance_after = balance_before + amount
    
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE users SET balance_available = balance_available + %s WHERE wallet_address = %s",
            (amount, wallet)
        )
        cur.execute(
            """INSERT INTO transactions 
               (user_id, type, amount, tx_hash, network, status, balance_before, balance_after, confirmed_at)
               VALUES (%s, 'deposit', %s, %s, 'BEP20', 'confirmed', %s, %s, NOW())""",
            (user['id'], amount, tx_hash, balance_before, balance_after)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, str(e))
    finally:
        conn.close()
    
    return {"status": "ok", "new_balance": balance_after}


@app.post("/api/balance/withdraw/{wallet}")
def request_withdrawal(wallet: str, amount: float, to_address: str):
    """Çekim talebi"""
    wallet = wallet.lower()
    WITHDRAW_FEE = 0.50
    
    user = db_query(
        "SELECT id, balance_available FROM users WHERE wallet_address = %s",
        (wallet,), fetch_one=True
    )
    if not user:
        raise HTTPException(404, "Kullanıcı bulunamadı")
    
    total_deduct = amount + WITHDRAW_FEE
    if float(user['balance_available']) < total_deduct:
        raise HTTPException(400, f"Yetersiz bakiye. Gerekli: {total_deduct} USDT")
    
    requires_admin = amount > 500
    
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE users SET balance_available = balance_available - %s WHERE wallet_address = %s",
            (total_deduct, wallet)
        )
        cur.execute(
            """INSERT INTO transactions 
               (user_id, type, amount, fee, to_address, network, status, 
                balance_before, balance_after, requires_admin)
               VALUES (%s, 'withdraw', %s, %s, %s, 'BEP20', %s, %s, %s, %s)
               RETURNING id""",
            (user['id'], amount, WITHDRAW_FEE, to_address,
             'pending' if requires_admin else 'processing',
             float(user['balance_available']),
             float(user['balance_available']) - total_deduct,
             requires_admin)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, str(e))
    finally:
        conn.close()
    
    return {
        "status": "pending" if requires_admin else "processing",
        "amount": amount,
        "fee": WITHDRAW_FEE,
        "requires_admin_approval": requires_admin
    }


# ============================================================
# LISTING ENDPOINTS — İlan yönetimi
# ============================================================

@app.get("/api/listings")
def get_listings(
    algorithm: Optional[str] = None,
    status: str = "active",
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: str = "price_per_hour",
    sort_dir: str = "asc",
    page: int = 1,
    limit: int = 20
):
    """Marketplace ilan listesi"""
    conditions = ["l.status = %s"]
    params = [status]
    
    if algorithm:
        conditions.append("LOWER(l.algorithm) = LOWER(%s)")
        params.append(algorithm)
    if min_price is not None:
        conditions.append("l.price_per_hour >= %s")
        params.append(min_price)
    if max_price is not None:
        conditions.append("l.price_per_hour <= %s")
        params.append(max_price)
    
    # Sort güvenliği
    allowed_sorts = {
        "price_per_hour": "l.price_per_hour",
        "hashrate": "l.hashrate",
        "rating": "u.seller_rating",
        "created_at": "l.created_at"
    }
    sort_col = allowed_sorts.get(sort_by, "l.price_per_hour")
    sort_direction = "DESC" if sort_dir.lower() == "desc" else "ASC"
    
    offset = (page - 1) * limit
    
    where = " AND ".join(conditions)
    
    listings = db_query(f"""
        SELECT l.*, 
               u.wallet_address AS seller_wallet,
               u.username AS seller_name,
               u.seller_rating,
               u.seller_rating_count,
               u.is_verified AS seller_verified,
               u.total_orders_as_seller
        FROM listings l
        JOIN users u ON l.seller_id = u.id
        WHERE {where}
        ORDER BY {sort_col} {sort_direction}
        LIMIT %s OFFSET %s
    """, params + [limit, offset])
    
    # Toplam sayı
    count = db_query(
        f"SELECT COUNT(*) as total FROM listings l WHERE {where}",
        params, fetch_one=True
    )
    
    return {
        "listings": [dict(l) for l in listings],
        "total": count['total'],
        "page": page,
        "pages": (count['total'] + limit - 1) // limit
    }


@app.get("/api/listings/{listing_id}")
def get_listing(listing_id: int):
    """Tek ilan detayı"""
    listing = db_query("""
        SELECT l.*, 
               u.wallet_address AS seller_wallet,
               u.username AS seller_name,
               u.seller_rating,
               u.seller_rating_count,
               u.is_verified AS seller_verified
        FROM listings l
        JOIN users u ON l.seller_id = u.id
        WHERE l.id = %s
    """, (listing_id,), fetch_one=True)
    
    if not listing:
        raise HTTPException(404, "İlan bulunamadı")
    return dict(listing)


@app.post("/api/listings")
def create_listing(data: CreateListing, wallet: str):
    """Yeni ilan oluştur"""
    user = db_query(
        "SELECT id, is_banned FROM users WHERE wallet_address = %s",
        (wallet.lower(),), fetch_one=True
    )
    if not user:
        raise HTTPException(404, "Kullanıcı bulunamadı")
    if user['is_banned']:
        raise HTTPException(403, "Hesabınız yasaklanmış")
    
    listing = db_query("""
        INSERT INTO listings 
        (seller_id, title, description, algorithm, hashrate, hashrate_unit,
         price_per_hour, min_hours, max_hours, hardware_info, proxy_region, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active')
        RETURNING *
    """, (
        user['id'], data.title, data.description, data.algorithm,
        data.hashrate, data.hashrate_unit, data.price_per_hour,
        data.min_hours, data.max_hours, data.hardware_info,
        data.proxy_region or 'eu'
    ), fetch_one=True)
    
    return dict(listing)


@app.put("/api/listings/{listing_id}")
def update_listing(listing_id: int, data: UpdateListing, wallet: str):
    """İlan güncelle"""
    # Sahiplik kontrolü
    listing = db_query("""
        SELECT l.id, l.seller_id, u.wallet_address 
        FROM listings l JOIN users u ON l.seller_id = u.id
        WHERE l.id = %s
    """, (listing_id,), fetch_one=True)
    
    if not listing:
        raise HTTPException(404, "İlan bulunamadı")
    if listing['wallet_address'] != wallet.lower():
        raise HTTPException(403, "Bu ilan size ait değil")
    
    updates = []
    params = []
    
    for field in ['title', 'description', 'price_per_hour', 'min_hours', 'max_hours', 'hardware_info', 'status']:
        val = getattr(data, field, None)
        if val is not None:
            updates.append(f"{field} = %s")
            params.append(val)
    
    if not updates:
        raise HTTPException(400, "Güncellenecek alan yok")
    
    updates.append("updated_at = NOW()")
    params.append(listing_id)
    
    result = db_query(
        f"UPDATE listings SET {', '.join(updates)} WHERE id = %s RETURNING *",
        params, fetch_one=True
    )
    return dict(result)


@app.get("/api/my-listings/{wallet}")
def my_listings(wallet: str):
    """Satıcının kendi ilanları"""
    listings = db_query("""
        SELECT l.* FROM listings l
        JOIN users u ON l.seller_id = u.id
        WHERE u.wallet_address = %s
        ORDER BY l.created_at DESC
    """, (wallet.lower(),))
    return [dict(l) for l in listings]


# ============================================================
# ORDER ENDPOINTS — Sipariş yönetimi
# ============================================================

@app.post("/api/orders")
def create_order(data: CreateOrder, wallet: str):
    """Yeni sipariş oluştur (alıcı)"""
    buyer_wallet = wallet.lower()
    
    # Alıcı bilgisi
    buyer = db_query(
        "SELECT id, balance_available, is_banned FROM users WHERE wallet_address = %s",
        (buyer_wallet,), fetch_one=True
    )
    if not buyer:
        raise HTTPException(404, "Kullanıcı bulunamadı")
    if buyer['is_banned']:
        raise HTTPException(403, "Hesabınız yasaklanmış")
    
    # İlan bilgisi
    listing = db_query(
        "SELECT * FROM listings WHERE id = %s AND status = 'active'",
        (data.listing_id,), fetch_one=True
    )
    if not listing:
        raise HTTPException(404, "İlan bulunamadı veya aktif değil")
    
    # Kendine kiralama engeli
    if listing['seller_id'] == buyer['id']:
        raise HTTPException(400, "Kendi ilanınızı kiralayamazsınız")
    
    # Süre kontrolü
    if data.hours < listing['min_hours'] or data.hours > listing['max_hours']:
        raise HTTPException(400, 
            f"Süre {listing['min_hours']}-{listing['max_hours']} saat aralığında olmalı")
    
    # Fiyat hesapla
    subtotal = Decimal(str(listing['price_per_hour'])) * data.hours
    commission = (subtotal * COMMISSION_RATE).quantize(Decimal('0.01'))
    total = subtotal + commission
    
    # Bakiye kontrolü
    if Decimal(str(buyer['balance_available'])) < total:
        raise HTTPException(400, 
            f"Yetersiz bakiye. Gerekli: {total} USDT, Mevcut: {buyer['balance_available']} USDT")
    
    # Sipariş kodu
    order_code = db_query("SELECT generate_order_code() as code", fetch_one=True)['code']
    
    # Proxy bilgileri
    proxy_regions = {
        'eu': 'eu.hashbrotherhood.com',
        'us1': 'us1.hashbrotherhood.com',
        'us2': 'us2.hashbrotherhood.com',
        'asia': 'asia.hashbrotherhood.com'
    }
    proxy_server = proxy_regions.get(listing['proxy_region'] or 'eu', 'eu.hashbrotherhood.com')
    proxy_port = 3333  # Genel port, algoritma bazlı değiştirilebilir
    
    # Transaction: bakiye kilitle + sipariş oluştur + ilan durumunu güncelle
    conn = get_db()
    try:
        cur = conn.cursor()
        
        # 1. Escrow kilitle
        cur.execute(
            "SELECT lock_escrow(%s, %s) as success",
            (buyer['id'], float(total))
        )
        lock_result = cur.fetchone()
        if not lock_result or not lock_result['success']:
            raise HTTPException(400, "Bakiye kilitlenemedi")
        
        # 2. Sipariş oluştur
        cur.execute("""
            INSERT INTO orders 
            (order_code, listing_id, buyer_id, seller_id,
             algorithm, hashrate_ordered, hashrate_unit, hours,
             price_per_hour, subtotal, commission, commission_rate, total_paid,
             pool_host, pool_port, pool_wallet, pool_worker, pool_password,
             backup_pool_host, backup_pool_port,
             proxy_server, proxy_port, proxy_worker_id,
             status, paid_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'paid', NOW())
            RETURNING *
        """, (
            order_code, data.listing_id, buyer['id'], listing['seller_id'],
            listing['algorithm'], listing['hashrate'], listing['hashrate_unit'], data.hours,
            listing['price_per_hour'], float(subtotal), float(commission), 
            float(COMMISSION_RATE), float(total),
            data.pool_host, data.pool_port, data.pool_wallet,
            data.pool_worker, data.pool_password,
            data.backup_pool_host, data.backup_pool_port,
            proxy_server, proxy_port, order_code
        ))
        order = cur.fetchone()
        
        # 3. İlan durumunu güncelle
        cur.execute(
            "UPDATE listings SET status = 'rented' WHERE id = %s",
            (data.listing_id,)
        )
        
        # 4. Transaction kaydı
        cur.execute("""
            INSERT INTO transactions 
            (user_id, type, amount, order_id, status, confirmed_at)
            VALUES (%s, 'escrow_lock', %s, %s, 'confirmed', NOW())
        """, (buyer['id'], float(total), order['id']))
        
        # 5. Kullanıcı istatistik güncelle
        cur.execute(
            "UPDATE users SET total_spent = total_spent + %s, total_orders_as_buyer = total_orders_as_buyer + 1 WHERE id = %s",
            (float(total), buyer['id'])
        )
        cur.execute(
            "UPDATE users SET total_orders_as_seller = total_orders_as_seller + 1 WHERE id = %s",
            (listing['seller_id'],)
        )
        
        # 6. Bildirimler
        cur.execute("""
            INSERT INTO notifications (user_id, type, title, body, related_type, related_id)
            VALUES (%s, 'order_created', 'Yeni sipariş!', %s, 'order', %s)
        """, (
            listing['seller_id'],
            f"İlanınız kiralandı: {order_code}. Lütfen rig'inizi proxy'ye bağlayın.",
            order['id']
        ))
        
        # 7. Proxy session oluştur
        cur.execute("""
            INSERT INTO proxy_sessions 
            (order_id, listing_id, proxy_server, proxy_port, worker_id,
             target_pool, target_port, target_wallet, target_worker, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'waiting')
        """, (
            order['id'], data.listing_id, proxy_server, proxy_port, order_code,
            data.pool_host, data.pool_port, data.pool_wallet,
            data.pool_worker or order_code
        ))
        
        # 8. Otomatik sistem mesajı
        cur.execute("""
            INSERT INTO messages (order_id, sender_id, content, is_system)
            VALUES (%s, %s, %s, true)
        """, (
            order['id'], buyer['id'],
            f"Sipariş oluşturuldu: {order_code}. Satıcının rig'ini bağlaması bekleniyor."
        ))
        
        conn.commit()
        
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, f"Sipariş oluşturulamadı: {str(e)}")
    finally:
        conn.close()
    
    return {
        "order": dict(order),
        "proxy_info": {
            "server": proxy_server,
            "port": proxy_port,
            "worker_id": order_code,
            "message": f"Satıcı bu bilgileri madenci yazılımına girmeli: {proxy_server}:{proxy_port} - Worker: {order_code}"
        }
    }


@app.get("/api/orders/{order_id}")
def get_order(order_id: int, wallet: str):
    """Sipariş detayı"""
    order = db_query("""
        SELECT o.*,
               b.wallet_address AS buyer_wallet, b.username AS buyer_name,
               s.wallet_address AS seller_wallet, s.username AS seller_name,
               l.title AS listing_title
        FROM orders o
        JOIN users b ON o.buyer_id = b.id
        JOIN users s ON o.seller_id = s.id
        JOIN listings l ON o.listing_id = l.id
        WHERE o.id = %s
    """, (order_id,), fetch_one=True)
    
    if not order:
        raise HTTPException(404, "Sipariş bulunamadı")
    
    # Erişim kontrolü (alıcı, satıcı veya admin)
    wallet = wallet.lower()
    if wallet not in [order['buyer_wallet'], order['seller_wallet']]:
        raise HTTPException(403, "Bu siparişi görüntüleme yetkiniz yok")
    
    return dict(order)


@app.get("/api/my-orders/{wallet}")
def my_orders(wallet: str, role: str = "all", status: Optional[str] = None):
    """Kullanıcının siparişleri"""
    wallet = wallet.lower()
    user = db_query(
        "SELECT id FROM users WHERE wallet_address = %s",
        (wallet,), fetch_one=True
    )
    if not user:
        raise HTTPException(404, "Kullanıcı bulunamadı")
    
    conditions = []
    params = []
    
    if role == "buyer":
        conditions.append("o.buyer_id = %s")
        params.append(user['id'])
    elif role == "seller":
        conditions.append("o.seller_id = %s")
        params.append(user['id'])
    else:
        conditions.append("(o.buyer_id = %s OR o.seller_id = %s)")
        params.extend([user['id'], user['id']])
    
    if status:
        conditions.append("o.status = %s")
        params.append(status)
    
    where = " AND ".join(conditions)
    
    orders = db_query(f"""
        SELECT o.*,
               b.wallet_address AS buyer_wallet, b.username AS buyer_name,
               s.wallet_address AS seller_wallet, s.username AS seller_name,
               l.title AS listing_title
        FROM orders o
        JOIN users b ON o.buyer_id = b.id
        JOIN users s ON o.seller_id = s.id
        JOIN listings l ON o.listing_id = l.id
        WHERE {where}
        ORDER BY o.created_at DESC
    """, params)
    
    return [dict(o) for o in orders]


@app.post("/api/orders/{order_id}/confirm")
def buyer_confirm(order_id: int, wallet: str):
    """Alıcı siparişi onaylar"""
    order = db_query(
        """SELECT o.*, b.wallet_address AS buyer_wallet
           FROM orders o JOIN users b ON o.buyer_id = b.id
           WHERE o.id = %s""",
        (order_id,), fetch_one=True
    )
    
    if not order:
        raise HTTPException(404, "Sipariş bulunamadı")
    if order['buyer_wallet'] != wallet.lower():
        raise HTTPException(403, "Bu siparişi sadece alıcı onaylayabilir")
    if order['status'] not in ('active', 'delivering'):
        raise HTTPException(400, f"Bu sipariş onaylanamaz. Durum: {order['status']}")
    
    db_execute("""
        UPDATE orders SET 
            buyer_confirmed = true, 
            buyer_confirmed_at = NOW(),
            status = 'delivering',
            review_at = NOW()
        WHERE id = %s
    """, (order_id,))
    
    return {"status": "confirmed", "message": "Sipariş admin onayına gönderildi"}


# ============================================================
# DISPUTE ENDPOINTS
# ============================================================

@app.post("/api/orders/{order_id}/dispute")
def open_dispute(order_id: int, data: OpenDispute, wallet: str):
    """Dispute aç"""
    wallet = wallet.lower()
    order = db_query("""
        SELECT o.*, b.wallet_address AS buyer_wallet, s.wallet_address AS seller_wallet
        FROM orders o
        JOIN users b ON o.buyer_id = b.id
        JOIN users s ON o.seller_id = s.id
        WHERE o.id = %s
    """, (order_id,), fetch_one=True)
    
    if not order:
        raise HTTPException(404, "Sipariş bulunamadı")
    if wallet not in [order['buyer_wallet'], order['seller_wallet']]:
        raise HTTPException(403, "Bu siparişte yetkiniz yok")
    if order['status'] not in ('active', 'delivering'):
        raise HTTPException(400, "Bu siparişte dispute açılamaz")
    
    user = db_query("SELECT id FROM users WHERE wallet_address = %s", (wallet,), fetch_one=True)
    
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO disputes (order_id, opened_by, reason, description,
                                  proxy_avg_hashrate, proxy_uptime_percent,
                                  proxy_total_shares, proxy_accepted_shares)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            order_id, user['id'], data.reason, data.description,
            order['avg_hashrate'], order['uptime_percent'],
            order['shares_accepted'] + order['shares_rejected'],
            order['shares_accepted']
        ))
        dispute = cur.fetchone()
        
        cur.execute(
            "UPDATE orders SET status = 'dispute' WHERE id = %s",
            (order_id,)
        )
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, str(e))
    finally:
        conn.close()
    
    return dict(dispute)


# ============================================================
# RATING ENDPOINTS
# ============================================================

@app.post("/api/orders/{order_id}/rate")
def rate_order(order_id: int, data: CreateRating, wallet: str):
    """Sipariş sonrası puanlama"""
    wallet = wallet.lower()
    order = db_query("""
        SELECT o.*, b.wallet_address AS buyer_wallet, s.wallet_address AS seller_wallet
        FROM orders o
        JOIN users b ON o.buyer_id = b.id
        JOIN users s ON o.seller_id = s.id
        WHERE o.id = %s
    """, (order_id,), fetch_one=True)
    
    if not order:
        raise HTTPException(404, "Sipariş bulunamadı")
    if order['status'] != 'completed':
        raise HTTPException(400, "Sadece tamamlanan siparişler puanlanabilir")
    
    user = db_query("SELECT id FROM users WHERE wallet_address = %s", (wallet,), fetch_one=True)
    
    if wallet == order['buyer_wallet']:
        role = 'buyer_rates_seller'
        rated_id = order['seller_id']
    elif wallet == order['seller_wallet']:
        role = 'seller_rates_buyer'
        rated_id = order['buyer_id']
    else:
        raise HTTPException(403, "Bu siparişte yetkiniz yok")
    
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO ratings (order_id, rater_id, rated_id, role, score, comment)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (order_id, rater_id) DO UPDATE 
            SET score = EXCLUDED.score, comment = EXCLUDED.comment
            RETURNING *
        """, (order_id, user['id'], rated_id, role, data.score, data.comment))
        rating = cur.fetchone()
        
        # Rating ortalamasını güncelle
        cur.execute("SELECT update_user_rating(%s, %s)", (rated_id, role))
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, str(e))
    finally:
        conn.close()
    
    return dict(rating)


# ============================================================
# MESSAGE ENDPOINTS
# ============================================================

@app.get("/api/orders/{order_id}/messages")
def get_messages(order_id: int, wallet: str):
    """Sipariş mesajları"""
    messages = db_query("""
        SELECT m.*, u.wallet_address AS sender_wallet, u.username AS sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.order_id = %s
        ORDER BY m.created_at ASC
    """, (order_id,))
    return [dict(m) for m in messages]


@app.post("/api/orders/{order_id}/messages")
def send_message(order_id: int, data: SendMessage, wallet: str):
    """Mesaj gönder"""
    wallet = wallet.lower()
    user = db_query("SELECT id FROM users WHERE wallet_address = %s", (wallet,), fetch_one=True)
    if not user:
        raise HTTPException(404, "Kullanıcı bulunamadı")
    
    message = db_query("""
        INSERT INTO messages (order_id, sender_id, content)
        VALUES (%s, %s, %s)
        RETURNING *
    """, (order_id, user['id'], data.content), fetch_one=True)
    
    return dict(message)


# ============================================================
# NOTIFICATION ENDPOINTS
# ============================================================

@app.get("/api/notifications/{wallet}")
def get_notifications(wallet: str, unread_only: bool = False):
    """Kullanıcı bildirimleri"""
    user = db_query("SELECT id FROM users WHERE wallet_address = %s", (wallet.lower(),), fetch_one=True)
    if not user:
        raise HTTPException(404)
    
    condition = "AND n.is_read = false" if unread_only else ""
    notifs = db_query(f"""
        SELECT * FROM notifications n
        WHERE n.user_id = %s {condition}
        ORDER BY n.created_at DESC LIMIT 50
    """, (user['id'],))
    return [dict(n) for n in notifs]


@app.put("/api/notifications/read/{wallet}")
def mark_read(wallet: str, notification_id: Optional[int] = None):
    """Bildirimleri okundu işaretle"""
    user = db_query("SELECT id FROM users WHERE wallet_address = %s", (wallet.lower(),), fetch_one=True)
    if not user:
        raise HTTPException(404)
    
    if notification_id:
        db_execute("UPDATE notifications SET is_read = true WHERE id = %s AND user_id = %s",
                   (notification_id, user['id']))
    else:
        db_execute("UPDATE notifications SET is_read = true WHERE user_id = %s AND is_read = false",
                   (user['id'],))
    return {"status": "ok"}


# ============================================================
# ADMIN ENDPOINTS — Yönetici paneli
# ============================================================

@app.get("/api/admin/dashboard")
def admin_dashboard():
    """Admin ana dashboard"""
    stats = {}
    
    # Aktif siparişler
    stats['active_orders'] = db_query(
        "SELECT COUNT(*) as count FROM orders WHERE status IN ('paid', 'active', 'delivering')",
        fetch_one=True
    )['count']
    
    # Onay bekleyen
    stats['pending_review'] = db_query(
        "SELECT COUNT(*) as count FROM orders WHERE status = 'delivering' AND review_at IS NOT NULL",
        fetch_one=True
    )['count']
    
    # Açık dispute
    stats['open_disputes'] = db_query(
        "SELECT COUNT(*) as count FROM disputes WHERE status = 'open'",
        fetch_one=True
    )['count']
    
    # Bugünkü gelir
    stats['today_commission'] = db_query(
        "SELECT COALESCE(SUM(commission), 0) as total FROM orders WHERE DATE(completed_at) = CURRENT_DATE AND status = 'completed'",
        fetch_one=True
    )['total']
    
    # Toplam kullanıcı
    stats['total_users'] = db_query(
        "SELECT COUNT(*) as count FROM users",
        fetch_one=True
    )['count']
    
    # Toplam hacim
    stats['total_volume'] = db_query(
        "SELECT COALESCE(SUM(total_paid), 0) as total FROM orders WHERE status = 'completed'",
        fetch_one=True
    )['total']
    
    # Bekleyen çekimler
    stats['pending_withdrawals'] = db_query(
        "SELECT COUNT(*) as count FROM transactions WHERE type = 'withdraw' AND status = 'pending'",
        fetch_one=True
    )['count']
    
    return stats


@app.get("/api/admin/orders")
def admin_orders(status: Optional[str] = None, page: int = 1, limit: int = 20):
    """Admin sipariş listesi"""
    conditions = []
    params = []
    
    if status:
        conditions.append("o.status = %s")
        params.append(status)
    
    where = "WHERE " + " AND ".join(conditions) if conditions else ""
    offset = (page - 1) * limit
    
    orders = db_query(f"""
        SELECT o.*,
               b.wallet_address AS buyer_wallet, b.username AS buyer_name,
               s.wallet_address AS seller_wallet, s.username AS seller_name,
               l.title AS listing_title
        FROM orders o
        JOIN users b ON o.buyer_id = b.id
        JOIN users s ON o.seller_id = s.id
        JOIN listings l ON o.listing_id = l.id
        {where}
        ORDER BY o.created_at DESC
        LIMIT %s OFFSET %s
    """, params + [limit, offset])
    
    return [dict(o) for o in orders]


@app.get("/api/admin/orders/review")
def admin_review_queue():
    """Admin onay kuyruğu — onay bekleyen siparişler"""
    orders = db_query("""
        SELECT o.*,
               b.wallet_address AS buyer_wallet, b.username AS buyer_name,
               s.wallet_address AS seller_wallet, s.username AS seller_name,
               l.title AS listing_title
        FROM orders o
        JOIN users b ON o.buyer_id = b.id
        JOIN users s ON o.seller_id = s.id
        JOIN listings l ON o.listing_id = l.id
        WHERE o.status = 'delivering' AND o.review_at IS NOT NULL
           OR o.status = 'active' AND o.expected_end_at < NOW()
        ORDER BY o.review_at ASC
    """)
    return [dict(o) for o in orders]


@app.post("/api/admin/orders/{order_id}/action")
def admin_order_action(order_id: int, data: AdminOrderAction, admin_id: int = 1):
    """Admin sipariş onayı/reddi"""
    order = db_query("SELECT * FROM orders WHERE id = %s", (order_id,), fetch_one=True)
    if not order:
        raise HTTPException(404, "Sipariş bulunamadı")
    
    subtotal = Decimal(str(order['subtotal']))
    commission = Decimal(str(order['commission']))
    total = Decimal(str(order['total_paid']))
    
    if data.action == "approve":
        payout = subtotal
        refund = Decimal('0')
    elif data.action == "reject":
        payout = Decimal('0')
        refund = total  # komisyon dahil iade
        commission = Decimal('0')
    elif data.action == "partial":
        ratio = Decimal(str(data.payout_percent or 100)) / Decimal('100')
        payout = (subtotal * ratio).quantize(Decimal('0.01'))
        refund = (subtotal * (1 - ratio)).quantize(Decimal('0.01'))
        commission = (payout * COMMISSION_RATE).quantize(Decimal('0.01'))
    else:
        raise HTTPException(400, "Geçersiz action")
    
    conn = get_db()
    try:
        cur = conn.cursor()
        
        # Escrow release
        cur.execute("SELECT release_escrow(%s, %s, %s, %s)",
                    (order_id, float(payout), float(refund), float(commission)))
        
        # Sipariş güncelle
        new_status = 'completed' if data.action in ('approve', 'partial') else 'cancelled'
        cur.execute("""
            UPDATE orders SET 
                status = %s,
                admin_action = %s,
                admin_id = %s,
                admin_note = %s,
                admin_action_at = NOW(),
                payout_amount = %s,
                refund_amount = %s,
                commission = %s,
                completed_at = CASE WHEN %s IN ('approve', 'partial') THEN NOW() ELSE NULL END,
                cancelled_at = CASE WHEN %s = 'reject' THEN NOW() ELSE NULL END
            WHERE id = %s
        """, (
            new_status, data.action, admin_id, data.note,
            float(payout), float(refund), float(commission),
            data.action, data.action, order_id
        ))
        
        # İlanı tekrar aktif yap
        cur.execute(
            "UPDATE listings SET status = 'active' WHERE id = %s",
            (order['listing_id'],)
        )
        
        # Transaction kayıtları
        if payout > 0:
            cur.execute("""
                INSERT INTO transactions (user_id, type, amount, order_id, status, confirmed_at)
                VALUES (%s, 'payout', %s, %s, 'confirmed', NOW())
            """, (order['seller_id'], float(payout), order_id))
        
        if refund > 0:
            cur.execute("""
                INSERT INTO transactions (user_id, type, amount, order_id, status, confirmed_at)
                VALUES (%s, 'escrow_refund', %s, %s, 'confirmed', NOW())
            """, (order['buyer_id'], float(refund), order_id))
        
        if commission > 0:
            cur.execute("""
                INSERT INTO transactions (user_id, type, amount, order_id, status, confirmed_at)
                VALUES (%s, 'commission', %s, %s, 'confirmed', NOW())
            """, (order['seller_id'], float(commission), order_id))
        
        # Bildirimler
        cur.execute("""
            INSERT INTO notifications (user_id, type, title, body, related_type, related_id)
            VALUES (%s, 'order_completed', %s, %s, 'order', %s),
                   (%s, 'order_completed', %s, %s, 'order', %s)
        """, (
            order['buyer_id'], 'Sipariş tamamlandı',
            f"Sipariş {order['order_code']}: {data.action}. İade: {refund} USDT",
            order_id,
            order['seller_id'], 'Ödeme yapıldı',
            f"Sipariş {order['order_code']}: {payout} USDT hesabınıza eklendi.",
            order_id
        ))
        
        # Admin log
        cur.execute("""
            INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
            VALUES (%s, %s, 'order', %s, %s)
        """, (admin_id, f"order_{data.action}", order_id, 
              json.dumps({"payout": float(payout), "refund": float(refund), "commission": float(commission)})))
        
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, str(e))
    finally:
        conn.close()
    
    return {
        "status": new_status,
        "action": data.action,
        "payout_to_seller": float(payout),
        "refund_to_buyer": float(refund),
        "commission": float(commission)
    }


@app.post("/api/admin/disputes/{dispute_id}/resolve")
def admin_resolve_dispute(dispute_id: int, data: AdminDisputeAction, admin_id: int = 1):
    """Admin dispute çözümü"""
    dispute = db_query("SELECT * FROM disputes WHERE id = %s", (dispute_id,), fetch_one=True)
    if not dispute:
        raise HTTPException(404, "Dispute bulunamadı")
    
    order = db_query("SELECT * FROM orders WHERE id = %s", (dispute['order_id'],), fetch_one=True)
    
    # Resolution'a göre admin order action çağır
    if data.resolution == 'full_refund':
        action_data = AdminOrderAction(action="reject", note=data.note)
    elif data.resolution == 'full_payout':
        action_data = AdminOrderAction(action="approve", note=data.note)
    elif data.resolution == 'partial':
        action_data = AdminOrderAction(
            action="partial", 
            payout_percent=data.payout_percent or 50,
            note=data.note
        )
    else:
        action_data = AdminOrderAction(action="reject", note="Dispute iptal edildi")
    
    # Order action'ı çalıştır
    result = admin_order_action(dispute['order_id'], action_data, admin_id)
    
    # Dispute'u güncelle
    db_execute("""
        UPDATE disputes SET 
            status = 'resolved', 
            resolution = %s,
            resolution_note = %s,
            admin_id = %s,
            resolved_at = NOW()
        WHERE id = %s
    """, (data.resolution, data.note, admin_id, dispute_id))
    
    return {"dispute_resolved": True, "order_result": result}


@app.get("/api/admin/disputes")
def admin_disputes(status: str = "open"):
    """Admin dispute listesi"""
    disputes = db_query("""
        SELECT d.*, 
               o.order_code, o.algorithm, o.hashrate_ordered,
               o.total_paid, o.avg_hashrate, o.uptime_percent,
               b.wallet_address AS buyer_wallet, b.username AS buyer_name,
               s.wallet_address AS seller_wallet, s.username AS seller_name,
               opener.username AS opened_by_name
        FROM disputes d
        JOIN orders o ON d.order_id = o.id
        JOIN users b ON o.buyer_id = b.id
        JOIN users s ON o.seller_id = s.id
        JOIN users opener ON d.opened_by = opener.id
        WHERE d.status = %s
        ORDER BY d.created_at ASC
    """, (status,))
    return [dict(d) for d in disputes]


@app.get("/api/admin/users")
def admin_users(page: int = 1, limit: int = 20):
    """Admin kullanıcı listesi"""
    offset = (page - 1) * limit
    users = db_query("""
        SELECT * FROM users
        ORDER BY created_at DESC
        LIMIT %s OFFSET %s
    """, (limit, offset))
    return [dict(u) for u in users]


@app.post("/api/admin/users/{user_id}/ban")
def admin_ban_user(user_id: int, reason: str = "Platform kuralları ihlali"):
    """Kullanıcı yasakla"""
    db_execute(
        "UPDATE users SET is_banned = true, ban_reason = %s WHERE id = %s",
        (reason, user_id)
    )
    return {"status": "banned"}


# ============================================================
# PROXY CALLBACK ENDPOINTS — Proxy sunucudan gelen veriler
# ============================================================

@app.post("/api/proxy/connect")
def proxy_worker_connected(worker_id: str, miner_ip: str, user_agent: str = None):
    """Proxy: Worker bağlandı"""
    conn = get_db()
    try:
        cur = conn.cursor()
        
        # Proxy session güncelle
        cur.execute("""
            UPDATE proxy_sessions SET 
                status = 'connected', 
                miner_ip = %s,
                miner_user_agent = %s,
                connected_at = NOW(),
                last_activity_at = NOW()
            WHERE worker_id = %s AND status = 'waiting'
        """, (miner_ip, user_agent, worker_id))
        
        # Order durumunu güncelle
        cur.execute("""
            UPDATE orders SET 
                status = 'active',
                started_at = NOW(),
                expected_end_at = NOW() + (hours * INTERVAL '1 hour'),
                proxy_connected_at = NOW()
            WHERE proxy_worker_id = %s AND status = 'paid'
            RETURNING id, buyer_id, seller_id, hours
        """, (worker_id,))
        order = cur.fetchone()
        
        if order:
            # Bildirimler
            cur.execute("""
                INSERT INTO notifications (user_id, type, title, body, related_type, related_id)
                VALUES (%s, 'order_started', 'Mining başladı!', %s, 'order', %s)
            """, (order['buyer_id'], f"Rig bağlandı, {order['hours']} saatlik mining başladı.", order['id']))
            
            # Sistem mesajı
            cur.execute("""
                INSERT INTO messages (order_id, sender_id, content, is_system)
                VALUES (%s, %s, '✅ Rig bağlandı, mining başladı!', true)
            """, (order['id'], order['seller_id']))
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, str(e))
    finally:
        conn.close()
    
    return {"status": "ok"}


@app.post("/api/proxy/share")
def proxy_share_submitted(
    worker_id: str, 
    share_type: str,  # accepted, rejected, stale
    difficulty: float = 0,
    hashrate: float = 0
):
    """Proxy: Share submit edildi"""
    order = db_query(
        "SELECT id FROM orders WHERE proxy_worker_id = %s AND status = 'active'",
        (worker_id,), fetch_one=True
    )
    if not order:
        return {"status": "no_active_order"}
    
    session = db_query(
        "SELECT id FROM proxy_sessions WHERE worker_id = %s AND status IN ('connected', 'mining') ORDER BY id DESC LIMIT 1",
        (worker_id,), fetch_one=True
    )
    
    conn = get_db()
    try:
        cur = conn.cursor()
        
        # Share log kaydet
        cur.execute("""
            INSERT INTO share_logs (order_id, session_id, share_type, difficulty, calculated_hashrate)
            VALUES (%s, %s, %s, %s, %s)
        """, (order['id'], session['id'] if session else None, share_type, difficulty, hashrate))
        
        # Order share sayaçlarını güncelle
        if share_type == 'accepted':
            cur.execute("""
                UPDATE orders SET 
                    shares_accepted = shares_accepted + 1,
                    current_hashrate = %s,
                    last_share_at = NOW()
                WHERE id = %s
            """, (hashrate, order['id']))
        else:
            cur.execute("""
                UPDATE orders SET shares_rejected = shares_rejected + 1 WHERE id = %s
            """, (order['id'],))
        
        # Proxy session güncelle
        if session:
            cur.execute("""
                UPDATE proxy_sessions SET status = 'mining', last_activity_at = NOW()
                WHERE id = %s
            """, (session['id'],))
        
        conn.commit()
    except Exception as e:
        conn.rollback()
    finally:
        conn.close()
    
    return {"status": "ok"}


@app.post("/api/proxy/hashrate")
def proxy_hashrate_update(worker_id: str, hashrate: float, hashrate_unit: str, 
                           shares_period: int = 0, accepted_period: int = 0, rejected_period: int = 0):
    """Proxy: Periyodik hashrate raporu (her 5dk)"""
    order = db_query(
        "SELECT id, hashrate_ordered FROM orders WHERE proxy_worker_id = %s AND status = 'active'",
        (worker_id,), fetch_one=True
    )
    if not order:
        return {"status": "no_active_order"}
    
    conn = get_db()
    try:
        cur = conn.cursor()
        
        # Snapshot kaydet
        cur.execute("""
            INSERT INTO hashrate_snapshots 
            (order_id, hashrate, hashrate_unit, shares_in_period, accepted_in_period, rejected_in_period)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (order['id'], hashrate, hashrate_unit, shares_period, accepted_period, rejected_period))
        
        # Ortalama hashrate hesapla
        avg = db_query("""
            SELECT AVG(hashrate) as avg_hr FROM hashrate_snapshots
            WHERE order_id = %s
        """, (order['id'],), fetch_one=True)
        
        accuracy = (float(avg['avg_hr']) / float(order['hashrate_ordered']) * 100) if order['hashrate_ordered'] > 0 else 0
        
        cur.execute("""
            UPDATE orders SET 
                current_hashrate = %s,
                avg_hashrate = %s,
                hashrate_accuracy = %s
            WHERE id = %s
        """, (hashrate, float(avg['avg_hr']), min(accuracy, 100), order['id']))
        
        # Düşük hashrate kontrolü
        if accuracy < 50:
            cur.execute("""
                INSERT INTO notifications (user_id, type, title, body, related_type, related_id)
                SELECT buyer_id, 'hashrate_low', '⚠️ Düşük hashrate!', 
                       'Hashrate sipariş değerinin %%50 altında: ' || %s::text, 'order', id
                FROM orders WHERE id = %s
            """, (round(hashrate, 2), order['id']))
        
        conn.commit()
    except Exception as e:
        conn.rollback()
    finally:
        conn.close()
    
    return {"status": "ok", "accuracy": round(accuracy, 2)}


@app.post("/api/proxy/disconnect")
def proxy_worker_disconnected(worker_id: str):
    """Proxy: Worker bağlantısı koptu"""
    conn = get_db()
    try:
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE proxy_sessions SET status = 'disconnected', disconnected_at = NOW()
            WHERE worker_id = %s AND status IN ('connected', 'mining')
        """, (worker_id,))
        
        cur.execute("""
            UPDATE orders SET proxy_disconnected_at = NOW()
            WHERE proxy_worker_id = %s AND status = 'active'
            RETURNING id, buyer_id, seller_id
        """, (worker_id,))
        order = cur.fetchone()
        
        if order:
            cur.execute("""
                INSERT INTO notifications (user_id, type, title, body, related_type, related_id)
                VALUES (%s, 'rig_offline', '🔴 Rig offline!', 'Mining durdu. Satıcı rig''i yeniden bağlamalı.', 'order', %s),
                       (%s, 'rig_offline', '⚠️ Rig''iniz offline!', 'Lütfen rig''inizi tekrar bağlayın.', 'order', %s)
            """, (order['buyer_id'], order['id'], order['seller_id'], order['id']))
        
        conn.commit()
    except Exception as e:
        conn.rollback()
    finally:
        conn.close()
    
    return {"status": "ok"}


# ============================================================
# STATS ENDPOINTS — Genel istatistikler
# ============================================================

@app.get("/api/stats/algorithms")
def get_algorithm_stats():
    """Algoritma bazlı istatistikler"""
    stats = db_query("""
        SELECT algorithm, 
               COUNT(*) as listing_count,
               AVG(price_per_hour) as avg_price,
               MIN(price_per_hour) as min_price,
               MAX(price_per_hour) as max_price
        FROM listings 
        WHERE status = 'active'
        GROUP BY algorithm
        ORDER BY listing_count DESC
    """)
    return [dict(s) for s in stats]


@app.get("/api/stats/platform")
def platform_stats():
    """Genel platform istatistikleri (public)"""
    return {
        "total_listings": db_query("SELECT COUNT(*) as c FROM listings WHERE status = 'active'", fetch_one=True)['c'],
        "total_completed": db_query("SELECT COUNT(*) as c FROM orders WHERE status = 'completed'", fetch_one=True)['c'],
        "total_users": db_query("SELECT COUNT(*) as c FROM users", fetch_one=True)['c'],
        "algorithms": db_query("SELECT DISTINCT algorithm FROM listings WHERE status = 'active'")
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "HashMarket API", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
