import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export default function WhatsAppFloat() {
  const { t, getWaLink } = useLanguage();

  return (
    <a
      href={getWaLink('general')}
      target="_blank"
      rel="noopener noreferrer"
      className="wa-float"
      aria-label={t.nav.bookWa}
    >
      <MessageCircle size={26} />

      <style>{`
        .wa-float {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 50;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: var(--wa-green);
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 26px -6px rgba(37,211,102,0.6);
          transition: transform 0.15s ease;
        }
        .wa-float:hover { transform: scale(1.06); }
      `}</style>
    </a>
  );
}
