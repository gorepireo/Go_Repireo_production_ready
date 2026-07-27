'use client';

import { useState } from 'react';
import { MessageCircle, Droplets, Zap } from 'lucide-react';
import { useLanguage } from './LanguageContext';

export default function Services() {
  const { t, getWaLink } = useLanguage();
  const [activeTab, setActiveTab] = useState<'all' | 'plumbing' | 'electrical'>('all');

  const servicesData = [
    {
      id: 'plumbing' as const,
      tag: t.services.plumbingTag,
      icon: Droplets,
      image: '/images/plumber.png',
      fallbackImage: '/plumber.png',
      imageAlt: 'Go_repario plumbing expert at work',
      accent: '#b8703c',
      accentLight: '#d68f5c',
      jobs: t.services.plumbingJobs,
      link: getWaLink('plumbing'),
      btnText: t.services.bookPlumbing,
    },
    {
      id: 'electrical' as const,
      tag: t.services.electricalTag,
      icon: Zap,
      image: '/images/electrician.png',
      fallbackImage: '/electrician.png',
      imageAlt: 'Go_repario electrician expert inspecting switchboard',
      accent: '#c98d17',
      accentLight: '#f0b429',
      jobs: t.services.electricalJobs,
      link: getWaLink('electrical'),
      btnText: t.services.bookElectrical,
    },
  ];

  const filteredServices = activeTab === 'all' 
    ? servicesData 
    : servicesData.filter(s => s.id === activeTab);

  return (
    <section className="section services" id="services">
      <div className="section-inner">
        <div className="services-head">
          <span className="eyebrow services-eyebrow">{t.services.eyebrow}</span>
          <h2 className="display services-title">{t.services.title}</h2>
          <p className="services-note">{t.services.note}</p>
        </div>

        {/* Tab Filter Controls */}
        <div className="service-tab-controls">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          >
            All Services
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('plumbing')}
            className={`tab-btn ${activeTab === 'plumbing' ? 'active' : ''}`}
          >
            <Droplets size={15} />
            Plumbing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('electrical')}
            className={`tab-btn ${activeTab === 'electrical' ? 'active' : ''}`}
          >
            <Zap size={15} />
            Electrical
          </button>
        </div>

        {/* Ticket Grid */}
        <div className="ticket-grid">
          {filteredServices.map((s) => (
            <article
              className="ticket"
              key={s.id}
            >
              <div className="ticket-img-box">
                <img
                  src={s.image}
                  onError={(e) => {
                    if (e.currentTarget.src !== window.location.origin + s.fallbackImage) {
                      e.currentTarget.src = s.fallbackImage;
                    }
                  }}
                  alt={s.imageAlt}
                  className="ticket-img"
                  loading="eager"
                />
                <div className="ticket-img-badge">
                  <span className="badge-dot"></span>
                  <span>Go_repario Uniformed Expert</span>
                </div>
              </div>

              <div className="ticket-stub" style={{ color: s.accent }}>
                <s.icon size={18} />
                <span>{s.tag}</span>
              </div>

              <ul className="ticket-jobs">
                {s.jobs.map((job) => (
                  <li key={job}>{job}</li>
                ))}
              </ul>

              <div className="ticket-footer">
                <span className="ticket-price-note">{t.services.priceNote}</span>
                <a href={s.link} target="_blank" rel="noopener noreferrer" className="ticket-cta">
                  <MessageCircle size={16} />
                  {s.btnText}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style jsx>{`
        .services {
          background: #ece9e2;
          padding: 88px 24px;
        }
        .section-inner {
          max-width: 1080px;
          margin: 0 auto;
        }
        .services-head {
          max-width: 560px;
          margin-bottom: 36px;
        }
        .services-eyebrow { 
          color: #b8703c; 
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .services-title {
          font-family: 'Oswald', sans-serif;
          font-size: clamp(28px, 5vw, 44px);
          color: #201c18;
          margin: 16px 0 12px;
          line-height: 1.08;
          text-transform: uppercase;
        }
        .services-note {
          color: rgba(32,28,24,0.6);
          font-size: 15px;
          line-height: 1.5;
          margin: 0;
        }
        .service-tab-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          border-radius: 30px;
          font-size: 13px;
          font-weight: 600;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.1);
          color: #201c18;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .tab-btn.active {
          background: #1a1714;
          color: #ffffff;
          border-color: #1a1714;
        }
        .ticket-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
        }
        .ticket {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
        }
        .ticket-img-box {
          position: relative;
          height: 240px;
          background: linear-gradient(135deg, #1c2436, #0e131d);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .ticket-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.3s ease;
        }
        .ticket:hover .ticket-img {
          transform: scale(1.05);
        }
        .ticket-img-badge {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: rgba(18, 24, 38, 0.85);
          backdrop-filter: blur(8px);
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #25d366;
        }
        .ticket-stub {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 18px 24px 12px;
          font-family: 'Oswald', sans-serif;
          font-size: 18px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .ticket-jobs {
          list-style: none;
          padding: 0 24px;
          margin: 0 0 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        .ticket-jobs li {
          font-size: 14px;
          color: rgba(32,28,24,0.8);
          position: relative;
          padding-left: 16px;
        }
        .ticket-jobs li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: #b8703c;
        }
        .ticket-footer {
          padding: 20px 24px;
          background: #e2ded4;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .ticket-price-note {
          font-size: 11px;
          color: rgba(32,28,24,0.6);
          line-height: 1.4;
        }
        .ticket-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #25d366;
          color: #ffffff;
          padding: 12px 20px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
          transition: filter 0.2s ease;
        }
        .ticket-cta:hover { filter: brightness(1.08); }

        @media (max-width: 768px) {
          .ticket-grid { grid-template-columns: 1fr; }
          .services { padding: 56px 20px; }
        }
      `}</style>
    </section>
  );
}
