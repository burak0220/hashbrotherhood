-- Algorithms table
CREATE TABLE IF NOT EXISTS algorithms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    stratum_port INTEGER UNIQUE NOT NULL,
    hardware_type VARCHAR(20),
    hash_unit VARCHAR(10),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Pool configurations
CREATE TABLE IF NOT EXISTS pool_configs (
    id SERIAL PRIMARY KEY,
    algorithm_id INTEGER REFERENCES algorithms(id),
    pool_host VARCHAR(255) NOT NULL,
    pool_port INTEGER NOT NULL,
    wallet_address VARCHAR(255) NOT NULL,
    worker_name VARCHAR(100) NOT NULL,
    password VARCHAR(50) DEFAULT 'x',
    vardiff_min INTEGER,
    vardiff_max INTEGER,
    vardiff_target_time INTEGER DEFAULT 15,
    vardiff_retarget_interval INTEGER DEFAULT 120,
    active BOOLEAN DEFAULT true,
    last_connection_test TIMESTAMP,
    connection_status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Revenue snapshots
CREATE TABLE IF NOT EXISTS revenue_snapshots (
    id BIGSERIAL PRIMARY KEY,
    miner_wallet VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    algorithm VARCHAR(50),
    difficulty BIGINT,
    network_difficulty DECIMAL(30,0),
    block_reward DECIMAL(18,8),
    coin_price_usdt DECIMAL(18,8),
    net_usdt_earned DECIMAL(18,8),
    paid BOOLEAN DEFAULT FALSE,
    payment_id INTEGER
);

CREATE INDEX IF NOT EXISTS idx_wallet_timestamp ON revenue_snapshots(miner_wallet, timestamp);
CREATE INDEX IF NOT EXISTS idx_paid ON revenue_snapshots(paid);
CREATE INDEX IF NOT EXISTS idx_algorithm ON revenue_snapshots(algorithm);

-- Miners (optional registration)
CREATE TABLE IF NOT EXISTS miners (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255),
    email VARCHAR(100),
    bep20_wallet VARCHAR(255),
    two_fa_secret VARCHAR(100),
    last_activity TIMESTAMP DEFAULT NOW(),
    account_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    miner_wallet VARCHAR(255) NOT NULL,
    amount_usdt DECIMAL(18,2) NOT NULL,
    tx_hash VARCHAR(255),
    network VARCHAR(20) DEFAULT 'BEP20',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,
    admin_id INTEGER
);

-- Admin
CREATE TABLE IF NOT EXISTS admin (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    two_fa_secret VARCHAR(100),
    two_fa_enabled BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Referrals (Phase 1.5)
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_wallet VARCHAR(255) NOT NULL,
    referee_wallet VARCHAR(255) NOT NULL,
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    total_referee_earnings DECIMAL(18,8) DEFAULT 0,
    referrer_commission_earned DECIMAL(18,8) DEFAULT 0,
    active BOOLEAN DEFAULT true
);

-- Insert demo algorithm (RandomX)
INSERT INTO algorithms (name, stratum_port, hardware_type, hash_unit) 
VALUES ('RandomX', 3333, 'CPU', 'H/s')
ON CONFLICT (name) DO NOTHING;

-- Insert demo pool config
INSERT INTO pool_configs (algorithm_id, pool_host, pool_port, wallet_address, worker_name, vardiff_min, vardiff_max)
VALUES (1, 'de.monero.herominers.com', 1111, 'YOUR_XMR_WALLET_HERE', 'hashbrotherhood_master', 100, 100000)
ON CONFLICT DO NOTHING;

