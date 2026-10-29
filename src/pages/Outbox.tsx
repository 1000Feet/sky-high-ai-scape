import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowDownToLine, ArrowUp, ArrowRight, Globe2, Keyboard, Languages, MessageCircle, Settings, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { APP_STORE_URL, OUTBOX_OFFER, startOutboxPixel, trackOutboxDownload } from "@/lib/outbox";
import icon from "@/assets/outbox/icon.webp.asset.json";
import phone1 from "@/assets/outbox/phone-01-type-in-english.webp.asset.json";
import phone2 from "@/assets/outbox/phone-02-outbox-translates.webp.asset.json";
import phone3 from "@/assets/outbox/phone-03-sent-in-spanish.webp.asset.json";
import phone4 from "@/assets/outbox/phone-04-whatsapp.webp.asset.json";
import phone5 from "@/assets/outbox/phone-05-imessage.webp.asset.json";
import phone6 from "@/assets/outbox/phone-06-instagram.webp.asset.json";
import phone7 from "@/assets/outbox/phone-07-telegram.webp.asset.json";
import demo from "@/assets/outbox/outbox-demo-720.mp4.asset.json";
import demoWebm from "@/assets/outbox/outbox-demo.webm.asset.json";
import poster from "@/assets/outbox/poster.jpg.asset.json";
import share from "@/assets/outbox/outbox-share.jpg.asset.json";

const description = "The keyboard that translates your messages as you type — right inside WhatsApp, iMessage, Instagram, Telegram and every chat app.";
const steps = [
  { image: phone1, title: "Write in your language", text: "Type your message as usual, in any chat.", alt: "English message typed with the usual iPhone keyboard" },
  { image: phone2, title: "Switch to Outbox", text: "Tap the globe key 🌐: the translation appears instantly in the green bar.", alt: "Outbox keyboard translating an English message into Spanish in its green bar" },
  { image: phone3, title: "Tap ↑ and send", text: "The translation goes into your message box. Hit send — done.", alt: "Translated Spanish message sent to Sofía" },
];
const chats = [
  { image: phone4, label: "WhatsApp · Italian" }, { image: phone5, label: "iMessage · Portuguese" },
  { image: phone6, label: "Instagram · French" }, { image: phone7, label: "Telegram · Japanese" },
];
const faq = [
  ["Does Outbox read my chats?", "No. Outbox only translates the text in your message box when you switch to it. It can't see your conversations."],
  ["Why does it ask for Full Access?", "Translation happens online, and iOS requires Full Access for a keyboard to connect to the internet."],
  ["Which languages are supported?", "More than 100, powered by Google Translate."],
  ["I installed it but don't see the keyboard", "Follow the 5 steps in 'Set it up in 30 seconds' above, then tap the globe key 🌐 in any chat."],
  ["Can I cancel the trial?", "Yes, anytime before it ends from your Apple ID subscriptions, and you won't be charged."],
];

function Download({ compact = false }: { compact?: boolean }) {
  return <Button asChild className={`outbox-download ${compact ? "outbox-download-small" : ""}`}><a href={APP_STORE_URL} onClick={trackOutboxDownload}><ArrowDownToLine aria-hidden="true" />{compact ? "Download" : `Try it free for ${OUTBOX_OFFER.trialDays} days`}</a></Button>;
}

