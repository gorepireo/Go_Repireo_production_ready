import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Go_Repireo | India\'s Trusted On-Demand Home Services Platform',
  description: 'Go_Repireo (also spelled GoRepireo, Go Repireo, Repireo) is India\'s verified on-demand home services platform. Book plumbers, electricians, AC technicians, appliance repair experts in Etawah. Founded in 2025.',
  keywords: [
    'Go_Repireo', 'GoRepireo', 'Go Repireo', 'Repireo', 'about gorepireo',
    'gorepireo company', 'gorepireo brand', 'gorepireo India', 'gorepireo etawah',
    'Go_Repireo Technologies', 'gorepireo home services', 'who is gorepireo',
    'gorepireo about', 'repireo about us', 'gorepireo founders'
  ],
  alternates: {
    canonical: 'https://gorepireo.in/about',
  },
  openGraph: {
    title: 'About Go_Repireo | India\'s Trusted Home Services Platform',
    description: 'Go_Repireo is India\'s verified on-demand home services marketplace connecting customers with background-checked plumbers, electricians, AC technicians and repair experts.',
    url: 'https://gorepireo.in/about',
    siteName: 'Go_Repireo',
    images: [{ url: 'https://gorepireo.in/icon.png', width: 512, height: 512, alt: 'Go_Repireo' }],
  },
};

export default function AboutPage() {
  return (
    <main style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '60px 16px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Brand Entity Block - critical for Google Knowledge Graph */}
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <img 
            src="https://gorepireo.in/icon.png" 
            alt="Go_Repireo Logo" 
            width={80} height={80}
            style={{ borderRadius: '20px', marginBottom: '16px', boxShadow: '0 4px 20px rgba(0,122,255,0.25)' }}
          />
          <h1 style={{ color: '#0A1629', fontSize: '32px', fontWeight: 900, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            About Go_Repireo
          </h1>
          <p style={{ color: '#64748B', fontSize: '16px', margin: 0 }}>
            India's Trusted On-Demand Home Services Platform
          </p>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '36px', border: '1px solid #E2E8F0', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <h2 style={{ color: '#0A1629', fontSize: '20px', fontWeight: 800, margin: '0 0 16px 0' }}>What is Go_Repireo?</h2>
          <p style={{ color: '#475569', fontSize: '15px', lineHeight: 1.7, margin: '0 0 16px 0' }}>
            <strong>Go_Repireo</strong> (pronounced "go-re-pi-re-oh", also written as <em>GoRepireo</em>, <em>Go Repireo</em>, or <em>Repireo</em>) is India's fastest-growing on-demand home services marketplace, headquartered in Etawah, Uttar Pradesh.
          </p>
          <p style={{ color: '#475569', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>
            We connect homeowners and businesses with background-verified plumbers, electricians, AC technicians, appliance repair specialists, cleaning experts, painters, and carpenters — all within a 15 km proximity radius for guaranteed fast arrival.
          </p>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '36px', border: '1px solid #E2E8F0', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <h2 style={{ color: '#0A1629', fontSize: '20px', fontWeight: 800, margin: '0 0 16px 0' }}>Our Mission</h2>
          <p style={{ color: '#475569', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>
            To make professional, affordable, and reliable home repairs accessible to every household in India — starting from Etawah. Go_Repireo's anti-fraud Start OTP system ensures that every job starts and ends only after the customer's confirmation, guaranteeing safety and accountability.
          </p>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '36px', border: '1px solid #E2E8F0', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <h2 style={{ color: '#0A1629', fontSize: '20px', fontWeight: 800, margin: '0 0 20px 0' }}>Brand Name Variations</h2>
          <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.6, margin: '0 0 12px 0' }}>
            Go_Repireo is commonly searched and referenced under the following names:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['Go_Repireo', 'GoRepireo', 'Go Repireo', 'Repireo', 'Go-Repireo', 'gorepireo', 'Go Repairo', 'Go Repaireo', 'Go Repiero', 'gorepireo.in'].map(name => (
              <span key={name} style={{ background: '#EFF6FF', color: '#1E40AF', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                {name}
              </span>
            ))}
          </div>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '36px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <h2 style={{ color: '#0A1629', fontSize: '20px', fontWeight: 800, margin: '0 0 20px 0' }}>Contact Go_Repireo</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '10px 0', color: '#64748B', fontSize: '14px', fontWeight: 600 }}>Phone:</td>
                <td style={{ padding: '10px 0', color: '#0A1629', fontSize: '14px', fontWeight: 700 }}>+91 8679245568</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '10px 0', color: '#64748B', fontSize: '14px', fontWeight: 600 }}>Email:</td>
                <td style={{ padding: '10px 0', color: '#0A1629', fontSize: '14px', fontWeight: 700 }}>support@gorepireo.com</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '10px 0', color: '#64748B', fontSize: '14px', fontWeight: 600 }}>Website:</td>
                <td style={{ padding: '10px 0', color: '#007AFF', fontSize: '14px', fontWeight: 700 }}>
                  <a href="https://gorepireo.in" style={{ color: '#007AFF' }}>https://gorepireo.in</a>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px 0', color: '#64748B', fontSize: '14px', fontWeight: 600 }}>Location:</td>
                <td style={{ padding: '10px 0', color: '#0A1629', fontSize: '14px', fontWeight: 700 }}>Etawah, Uttar Pradesh, India — 206001</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}
