import { MessageCircle, Phone, MapPin } from 'lucide-react';
import { WA } from '../waConfig';
import { useLanguage } from '../LanguageContext';

export default function Footer() {
  const { t, getWaLink } = useLanguage();

  return (
    <footer className="footer">
      <div className="section-inner footer-inner">
        <div className="footer-cta">
          <h2 className="display footer-title">
            {t.footer.titleLine1}
            <br />
            <span>{t.footer.titleLine2}</span>
          </h2>
          <a href={getWaLink('general')} target="_blank" rel="noopener noreferrer" className="footer-wa-btn">
            <MessageCircle size={18} />
            {t.footer.waBtn}
          </a>
          <p className="footer-privacy">
            {t.footer.privacy}
          </p>
        </div>

        <div className="footer-meta">
          <div className="footer-brand">
            <img src="/logo.png" alt="Go_repario Logo" className="footer-mark" />
            <div>
              <p className="footer-name">{t.footer.name}</p>
              <p className="footer-tagline">{t.footer.tagline}</p>
            </div>
          </div>

          <div className="footer-contact">
            <a href={WA.telLink} className="footer-contact-row">
              <Phone size={14} />
              {WA.phoneDisplay}
            </a>
            <span className="footer-contact-row">
              <MapPin size={14} />
              {t.footer.location}
            </span>
          </div>
        </div>

        <p className="footer-copy">© {new Date().getFullYear()} Go_repario. {t.footer.rights}</p>
      </div>

      <style>{`
        .footer {
          background: var(--charcoal);
          color: var(--white);
          padding: 88px 24px 32px;
        }
        .footer-cta {
          text-align: center;
          max-width: 560px;
          margin: 0 auto 64px;
        }
        .footer-title {
          font-size: clamp(26px, 5vw, 42px);
          color: var(--white);
          margin: 0 0 32px;
          line-height: 1.1;
        }
        .footer-title span { color: var(--copper-light); }
        .footer-wa-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--wa-green);
          color: var(--white);
          font-weight: 700;
          font-size: 15px;
          padding: 16px 28px;
          border-radius: 12px;
          transition: filter 0.2s ease;
        }
        .footer-wa-btn:hover { filter: brightness(1.08); }
        .footer-privacy {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          margin: 20px 0 0;
          line-height: 1.5;
        }
        .footer-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 32px 0;
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
        }
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .footer-mark {
          height: 40px;
          width: auto;
          max-width: 40px;
          object-fit: contain;
          display: block;
        }
        .footer-name {
          font-family: var(--font-display);
          font-weight: 600;
          letter-spacing: 0.04em;
          margin: 0;
          font-size: 15px;
        }
        .footer-tagline {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.4);
          margin: 2px 0 0;
        }
        .footer-contact {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }
        .footer-contact-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255,255,255,0.6);
        }
        .footer-copy {
          text-align: center;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.25);
          margin: 24px 0 0;
        }

        @media (max-width: 640px) {
          .footer { padding: 56px 20px 32px; }
          .footer-cta { margin-bottom: 48px; }
          .footer-meta { flex-direction: column; align-items: flex-start; gap: 20px; }
          .footer-contact { flex-direction: column; gap: 10px; }
        }
      `}</style>
    </footer>
  );
}