export default function Outbox() {
  const hero = useRef<HTMLElement>(null);
  const carousel = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  const [sticky, setSticky] = useState(false);
  const [active, setActive] = useState(0);
  useLayoutEffect(() => {
    // Static homepage tags must not compete with this route's Helmet tags.
    // Restore them unchanged when navigating away from Outbox.
    const tags = Array.from(document.head.querySelectorAll('link[rel="canonical"], meta[name="description"], meta[property^="og:"], meta[name^="twitter:"]')).filter(tag => !tag.hasAttribute("data-rh"));
    tags.forEach(tag => tag.remove());
    return () => { tags.forEach(tag => document.head.appendChild(tag)); };
  }, []);
  useEffect(() => {
    startOutboxPixel();
    const heroObserver = new IntersectionObserver(([entry]) => setSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    if (hero.current) heroObserver.observe(hero.current);
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add("outbox-visible"); revealObserver.unobserve(entry.target); } }), { threshold: 0.08 });
    root.current?.querySelectorAll(".outbox-reveal").forEach(el => { el.classList.add("outbox-reveal-ready"); revealObserver.observe(el); });
    return () => { heroObserver.disconnect(); revealObserver.disconnect(); };
  }, []);
  return <main ref={root} className="outbox-page">
    <Helmet>
      <title>Outbox — Translate as you type, in every chat</title>
      <meta name="description" content={description} />
      <link rel="canonical" href="https://1000feetabove.com/outbox" />
      <meta property="og:title" content="Outbox — Translate as you type, in every chat" />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://1000feetabove.com/outbox" />
      <meta property="og:image" content={`https://1000feetabove.com${share.url}`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Outbox — Translate as you type, in every chat" />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`https://1000feetabove.com${share.url}`} />
      <link rel="icon" type="image/png" href="/outbox-icon.png" />
      <link rel="apple-touch-icon" href="/outbox-icon.png" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
    </Helmet>

    <section ref={hero} className="outbox-hero">
      <div className="outbox-brand"><img src={icon.url} alt="Outbox app icon" width="88" height="88" fetchPriority="high" /><span>Outbox</span></div>
      <h1>Type in <span className="outbox-orange">your</span> language.<br />Send in <span className="outbox-green">theirs.</span></h1>
      <p className="outbox-hero-description">{description}</p>
      <Download />
      <p className="outbox-availability">Free on the App Store · iPhone &amp; iPad · iOS {OUTBOX_OFFER.minimumIOS}+</p>
      <img className="outbox-phone outbox-hero-phone" src={phone2.url} alt={steps[1].alt} width="600" height="1168" fetchPriority="high" />
    </section>

    <section className="outbox-section outbox-how">
      <div className="outbox-section-heading"><span className="outbox-eyebrow">HOW IT WORKS</span><h2>A new language.<br />Same conversation.</h2></div>
      <div className="outbox-steps">{steps.map((step, i) => <article className="outbox-step outbox-reveal" key={step.title}>
        <img className="outbox-phone" src={step.image.url} alt={step.alt} width="600" height="1168" loading="lazy" decoding="async" />
        <div className="outbox-step-title"><span className="outbox-number">{i + 1}</span><h3>{step.title}</h3></div><p>{step.text}</p>
      </article>)}</div>
    </section>

    <section className="outbox-section outbox-dark outbox-watch">
      <span className="outbox-eyebrow">WATCH IT IN ACTION</span><h2>See the switch.</h2>
      <video className="outbox-video" poster={poster.url} autoPlay muted loop playsInline preload="metadata" controls aria-label="Outbox keyboard translation demonstration"><source src={demo.url} type="video/mp4" /><source src={demoWebm.url} type="video/webm" /></video>
      <p className="outbox-video-caption">19 seconds, no copy-paste.</p>
    </section>

    <section className="outbox-section outbox-chats">
      <div className="outbox-section-heading"><span className="outbox-eyebrow">RIGHT WHERE YOU CHAT</span><h2>Works in every<br />chat app.</h2></div>
      <div className="outbox-carousel" ref={carousel} onScroll={() => { const el = carousel.current; if (!el) return; const children = Array.from(el.children); const nearest = children.reduce((best, item, i) => Math.abs((item as HTMLElement).offsetLeft - el.offsetLeft - el.scrollLeft) < Math.abs((children[best] as HTMLElement).offsetLeft - el.offsetLeft - el.scrollLeft) ? i : best, 0); setActive(nearest); }}>
        {chats.map(chat => <figure className="outbox-chat" key={chat.label}><img className="outbox-phone" src={chat.image.url} alt={`Outbox translating a message in ${chat.label}`} loading="lazy" decoding="async" width="600" height="1168" /><figcaption>{chat.label}</figcaption></figure>)}
      </div>
      <div className="outbox-dots" aria-label="Choose a chat example">{chats.map((chat, i) => <Button key={chat.label} variant="ghost" size="icon" className="outbox-dot" aria-label={`Show ${chat.label}`} aria-pressed={active === i} onClick={() => { const el = carousel.current; const child = el?.children[i] as HTMLElement | undefined; if (el && child) el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }}><span /></Button>)}</div>
      <div className="outbox-apps">{["WhatsApp", "iMessage", "Instagram", "Telegram", "Messenger", "+ more"].map(app => <span key={app}>{app}</span>)}</div>
    </section>

    <section className="outbox-section outbox-setup" id="setup">
      <div className="outbox-section-heading"><span className="outbox-eyebrow">SET IT UP IN 30 SECONDS</span><h2>Turn on the<br />Outbox keyboard.</h2><p>After installing, do this once:</p></div>
      <div className="outbox-setup-panel">
        <ol className="outbox-activation">
          <li><Settings aria-hidden="true" /><div>Open the Outbox app and tap <strong>“Open Settings”</strong> (or open the iPhone Settings app).</div></li>
          <li><Keyboard aria-hidden="true" /><div>Go to <strong>General → Keyboard → Keyboards.</strong></div></li>
          <li><Keyboard aria-hidden="true" /><div>Tap <strong>“Add New Keyboard…”</strong> and select <strong>“Outbox Chat Translator”.</strong></div></li>
          <li><ShieldCheck aria-hidden="true" /><div>Tap <strong>“Outbox Chat Translator”</strong> in the list and turn on <strong>“Allow Full Access”</strong> — it's needed because translation happens online.</div></li>
          <li><Languages aria-hidden="true" /><div>Back in the Outbox app, choose your languages: <strong>Source</strong> (the language you write in) and <strong>Target</strong> (the language you want to send). Use <strong>“Swap Languages”</strong> to switch them anytime.</div></li>
        </ol>
        <div className="outbox-using"><h3>Using it in any chat</h3><ol><li>Write your message with your usual keyboard.</li><li>Tap the globe key 🌐 (or long-press it and pick Outbox).</li><li>Check the translation in the green bar and tap ↑ to insert it, then send.</li><li>Tap 🌐 again to go back to your normal keyboard.</li></ol><p>You can change languages anytime from the language buttons on the Outbox keyboard or in the app.</p></div>
      </div>
    </section>

    <section className="outbox-section outbox-benefits" aria-label="Outbox benefits"><div className="outbox-benefit-grid">{[[Globe2, "100+ languages"], [ArrowUp, "No copy-paste"], [MessageCircle, "Works in every app"], [Languages, "Set your languages once"]].map(([Icon, text]) => { const BenefitIcon = Icon as typeof Globe2; return <article className="outbox-benefit" key={String(text)}><BenefitIcon aria-hidden="true" /><h3>{String(text)}</h3></article>; })}</div></section>

    <section className="outbox-section outbox-dark outbox-pricing"><Sparkles className="outbox-pricing-icon" aria-hidden="true" /><span className="outbox-eyebrow">LESS TRANSLATING. MORE CONNECTING.</span><h2>{OUTBOX_OFFER.trialDays} days free.<br />A world of conversation.</h2><p className="outbox-price">Then <strong>${OUTBOX_OFFER.annualPrice}/year.</strong></p><p>Unlimited translations (fair use applies).<br />Cancel anytime from your Apple ID subscriptions.</p><Download /></section>

    <section className="outbox-section outbox-faq"><span className="outbox-eyebrow">GOOD TO KNOW</span><h2>A few questions.</h2><Accordion type="single" collapsible>{faq.map(([question, answer], i) => <AccordionItem value={`faq-${i}`} key={question}><AccordionTrigger className="outbox-faq-trigger">{question}</AccordionTrigger><AccordionContent className="outbox-faq-answer">{answer}{i === 3 && <a className="outbox-setup-link" href="#setup"> Keyboard setup <ArrowRight aria-hidden="true" /></a>}</AccordionContent></AccordionItem>)}</Accordion></section>

    <footer className="outbox-footer"><div className="outbox-footer-brand"><img src={icon.url} alt="Outbox" width="32" height="32" loading="lazy" /><strong>Outbox</strong></div><p>© 2026 1000 Feet, Inc.</p><div><a href="https://1000feetabove.com/outboxprivacypolicy">Privacy Policy</a><a href="mailto:angelo@angelomagni.it">Contact</a></div></footer>
    {sticky && <aside className="outbox-sticky" aria-label="Download Outbox"><img src={icon.url} alt="" width="40" height="40" /><span><strong>Outbox</strong><small>Free for {OUTBOX_OFFER.trialDays} days</small></span><Download compact /></aside>}
  </main>;
}