"""
HashMarket Stratum Proxy Server
================================
Satıcı rig'i bu proxy'ye bağlanır.
Proxy, aktif siparişe göre alıcının pool'una yönlendirir.
Tüm share'leri loglar, hashrate hesaplar, API'ye raporlar.

Kullanım:
  python3 stratum_proxy.py --port 3333 --api http://localhost:8000 --region eu

Satıcı bağlantısı:
  stratum+tcp://eu.hashbrotherhood.com:3333 -u hb_ord_XXXXX -p x
"""

import asyncio
import json
import time
import argparse
import signal
import sys
from datetime import datetime
from collections import defaultdict
from typing import Optional, Dict
import aiohttp
import logging

# ============================================================
# LOGGING
# ============================================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
log = logging.getLogger("stratum-proxy")

# ============================================================
# CONFIG
# ============================================================
class Config:
    API_BASE = "http://localhost:8000"
    REGION = "eu"
    PROXY_HOST = "0.0.0.0"
    PROXY_PORT = 3333
    HASHRATE_REPORT_INTERVAL = 300  # 5 dakika
    HEARTBEAT_INTERVAL = 30         # 30 saniye
    SHARE_BUFFER_SIZE = 50          # Bu kadar share birikince toplu gönder
    MAX_CONNECTIONS = 500
    READ_TIMEOUT = 600              # 10 dk okuma timeout

# ============================================================
# WORKER SESSION — Her bağlantı için
# ============================================================
class WorkerSession:
    def __init__(self, worker_id: str, miner_ip: str):
        self.worker_id = worker_id
        self.miner_ip = miner_ip
        self.connected_at = time.time()
        self.last_share_at = 0.0
        self.last_report_at = time.time()
        
        # Share sayaçları
        self.shares_accepted = 0
        self.shares_rejected = 0
        self.shares_stale = 0
        
        # Periyodik sayaçlar (her raporda sıfırlanır)
        self.period_accepted = 0
        self.period_rejected = 0
        
        # Hashrate hesaplama
        self.share_times: list = []      # son share zamanları
        self.share_diffs: list = []      # son share difficulty'leri
        self.current_hashrate = 0.0
        
        # Pool bilgileri (API'den gelecek)
        self.target_pool: Optional[str] = None
        self.target_port: Optional[int] = None
        self.target_wallet: Optional[str] = None
        self.target_worker: Optional[str] = None
        
        # Bağlantı nesneleri
        self.pool_reader: Optional[asyncio.StreamReader] = None
        self.pool_writer: Optional[asyncio.StreamWriter] = None
        self.miner_writer: Optional[asyncio.StreamWriter] = None
        
        # Durum
        self.is_active = True
        self.user_agent = ""
        self.algorithm = ""
        
        # Stratum state
        self.subscription_id = None
        self.extranonce1 = None
        self.extranonce2_size = None
        self.difficulty = 1
        self.job_id_map: Dict[str, float] = {}  # job_id → difficulty
    
    def record_share(self, difficulty: float, accepted: bool):
        """Share kaydı + hashrate hesapla"""
        now = time.time()
        
        if accepted:
            self.shares_accepted += 1
            self.period_accepted += 1
        else:
            self.shares_rejected += 1
            self.period_rejected += 1
        
        self.last_share_at = now
        self.share_times.append(now)
        self.share_diffs.append(difficulty)
        
        # Son 5dk'lık pencere
        cutoff = now - 300
        while self.share_times and self.share_times[0] < cutoff:
            self.share_times.pop(0)
            self.share_diffs.pop(0)
        
        # Hashrate hesapla (toplam difficulty / süre)
        if len(self.share_times) >= 2:
            time_span = self.share_times[-1] - self.share_times[0]
            if time_span > 0:
                total_diff = sum(self.share_diffs)
                # Hashrate = difficulty * 2^32 / time (standart stratum formülü)
                self.current_hashrate = (total_diff * (2**32)) / time_span
    
    def get_period_stats(self):
        """Periyodik rapor verisi al ve sayaçları sıfırla"""
        stats = {
            "shares_period": self.period_accepted + self.period_rejected,
            "accepted_period": self.period_accepted,
            "rejected_period": self.period_rejected,
            "hashrate": self.current_hashrate
        }
        self.period_accepted = 0
        self.period_rejected = 0
        self.last_report_at = time.time()
        return stats
    
    @property
    def uptime_seconds(self):
        return int(time.time() - self.connected_at)


