'use client';

import { MapPin, ReceiptText, Clock, MessageSquareText } from 'lucide-react';
import { useLanguage } from './LanguageContext';

export default function WhyUs() {
  const { t } = useLanguage();

  const points = [
    {
      icon: MapPin,
      title: t.whyUs.card1Title,
      detail: t.whyUs.card1Detail,
    },
    {
      icon: ReceiptText,
      title: t.whyUs.card2Title,
      detail: t.whyUs.card2Detail,
    },
    {
      icon: Clock,
      title: t.whyUs.card3Title,
      detail: t.whyUs.card3Detail,
    },
    {
      icon: MessageSquareText,
      title: t.whyUs.card4Title,
      detail: t.whyUs.card4Detail,
    },
  ];

  return (
    <section className="section why">
      <div className="section-inner">
        <span className="eyebrow why-eyebrow">{t.whyUs.eyebrow}</span>
        <h2 className="display why-title">{t.whyUs.title}</h2>

        <div className="why-grid">
          {points.map((p) => (
            <div className="why-card" key={p.title}>
              <div className="why-icon">
                <p.icon size={18} />
              </div>
              <h3 className="why-card-title">{p.title}</h3>
              <p className="why-card-detail">{p.detail}</p>
            </div>
          ))}
        </div>

        {/* Uniformed Technician Trust Showcase */}
        <div className="trust-banner">
          <div className="trust-photos">
            <div className="trust-photo-card">
              <img src="/images/plumber.png" alt="Go_repario Plumbing Expert" className="trust-img" />
              <div className="trust-photo-label">Plumbing Specialist</div>
            </div>
            <div className="trust-photo-card">
              <img src="/images/electrician.png" alt="Go_repario Electrical Expert" className="trust-img" />
              <div className="trust-photo-label">Electrical Specialist</div>
            </div>
          </div>

          <div className="trust-info">
            <div className="trust-badge-pill">
              <span className="shield-icon">🛡️</span> Verified Professionals
            </div>
            <h3 className="trust-heading">Clean, Uniformed & Background-Checked Experts</h3>
            <p className="trust-desc">
              Every Go_repario technician arrives at your doorstep in official company uniform with professional equipment, ensuring complete safety, trustworthiness, and high-quality repairs for your home.
            </p>
            <div className="trust-perks">
              <div className="perk">
                <span className="check">✓</span> Upfront Pricing Before Work Begins
              </div>
              <div className="perk">
                <span className="check">✓</span> Local Experts in Etawah & Banda
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .why { 
          background: #ece9e2; 
          padding: 88px 24px;
        }
        .section-inner {
          max-width: 1080px;
          margin: 0 auto;
        }
        .why-eyebrow { 
          color: #b8703c; 
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .why-title {
          font-family: 'Oswald', sans-serif;
          font-size: clamp(30px, 5vw, 44px);
          color: #201c18;
          margin: 16px 0 48px;
          text-transform: uppercase;
        }
        .why-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 48px;
        }
        .why-card {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 16px;
          padding: 24px 20px;
        }
        .why-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #e2ded4;
          color: #b8703c;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .why-card-title {
          font-family: 'Oswald', sans-serif;
          text-transform: uppercase;
          font-size: 15px;
          margin: 0 0 8px;
          color: #201c18;
        }
        .why-card-detail {
          font-size: 13px;
          line-height: 1.55;
          color: rgba(32,28,24,0.6);
          margin: 0;
        }

        .trust-banner {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 24px;
          padding: 36px;
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 36px;
          align-items: center;
          box-shadow: 0 12px 32px rgba(0,0,0,0.04);
        }
        .trust-photos {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .trust-photo-card {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          height: 210px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.15);
          background: linear-gradient(135deg, #1c2436, #0e131d);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .trust-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.3s ease;
          filter: drop-shadow(0 6px 12px rgba(0,0,0,0.4));
        }
        .trust-photo-card:hover .trust-img {
          transform: scale(1.08);
        }
        .trust-photo-label {
          position: absolute;
          bottom: 10px;
          left: 10px;
          right: 10px;
          background: rgba(18, 24, 38, 0.9);
          backdrop-filter: blur(6px);
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 6px 8px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .trust-info {
          display: flex;
          flex-direction: column;
        }
        .trust-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(184, 112, 60, 0.12);
          color: #b8703c;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 20px;
          align-self: flex-start;
          margin-bottom: 14px;
        }
        .trust-heading {
          font-family: 'Oswald', sans-serif;
          font-size: clamp(22px, 3vw, 28px);
          color: #201c18;
          margin: 0 0 12px;
          line-height: 1.2;
        }
        .trust-desc {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(32,28,24,0.7);
          margin: 0 0 20px;
        }
        .trust-perks {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .perk {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #201c18;
        }
        .check {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #25d366;
          color: #fff;
          font-size: 11px;
          font-weight: 800;
        }

        @media (max-width: 900px) {
          .why-grid { grid-template-columns: repeat(2, 1fr); }
          .trust-banner {
            grid-template-columns: 1fr;
            padding: 24px;
            gap: 24px;
          }
          .why { padding: 56px 20px; }
        }
        @media (max-width: 520px) {
          .why-grid { grid-template-columns: 1fr; }
          .trust-photo-card { height: 160px; }
        }
      `}</style>
    </section>
  );
}
