-- KawPow (RVN)
INSERT INTO algorithms (name, stratum_port, hardware_type, hash_unit) 
VALUES ('KawPow', 3334, 'GPU', 'MH/s')
ON CONFLICT (name) DO NOTHING;

INSERT INTO pool_configs (algorithm_id, pool_host, pool_port, wallet_address, worker_name, vardiff_min, vardiff_max)
VALUES (2, 'rvn.2miners.com', 6060, 'YOUR_RVN_WALLET', 'hashbro_rvn', 1000, 500000)
ON CONFLICT DO NOTHING;

-- Ethash (ETC)
INSERT INTO algorithms (name, stratum_port, hardware_type, hash_unit) 
VALUES ('Ethash', 3335, 'GPU', 'MH/s')
ON CONFLICT (name) DO NOTHING;

INSERT INTO pool_configs (algorithm_id, pool_host, pool_port, wallet_address, worker_name, vardiff_min, vardiff_max)
VALUES (3, 'etc.2miners.com', 1010, 'YOUR_ETC_WALLET', 'hashbro_etc', 5000, 1000000)
ON CONFLICT DO NOTHING;

-- Scrypt (LTC)
INSERT INTO algorithms (name, stratum_port, hardware_type, hash_unit) 
VALUES ('Scrypt', 3336, 'ASIC', 'MH/s')
ON CONFLICT (name) DO NOTHING;

INSERT INTO pool_configs (algorithm_id, pool_host, pool_port, wallet_address, worker_name, vardiff_min, vardiff_max)
VALUES (4, 'ltc.2miners.com', 3333, 'YOUR_LTC_WALLET', 'hashbro_ltc', 1024, 65536)
ON CONFLICT DO NOTHING;

-- SHA256 (BTC)
INSERT INTO algorithms (name, stratum_port, hardware_type, hash_unit) 
VALUES ('SHA256', 3337, 'ASIC', 'TH/s')
ON CONFLICT (name) DO NOTHING;

INSERT INTO pool_configs (algorithm_id, pool_host, pool_port, wallet_address, worker_name, vardiff_min, vardiff_max)
VALUES (5, 'btc.2miners.com', 3333, 'YOUR_BTC_WALLET', 'hashbro_btc', 1000000, 10000000)
ON CONFLICT DO NOTHING;

-- Autolykos (ERG)
INSERT INTO algorithms (name, stratum_port, hardware_type, hash_unit) 
VALUES ('Autolykos', 3338, 'GPU', 'MH/s')
ON CONFLICT (name) DO NOTHING;

INSERT INTO pool_configs (algorithm_id, pool_host, pool_port, wallet_address, worker_name, vardiff_min, vardiff_max)
VALUES (6, 'erg.2miners.com', 8888, 'YOUR_ERG_WALLET', 'hashbro_erg', 5000, 500000)
ON CONFLICT DO NOTHING;
