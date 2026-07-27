import { Phone, MessageCircle } from 'lucide-react';
import { WA } from '../waConfig';
import { useLanguage } from '../LanguageContext';

export default function Navbar() {
  const { lang, toggleLanguage, t, getWaLink } = useLanguage();

  return (
    <header className="navbar">
      <a href="#top" className="navbar-brand">
        <img src="/logo.png" alt="Go_repario Logo" className="navbar-mark" />
        <span className="navbar-word">
          GO_REPARIO
          <small>{t.nav.location}</small>
        </span>
      </a>

      <div className="navbar-actions">
        <button
          type="button"
          onClick={toggleLanguage}
          className="lang-toggle-btn"
          aria-label="Switch Language"
        >
          <span className={lang === 'en' ? 'active' : ''}>EN</span>
          <span className="divider">|</span>
          <span className={lang === 'hi' ? 'active' : ''}>हिं</span>
        </button>

        <a href={WA.telLink} className="navbar-icon-btn" aria-label={t.nav.callAria}>
          <Phone size={16} />
        </a>
        <a href={getWaLink('general')} target="_blank" rel="noopener noreferrer" className="navbar-wa-btn">
          <MessageCircle size={16} />
          <span>{t.nav.bookWa}</span>
        </a>
      </div>

      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background: var(--charcoal);
          border-bottom: 1px solid var(--line);
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .navbar-mark {
          height: 44px;
          width: auto;
          max-width: 44px;
          object-fit: contain;
          display: block;
        }
        .navbar-word {
          display: flex;
          flex-direction: column;
          font-family: var(--font-display);
          font-weight: 600;
          color: var(--white);
          letter-spacing: 0.04em;
          font-size: 15px;
          line-height: 1.1;
        }
        .navbar-word small {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.16em;
          color: rgba(255,255,255,0.4);
          margin-top: 2px;
        }
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .lang-toggle-btn {
          display: flex;
          align-items: center;
          gap: 3px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: var(--white);
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .lang-toggle-btn:hover, .lang-toggle-btn:focus-visible {
          background: rgba(255, 255, 255, 0.18);
          outline-offset: 2px;
        }
        .lang-toggle-btn span.active {
          color: var(--amber);
        }
        .lang-toggle-btn .divider {
          opacity: 0.35;
        }
        .navbar-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(255,255,255,0.06);
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }
        .navbar-icon-btn:hover { background: rgba(255,255,255,0.14); }
        .navbar-wa-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--wa-green);
          color: var(--white);
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          transition: filter 0.2s ease;
          white-space: nowrap;
        }
        .navbar-wa-btn:hover { filter: brightness(1.08); }

        @media (max-width: 580px) {
          .navbar-word { display: none; }
          .navbar-wa-btn span { display: none; }
          .navbar-wa-btn { padding: 8px; border-radius: 8px; }
        }
      `}</style>
    </header>
  );
}
