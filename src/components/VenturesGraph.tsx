import React from 'react';
import { ExternalLink } from 'lucide-react';

interface Venture {
  id: string;
  name: string;
  logo: string;
  description: string;
  url: string;
  darkBg?: boolean;
}

const ventures: Venture[] = [
  { id: 'nuovimondi', name: 'Nuovi Mondi', logo: '/ventures/Nuovi-Mondi-Logo.png', description: 'A new kind of coliving spaces.', url: '/nuovimondi' },
  { id: 'dawlink', name: 'DawLink AI', logo: '/ventures/DawLink-AI-Logo-LR-Dark-Bk.jpg', description: 'AI tools for music producers — bridge the gap between your DAW and creative ideas.', url: 'https://dawlinkai.com', darkBg: true },
  { id: 'aiwege', name: 'AIwege', logo: '/ventures/AIwege-Logo.jpg', description: 'AI-powered website generator — build professional websites in minutes, no coding required.', url: 'https://aiwege.com' },
  { id: 'reservamesa', name: 'ReservaMesa', logo: '/ventures/reservamesa-logo.png', description: 'AI-driven restaurant reservations and table management for the Spanish-speaking market.', url: 'https://reservamesa.cr' },
  { id: 'rat', name: 'Reserve A Table', logo: '/ventures/RAT-Logo-Circle.png', description: 'AI-driven restaurant booking and tables management system — seamless for both diners and venues.', url: '' },
  { id: 'conciergedesk', name: 'ConciergeDesk', logo: '/ventures/ConciergeDesk-Logo.png', description: 'AI-powered concierge service for hotels and hospitality businesses.', url: '' },
  { id: 'time4love', name: 'Time 4 Love', logo: '/ventures/Time-4-Love-Logo.png', description: 'Volunteer recruitment and HR management platform for charity organizations and non-profits.', url: 'https://time4love.org' },
  { id: 'gyrotours', name: 'GyroTours', logo: '/ventures/GyroTours-Logo.png', description: 'Gyrocopter tours in Costa Rica — an unforgettable aerial adventure over stunning landscapes.', url: 'https://gyrotours.cr' },
  { id: 'nameswiki', name: 'NamesWiki', logo: '/ventures/nameswiki-logo.png', description: 'The world\'s largest searchable database of names — meanings, origins, and cultural history.', url: 'https://nameswiki.com' },
  { id: 'wonderlogo', name: 'Wonderlogo', logo: '/ventures/Wonderlogo-Logo.jpg', description: 'Generate stunning, professional logos in seconds with AI — for businesses of any size.', url: 'https://wonderlogo.art' },
  { id: 'flashlogo', name: 'Flashlogo', logo: '/ventures/Flashlogo-Logo.jpg', description: 'Instant AI logo creation tailored for freelancers, creators, and personal brands.', url: 'https://flashlogo.com' },
  { id: '1000bots', name: '1000 Bots', logo: '/ventures/1000-Bots-Logo-Small.jpg', description: 'Custom AI chatbots and automation solutions for any industry — from support to lead generation.', url: 'https://1000bots.com' },
  { id: 'whatsapp-translator', name: 'WhatsApp Translator', logo: '/ventures/Whatsapp-Translator-Logo.png', description: 'Real-time translation built directly into WhatsApp — break language barriers in any conversation.', url: '' },
  { id: 'savemybiz', name: 'SaveMyBiz', logo: '/ventures/SaveMyBiz-Logo.png', description: 'AI-powered business rescue and growth platform — turn struggling businesses around with data-driven insights.', url: 'https://savemybiz.netlify.app', darkBg: true },
];

const VenturesGraph: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {ventures.map((v) => {
          const isExternal = v.url?.startsWith('http');
          const Wrapper: any = v.url ? 'a' : 'div';
          const wrapperProps = v.url
            ? { href: v.url, target: isExternal ? '_blank' : undefined, rel: isExternal ? 'noopener noreferrer' : undefined }
            : {};
          return (
            <Wrapper
              key={v.id}
              {...wrapperProps}
              className="group relative rounded-2xl border border-blue-500/30 bg-white/95 p-5 flex flex-col items-center justify-center aspect-square shadow-lg transition-all duration-300 hover:scale-[1.03] hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.45)] cursor-pointer overflow-hidden"
            >
              {/* Default state: logo + name */}
              <div className="flex flex-col items-center justify-center w-full h-full transition-opacity duration-300 group-hover:opacity-0">
                <img
                  src={encodeURI(v.logo)}
                  alt={v.name}
                  className="max-h-20 max-w-[80%] object-contain mb-3"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }}
                />
                <span className="text-sm font-semibold text-slate-800 text-center">{v.name}</span>
              </div>

              {/* Hover state: description */}
              <div className="absolute inset-0 rounded-2xl bg-slate-900/95 backdrop-blur-sm p-4 flex flex-col justify-center items-center text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-white font-bold text-sm mb-2">{v.name}</h3>
                <p className="text-gray-300 text-xs leading-relaxed mb-3">{v.description}</p>
                {v.url ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400">
                    {isExternal ? 'Visit site' : 'Learn more'} <ExternalLink size={12} />
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 italic">Coming soon</span>
                )}
              </div>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
};

export default VenturesGraph;
