-- ============================================================
-- HASHMARKET DATABASE SCHEMA
-- Marketplace tabloları (mevcut HashBrotherhood üzerine)
-- ============================================================

-- ============================================================
-- 1. USERS — Cüzdan bazlı kullanıcı sistemi
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,  -- 0x... BSC/ETH adresi
    username VARCHAR(30) UNIQUE,                  -- opsiyonel görünen ad
    email VARCHAR(100),                           -- opsiyonel bildirim için
    avatar_url TEXT,
    bio TEXT,
    
    -- Bakiyeler (iç sistem)
    balance_available DECIMAL(18,2) DEFAULT 0,    -- kullanılabilir USDT
    balance_escrow DECIMAL(18,2) DEFAULT 0,       -- kilitli (siparişlerde)
    balance_pending DECIMAL(18,2) DEFAULT 0,      -- onay bekleyen
    
    -- İstatistikler
    total_earned DECIMAL(18,2) DEFAULT 0,         -- toplam kazanç (satıcı)
    total_spent DECIMAL(18,2) DEFAULT 0,          -- toplam harcama (alıcı)
    total_orders_as_buyer INTEGER DEFAULT 0,
    total_orders_as_seller INTEGER DEFAULT 0,
    disputes_won INTEGER DEFAULT 0,
    disputes_lost INTEGER DEFAULT 0,
    
    -- Rating
    seller_rating DECIMAL(3,2) DEFAULT 0,         -- 0.00 - 5.00
    seller_rating_count INTEGER DEFAULT 0,
    buyer_rating DECIMAL(3,2) DEFAULT 0,
    buyer_rating_count INTEGER DEFAULT 0,
    
    -- Durum
    is_verified BOOLEAN DEFAULT false,            -- 10+ başarılı sipariş
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,
    
    -- Zaman
    created_at TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW(),
    
    -- Kısıtlamalar
    CONSTRAINT balance_non_negative CHECK (balance_available >= 0),
    CONSTRAINT escrow_non_negative CHECK (balance_escrow >= 0)
);

CREATE INDEX idx_users_wallet ON users(wallet_address);

-- ============================================================
-- 2. LISTINGS — Satıcı ilanları (rig listeleme)
-- ============================================================
CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES users(id),
    
    -- Rig bilgileri
    title VARCHAR(100) NOT NULL,                  -- "2x Antminer S19 XP"
    description TEXT,
    algorithm VARCHAR(50) NOT NULL,               -- SHA256, RandomX, KawPow...
    hashrate DECIMAL(20,4) NOT NULL,              -- sayısal değer
    hashrate_unit VARCHAR(10) NOT NULL,            -- H/s, KH/s, MH/s, GH/s, TH/s
    hardware_info VARCHAR(200),                    -- opsiyonel donanım detayı
    
    -- Fiyatlandırma
    price_per_hour DECIMAL(18,4) NOT NULL,        -- USDT/saat
    min_hours INTEGER DEFAULT 1,                  -- minimum kiralama süresi
    max_hours INTEGER DEFAULT 720,                -- maximum (30 gün)
    
    -- Proxy bağlantı bilgileri
    proxy_region VARCHAR(20),                     -- eu, us1, us2, asia
    proxy_worker_id VARCHAR(50),                  -- kullanıcıadı.rigID
    
    -- Doğrulama
    verified_hashrate DECIMAL(20,4),              -- proxy ile ölçülen gerçek hashrate
    last_verified_at TIMESTAMP,
    verification_status VARCHAR(20) DEFAULT 'unverified',  -- unverified, verified, failed
    
    -- Durum
    status VARCHAR(20) DEFAULT 'draft',           -- draft, active, rented, paused, suspended
    is_online BOOLEAN DEFAULT false,              -- proxy'de aktif mi?
    last_online_at TIMESTAMP,
    
    -- İstatistikler
    total_rentals INTEGER DEFAULT 0,
    total_hours_rented DECIMAL(10,1) DEFAULT 0,
    avg_uptime_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Zaman
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT positive_hashrate CHECK (hashrate > 0),
    CONSTRAINT positive_price CHECK (price_per_hour > 0),
    CONSTRAINT valid_hours CHECK (min_hours > 0 AND max_hours >= min_hours)
);

CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_algorithm ON listings(algorithm);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_price ON listings(price_per_hour);

