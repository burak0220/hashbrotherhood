export default function Guide() {
  return (
    <div style={{ minHeight: '100vh', background: '#0B0F1C', padding: '40px 16px' }}>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '40px', fontWeight: 'bold', marginBottom: '16px', color: 'white' }}>
          How to Mine
        </h1>
        <p style={{ color: '#9CA3AF', marginBottom: '48px', fontSize: '16px' }}>
          Start mining in 3 simple steps
        </p>

        {/* Steps */}
        {[
          {
            step: '1',
            title: 'Choose Your Algorithm',
            content: 'Select an algorithm based on your hardware. CPU miners should use RandomX, GPU miners can use KawPow or Ethash, and ASIC miners can use SHA256 or Scrypt.'
          },
          {
            step: '2',
            title: 'Download Mining Software',
            content: (
              <div>
                <p style={{ marginBottom: '12px' }}>Download the appropriate miner for your chosen algorithm:</p>
                <ul style={{ marginLeft: '20px', lineHeight: '2' }}>
                  <li><strong>RandomX (CPU):</strong> XMRig</li>
                  <li><strong>KawPow (GPU):</strong> T-Rex Miner, TeamRedMiner</li>
                  <li><strong>Ethash (GPU):</strong> lolMiner, Phoenix Miner</li>
                  <li><strong>SHA256 (ASIC):</strong> CGMiner, BFGMiner</li>
                </ul>
              </div>
            )
          },
          {
            step: '3',
            title: 'Configure & Start Mining',
            content: (
              <div>
                <p style={{ marginBottom: '16px' }}>Use these connection details:</p>
                <div style={{ background: '#1E2330', padding: '20px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '14px' }}>
                  <div style={{ marginBottom: '8px' }}><span style={{ color: '#9CA3AF' }}>Server:</span> <span style={{ color: '#00E5FF' }}>hashbrotherhood.com</span></div>
                  <div style={{ marginBottom: '8px' }}><span style={{ color: '#9CA3AF' }}>Port:</span> <span style={{ color: '#00E5FF' }}>3333</span> (for RandomX)</div>
                  <div style={{ marginBottom: '8px' }}><span style={{ color: '#9CA3AF' }}>Username:</span> <span style={{ color: '#00E5FF' }}>YOUR_BEP20_WALLET.worker01</span></div>
                  <div><span style={{ color: '#9CA3AF' }}>Password:</span> <span style={{ color: '#00E5FF' }}>x</span></div>
                </div>
                <p style={{ marginTop: '16px', fontSize: '14px', color: '#9CA3AF' }}>
                  💡 Replace YOUR_BEP20_WALLET with your actual BEP20 (BSC) wallet address
                </p>
              </div>
            )
          }
        ].map((item, index) => (
          <div key={index} style={{ background: '#141825', border: '1px solid #374151', borderRadius: '16px', padding: '32px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #00E5FF, #00B8CC)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: '#0B0F1C' }}>
                {item.step}
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                {item.title}
              </h2>
            </div>
            <div style={{ color: '#D1D5DB', fontSize: '15px', lineHeight: '1.8', paddingLeft: '64px' }}>
              {typeof item.content === 'string' ? <p>{item.content}</p> : item.content}
            </div>
          </div>
        ))}

        {/* FAQ */}
        <div style={{ marginTop: '64px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px', color: 'white' }}>
            Frequently Asked Questions
          </h2>
          
          {[
            { q: 'What is the minimum payout?', a: '10 USDT on BEP20 network' },
            { q: 'How often are payouts processed?', a: 'Payouts are processed within 24-48 hours after reaching the minimum threshold' },
            { q: 'What network do you use?', a: 'We use BEP20 (Binance Smart Chain) for fast and low-fee transactions' },
            { q: 'Can I mine multiple algorithms?', a: 'Yes! You can connect different workers to different algorithms using the same wallet' },
            { q: 'How are earnings calculated?', a: 'We use snapshot pricing - the price is locked when you submit each share, protecting you from volatility' }
          ].map((item, index) => (
            <div key={index} style={{ background: '#141825', border: '1px solid #374151', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#00E5FF', marginBottom: '12px' }}>
                {item.q}
              </h3>
              <p style={{ color: '#D1D5DB', fontSize: '15px', margin: 0, lineHeight: '1.6' }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
