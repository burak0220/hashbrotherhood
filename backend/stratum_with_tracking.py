import asyncio
import json
import psycopg2
from datetime import datetime
import requests
import time

def get_db():
    return psycopg2.connect(
        dbname="hashbrotherhood",
        user="u0_a307",
        host="localhost"
    )

def get_coin_price(coin_symbol):
    try:
        coin_map = {
            "XMR": "monero",
            "RVN": "ravencoin",
            "ETC": "ethereum-classic",
            "LTC": "litecoin",
            "BTC": "bitcoin",
            "ERG": "ergo"
        }
        
        coin_id = coin_map.get(coin_symbol, "monero")
        response = requests.get(f"https://api.coingecko.com/api/v3/simple/price?ids={coin_id}&vs_currencies=usd", timeout=5)
        data = response.json()
        return float(data[coin_id]['usd'])
    except Exception as e:
        print(f"ERROR: Price fetch failed: {e}")
        return 165.0

def calculate_share_earnings(difficulty, algorithm, coin_price):
    base_earning = float(difficulty) * 0.000001
    usdt_earned = base_earning * coin_price
    net_usdt = usdt_earned * 0.975
    return net_usdt

def save_share(miner_wallet, worker_name, algorithm, difficulty, coin_price, net_usdt):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO revenue_snapshots 
        (miner_wallet, worker_name, timestamp, algorithm, difficulty, coin_price_usdt, net_usdt_earned, paid)
        VALUES (%s, %s, %s, %s, %s, %s, %s, FALSE)
    """, (miner_wallet, worker_name, datetime.now(), algorithm, int(difficulty), coin_price, net_usdt))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"✅ Share saved: {miner_wallet}/{worker_name} earned ${net_usdt:.8f} USDT (XMR: ${coin_price:.2f})")

def get_pool_config(stratum_port):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT p.*, a.name as algorithm_name
        FROM pool_configs p
        JOIN algorithms a ON p.algorithm_id = a.id
        WHERE a.stratum_port = %s AND p.active = TRUE
    """, (stratum_port,))
    
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if result:
        return {
            'pool_host': result[2],
            'pool_port': result[3],
            'wallet': result[4],
            'worker': result[5],
            'password': result[6],
            'algorithm': result[-1]
        }
    return None

async def handle_miner(reader, writer):
    addr = writer.get_extra_info('peername')
    print(f"INFO: New connection from {addr}")
    
    pool_config = get_pool_config(3333)
    
    if not pool_config:
        print("ERROR: No pool config found!")
        writer.close()
        await writer.wait_closed()
        return
    
    pool_reader, pool_writer = await asyncio.open_connection(
        pool_config['pool_host'], 
        pool_config['pool_port']
    )
    print(f"INFO: Connected to pool: {pool_config['pool_host']}:{pool_config['pool_port']}")
    
    miner_wallet = None
    worker_name = "worker01"
    last_share_time = time.time()
    
    async def miner_to_pool():
        nonlocal miner_wallet, worker_name, last_share_time
        try:
            while True:
                data = await reader.read(4096)
                if not data:
                    break
                
                try:
                    message = json.loads(data.decode())
                    print(f"INFO: Miner → Proxy: {message}")
                    
                    if message.get('method') == 'login':
                        login = message['params']['login']
                        miner_wallet = login.split('.')[0]
                        worker_name = login.split('.')[1] if '.' in login else 'worker01'
                        print(f"INFO: Miner wallet: {miner_wallet}, worker: {worker_name}")
                        message['params']['login'] = f"{pool_config['wallet']}.{pool_config['worker']}"
                    
                    if message.get('method') == 'submit':
                        difficulty = int(message['params'].get('job_id', 1000))
                        coin_price = get_coin_price("XMR")
                        net_usdt = calculate_share_earnings(difficulty, pool_config['algorithm'], coin_price)
                        
                        if miner_wallet:
                            save_share(miner_wallet, worker_name, pool_config['algorithm'], difficulty, coin_price, net_usdt)
                            
                            current_time = time.time()
                            time_diff = current_time - last_share_time
                            hashrate = difficulty / max(time_diff, 1)
                            last_share_time = current_time
                            print(f"⚡ Hashrate: {hashrate:.2f} H/s")
                    
                    pool_writer.write(json.dumps(message).encode() + b'\n')
                    await pool_writer.drain()
                    
                except json.JSONDecodeError:
                    pool_writer.write(data)
                    await pool_writer.drain()
                    
        except Exception as e:
            print(f"ERROR: Miner to pool: {e}")
    
    async def pool_to_miner():
        try:
            while True:
                data = await pool_reader.read(4096)
                if not data:
                    break
                
                try:
                    message = json.loads(data.decode())
                    print(f"INFO: Pool → Proxy: {message}")
                except:
                    pass
                
                writer.write(data)
                await writer.drain()
                
        except Exception as e:
            print(f"ERROR: Pool to miner: {e}")
    
    await asyncio.gather(
        miner_to_pool(),
        pool_to_miner(),
        return_exceptions=True
    )
    
    print(f"INFO: Connection closed: {addr}")
    writer.close()
    await writer.wait_closed()
    pool_writer.close()
    await pool_writer.wait_closed()

async def main():
    server = await asyncio.start_server(handle_miner, '0.0.0.0', 3333)
    addr = server.sockets[0].getsockname()
    print(f"INFO: Stratum server running on {addr}")
    print(f"INFO: Miners can connect to: {addr[0]}:{addr[1]}")
    
    async with server:
        await server.serve_forever()

if __name__ == "__main__":
    asyncio.run(main())