-- ============================================================
-- 3. ORDERS — Kiralama siparişleri
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(20) UNIQUE NOT NULL,       -- hb_ord_XXXX
    listing_id INTEGER NOT NULL REFERENCES listings(id),
    buyer_id INTEGER NOT NULL REFERENCES users(id),
    seller_id INTEGER NOT NULL REFERENCES users(id),
    
    -- Sipariş detayları
    algorithm VARCHAR(50) NOT NULL,
    hashrate_ordered DECIMAL(20,4) NOT NULL,
    hashrate_unit VARCHAR(10) NOT NULL,
    hours INTEGER NOT NULL,
    price_per_hour DECIMAL(18,4) NOT NULL,
    subtotal DECIMAL(18,2) NOT NULL,              -- price_per_hour * hours
    commission DECIMAL(18,2) NOT NULL,            -- %3
    commission_rate DECIMAL(5,4) DEFAULT 0.03,
    total_paid DECIMAL(18,2) NOT NULL,            -- subtotal + commission
    
    -- Alıcının pool bilgileri
    pool_host VARCHAR(255) NOT NULL,
    pool_port INTEGER NOT NULL,
    pool_wallet VARCHAR(255) NOT NULL,            -- alıcının mining cüzdanı
    pool_worker VARCHAR(100),
    pool_password VARCHAR(50) DEFAULT 'x',
    backup_pool_host VARCHAR(255),
    backup_pool_port INTEGER,
    
    -- Proxy bilgileri
    proxy_server VARCHAR(50),                     -- eu.hashbrotherhood.com
    proxy_port INTEGER,                           -- 3333
    proxy_worker_id VARCHAR(50),                  -- hb_ord_XXXX
    
    -- Proxy izleme verileri
    shares_accepted BIGINT DEFAULT 0,
    shares_rejected BIGINT DEFAULT 0,
    current_hashrate DECIMAL(20,4) DEFAULT 0,
    avg_hashrate DECIMAL(20,4) DEFAULT 0,
    hashrate_accuracy DECIMAL(5,2) DEFAULT 0,     -- yüzde (gerçek/söz verilen)
    uptime_seconds BIGINT DEFAULT 0,
    downtime_seconds BIGINT DEFAULT 0,
    uptime_percent DECIMAL(5,2) DEFAULT 0,
    last_share_at TIMESTAMP,
    proxy_connected_at TIMESTAMP,
    proxy_disconnected_at TIMESTAMP,
    
    -- Durum akışı
    -- pending → paid → active → delivering → completed
    -- pending → paid → active → dispute → resolved
    -- pending → cancelled
    status VARCHAR(20) DEFAULT 'pending',
    
    -- Zaman damgaları
    created_at TIMESTAMP DEFAULT NOW(),
    paid_at TIMESTAMP,                            -- escrow'a alındı
    started_at TIMESTAMP,                         -- proxy bağlantısı başladı
    expected_end_at TIMESTAMP,                    -- started_at + hours
    actual_end_at TIMESTAMP,                      -- gerçek bitiş
    review_at TIMESTAMP,                          -- admin review'a düştü
    completed_at TIMESTAMP,                       -- admin onayladı
    cancelled_at TIMESTAMP,
    
    -- Admin onay
    admin_action VARCHAR(20),                     -- approved, rejected, partial
    admin_id INTEGER,
    admin_note TEXT,
    admin_action_at TIMESTAMP,
    payout_amount DECIMAL(18,2),                  -- satıcıya ödenecek (kısmi olabilir)
    refund_amount DECIMAL(18,2),                  -- alıcıya iade
    
    -- Alıcı/Satıcı onay
    buyer_confirmed BOOLEAN DEFAULT false,
    buyer_confirmed_at TIMESTAMP,
    seller_confirmed BOOLEAN DEFAULT false,
    seller_confirmed_at TIMESTAMP
);

CREATE INDEX idx_orders_code ON orders(order_code);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_listing ON orders(listing_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ============================================================
-- 4. TRANSACTIONS — Para hareketleri (deposit/withdraw/escrow)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    
    -- Tip
    type VARCHAR(20) NOT NULL,                    -- deposit, withdraw, escrow_lock, escrow_release, 
                                                  -- escrow_refund, commission, payout
    
    -- Tutar
    amount DECIMAL(18,2) NOT NULL,
    fee DECIMAL(18,2) DEFAULT 0,                  -- çekim fee vs
    
    -- Blockchain bilgileri (deposit/withdraw için)
    tx_hash VARCHAR(66),                          -- BSC tx hash
    network VARCHAR(10) DEFAULT 'BEP20',
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    
    -- İlişkili sipariş (escrow işlemleri için)
    order_id INTEGER REFERENCES orders(id),
    
    -- Durum
    status VARCHAR(20) DEFAULT 'pending',         -- pending, confirmed, failed
    
    -- Bakiye snapshot
    balance_before DECIMAL(18,2),
    balance_after DECIMAL(18,2),
    
    -- Zaman
    created_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP,
    
    -- Admin onay (büyük çekimler için)
    requires_admin BOOLEAN DEFAULT false,
    admin_approved BOOLEAN,
    admin_id INTEGER,
    admin_note TEXT
);

