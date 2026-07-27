import { useState, useEffect } from 'react';
import { MessageCircle, Droplets, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export default function Services() {
  const { t, getWaLink } = useLanguage();
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'plumbing', 'electrical'

  const servicesData = [
    {
      id: 'plumbing',
      tag: t.services.plumbingTag,
      icon: Droplets,
      image: '/images/plumber.png',
      fallbackImage: '/plumber.png',
      imageAlt: 'Go_repario plumbing expert at work',
      accent: 'var(--copper)',
      accentLight: 'var(--copper-light)',
      jobs: t.services.plumbingJobs,
      link: getWaLink('plumbing'),
      btnText: t.services.bookPlumbing,
    },
    {
      id: 'electrical',
      tag: t.services.electricalTag,
      icon: Zap,
      image: '/images/electrician.png',
      fallbackImage: '/electrician.png',
      imageAlt: 'Go_repario electrician expert inspecting switchboard',
      accent: 'var(--amber-deep)',
      accentLight: 'var(--amber)',
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
              style={{ '--card-accent': s.accent, '--card-accent-light': s.accentLight }}
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

              <div className="ticket-stub">
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

      <style>{`
        .services {
          background: var(--paper);
        }
        .services-head {
          max-width: 560px;
          margin-bottom: 36px;
        }
        .services-eyebrow { color: var(--copper); }
        .services-title {
          font-size: clamp(28px, 5vw, 44px);
          color: var(--ink);
          margin: 16px 0 12px;
          line-height: 1.08;
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
          margin-bottom: 28px;
        }
        .tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--white);
          border: 1px solid var(--line-dark);
          color: var(--ink);
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .tab-btn:hover {
          border-color: var(--copper);
          color: var(--copper);
        }
        .tab-btn.active {
          background: var(--ink);
          color: var(--white);
          border-color: var(--ink);
        }
        .ticket-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .ticket {
          background: var(--white);
          border-radius: 18px;
          border: 1px solid var(--line-dark);
          border-top: 5px solid var(--card-accent);
          padding: 20px 20px 24px;
          position: relative;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .ticket-img-box {
          position: relative;
          width: 100%;
          height: 240px;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #182132, #0d121c);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0,0,0,0.1);
        }
        .ticket-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          filter: drop-shadow(0 8px 16px rgba(0,0,0,0.35));
          transition: transform 0.4s ease;
        }
        .ticket:hover .ticket-img {
          transform: scale(1.06) translateY(-4px);
        }
        .ticket-img-badge {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: rgba(18, 24, 38, 0.92);
          backdrop-filter: blur(8px);
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--wa-green);
        }
        .ticket-stub {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          align-self: flex-start;
          background: color-mix(in srgb, var(--card-accent) 14%, white);
          color: var(--card-accent);
          font-family: var(--font-mono);
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.14em;
          padding: 8px 14px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .ticket-jobs {
          list-style: none;
          padding: 0;
          margin: 0 0 24px;
          flex-grow: 1;
        }
        .ticket-jobs li {
          font-size: 15px;
          color: var(--ink);
          padding: 10px 0;
          border-bottom: 1px dashed var(--line-dark);
        }
        .ticket-jobs li:last-child { border-bottom: none; }
        .ticket-footer {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding-top: 16px;
          border-top: 1px solid var(--line-dark);
        }
        .ticket-price-note {
          font-size: 12px;
          color: rgba(32,28,24,0.5);
          line-height: 1.4;
        }
        .ticket-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--card-accent);
          color: var(--white);
          font-weight: 700;
          font-size: 14px;
          padding: 13px 20px;
          border-radius: 10px;
          transition: filter 0.2s ease;
        }
        .ticket-cta:hover { filter: brightness(1.08); }

        @media (max-width: 760px) {
          .mobile-card-controls {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--white);
            border: 1px solid var(--line-dark);
            border-radius: 14px;
            padding: 8px 14px;
            margin-bottom: 16px;
          }
          .mobile-card-title {
            font-family: var(--font-mono);
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.12em;
            color: var(--copper);
            text-transform: uppercase;
          }
          .card-nav-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: var(--paper-2);
            color: var(--ink);
            border: 1px solid var(--line-dark);
            transition: all 0.2s ease;
            cursor: pointer;
          }
          .card-nav-btn.is-hidden {
            visibility: hidden;
            pointer-events: none;
          }
          .card-nav-btn:not(.is-hidden):hover, .card-nav-btn:focus-visible {
            background: var(--copper);
            color: var(--white);
            outline: 3px solid var(--amber);
            outline-offset: 2px;
          }
          .ticket-grid {
            grid-template-columns: 1fr;
          }
          .ticket.mobile-hidden {
            display: none !important;
          }
          .ticket.mobile-active {
            display: flex !important;
          }
          .mobile-dots-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
          }
          .mobile-dots-indicator .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.2);
            border: none;
            padding: 0;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .mobile-dots-indicator .dot:focus-visible {
            outline: 2px solid var(--copper);
            outline-offset: 2px;
          }
          .mobile-dots-indicator .dot.active {
            background: var(--copper);
            width: 24px;
            border-radius: 6px;
          }
        }
      `}</style>
    </section>
  );
}
