export default function Guide() {
  const steps = [
    {
      icon: '💰',
      title: 'Get Your BEP20 Wallet',
      description: 'You need a Binance Smart Chain (BEP20) wallet address to receive USDT payments.',
      details: [
        'Use MetaMask, Trust Wallet, or any BEP20-compatible wallet',
        'Make sure you have your wallet address ready (starts with 0x)',
        'Keep your private keys secure - never share them!'
      ]
    },
    {
      icon: '🧮',
      title: 'Calculate Your Earnings',
      description: 'Use our profitability calculator to estimate your potential earnings.',
      details: [
        'Select your algorithm based on your hardware',
        'Enter your hashrate and power consumption',
        'See real-time earnings estimates with current market prices'
      ]
    },
    {
      icon: '⚙️',
      title: 'Configure Your Miner',
      description: 'Download mining software and configure it with our connection details.',
      details: [
        'Server: hashbrotherhood.com',
        'Port: Check algorithm page for specific port',
        'Username: YOUR_BEP20_WALLET.worker_name',
        'Password: x'
      ]
    },
    {
      icon: '⛏️',
      title: 'Start Mining',
      description: 'Launch your miner and start earning USDT automatically!',
      details: [
        'Your earnings are calculated in real-time',
        'Balance updates every 15 seconds',
        'Minimum payout: 10 USDT (BEP20)',
        'Payments processed within 24-48 hours'
      ]
    }
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0B0F1C 0%, #141825 100%)', padding: '40px 20px' }}>
      <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '80px', animation: 'fadeInDown 0.8s ease-out' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #00E5FF, #8B5CF6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '16px'
          }}>
            📚 Getting Started Guide
          </h1>
          <p style={{ fontSize: '20px', color: '#9CA3AF' }}>
            Start mining in 4 simple steps
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {steps.map((step, index) => (
            <div 
              key={index}
              style={{ 
                background: 'linear-gradient(135deg, #141825, #1E2330)',
                border: '1px solid #374151',
                borderRadius: '24px',
                padding: '40px',
                animation: `fadeInUp 0.6s ease-out ${index * 0.15}s backwards`,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Step Number */}
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '60px',
                height: '60px',
                background: 'rgba(0, 229, 255, 0.1)',
                border: '2px solid #00E5FF',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#00E5FF'
              }}>
                {index + 1}
              </div>

              <div style={{ display: 'flex', gap: '24px' }}>
                {/* Icon */}
                <div style={{ 
                  fontSize: '64px',
                  animation: 'float 3s ease-in-out infinite',
                  animationDelay: `${index * 0.2}s`
                }}>
                  {step.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <h2 style={{ 
                    fontSize: '28px', 
                    fontWeight: 'bold', 
                    color: 'white',
                    marginBottom: '12px'
                  }}>
                    {step.title}
                  </h2>
                  <p style={{ 
                    fontSize: '16px', 
                    color: '#9CA3AF',
                    marginBottom: '24px',
                    lineHeight: '1.6'
                  }}>
                    {step.description}
                  </p>

                  {/* Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {step.details.map((detail, i) => (
                      <div 
                        key={i}
                        style={{ 
                          display: 'flex',
                          alignItems: 'start',
                          gap: '12px',
                          padding: '12px',
                          background: 'rgba(0, 229, 255, 0.05)',
                          borderRadius: '12px',
                          border: '1px solid rgba(0, 229, 255, 0.1)'
                        }}
                      >
                        <span style={{ color: '#00E5FF', fontSize: '20px' }}>✓</span>
                        <span style={{ color: '#E5E7EB', fontSize: '14px', lineHeight: '1.6' }}>
                          {detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ 
          marginTop: '80px',
          textAlign: 'center',
          animation: 'fadeInUp 0.8s ease-out 0.6s backwards'
        }}>
          <a 
            href="/calculator"
            style={{
              display: 'inline-block',
              padding: '20px 48px',
              background: 'linear-gradient(135deg, #00E5FF, #00B8CC)',
              color: '#0B0F1C',
              fontSize: '20px',
              fontWeight: 'bold',
              borderRadius: '16px',
              textDecoration: 'none',
              boxShadow: '0 10px 40px rgba(0, 229, 255, 0.4)',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 15px 50px rgba(0, 229, 255, 0.6)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 229, 255, 0.4)'
            }}
          >
            🚀 Start Mining Now
          </a>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: '100px' }}>
          <h2 style={{ 
            fontSize: '36px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '48px',
            background: 'linear-gradient(135deg, #FFFFFF, #9CA3AF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            ❓ Frequently Asked Questions
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {[
              {
                q: 'How long until I receive my first payment?',
                a: 'Once your balance reaches 10 USDT, payment is processed within 24-48 hours.'
              },
              {
                q: 'What are the fees?',
                a: 'All fees are included in the displayed earnings. What you see is what you get!'
              },
              {
                q: 'Can I mine with multiple devices?',
                a: 'Yes! Use different worker names for each device (e.g., wallet.rig1, wallet.rig2).'
              },
              {
                q: 'Which algorithm should I choose?',
                a: 'Use our calculator to find the most profitable algorithm for your hardware.'
              }
            ].map((faq, i) => (
              <div 
                key={i}
                style={{
                  background: '#141825',
                  border: '1px solid #374151',
                  borderRadius: '16px',
                  padding: '24px'
                }}
              >
                <div style={{ 
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#00E5FF',
                  marginBottom: '12px'
                }}>
                  {faq.q}
                </div>
                <div style={{ 
                  fontSize: '15px',
                  color: '#9CA3AF',
                  lineHeight: '1.6'
                }}>
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