# ============================================================
# API CLIENT — Backend ile iletişim
# ============================================================
class APIClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def _get_session(self):
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=10)
            )
        return self._session
    
    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()
    
    async def _post(self, path: str, **params):
        try:
            session = await self._get_session()
            async with session.post(f"{self.base_url}{path}", params=params) as resp:
                if resp.status == 200:
                    return await resp.json()
                else:
                    text = await resp.text()
                    log.warning(f"API {path} returned {resp.status}: {text}")
                    return None
        except Exception as e:
            log.error(f"API error {path}: {e}")
            return None
    
    async def _get(self, path: str, **params):
        try:
            session = await self._get_session()
            async with session.get(f"{self.base_url}{path}", params=params) as resp:
                if resp.status == 200:
                    return await resp.json()
                return None
        except Exception as e:
            log.error(f"API error {path}: {e}")
            return None
    
    async def get_order_by_worker(self, worker_id: str):
        """Sipariş bilgilerini worker_id ile al"""
        return await self._get(f"/api/proxy/order/{worker_id}")
    
    async def notify_connect(self, worker_id: str, miner_ip: str, user_agent: str = ""):
        return await self._post("/api/proxy/connect",
                                worker_id=worker_id, miner_ip=miner_ip, user_agent=user_agent)
    
    async def notify_share(self, worker_id: str, share_type: str, difficulty: float, hashrate: float):
        return await self._post("/api/proxy/share",
                                worker_id=worker_id, share_type=share_type,
                                difficulty=difficulty, hashrate=hashrate)
    
    async def notify_hashrate(self, worker_id: str, hashrate: float, hashrate_unit: str,
                               shares_period: int, accepted_period: int, rejected_period: int):
        return await self._post("/api/proxy/hashrate",
                                worker_id=worker_id, hashrate=hashrate, hashrate_unit=hashrate_unit,
                                shares_period=shares_period, accepted_period=accepted_period,
                                rejected_period=rejected_period)
    
    async def notify_disconnect(self, worker_id: str):
        return await self._post("/api/proxy/disconnect", worker_id=worker_id)


