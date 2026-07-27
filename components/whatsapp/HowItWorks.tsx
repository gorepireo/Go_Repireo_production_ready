'use client';

import { MessageCircle, ClipboardCheck, Wrench } from 'lucide-react';
import { useLanguage } from './LanguageContext';

export default function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    {
      n: '01',
      icon: MessageCircle,
      title: t.howItWorks.step1Title,
      detail: t.howItWorks.step1Detail,
    },
    {
      n: '02',
      icon: ClipboardCheck,
      title: t.howItWorks.step2Title,
      detail: t.howItWorks.step2Detail,
    },
    {
      n: '03',
      icon: Wrench,
      title: t.howItWorks.step3Title,
      detail: t.howItWorks.step3Detail,
    },
  ];

  return (
    <section className="section how">
      <div className="section-inner">
        <span className="eyebrow how-eyebrow">{t.howItWorks.eyebrow}</span>
        <h2 className="display how-title">{t.howItWorks.title}</h2>

        <div className="how-grid">
          {steps.map((s, i) => (
            <div className="how-step" key={s.n}>
              <div className="how-step-top">
                <span className="how-step-n">{s.n}</span>
                <s.icon size={20} />
              </div>
              <h3 className="how-step-title">{s.title}</h3>
              <p className="how-step-detail">{s.detail}</p>
              {i < steps.length - 1 && <span className="how-connector" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .how {
          background: #221e1a;
          color: #ffffff;
          padding: 88px 24px;
        }
        .section-inner {
          max-width: 1080px;
          margin: 0 auto;
        }
        .how-eyebrow { 
          color: #f0b429; 
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .how-title {
          font-family: 'Oswald', sans-serif;
          font-size: clamp(28px, 5vw, 44px);
          color: #ffffff;
          margin: 16px 0 48px;
          line-height: 1.08;
          text-transform: uppercase;
        }
        .how-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }
        .how-step {
          position: relative;
        }
        .how-step-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #f0b429;
          margin-bottom: 18px;
        }
        .how-step-n {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.35);
        }
        .how-step-title {
          font-family: 'Oswald', sans-serif;
          text-transform: uppercase;
          font-size: 19px;
          margin: 0 0 10px;
          color: #ffffff;
        }
        .how-step-detail {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(255,255,255,0.5);
          margin: 0;
        }
        .how-connector {
          display: none;
        }

        @media (min-width: 761px) {
          .how-connector {
            display: block;
            position: absolute;
            top: 12px;
            right: -32px;
            width: 32px;
            height: 1px;
            background: repeating-linear-gradient(
              to right, rgba(255,255,255,0.2) 0 6px, transparent 6px 12px
            );
          }
        }

        @media (max-width: 760px) {
          .how-grid { grid-template-columns: 1fr; gap: 32px; }
          .how-connector { display: none !important; }
          .how { padding: 56px 20px; }
        }
      `}</style>
    </section>
  );
}
