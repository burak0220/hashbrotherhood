import asyncio
import json
import logging
from datetime import datetime
import psycopg2

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StratumServer:
    def __init__(self, host='0.0.0.0', port=3333):
        self.host = host
        self.port = port
        self.miners = {}
        
    def get_pool_config(self, algo_port):
        """Get pool configuration from database"""
        conn = psycopg2.connect(dbname="hashbrotherhood", user="u0_a307", host="localhost")
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT p.pool_host, p.pool_port, p.wallet_address, p.worker_name, p.password,
                   a.name as algo_name
            FROM pool_configs p
            JOIN algorithms a ON p.algorithm_id = a.id
            WHERE a.stratum_port = %s AND a.active = true
        """, (algo_port,))
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if result:
            return {
                'pool_host': result[0],
                'pool_port': result[1],
                'wallet': result[2],
                'worker': result[3],
                'password': result[4],
                'algorithm': result[5]
            }
        return None
    
    async def handle_miner(self, reader, writer):
        """Handle individual miner connection"""
        addr = writer.get_extra_info('peername')
        logger.info(f"New connection from {addr}")
        
        miner_wallet = None
        pool_config = self.get_pool_config(self.port)
        
        if not pool_config:
            logger.error(f"No pool config found for port {self.port}")
            writer.close()
            await writer.wait_closed()
            return
        
        try:
            # Connect to actual pool
            pool_reader, pool_writer = await asyncio.open_connection(
                pool_config['pool_host'], 
                pool_config['pool_port']
            )
            logger.info(f"Connected to pool: {pool_config['pool_host']}:{pool_config['pool_port']}")
            
            # Handle bidirectional communication
            async def miner_to_pool():
                try:
                    while True:
                        data = await reader.readline()
                        if not data:
                            break
                        
                        message = json.loads(data.decode())
                        logger.info(f"Miner → Proxy: {message}")
                        
                        # Extract wallet from login
                        if message.get('method') == 'login':
                            params = message.get('params', {})
                            login = params.get('login', '')
                            
                            # Format: WALLET.worker or just WALLET
                            if '.' in login:
                                miner_wallet = login.split('.')[0]
                            else:
                                miner_wallet = login
                            
                            logger.info(f"Miner wallet: {miner_wallet}")
                            
                            # Replace with our pool wallet
                            params['login'] = f"{pool_config['wallet']}.{pool_config['worker']}"
                            params['pass'] = pool_config['password']
                            message['params'] = params
                        
                        # Forward to pool
                        pool_writer.write(json.dumps(message).encode() + b'\n')
                        await pool_writer.drain()
                        
                except Exception as e:
                    logger.error(f"Miner → Pool error: {e}")
                finally:
                    pool_writer.close()
                    await pool_writer.wait_closed()
            
            async def pool_to_miner():
                try:
                    while True:
                        data = await pool_reader.readline()
                        if not data:
                            break
                        
                        message = json.loads(data.decode())
                        logger.info(f"Pool → Proxy: {message}")
                        
                        # Track shares
                        if message.get('method') == 'job':
                            logger.info(f"New job received for {miner_wallet}")
                        
                        # Forward to miner
                        writer.write(json.dumps(message).encode() + b'\n')
                        await writer.drain()
                        
                except Exception as e:
                    logger.error(f"Pool → Miner error: {e}")
                finally:
                    writer.close()
                    await writer.wait_closed()
            
            # Run both directions concurrently
            await asyncio.gather(
                miner_to_pool(),
                pool_to_miner()
            )
            
        except Exception as e:
            logger.error(f"Connection error: {e}")
        finally:
            writer.close()
            await writer.wait_closed()
            logger.info(f"Connection closed: {addr}")
    
    async def start(self):
        """Start stratum server"""
        server = await asyncio.start_server(
            self.handle_miner, 
            self.host, 
            self.port
        )
        
        addr = server.sockets[0].getsockname()
        logger.info(f"Stratum server running on {addr}")
        logger.info(f"Miners can connect to: {self.host}:{self.port}")
        
        async with server:
            await server.serve_forever()

if __name__ == "__main__":
    # Start RandomX stratum on port 3333
    server = StratumServer(host='0.0.0.0', port=3333)
    
    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
