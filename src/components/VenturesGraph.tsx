import React, { useState, useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface Venture {
  id: string;
  name: string;
  logo: string;
  description: string;
  url: string;
  /** Card size: sm | md | lg */
  size: 'sm' | 'md' | 'lg';
  /** Dark background needed for logo visibility */
  darkBg?: boolean;
}

const ventures: Venture[] = [
  {
    id: 'whatsapp-translator',
    name: 'WhatsApp Translator',
    logo: '/ventures/Whatsapp Translator Logo.png',
    description: 'Real-time translation built directly into WhatsApp — break language barriers in any conversation.',
    url: '',
    size: 'md',
  },
  {
    id: 'time4love',
    name: 'Time 4 Love',
    logo: '/ventures/Time 4 Love Logo.png',
    description: 'Volunteer recruitment and HR management platform for charity organizations and non-profits.',
    url: 'https://time4love.org',
    size: 'md',
  },
  {
    id: 'nameswiki',
    name: 'NamesWiki',
    logo: '/ventures/nameswiki logo.png',
    description: 'The world\'s largest searchable database of names — meanings, origins, and cultural history.',
    url: 'https://nameswiki.com',
    size: 'md',
  },
  {
    id: 'conciergedesk',
    name: 'ConciergeDesk',
    logo: '/ventures/ConciergeDesk Logo.png',
    description: 'AI-powered concierge service for hotels and hospitality businesses.',
    url: '',
    size: 'md',
  },
  {
    id: 'rat',
    name: 'Reserve A Table',
    logo: '/ventures/RAT-Logo-Circle.png',
    description: 'AI-driven restaurant booking and tables management system — seamless for both diners and venues.',
    url: 'https://reserveatable.com',
    size: 'sm',
  },
  {
    id: 'reservamesa',
    name: 'ReservaMesa',
    logo: '/ventures/reservamesa-logo.png',
    description: 'AI-driven restaurant reservations and table management for the Spanish-speaking market.',
    url: 'https://reservamesa.cr',
    size: 'sm',
  },
  {
    id: 'dawlink',
    name: 'DawLink AI',
    logo: '/ventures/DawLink-AI-Logo-LR-Dark-Bk.jpg',
    description: 'AI tools for music producers — bridge the gap between your DAW and creative ideas.',
    url: 'https://dawlinkai.com',
    size: 'md',
    darkBg: true,
  },
  {
    id: 'gyrotours',
    name: 'GyroTours',
    logo: '/ventures/GyroTours Logo.png',
    description: 'Gyrocopter tours in Costa Rica — an unforgettable aerial adventure over stunning landscapes.',
    url: 'https://gyrotours.cr',
    size: 'md',
  },
  {
    id: 'aiwege',
    name: 'AIwege',
    logo: '/ventures/AIwege-Logo.jpg',
    description: 'AI-powered website generator — build professional websites in minutes, no coding required.',
    url: 'https://aiwege.com',
    size: 'sm',
  },
  {
    id: 'wonderlogo',
    name: 'Wonderlogo',
    logo: '/ventures/Wonderlogo Logo.jpg',
    description: 'Generate stunning, professional logos in seconds with AI — for businesses of any size.',
    url: 'https://wonderlogo.art',
    size: 'sm',
  },
  {
    id: 'flashlogo',
    name: 'Flashlogo',
    logo: '/ventures/Flashlogo Logo.jpg',
    description: 'Instant AI logo creation tailored for freelancers, creators, and personal brands.',
    url: 'https://flashlogo.com',
    size: 'sm',
  },
  {
    id: '1000bots',
    name: '1000 Bots',
    logo: '/ventures/1000-Bots-Logo-Small.jpg',
    description: 'Custom AI chatbots and automation solutions for any industry — from support to lead generation.',
    url: 'https://1000bots.com',
    size: 'md',
  },
];

const sizeMap = {
  sm: { card: 'w-24 h-24', img: 'max-h-12 max-w-20' },
  md: { card: 'w-32 h-32', img: 'max-h-16 max-w-28' },
  lg: { card: 'w-40 h-40', img: 'max-h-20 max-w-36' },
};

/** Distribute ventures in an elliptical orbit around the center */
function getOrbitPosition(index: number, total: number, rx: number, ry: number) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    x: Math.cos(angle) * rx,
    y: Math.sin(angle) * ry,
  };
}

