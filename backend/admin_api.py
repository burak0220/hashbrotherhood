from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor

app = FastAPI(title="HashBrotherhood Admin API")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
def get_db():
    return psycopg2.connect(
        dbname="hashbrotherhood",
        user="u0_a307",
        host="localhost"
    )

class PoolConfig(BaseModel):
    algorithm_id: int
    pool_host: str
    pool_port: int
    wallet_address: str
    worker_name: str
    password: str = 'x'
    vardiff_min: int = 100
    vardiff_max: int = 100000

@app.get("/admin/pools")
async def get_all_pools():
    """Get all pool configurations"""
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        SELECT p.*, a.name as algorithm_name
        FROM pool_configs p
        JOIN algorithms a ON p.algorithm_id = a.id
        ORDER BY a.name
    """)
    
    pools = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return {"pools": pools}

@app.put("/admin/pool/{pool_id}")
async def update_pool(pool_id: int, config: PoolConfig):
    """Update pool configuration"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE pool_configs 
        SET pool_host = %s, pool_port = %s, wallet_address = %s,
            worker_name = %s, password = %s, vardiff_min = %s, vardiff_max = %s,
            updated_at = NOW()
        WHERE id = %s
    """, (
        config.pool_host, config.pool_port, config.wallet_address,
        config.worker_name, config.password, config.vardiff_min, 
        config.vardiff_max, pool_id
    ))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"message": "Pool updated successfully", "pool_id": pool_id}

@app.get("/admin/algorithms")
async def get_algorithms():
    """Get all algorithms with stats"""
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        SELECT a.*, p.pool_host, p.pool_port, p.wallet_address
        FROM algorithms a
        LEFT JOIN pool_configs p ON a.id = p.algorithm_id
        ORDER BY a.id
    """)
    
    algos = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return {"algorithms": algos}

@app.get("/admin/payments/pending")
async def get_pending_payments():
    """Get all pending payments"""
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        SELECT id, miner_wallet, amount_usdt, status, created_at
        FROM payments
        WHERE status = 'pending'
        ORDER BY created_at DESC
    """)
    
    payments = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return {"payments": payments}

@app.post("/admin/payment/{payment_id}/approve")
async def approve_payment(payment_id: int):
    """Approve a pending payment"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE payments 
        SET status = 'approved', approved_at = NOW()
        WHERE id = %s
    """, (payment_id,))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"message": "Payment approved", "payment_id": payment_id}

@app.post("/admin/payment/{payment_id}/complete")
async def complete_payment(payment_id: int, tx_hash: str):
    """Mark payment as completed with TX hash"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE payments 
        SET status = 'paid', paid_at = NOW(), tx_hash = %s
        WHERE id = %s
    """, (tx_hash, payment_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"message": "Payment completed", "payment_id": payment_id, "tx_hash": tx_hash}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