# ============================================================
# STRATUM PROXY SERVER
# ============================================================
class StratumProxy:
    def __init__(self, config: Config):
        self.config = config
        self.api = APIClient(config.API_BASE)
        self.sessions: Dict[str, WorkerSession] = {}
        self.server: Optional[asyncio.AbstractServer] = None
        self._running = True
    
    async def start(self):
        """Proxy sunucuyu başlat"""
        self.server = await asyncio.start_server(
            self.handle_miner,
            self.config.PROXY_HOST,
            self.config.PROXY_PORT,
            limit=65536
        )
        
        addr = self.server.sockets[0].getsockname()
        log.info(f"═══════════════════════════════════════════════")
        log.info(f"  HashMarket Stratum Proxy v1.0")
        log.info(f"  Region: {self.config.REGION}")
        log.info(f"  Listening: {addr[0]}:{addr[1]}")
        log.info(f"  API: {self.config.API_BASE}")
        log.info(f"  Hashrate report interval: {self.config.HASHRATE_REPORT_INTERVAL}s")
        log.info(f"═══════════════════════════════════════════════")
        
        # Background task: periyodik hashrate raporlama
        asyncio.create_task(self._periodic_reporter())
        
        async with self.server:
            await self.server.serve_forever()
    
    async def stop(self):
        """Graceful shutdown"""
        self._running = False
        log.info("Shutting down proxy...")
        
        # Tüm session'ları kapat
        for worker_id, session in list(self.sessions.items()):
            await self._cleanup_session(worker_id, session)
        
        if self.server:
            self.server.close()
            await self.server.wait_closed()
        
        await self.api.close()
        log.info("Proxy stopped.")
    
    async def handle_miner(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        """Yeni miner bağlantısı"""
        addr = writer.get_extra_info('peername')
        miner_ip = addr[0] if addr else "unknown"
        worker_id = None
        session = None
        
        log.info(f"🔌 New connection from {miner_ip}")
        
        try:
            # İlk mesajı bekle (mining.subscribe veya login)
            worker_id, session = await self._handle_handshake(reader, writer, miner_ip)
            
            if not worker_id or not session:
                log.warning(f"❌ Handshake failed from {miner_ip}")
                writer.close()
                await writer.wait_closed()
                return
            
            # Session'ı kaydet
            self.sessions[worker_id] = session
            
            # API'ye bağlantı bildir
            await self.api.notify_connect(worker_id, miner_ip, session.user_agent)
            
            log.info(f"✅ Worker {worker_id} authenticated → {session.target_pool}:{session.target_port}")
            
            # Pool'a bağlan
            try:
                pool_reader, pool_writer = await asyncio.open_connection(
                    session.target_pool, session.target_port
                )
                session.pool_reader = pool_reader
                session.pool_writer = pool_writer
                log.info(f"🔗 Connected to pool: {session.target_pool}:{session.target_port}")
            except Exception as e:
                log.error(f"❌ Pool connection failed: {session.target_pool}:{session.target_port} → {e}")
                await self._send_error(writer, -1, f"Pool connection failed: {e}")
                writer.close()
                await writer.wait_closed()
                return
            
            # İki yönlü proxy başlat
            await asyncio.gather(
                self._miner_to_pool(session, reader, writer),
                self._pool_to_miner(session, writer),
                return_exceptions=True
            )
            
        except asyncio.CancelledError:
            pass
        except Exception as e:
            log.error(f"💥 Error handling {miner_ip}: {e}")
        finally:
            # Cleanup
            if worker_id and session:
                await self._cleanup_session(worker_id, session)
            
            try:
                writer.close()
                await writer.wait_closed()
            except:
                pass
    
    async def _handle_handshake(self, reader, writer, miner_ip):
        """Stratum handshake — worker_id'yi al, sipariş bilgilerini çek"""
        buffer = b""
        
        while True:
            try:
                data = await asyncio.wait_for(reader.read(4096), timeout=30)
            except asyncio.TimeoutError:
                log.warning(f"Handshake timeout from {miner_ip}")
                return None, None
            
            if not data:
                return None, None
            
            buffer += data
            
            # Satır satır parse et
            while b'\n' in buffer:
                line, buffer = buffer.split(b'\n', 1)
                line = line.strip()
                if not line:
                    continue
                
                try:
                    msg = json.loads(line.decode())
                except json.JSONDecodeError:
                    continue
                
                method = msg.get('method', '')
                
                # --- mining.subscribe ---
                if method == 'mining.subscribe':
                    user_agent = ""
                    if msg.get('params') and len(msg['params']) > 0:
                        user_agent = msg['params'][0]
                    
                    # Subscribe response gönder
                    response = {
                        "id": msg.get('id', 1),
                        "result": [
                            ["mining.notify", "hb_sub_001"],
                            "hb0001",  # extranonce1
                            4           # extranonce2_size
                        ],
                        "error": None
                    }
                    await self._send_json(writer, response)
                    continue
                
                # --- mining.authorize ---
                if method == 'mining.authorize':
                    params = msg.get('params', [])
                    if not params:
                        await self._send_error(writer, msg.get('id'), "Missing worker ID")
                        return None, None
                    
                    # Worker ID = hb_ord_XXXXX
                    raw_worker = params[0]
                    worker_id = raw_worker.split('.')[0]  # hb_ord_XXXXX.rig1 → hb_ord_XXXXX
                    
                    if not worker_id.startswith('hb_ord_'):
                        await self._send_error(writer, msg.get('id'), 
                            "Invalid worker ID. Use your order code: hb_ord_XXXXX")
                        return None, None
                    
                    # API'den sipariş bilgilerini al
                    order = await self.api.get_order_by_worker(worker_id)
                    
                    if not order:
                        await self._send_error(writer, msg.get('id'),
                            f"No active order found for {worker_id}")
                        return None, None
                    
                    # Session oluştur
                    session = WorkerSession(worker_id, miner_ip)
                    session.user_agent = user_agent if 'user_agent' in dir() else ""
                    session.miner_writer = writer
                    session.target_pool = order.get('pool_host')
                    session.target_port = order.get('pool_port')
                    session.target_wallet = order.get('pool_wallet')
                    session.target_worker = order.get('pool_worker') or worker_id
                    session.algorithm = order.get('algorithm', '')
                    
                    # Authorize OK
                    response = {
                        "id": msg.get('id', 2),
                        "result": True,
                        "error": None
                    }
                    await self._send_json(writer, response)
                    
                    return worker_id, session
                
                # --- login (CryptoNight / RandomX style) ---
                if method == 'login':
                    params = msg.get('params', {})
                    login = params.get('login', '')
                    worker_id = login.split('.')[0]
                    
                    if not worker_id.startswith('hb_ord_'):
                        await self._send_error(writer, msg.get('id'),
                            "Invalid login. Use your order code: hb_ord_XXXXX")
                        return None, None
                    
                    order = await self.api.get_order_by_worker(worker_id)
                    
                    if not order:
                        await self._send_error(writer, msg.get('id'),
                            f"No active order found for {worker_id}")
                        return None, None
                    
                    session = WorkerSession(worker_id, miner_ip)
                    session.user_agent = params.get('agent', '')
                    session.miner_writer = writer
                    session.target_pool = order.get('pool_host')
                    session.target_port = order.get('pool_port')
                    session.target_wallet = order.get('pool_wallet')
                    session.target_worker = order.get('pool_worker') or worker_id
                    session.algorithm = order.get('algorithm', '')
                    
                    # Login'i pool credential'larıyla değiştireceğiz
                    # (pool bağlantısı sonra yapılacak)
                    
                    return worker_id, session
        
        return None, None
    
    async def _miner_to_pool(self, session: WorkerSession, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        """Miner → Pool yönü (share intercept)"""
        buffer = b""
        
        while session.is_active:
            try:
                data = await asyncio.wait_for(
                    reader.read(4096),
                    timeout=self.config.READ_TIMEOUT
                )
            except asyncio.TimeoutError:
                log.warning(f"⏰ Read timeout for {session.worker_id}")
                break
            
            if not data:
                break
            
            buffer += data
            
            while b'\n' in buffer:
                line, buffer = buffer.split(b'\n', 1)
                line = line.strip()
                if not line:
                    continue
                
                try:
                    msg = json.loads(line.decode())
                except json.JSONDecodeError:
                    # Raw data forward
                    if session.pool_writer:
                        session.pool_writer.write(line + b'\n')
                        await session.pool_writer.drain()
                    continue
                
                method = msg.get('method', '')
                
                # --- mining.authorize → Pool'a wallet ile gönder ---
                if method == 'mining.authorize':
                    msg['params'] = [
                        f"{session.target_wallet}.{session.target_worker}",
                        "x"
                    ]
                    log.debug(f"📤 Auth rewritten → {session.target_wallet}")
                
                # --- mining.submit → Share log ---
                elif method == 'mining.submit':
                    # Share'i logla (henüz kabul/red bilmiyoruz, pool cevabını bekleyeceğiz)
                    msg_id = msg.get('id')
                    if msg_id:
                        session.job_id_map[str(msg_id)] = session.difficulty
                    
                    # Worker adını değiştir
                    if msg.get('params') and len(msg['params']) > 0:
                        msg['params'][0] = f"{session.target_wallet}.{session.target_worker}"
                
                # --- login (CN/RX) → Pool credential'larıyla değiştir ---
                elif method == 'login':
                    if 'params' in msg:
                        msg['params']['login'] = session.target_wallet
                        msg['params']['pass'] = 'x'
                
                # --- submit (CN/RX) ---
                elif method == 'submit':
                    msg_id = msg.get('id')
                    if msg_id:
                        session.job_id_map[str(msg_id)] = session.difficulty
                
                # Pool'a forward
                if session.pool_writer:
                    out = json.dumps(msg).encode() + b'\n'
                    session.pool_writer.write(out)
                    await session.pool_writer.drain()
    
    async def _pool_to_miner(self, session: WorkerSession, miner_writer: asyncio.StreamWriter):
        """Pool → Miner yönü (share result intercept)"""
        buffer = b""
        
        while session.is_active:
            if not session.pool_reader:
                await asyncio.sleep(0.1)
                continue
            
            try:
                data = await asyncio.wait_for(
                    session.pool_reader.read(4096),
                    timeout=self.config.READ_TIMEOUT
                )
            except asyncio.TimeoutError:
                break
            
            if not data:
                break
            
            buffer += data
            
            while b'\n' in buffer:
                line, buffer = buffer.split(b'\n', 1)
                line = line.strip()
                if not line:
                    continue
                
                try:
                    msg = json.loads(line.decode())
                except json.JSONDecodeError:
                    miner_writer.write(line + b'\n')
                    await miner_writer.drain()
                    continue
                
                # --- Share result (mining.submit cevabı) ---
                msg_id = str(msg.get('id', ''))
                if msg_id in session.job_id_map:
                    difficulty = session.job_id_map.pop(msg_id)
                    accepted = msg.get('result', False) is True or msg.get('result') is not None
                    error = msg.get('error')
                    
                    if error:
                        accepted = False
                    
                    share_type = 'accepted' if accepted else 'rejected'
                    session.record_share(difficulty, accepted)
                    
                    status_icon = "✅" if accepted else "❌"
                    log.info(f"{status_icon} {session.worker_id} share {share_type} | "
                             f"diff={difficulty:.0f} | HR={session.current_hashrate:.2f} H/s | "
                             f"total={session.shares_accepted}A/{session.shares_rejected}R")
                    
                    # API'ye bildir (async, bloklamaz)
                    asyncio.create_task(
                        self.api.notify_share(
                            session.worker_id, share_type,
                            difficulty, session.current_hashrate
                        )
                    )
                
                # --- mining.set_difficulty ---
                if isinstance(msg.get('method'), str) and msg['method'] == 'mining.set_difficulty':
                    if msg.get('params') and len(msg['params']) > 0:
                        session.difficulty = float(msg['params'][0])
                        log.info(f"🎯 {session.worker_id} difficulty set to {session.difficulty}")
                
                # --- job notify (CN/RX result with job) ---
                if 'result' in msg and isinstance(msg.get('result'), dict):
                    if 'job' in msg['result']:
                        job = msg['result']['job']
                        if 'target' in job:
                            # target'tan difficulty hesapla
                            try:
                                target = int(job['target'], 16)
                                if target > 0:
                                    session.difficulty = (2**256 - 1) / target / (2**32)
                            except:
                                pass
                
                # Miner'a forward
                out = json.dumps(msg).encode() + b'\n'
                miner_writer.write(out)
                await miner_writer.drain()
    
    async def _cleanup_session(self, worker_id: str, session: WorkerSession):
        """Session temizliği"""
        session.is_active = False
        
        log.info(f"🔌 Disconnecting {worker_id} | "
                 f"uptime={session.uptime_seconds}s | "
                 f"shares={session.shares_accepted}A/{session.shares_rejected}R")
        
        # API'ye bildir
        await self.api.notify_disconnect(worker_id)
        
        # Pool bağlantısını kapat
        if session.pool_writer:
            try:
                session.pool_writer.close()
                await session.pool_writer.wait_closed()
            except:
                pass
        
        # Session'ı sil
        self.sessions.pop(worker_id, None)
    
    async def _periodic_reporter(self):
        """Her 5dk'da bir tüm session'ların hashrate'ini API'ye raporla"""
        while self._running:
            await asyncio.sleep(self.config.HASHRATE_REPORT_INTERVAL)
            
            if not self.sessions:
                continue
            
            log.info(f"📊 Reporting {len(self.sessions)} active session(s)")
            
            for worker_id, session in list(self.sessions.items()):
                if not session.is_active:
                    continue
                
                stats = session.get_period_stats()
                
                # Hashrate unit tahmin (basit)
                hr = stats['hashrate']
                if hr > 1e15:
                    unit, display = "PH/s", hr / 1e15
                elif hr > 1e12:
                    unit, display = "TH/s", hr / 1e12
                elif hr > 1e9:
                    unit, display = "GH/s", hr / 1e9
                elif hr > 1e6:
                    unit, display = "MH/s", hr / 1e6
                elif hr > 1e3:
                    unit, display = "KH/s", hr / 1e3
                else:
                    unit, display = "H/s", hr
                
                log.info(f"  {worker_id}: {display:.2f} {unit} | "
                         f"{stats['accepted_period']}A/{stats['rejected_period']}R in period | "
                         f"uptime={session.uptime_seconds}s")
                
                await self.api.notify_hashrate(
                    worker_id, hr, unit,
                    stats['shares_period'],
                    stats['accepted_period'],
                    stats['rejected_period']
                )
    
    async def _send_json(self, writer: asyncio.StreamWriter, data: dict):
        """JSON mesaj gönder"""
        writer.write(json.dumps(data).encode() + b'\n')
        await writer.drain()
    
    async def _send_error(self, writer: asyncio.StreamWriter, msg_id, error_msg: str):
        """Hata mesajı gönder"""
        response = {
            "id": msg_id,
            "result": None,
            "error": [20, error_msg, None]
        }
        await self._send_json(writer, response)


# ============================================================
# EXTRA API ENDPOINT — Proxy'den sipariş bilgisi çekme
# ============================================================
# Bu endpoint main API'ye eklenmeli:
#
# @app.get("/api/proxy/order/{worker_id}")
# def get_proxy_order(worker_id: str):
#     """Proxy'nin sipariş bilgilerini alması için"""
#     order = db_query("""
#         SELECT o.pool_host, o.pool_port, o.pool_wallet, o.pool_worker,
#                o.algorithm, o.hashrate_ordered, o.hashrate_unit,
#                o.hours, o.status
#         FROM orders o
#         WHERE o.proxy_worker_id = %s AND o.status IN ('paid', 'active')
#     """, (worker_id,), fetch_one=True)
#     if not order:
#         raise HTTPException(404, "Active order not found")
#     return dict(order)


# ============================================================
# MAIN
# ============================================================
def main():
    parser = argparse.ArgumentParser(description="HashMarket Stratum Proxy")
    parser.add_argument('--host', default='0.0.0.0', help='Bind host')
    parser.add_argument('--port', type=int, default=3333, help='Bind port')
    parser.add_argument('--api', default='http://localhost:8000', help='API base URL')
    parser.add_argument('--region', default='eu', help='Region identifier')
    parser.add_argument('--report-interval', type=int, default=300, help='Hashrate report interval (seconds)')
    args = parser.parse_args()
    
    config = Config()
    config.PROXY_HOST = args.host
    config.PROXY_PORT = args.port
    config.API_BASE = args.api
    config.REGION = args.region
    config.HASHRATE_REPORT_INTERVAL = args.report_interval
    
    proxy = StratumProxy(config)
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    # Graceful shutdown
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, lambda: asyncio.create_task(proxy.stop()))
        except NotImplementedError:
            pass  # Windows
    
    try:
        loop.run_until_complete(proxy.start())
    except KeyboardInterrupt:
        loop.run_until_complete(proxy.stop())
    finally:
        loop.close()


if __name__ == "__main__":
    main()