interface ActiveState {
  venture: Venture;
  cardCx: number;
  cardCy: number;
}

const POPUP_W = 288;
const POPUP_H = 220;

const VenturesGraph: React.FC = () => {
  const [active, setActive] = useState<ActiveState | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 900, h: 820 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setContainerSize({
          w: containerRef.current.offsetWidth,
          h: containerRef.current.offsetHeight,
        });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const cx = containerSize.w / 2;
  const cy = containerSize.h / 2;
  const rx = Math.min(cx - 110, 360);
  const ry = Math.min(cy - 100, 270);

  /** Compute popup top-left so it stays within the container */
  const popupPos = (cardCx: number, cardCy: number) => {
    // Try to place popup to the right of the card, fallback left
    let left = cardCx + 70;
    if (left + POPUP_W > containerSize.w - 8) left = cardCx - POPUP_W - 70;
    left = Math.max(8, left);
    let top = cardCy - POPUP_H / 2;
    top = Math.max(8, Math.min(top, containerSize.h - POPUP_H - 8));
    return { left, top };
  };

  return (
    <div className="relative w-full" style={{ height: '820px' }} ref={containerRef}>
      {/* Orbit ring */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="none"
          stroke="rgba(96,165,250,0.15)"
          strokeWidth="1"
          strokeDasharray="6 6"
        />
        {ventures.map((v, i) => {
          const pos = getOrbitPosition(i, ventures.length, rx, ry);
          return (
            <line
              key={v.id}
              x1={cx}
              y1={cy}
              x2={cx + pos.x}
              y2={cy + pos.y}
              stroke="rgba(96,165,250,0.08)"
              strokeWidth="1"
            />
          );
        })}
      </svg>

      {/* Center logo */}
      <div
        className="absolute z-10 flex items-center justify-center"
        style={{
          left: cx - 64,
          top: cy - 64,
          width: 128,
          height: 128,
        }}
      >
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600/30 to-cyan-600/20 border border-blue-400/40 backdrop-blur-sm flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.3)]">
          <img
            src="/ventures/1000 Feet Logo.png"
            alt="1000 Feet"
            className="w-20 h-20 object-contain"
          />
        </div>
      </div>

      {/* Venture cards */}
      {ventures.map((v, i) => {
        const pos = getOrbitPosition(i, ventures.length, rx, ry);
        const { card, img } = sizeMap[v.size];
        const cardW = v.size === 'sm' ? 96 : v.size === 'md' ? 128 : 160;
        const cardH = cardW;
        const cardCx = cx + pos.x;
        const cardCy = cy + pos.y;

        return (
          <button
            key={v.id}
            onClick={() => setActive({ venture: v, cardCx, cardCy })}
            className={`absolute z-20 ${card} rounded-2xl border border-blue-500/30 bg-white flex items-center justify-center cursor-pointer shadow-lg
              transition-all duration-300 hover:scale-110 hover:border-blue-400 hover:shadow-[0_0_24px_rgba(59,130,246,0.5)]
              ${active?.venture.id === v.id ? 'border-blue-400 shadow-[0_0_24px_rgba(59,130,246,0.6)] scale-110' : ''}`}
            style={{
              left: cardCx - cardW / 2,
              top: cardCy - cardH / 2,
            }}
            aria-label={v.name}
          >
            <img
              src={encodeURI(v.logo)}
              alt={v.name}
              className={`object-contain ${img}`}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }}
            />
          </button>
        );
      })}

      {/* Detail popup */}
      {active && (() => {
        const v = active.venture;
        const { left, top } = popupPos(active.cardCx, active.cardCy);
        return (
          <div
            className="absolute z-30 rounded-2xl border border-blue-400/30 bg-slate-900/95 backdrop-blur-md shadow-2xl p-5"
            style={{ width: POPUP_W, left, top }}
          >
            <button
              onClick={() => setActive(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="w-14 h-14 rounded-xl mb-3 flex items-center justify-center bg-white">
              <img src={encodeURI(v.logo)} alt={v.name} className="w-10 h-10 object-contain" />
            </div>


            <h3 className="text-white font-bold text-base mb-1">{v.name}</h3>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">{v.description}</p>

            {v.url ? (
              <a
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-cyan-400 transition-colors"
              >
                Visit site <ExternalLink size={14} />
              </a>
            ) : (
              <span className="text-sm text-gray-500 italic">Coming soon</span>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default VenturesGraph;
