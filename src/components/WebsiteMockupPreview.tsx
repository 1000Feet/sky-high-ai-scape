import React, { useState, useEffect } from 'react';
import { Globe, Phone, Mail, Star, ArrowRight, Menu, Zap, Shield, TrendingUp, Users, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MockupProps {
  businessName: string;
  businessType: string;
  logoUrl: string;
  colors: string[];
  socialMedia: string;
}

// Determine if a hex color is "dark"
const isDark = (hex: string) => {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
};

const WebsiteMockupPreview: React.FC<MockupProps> = ({
  businessName,
  businessType,
  logoUrl,
  colors,
}) => {
  const primary = colors[0] || '#3b82f6';
  const primaryDark = colors[1] || '#2563eb';
  const bgColor = colors[2] || '#f0f9ff';
  const textColor = colors[3] || '#1e293b';

  // Detect if the palette is dark-themed based on the background color
  const darkMode = isDark(bgColor);
  
  // Adaptive colors
  const pageBg = darkMode ? bgColor : '#ffffff';
  const sectionAltBg = darkMode ? `${primary}08` : '#f9fafb';
  const cardBg = darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const cardBorder = darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  const textMain = darkMode ? '#f1f5f9' : textColor;
  const textMuted = darkMode ? '#94a3b8' : '#6b7280';
  const textSubtle = darkMode ? '#64748b' : '#9ca3af';
  const navBg = darkMode ? 'rgba(0,0,0,0.3)' : '#ffffff';
  const navBorder = darkMode ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const footerBg = darkMode ? '#050510' : textColor;

  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [loadingHero, setLoadingHero] = useState(false);

  useEffect(() => {
    generateHeroImage();
  }, [businessName, businessType, primary]);

  const generateHeroImage = async () => {
    if (!businessType && !businessName) return;
    setLoadingHero(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-website-mockup', {
        body: {
          businessName,
          businessType,
          colorPalette: primary,
          logoUrl: '',
          mode: 'hero-image',
        },
      });
      if (!error && result?.success && result?.mockupImage) {
        setHeroImage(result.mockupImage);
      }
    } catch (e) {
      console.error('Hero image generation failed:', e);
    } finally {
      setLoadingHero(false);
    }
  };

  const getHeroText = () => {
    const type = (businessType || '').toLowerCase();
    if (type.includes('restaurant') || type.includes('food') || type.includes('café'))
      return { headline: 'Savor Every Moment', sub: 'Experience exceptional cuisine crafted with passion and the finest ingredients.', cta: 'Reserve a Table' };
    if (type.includes('tech') || type.includes('software') || type.includes('saas'))
      return { headline: 'Build the Future', sub: 'Cutting-edge technology solutions that scale with your ambition.', cta: 'Start Building' };
    if (type.includes('fitness') || type.includes('gym') || type.includes('health'))
      return { headline: 'Transform Your Life', sub: 'Expert-led programs designed to push your limits and achieve real results.', cta: 'Join Now' };
    if (type.includes('real estate') || type.includes('property'))
      return { headline: 'Find Your Dream Home', sub: 'Premium properties with personalized service you can trust.', cta: 'Browse Listings' };
    if (type.includes('consult'))
      return { headline: 'Accelerate Your Growth', sub: 'Strategic consulting that turns vision into measurable outcomes.', cta: 'Book a Call' };
    if (type.includes('ecommerce') || type.includes('shop') || type.includes('store'))
      return { headline: 'Shop the Collection', sub: 'Curated products delivered with care. Discover what\'s new.', cta: 'Shop Now' };
    return { headline: 'Welcome to Excellence', sub: 'Professional solutions crafted to elevate your business to new heights.', cta: 'Get Started' };
  };

  const getFeatures = () => {
    const icons = [Zap, Shield, TrendingUp, Users];
    const type = (businessType || '').toLowerCase();
    let features: string[];
    if (type.includes('restaurant') || type.includes('food'))
      features = ['Farm to Table', 'Private Dining', 'Event Catering', 'Online Ordering'];
    else if (type.includes('tech') || type.includes('software'))
      features = ['Cloud Native', 'AI Powered', 'Enterprise Scale', 'Secure by Design'];
    else if (type.includes('consult'))
      features = ['Strategy', 'Analytics', 'Growth', 'Transformation'];
    else
      features = ['Innovation', 'Quality', 'Speed', 'Support'];
    return features.map((f, i) => ({ name: f, icon: icons[i] }));
  };

  const hero = getHeroText();
  const features = getFeatures();

  const stats = [
    { value: '500+', label: 'Happy Clients' },
    { value: '99%', label: 'Satisfaction' },
    { value: '24/7', label: 'Support' },
    { value: '10+', label: 'Years' },
  ];

  return (
    <div className="w-full rounded-xl overflow-hidden shadow-2xl border border-white/20" style={{ fontSize: '10px' }}>
      {/* Browser Chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2" style={{ backgroundColor: '#1e1e2e' }}>
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-2 px-3 py-1 rounded-md text-[9px] text-gray-400 truncate" style={{ backgroundColor: '#2a2a3e' }}>
          🔒 {businessName.toLowerCase().replace(/\s+/g, '')}.com
        </div>
      </div>

      {/* Website Content */}
      <div style={{ backgroundColor: pageBg, color: textMain }}>
        {/* Nav */}
        <nav className="flex items-center justify-between px-4 py-2.5" style={{
          backgroundColor: navBg,
          backdropFilter: darkMode ? 'blur(12px)' : undefined,
          borderBottom: `1px solid ${navBorder}`,
        }}>
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-5 w-5 object-contain rounded" />
            ) : (
              <div className="h-5 w-5 rounded-lg flex items-center justify-center text-white font-bold text-[8px]" style={{
                background: `linear-gradient(135deg, ${primary}, ${primaryDark})`,
              }}>
                {businessName.charAt(0)}
              </div>
            )}
            <span className="font-bold text-[11px]" style={{ color: textMain }}>{businessName}</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[9px]" style={{ color: textMuted }}>
            <span>Home</span><span>About</span><span>Services</span><span>Contact</span>
            <span className="px-2.5 py-1 rounded-full text-white text-[8px] font-semibold" style={{
              background: `linear-gradient(135deg, ${primary}, ${primaryDark})`,
            }}>
              {hero.cta}
            </span>
          </div>
          <Menu className="sm:hidden h-3.5 w-3.5" style={{ color: textMuted }} />
        </nav>

        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0" style={{
            background: darkMode
              ? `radial-gradient(ellipse at 30% 50%, ${primary}25 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, ${primaryDark}15 0%, transparent 50%)`
              : `radial-gradient(ellipse at 30% 50%, ${primary}12 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, ${primaryDark}08 0%, transparent 50%)`,
          }} />
          {!darkMode && (
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }} />
          )}
          {darkMode && (
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.04]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }} />
          )}

          <div className="relative z-10 px-5 py-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-medium mb-3" style={{
              backgroundColor: `${primary}15`,
              color: primary,
              border: `1px solid ${primary}25`,
            }}>
              <Zap className="h-2 w-2" /> Now Available
            </div>

            <h1 className="font-extrabold text-[22px] leading-tight mb-2" style={{ color: textMain }}>
              {hero.headline}
            </h1>
            <p className="text-[10px] mb-5 max-w-[280px] leading-relaxed" style={{ color: textMuted }}>
              {hero.sub}
            </p>
            <div className="flex items-center gap-2">
              <button className="px-4 py-1.5 rounded-full text-white text-[9px] font-semibold flex items-center gap-1 shadow-lg" style={{
                background: `linear-gradient(135deg, ${primary}, ${primaryDark})`,
                boxShadow: `0 4px 15px ${primary}30`,
              }}>
                {hero.cta} <ArrowRight className="h-2.5 w-2.5" />
              </button>
              <button className="px-4 py-1.5 rounded-full text-[9px] font-semibold" style={{
                border: `1px solid ${cardBorder}`,
                color: textMuted,
                backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'transparent',
              }}>
                Learn More
              </button>
            </div>
          </div>

          {/* Hero Image */}
          {(heroImage || loadingHero) && (
            <div className="px-5 pb-5">
              <div className="rounded-lg overflow-hidden border" style={{ borderColor: cardBorder }}>
                {loadingHero ? (
                  <div className="h-24 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primary}08, ${primaryDark}08)` }}>
                    <div className="flex items-center gap-2 text-[9px]" style={{ color: textSubtle }}>
                      <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${textSubtle} transparent ${textSubtle} ${textSubtle}` }} />
                      Generating hero...
                    </div>
                  </div>
                ) : heroImage && (
                  <img src={heroImage} alt="Hero" className="w-full h-24 object-cover" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-0" style={{
          borderTop: `1px solid ${cardBorder}`,
          borderBottom: `1px solid ${cardBorder}`,
          backgroundColor: sectionAltBg,
        }}>
          {stats.map((stat, i) => (
            <div key={i} className="text-center py-3 px-2" style={{
              borderRight: i < 3 ? `1px solid ${cardBorder}` : 'none',
            }}>
              <div className="font-bold text-[13px]" style={{ color: primary }}>{stat.value}</div>
              <div className="text-[7px] uppercase tracking-wider mt-0.5" style={{ color: textSubtle }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="px-4 py-6" style={{ backgroundColor: pageBg }}>
          <p className="text-center text-[8px] font-semibold uppercase tracking-widest mb-1" style={{ color: primary }}>What We Do</p>
          <h2 className="text-center font-bold text-[14px] mb-4" style={{ color: textMain }}>Built for Excellence</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {features.map((f, i) => (
              <div key={i} className="p-3 rounded-xl text-center" style={{
                backgroundColor: cardBg,
                border: `1px solid ${cardBorder}`,
              }}>
                <div className="w-7 h-7 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{
                  background: `${primary}15`,
                }}>
                  <f.icon className="h-3.5 w-3.5" style={{ color: primary }} />
                </div>
                <p className="font-semibold text-[9px]" style={{ color: textMain }}>{f.name}</p>
                <p className="text-[7px] mt-0.5" style={{ color: textSubtle }}>Premium quality</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="px-5 py-5" style={{ backgroundColor: sectionAltBg }}>
          <div className="max-w-[280px] mx-auto text-center">
            <div className="flex justify-center gap-0.5 mb-2">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="h-2.5 w-2.5 fill-current" style={{ color: '#eab308' }} />
              ))}
            </div>
            <p className="text-[9px] italic leading-relaxed mb-2" style={{ color: textMuted }}>
              "{businessName} exceeded all expectations. Their attention to detail and professional approach made all the difference."
            </p>
            <p className="text-[8px] font-semibold" style={{ color: textMain }}>Sarah Johnson</p>
            <p className="text-[7px]" style={{ color: textSubtle }}>CEO, TechCorp</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="px-4 py-6 text-center relative overflow-hidden">
          <div className="absolute inset-0" style={{
            background: `linear-gradient(135deg, ${primary}, ${primaryDark})`,
          }} />
          <div className="relative z-10">
            <h3 className="text-white font-bold text-[14px] mb-1">Ready to Get Started?</h3>
            <p className="text-[9px] text-white/80 mb-3 max-w-[240px] mx-auto">
              Join hundreds of satisfied clients. Let's build something amazing together.
            </p>
            <button className="px-5 py-2 rounded-full text-[9px] font-semibold shadow-lg" style={{
              backgroundColor: '#ffffff',
              color: primary,
            }}>
              {hero.cta} <ChevronRight className="inline h-2.5 w-2.5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-4 py-4" style={{
          backgroundColor: footerBg,
          borderTop: `1px solid ${cardBorder}`,
        }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-4 w-4 object-contain rounded" />
              ) : (
                <Globe className="h-3 w-3" style={{ color: primary }} />
              )}
              <span className="text-[9px] font-semibold text-white">{businessName}</span>
            </div>
            <div className="flex items-center gap-3 text-[8px] text-gray-400">
              <span>Privacy</span><span>Terms</span><span>Contact</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[7px] text-gray-500">
            <span>© 2026 {businessName}. All rights reserved.</span>
            <div className="flex items-center gap-2">
              <Mail className="h-2 w-2" /><Phone className="h-2 w-2" />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default WebsiteMockupPreview;