CREATE INDEX idx_tx_user ON transactions(user_id);
CREATE INDEX idx_tx_type ON transactions(type);
CREATE INDEX idx_tx_order ON transactions(order_id);
CREATE INDEX idx_tx_status ON transactions(status);
CREATE INDEX idx_tx_hash ON transactions(tx_hash);

-- ============================================================
-- 5. PROXY_SESSIONS — Proxy bağlantı oturumları
-- ============================================================
CREATE TABLE IF NOT EXISTS proxy_sessions (
    id BIGSERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    listing_id INTEGER REFERENCES listings(id),
    
    -- Bağlantı bilgileri
    proxy_server VARCHAR(50) NOT NULL,            -- eu.hashbrotherhood.com
    proxy_port INTEGER NOT NULL,
    worker_id VARCHAR(50) NOT NULL,               -- hb_ord_XXXX
    
    -- Yönlendirme (nereye forward ediliyor)
    target_pool VARCHAR(255),
    target_port INTEGER,
    target_wallet VARCHAR(255),
    target_worker VARCHAR(100),
    
    -- Durum
    status VARCHAR(20) DEFAULT 'waiting',         -- waiting, connected, mining, disconnected
    miner_ip VARCHAR(45),                         -- bağlanan IP (IPv4/IPv6)
    miner_user_agent VARCHAR(200),                -- madenci yazılımı
    
    -- Zaman
    connected_at TIMESTAMP,
    disconnected_at TIMESTAMP,
    last_activity_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_proxy_order ON proxy_sessions(order_id);
CREATE INDEX idx_proxy_worker ON proxy_sessions(worker_id);
CREATE INDEX idx_proxy_status ON proxy_sessions(status);

-- ============================================================
-- 6. SHARE_LOGS — Share kayıtları (proxy'den gelen)
-- ============================================================
CREATE TABLE IF NOT EXISTS share_logs (
    id BIGSERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    session_id BIGINT REFERENCES proxy_sessions(id),
    
    -- Share bilgisi
    share_type VARCHAR(10) NOT NULL,              -- accepted, rejected, stale
    difficulty DECIMAL(30,0),
    
    -- Hesaplanan hashrate (5dk ortalamayla)
    calculated_hashrate DECIMAL(20,4),
    
    -- Zaman
    submitted_at TIMESTAMP DEFAULT NOW()
);

-- Partitioned by time olabilir, şimdilik basit index
CREATE INDEX idx_shares_order ON share_logs(order_id);
CREATE INDEX idx_shares_time ON share_logs(submitted_at DESC);
CREATE INDEX idx_shares_order_time ON share_logs(order_id, submitted_at DESC);

-- ============================================================
-- 7. HASHRATE_SNAPSHOTS — Periyodik hashrate kaydı
-- ============================================================
CREATE TABLE IF NOT EXISTS hashrate_snapshots (
    id BIGSERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    
    hashrate DECIMAL(20,4) NOT NULL,
    hashrate_unit VARCHAR(10) NOT NULL,
    shares_in_period INTEGER DEFAULT 0,           -- bu periyottaki share sayısı
    accepted_in_period INTEGER DEFAULT 0,
    rejected_in_period INTEGER DEFAULT 0,
    
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hashsnap_order ON hashrate_snapshots(order_id, recorded_at DESC);

-- ============================================================
-- 8. DISPUTES — Anlaşmazlıklar
-- ============================================================
CREATE TABLE IF NOT EXISTS disputes (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    opened_by INTEGER NOT NULL REFERENCES users(id),  -- kim açtı
    
    -- Dispute detayı
    reason VARCHAR(50) NOT NULL,                  -- low_hashrate, offline, wrong_pool, 
                                                  -- wrong_wallet, other
    description TEXT,
    
    -- Otomatik mı yoksa manuel mi?
    auto_triggered BOOLEAN DEFAULT false,         -- proxy anomali tespiti
    trigger_detail TEXT,                           -- "hashrate <%50 for 1+ hour"
    
    -- Proxy kanıtları (otomatik eklenir)
    proxy_avg_hashrate DECIMAL(20,4),
    proxy_uptime_percent DECIMAL(5,2),
    proxy_total_shares BIGINT,
    proxy_accepted_shares BIGINT,
    
    -- Admin karar
    status VARCHAR(20) DEFAULT 'open',            -- open, investigating, resolved, closed
    resolution VARCHAR(20),                       -- full_refund, full_payout, partial, cancelled
    resolution_note TEXT,
    admin_id INTEGER,
    resolved_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_disputes_order ON disputes(order_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- ============================================================
-- 9. RATINGS — Karşılıklı puanlama
-- ============================================================
CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    rater_id INTEGER NOT NULL REFERENCES users(id),     -- puanlayan
    rated_id INTEGER NOT NULL REFERENCES users(id),     -- puanlanan
    
    role VARCHAR(10) NOT NULL,                    -- buyer_rates_seller, seller_rates_buyer
    score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(order_id, rater_id)                    -- sipariş başına 1 puan
);

CREATE INDEX idx_ratings_rated ON ratings(rated_id);
CREATE INDEX idx_ratings_order ON ratings(order_id);

-- ============================================================
-- 10. MESSAGES — Sipariş bazlı mesajlaşma
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    sender_id INTEGER NOT NULL REFERENCES users(id),
    
    content TEXT NOT NULL,
    is_system BOOLEAN DEFAULT false,              -- otomatik mesajlar
    is_admin BOOLEAN DEFAULT false,               -- admin mesajı
    
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_order ON messages(order_id, created_at);

-- ============================================================
-- 11. NOTIFICATIONS — Bildirimler
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    
    type VARCHAR(30) NOT NULL,                    -- order_created, order_started, 
                                                  -- hashrate_low, rig_offline,
                                                  -- order_completed, payment_received,
                                                  -- dispute_opened, message_received
    title VARCHAR(100) NOT NULL,
    body TEXT,
    
    -- İlişkili kayıt
    related_type VARCHAR(20),                     -- order, listing, dispute, transaction
    related_id INTEGER,
    
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notif_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- 12. PLATFORM_WALLET — Platform cüzdan bilgileri
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_wallet (
    id SERIAL PRIMARY KEY,
    wallet_type VARCHAR(10) NOT NULL,             -- hot, cold
    address VARCHAR(42) NOT NULL,
    network VARCHAR(10) DEFAULT 'BEP20',
    balance DECIMAL(18,2) DEFAULT 0,
    max_balance DECIMAL(18,2),                    -- hot wallet limiti
    last_sweep_at TIMESTAMP,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 13. ADMIN_LOGS — Admin işlem geçmişi
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,                  -- approve_order, reject_order, ban_user, etc
    target_type VARCHAR(20),                      -- order, user, listing, dispute
    target_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_time ON admin_logs(created_at DESC);

-- ============================================================
-- VIEWS — Yararlı görünümler
-- ============================================================

-- Aktif siparişler (admin dashboard için)
CREATE OR REPLACE VIEW v_active_orders AS
SELECT 
    o.id,
    o.order_code,
    o.algorithm,
    o.hashrate_ordered,
    o.hashrate_unit,
    o.hours,
    o.total_paid,
    o.status,
    o.current_hashrate,
    o.avg_hashrate,
    o.hashrate_accuracy,
    o.uptime_percent,
    o.shares_accepted,
    o.shares_rejected,
    o.started_at,
    o.expected_end_at,
    b.wallet_address AS buyer_wallet,
    b.username AS buyer_name,
    b.seller_rating AS buyer_rating,
    s.wallet_address AS seller_wallet,
    s.username AS seller_name,
    s.seller_rating,
    l.title AS listing_title
FROM orders o
JOIN users b ON o.buyer_id = b.id
JOIN users s ON o.seller_id = s.id
JOIN listings l ON o.listing_id = l.id
WHERE o.status IN ('paid', 'active', 'delivering');

-- Platform gelir özeti
CREATE OR REPLACE VIEW v_platform_revenue AS
SELECT 
    DATE(created_at) AS date,
    COUNT(*) AS total_orders,
    SUM(commission) AS total_commission,
    SUM(total_paid) AS total_volume,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_orders,
    COUNT(CASE WHEN status IN ('dispute', 'cancelled') THEN 1 END) AS problem_orders
FROM orders
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Satıcı performans özeti
CREATE OR REPLACE VIEW v_seller_performance AS
SELECT 
    u.id AS user_id,
    u.wallet_address,
    u.username,
    u.seller_rating,
    u.seller_rating_count,
    COUNT(DISTINCT l.id) AS active_listings,
    u.total_orders_as_seller,
    u.total_earned,
    u.disputes_lost,
    u.is_verified,
    u.is_banned
FROM users u
LEFT JOIN listings l ON l.seller_id = u.id AND l.status = 'active'
WHERE u.total_orders_as_seller > 0
GROUP BY u.id
ORDER BY u.seller_rating DESC;

-- ============================================================
-- FUNCTIONS — Yardımcı fonksiyonlar
-- ============================================================

-- Sipariş kodu üret
CREATE OR REPLACE FUNCTION generate_order_code() RETURNS VARCHAR(20) AS $$
DECLARE
    new_code VARCHAR(20);
    exists_count INTEGER;
BEGIN
    LOOP
        new_code := 'hb_ord_' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');
        SELECT COUNT(*) INTO exists_count FROM orders WHERE order_code = new_code;
        EXIT WHEN exists_count = 0;
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Kullanıcı bakiyesi güncelle (escrow lock)
CREATE OR REPLACE FUNCTION lock_escrow(
    p_user_id INTEGER, 
    p_amount DECIMAL(18,2)
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users 
    SET balance_available = balance_available - p_amount,
        balance_escrow = balance_escrow + p_amount
    WHERE id = p_user_id 
      AND balance_available >= p_amount;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Escrow release (satıcıya ödeme)
CREATE OR REPLACE FUNCTION release_escrow(
    p_order_id INTEGER,
    p_payout DECIMAL(18,2),
    p_refund DECIMAL(18,2),
    p_commission DECIMAL(18,2)
) RETURNS BOOLEAN AS $$
DECLARE
    v_buyer_id INTEGER;
    v_seller_id INTEGER;
BEGIN
    SELECT buyer_id, seller_id INTO v_buyer_id, v_seller_id
    FROM orders WHERE id = p_order_id;
    
    -- Alıcının escrow'undan düş
    UPDATE users SET balance_escrow = balance_escrow - (p_payout + p_refund + p_commission)
    WHERE id = v_buyer_id;
    
    -- Satıcıya öde
    IF p_payout > 0 THEN
        UPDATE users SET 
            balance_available = balance_available + p_payout,
            total_earned = total_earned + p_payout
        WHERE id = v_seller_id;
    END IF;
    
    -- Alıcıya iade
    IF p_refund > 0 THEN
        UPDATE users SET balance_available = balance_available + p_refund
        WHERE id = v_buyer_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Rating güncelle
CREATE OR REPLACE FUNCTION update_user_rating(p_user_id INTEGER, p_role VARCHAR(10)) RETURNS VOID AS $$
BEGIN
    IF p_role = 'buyer_rates_seller' THEN
        UPDATE users SET 
            seller_rating = COALESCE((
                SELECT AVG(score)::DECIMAL(3,2) FROM ratings 
                WHERE rated_id = p_user_id AND role = 'buyer_rates_seller'
            ), 0),
            seller_rating_count = (
                SELECT COUNT(*) FROM ratings 
                WHERE rated_id = p_user_id AND role = 'buyer_rates_seller'
            )
        WHERE id = p_user_id;
    ELSE
        UPDATE users SET 
            buyer_rating = COALESCE((
                SELECT AVG(score)::DECIMAL(3,2) FROM ratings 
                WHERE rated_id = p_user_id AND role = 'seller_rates_buyer'
            ), 0),
            buyer_rating_count = (
                SELECT COUNT(*) FROM ratings 
                WHERE rated_id = p_user_id AND role = 'seller_rates_buyer'
            )
        WHERE id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- DEMO DATA
-- ============================================================

-- Demo admin (mevcut admin tablosuna eklenmeli, zaten var)
-- Demo kullanıcı oluştur (test için)
INSERT INTO users (wallet_address, username) 
VALUES ('0xDemoSeller123456789012345678901234567890', 'demo_seller')
ON CONFLICT (wallet_address) DO NOTHING;

INSERT INTO users (wallet_address, username)
VALUES ('0xDemoBuyer1234567890123456789012345678901', 'demo_buyer')
ON CONFLICT (wallet_address) DO NOTHING;
