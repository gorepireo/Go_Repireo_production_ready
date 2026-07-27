import { MessageCircle, MapPin } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export default function Hero() {
  const { t, getWaLink } = useLanguage();

  return (
    <section id="top" className="hero">
      <div className="hero-inner">
        <div className="hero-text-col">
          <span className="eyebrow hero-eyebrow">{t.hero.eyebrow}</span>

          <h1 className="display hero-title">
            {t.hero.title}
            <br />
            <span className="hero-title-accent">{t.hero.titleAccent}</span>
          </h1>

          <p className="hero-sub">{t.hero.sub}</p>

          <div className="hero-actions">
            <a href={getWaLink('general')} target="_blank" rel="noopener noreferrer" className="hero-cta">
              <MessageCircle size={18} />
              {t.hero.cta}
            </a>
            <div className="hero-area">
              <MapPin size={16} />
              {t.hero.serving}
            </div>
          </div>
        </div>

        <div className="hero-visual-col">
          <div className="hero-cartoon-card">
            <div className="cartoon-img-wrap">
              <img
                src="/images/plumber.png"
                alt="Go_repario animated cartoon technician in uniform"
                className="hero-cartoon-img"
              />
              <div className="cartoon-glow-effect" />
            </div>

            {/* Top Floating Animated Badge */}
            <div className="hero-top-badge">
              <span className="badge-pulse-dot" />
              <span>Official Go_repario Uniformed Mascot</span>
            </div>

            {/* Bottom Floating Card info */}
            <div className="hero-card-footer">
              <div className="tech-meta">
                <span className="tech-title">Go_repario Animated Experts</span>
                <span className="tech-sub">Instant Plumbing & Electrical Fix</span>
              </div>
              <div className="rating-pill">
                <span className="star">★</span> 4.9/5
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pipe + wire motif marking the hand-off between the two trades */}
      <svg className="hero-divider" viewBox="0 0 1080 40" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="20" x2="500" y2="20" stroke="var(--copper)" strokeWidth="6" strokeLinecap="round" />
        <path d="M 580 20 L 610 8 L 640 32 L 670 8 L 700 32 L 730 8 L 760 20"
              fill="none" stroke="var(--amber)" strokeWidth="3" strokeLinecap="round" />
        <line x1="760" y1="20" x2="1080" y2="20" stroke="var(--amber)" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 14" />
      </svg>

      <style>{`
        .hero {
          background: var(--charcoal);
          color: var(--white);
          padding: 60px 24px 0;
          position: relative;
        }
        .hero-inner {
          max-width: 1120px;
          margin: 0 auto;
          padding-bottom: 50px;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 48px;
          align-items: center;
        }
        .hero-eyebrow {
          color: var(--amber);
        }
        .hero-title {
          font-size: clamp(36px, 5.5vw, 64px);
          margin: 18px 0 0;
          color: var(--white);
          line-height: 1.1;
        }
        .hero-title-accent {
          color: var(--copper-light);
        }
        .hero-sub {
          font-size: 17px;
          line-height: 1.6;
          color: rgba(255,255,255,0.7);
          max-width: 480px;
          margin: 22px 0 0;
        }
        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 20px;
          margin-top: 32px;
        }
        .hero-cta {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--wa-green);
          color: var(--white);
          padding: 16px 28px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          box-shadow: 0 12px 24px -10px rgba(37,211,102,0.5);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .hero-cta:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 16px 30px -10px rgba(37,211,102,0.6);
        }
        .hero-area {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.06em;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
        }
        .hero-visual-col {
          display: flex;
          justify-content: center;
        }
        .hero-cartoon-card {
          position: relative;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 24px 50px -10px rgba(0,0,0,0.6), 0 0 30px rgba(224, 122, 60, 0.15);
          border: 2px solid rgba(255,255,255,0.15);
          max-width: 460px;
          width: 100%;
          background: linear-gradient(145deg, #1e2638, #111622);
          animation: cartoonFloat 4s ease-in-out infinite alternate;
        }
        @keyframes cartoonFloat {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-10px); }
        }
        .cartoon-img-wrap {
          position: relative;
          width: 100%;
          height: 440px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, rgba(37, 211, 102, 0.08), transparent 70%);
        }
        .hero-cartoon-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          filter: drop-shadow(0 12px 24px rgba(0,0,0,0.4));
          transition: transform 0.4s ease;
        }
        .hero-cartoon-card:hover .hero-cartoon-img {
          transform: scale(1.05) rotate(1deg);
        }
        .cartoon-glow-effect {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            transparent 60%,
            rgba(17, 22, 34, 0.95) 100%
          );
          pointer-events: none;
        }
        .hero-top-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(18, 24, 38, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--white);
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.3);
        }
        .badge-pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #25d366;
          box-shadow: 0 0 10px #25d366;
          animation: pulseGreen 1.5s infinite;
        }
        @keyframes pulseGreen {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        .hero-card-footer {
          position: absolute;
          bottom: 16px;
          left: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(18, 24, 38, 0.92);
          backdrop-filter: blur(12px);
          padding: 12px 18px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
        .tech-meta {
          display: flex;
          flex-direction: column;
        }
        .tech-title {
          font-weight: 700;
          font-size: 14px;
          color: var(--white);
        }
        .tech-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.7);
        }
        .rating-pill {
          background: rgba(230, 160, 40, 0.25);
          border: 1px solid rgba(230, 160, 40, 0.4);
          color: #f7ca45;
          font-weight: 700;
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .hero-divider {
          display: block;
          width: 100%;
          height: 32px;
        }

        @media (max-width: 868px) {
          .hero-inner {
            grid-template-columns: 1fr;
            padding-bottom: 40px;
            gap: 32px;
          }
          .hero { padding-top: 40px; }
          .cartoon-img-wrap {
            height: 340px;
          }
        }
      `}</style>
    </section>
  );
}
