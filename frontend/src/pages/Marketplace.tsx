import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

const ALGORITHMS = ['All', 'SHA256', 'RandomX', 'KawPow', 'Etchash', 'Autolykos', 'Scrypt', 'Equihash']
const HASHRATE_UNITS: Record<string, string> = {
  'SHA256': 'TH/s', 'RandomX': 'KH/s', 'KawPow': 'MH/s',
  'Etchash': 'MH/s', 'Autolykos': 'MH/s', 'Scrypt': 'GH/s', 'Equihash': 'KSol/s'
}

export default function Marketplace() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ algorithm: 'All', sort: 'price_per_hour', dir: 'asc' })
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = {
      sort_by: filter.sort,
      sort_dir: filter.dir,
      status: 'active',
    }
    if (filter.algorithm !== 'All') params.algorithm = filter.algorithm

    api.getListings(params)
      .then(res => {
        setListings(res.listings || [])
        setTotal(res.total || 0)
      })
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [filter])

  const renderStars = (rating: number) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: 0 }}>Marketplace</h1>
          <p style={{ color: '#666', fontSize: 14, margin: '4px 0 0' }}>{total} listings available</p>
        </div>
        <Link to="/sell" style={{
          background: 'linear-gradient(135deg, #ffb400, #ff6b00)',
          color: '#000', padding: '10px 24px', borderRadius: 8,
          textDecoration: 'none', fontWeight: 600, fontSize: 14,
        }}>+ Sell Hashrate</Link>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {ALGORITHMS.map(algo => (
          <button key={algo} onClick={() => setFilter(f => ({ ...f, algorithm: algo }))} style={{
            background: filter.algorithm === algo ? 'rgba(255,180,0,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${filter.algorithm === algo ? 'rgba(255,180,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 8, padding: '6px 16px', fontSize: 13,
            color: filter.algorithm === algo ? '#ffb400' : '#888',
            cursor: 'pointer',
          }}>
            {algo}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <select
            value={`${filter.sort}_${filter.dir}`}
            onChange={e => {
              const [sort, dir] = e.target.value.split('_')
              setFilter(f => ({ ...f, sort, dir }))
            }}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '6px 12px', fontSize: 13, color: '#888',
            }}
          >
            <option value="price_per_hour_asc">Price: Low → High</option>
            <option value="price_per_hour_desc">Price: High → Low</option>
            <option value="hashrate_desc">Hashrate: High → Low</option>
            <option value="rating_desc">Rating: Best First</option>
            <option value="created_at_desc">Newest First</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#555' }}>Loading...</div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <div style={{ color: '#555', fontSize: 16 }}>No listings found</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {listings.map((listing: any) => (
            <Link to={`/listing/${listing.id}`} key={listing.id} style={{
              textDecoration: 'none',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: 20,
              transition: 'all 0.2s',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: 0 }}>{listing.title}</h3>
                  <span style={{
                    display: 'inline-block', marginTop: 4,
                    background: 'rgba(255,180,0,0.1)',
                    color: '#ffb400',
                    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                  }}>{listing.algorithm}</span>
                </div>
                {listing.is_online && (
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#22c55e', display: 'inline-block',
                  }} />
                )}
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ color: '#555', fontSize: 11 }}>Hashrate</div>
                  <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>
                    {listing.hashrate} <span style={{ fontSize: 12, color: '#888' }}>{listing.hashrate_unit}</span>
                  </div>
                </div>
                <div>
                  <div style={{ color: '#555', fontSize: 11 }}>Price</div>
                  <div style={{ color: '#ffb400', fontSize: 18, fontWeight: 700 }}>
                    ${Number(listing.price_per_hour).toFixed(4)} <span style={{ fontSize: 12, color: '#888' }}>/hr</span>
                  </div>
                </div>
              </div>

              {/* Seller info */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'rgba(255,180,0,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: '#ffb400', fontWeight: 700,
                  }}>
                    {(listing.seller_name || 'U')[0].toUpperCase()}
                  </div>
                  <span style={{ color: '#888', fontSize: 12 }}>
                    {listing.seller_name || listing.seller_wallet?.slice(0, 8) + '...'}
                  </span>
                  {listing.seller_verified && <span style={{ fontSize: 12 }}>✅</span>}
                </div>
                <div style={{ color: '#ffb400', fontSize: 12 }}>
                  {renderStars(listing.seller_rating || 0)}
                  <span style={{ color: '#555', marginLeft: 4 }}>({listing.seller_rating_count || 0})</span>
                </div>
              </div>

              {/* Duration */}
              <div style={{ marginTop: 10, color: '#555', fontSize: 11 }}>
                Min {listing.min_hours}h — Max {listing.max_hours}h • {listing.total_rentals || 0} rentals
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
