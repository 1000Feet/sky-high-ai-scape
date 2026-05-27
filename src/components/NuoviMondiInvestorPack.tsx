/**
 * NuoviMondiInvestorPack.tsx
 * ----------------------------------------------------------------------
 * Sezione "Investor Pack" da inserire su /nuovimondi (Lovable).
 * Posizionamento: SUBITO DOPO il video Synthesia, PRIMA del Market Analysis.
 *
 * Setup Lovable richiesto:
 * 1. Caricare le 10 immagini AI generate in:
 *      public/images/nuovi-mondi/01.png  → Lisbon/Cascais facade
 *      public/images/nuovi-mondi/02.png  → Málaga finca + olive grove
 *      public/images/nuovi-mondi/03.png  → Capital ask waterfall
 *      public/images/nuovi-mondi/04.png  → Roadmap timeline
 *      public/images/nuovi-mondi/05.png  → Market growth curves
 *      public/images/nuovi-mondi/06.png  → Community meditation workshop
 *      public/images/nuovi-mondi/07.png  → Tamarindo palapa
 *      public/images/nuovi-mondi/08.png  → Interior "Slow Pottery Tuesday"
 *      public/images/nuovi-mondi/09.png  → Exterior villa at sunset
 *      public/images/nuovi-mondi/10.png  → Cover hero (dinner under constellation)
 *
 * 2. Importare e renderizzare nel page component:
 *      import NuoviMondiInvestorPack from "@/components/NuoviMondiInvestorPack";
 *      // ...
 *      <NuoviMondiInvestorPack lang={lang} />   // dove lang è "it" | "en" gestita dal toggle
 *
 * 3. Rinominare il titolo del §1 del Market Analysis esistente:
 *      IT: "1. Executive Summary"  →  "1. Setup & Tesi"
 *      EN: "1. Executive Summary"  →  "1. Setup & Thesis"
 *    (evita la collisione con il nuovo blocco "Investor Pack" sopra).
 *
 * 4. Tra il nuovo blocco e il Market Analysis sottostante, aggiungere
 *    un divider con titolo:
 *      IT: "Analisi di Mercato e Fattibilità — deep-dive completo"
 *      EN: "Market Analysis & Feasibility — full deep-dive"
 *
 * Il componente è autoportante: Tailwind only, niente dipendenze esterne
 * a parte React. Compatibile con il design system dark-navy/cream/gold
 * della pagina attuale.
 * ----------------------------------------------------------------------
 */

import React from "react";

type Lang = "it" | "en";

interface Props {
  lang?: Lang;
}

// ============================================================
// CONTENT — IT + EN
// ============================================================
const CONTENT = {
  it: {
    eyebrow: "INVESTOR PACK",
    title: "Executive Summary",
    subtitle:
      "Stima dell'investimento per location, ricavi attesi, fattori di successo e roadmap operativa dei primi 24 mesi.",
    note:
      "Documento standalone per prime conversazioni con investitori. Il modello finanziario di dettaglio (P&L per location anno 1-7, sensitivity, IRR per LP scenarios) viene rilasciato come secondo deliverable agli investitori che vogliono procedere.",

    thesis: {
      eyebrow: "LA TESI",
      quote:
        "Il mercato vuole oggi quello che Selina prometteva nel 2018 — ma con economics da hospitality premium e community come prodotto, non come marketing.",
      note: "La finestra di mercato esiste, ma è stretta. E richiede un'esecuzione opposta a quella di Selina.",
    },

    product: {
      title: "Il prodotto",
      lead: "Nuovi Mondi è una rete di community coliving e long-stay residenziale in città costiere, posizionata mid-luxury, organizzata intorno a una membership multi-paese.",
      bullets: [
        {
          title: "Residenza part-time, non vacanza.",
          body: "Soggiorno medio target 4-12 settimane. Non resort short-stay, non hotel turistico — una seconda casa con servizi e community continua.",
        },
        {
          title: "Network membership.",
          body: "Un membro Nuovi Mondi paga $2.000-5.000 l'anno per accesso continuativo a tutte le 10 case della rete, con calendario di programmazione condiviso e community curata.",
        },
        {
          title: "Community come prodotto, non come marketing.",
          body: "Head of Community hired dal mese uno. Retention metrics tracciate per ogni location. Programmazione settimanale curata. È esattamente dove Selina ha sbagliato.",
        },
      ],
      tagline: "Soho House meets the digital nomad.",
      exteriorCaption: "Concept esterno — villa costiera mid-luxury al tramonto, community visibile sul terrazzo.",
      interiorCaption: "Concept interno — cucina-living comunale dove la programmazione settimanale accade.",
    },

    market: {
      eyebrow: "IL MERCATO",
      title: "Offerta in contrazione, domanda in accelerazione",
      lead: "Il digital nomad non era una bolla post-COVID. I dati 2025-2026 lo confermano.",
      stats: [
        { num: "35-40M", label: "digital nomad full-time globali" },
        { num: "$42B", label: "coliving market by 2030 (CAGR 27%)" },
        { num: "$89→$244B", label: "tourism segment 2025 → 2034" },
        { num: "$1-3K/anno", label: "gap di posizionamento membership scoperto" },
      ],
      insight:
        "Il segmento si sta segmentando: dal nomade puro al slow-nomad / long-stay residente part-time. È esattamente il prodotto che Nuovi Mondi serve.",
    },

    lighthouses: {
      eyebrow: "LE TRE LIGHTHOUSE",
      title: "Tre città — geografie scoperte da Habitas/Ennismore",
      lead: "Tamarindo lighthouse + Málaga scale proof + Lisbona/Cascais asse atlantico. Tutte e tre con digital nomad visa attiva.",
      cities: [
        {
          num: "01",
          role: "LIGHTHOUSE",
          name: "Tamarindo",
          country: "Costa Rica",
          capex: "$6-8M",
          points: [
            "DNV $3K/mese, esente income tax",
            "HUB esistente di Angelo (15Love, Casa Idea, Autogyro)",
            "White space — bassa saturazione",
            "Rischio Habitas Santa Teresa, ma costa diversa",
          ],
        },
        {
          num: "02",
          role: "SCALE PROOF",
          name: "Málaga",
          country: "Spagna",
          capex: "$9-12M",
          points: [
            "Spain DNV €2.160/mese · valida 5 anni",
            "#1 expat city al mondo 2023",
            "Silicon Valley Costa del Sol · 320 giorni di sole",
            "Mid-luxury costiero ancora scoperto",
          ],
        },
        {
          num: "03",
          role: "ASSE ATLANTICO",
          name: "Lisbona / Cascais",
          country: "Portogallo",
          capex: "$10-14M",
          points: [
            "Portugal DNV €3.480/mese, rinnovabile",
            "Cascais capitale digital nomad atlantica",
            "Comunità expat matura · volo diretto da LIS",
            "Zero Habitas/Ennismore costiero in PT",
          ],
        },
      ],
    },

    economics: {
      eyebrow: "UNIT ECONOMICS",
      title: "Modello per location",
      lead: "Stime direzionali basate su benchmark STR/HVS upper-upscale + lifestyle resort. Da affinare nel modello finanziario di dettaglio.",
      capexTitle: "Capex per location (40-60 keys)",
      capexRows: [
        ["Land / JV equity contribution", "$1,5-3,0M"],
        ["Renovation o build ($100-150K/key tier premium)", "$4,0-7,0M"],
        ["FF&E ($25-40K/key)", "$1,2-2,4M"],
        ["Pre-opening + working capital", "$1,0-1,5M"],
        ["Contingency (~10%)", "$0,8-1,4M"],
      ],
      capexTotal: ["Totale capex per location", "$8,5-15,3M"],
      revenueTitle: "Ricavi steady-state per location (anno 3+)",
      revenueRows: [
        ["Rooms (50 keys · 78% occ · $240 ADR blended)", "$3,42M"],
        ["F&B + wellness (~30% di rooms)", "$1,02M"],
        ["Membership (quota location ~$250K)", "$0,25M"],
        ["Events + programming (5-8% rooms)", "$0,20M"],
      ],
      revenueTotal: ["Totale ricavi ricorrenti Y3", "~$4,9M"],
      revenueOneOff: ["Branded residences (5 unit × $400-800K, one-off)", "$2-4M"],
      opsTitle: "Operating economics & returns",
      opsRows: [
        ["EBITDA margin steady-state Y3", "25-30%"],
        ["EBITDA Y3 per location", "$1,2-1,5M"],
        ["Payback semplice (capex / EBITDA)", "7-9 anni"],
        ["IRR per LP equity (con branded residences exit)", "18-22%"],
        ["MOIC al year 7-10", "2,5-3,0x"],
      ],
      programTitle: "Total program (10 location · 7 anni)",
      programRows: [
        ["Capex totale", "$80-120M (50% JV / 30% LP equity / 20% residences pre-sales)"],
        ["Equity LP cumulativo", "$25-35M"],
        ["EBITDA steady-state Y7", "$12-16M ricorrenti"],
        ["Valuation target Y7-10", "$120-180M (8-10x EBITDA + residences book)"],
      ],
    },

    capital: {
      eyebrow: "CAPITAL ASK",
      title: "Round attuale: $5M soft-circle / pre-seed",
      lead: "Vehicle: SPV Nuovi Mondi Holdings (Delaware C-Corp o BVI HoldCo). Use of funds breakdown mesi 0-18:",
      useOfFunds: [
        ["Tamarindo — JV equity + closing", "$2,2M"],
        ["Tamarindo — design + pre-construction", "$0,4M"],
        ["Working capital + team (4-5 hires chiave)", "$1,0M"],
        ["Málaga — site scouting + JV pre-deal", "$0,3M"],
        ["Investor relations + Series A prep", "$0,3M"],
        ["Marketing + community pre-launch (100 founders)", "$0,3M"],
        ["Legal + structuring SPV/JV", "$0,2M"],
        ["Contingency (6% buffer)", "$0,3M"],
      ],
      total: "$5,0M",
      followOn:
        "Round successivo (mesi 18-24) $8-12M post apertura Tamarindo. Series A (year 3, post decision gate) $25-35M per Lisbona/Cascais + location 4-5.",
      returns: "IRR gross 18-22% · MOIC 2,5-3,0x al year 7-10 · fee structure 2/20 PE-standard con hurdle 8%.",
    },

    successFactors: {
      eyebrow: "KEY SUCCESS FACTORS",
      title: "Cinque condizioni non negoziabili",
      lead: "Se manca una di queste, il modello salta.",
      factors: [
        {
          title: "Capital structure asset-heavy con JV locali",
          body: "Niente master lease su edifici altrui (l'errore Selina). JV equity 30-50% con landowner/developer locali — riduce capex, allinea incentivi, scarica rischio.",
        },
        {
          title: "Pricing premium difendibile",
          body: "Membership $2-5K/anno minimo. Stay rate premium $200-400/notte. Posizionamento esplicito \"Soho House per costiero\" — non \"Selina meglio\".",
        },
        {
          title: "Asset partner locali in ogni città",
          body: "Un developer o property owner locale come JV partner per location. Riduce frizione regolatoria, accelera time-to-market, dà credibilità locale.",
        },
        {
          title: "Community come prodotto, non come marketing",
          body: "Head of Community prima dell'apertura. Retention metrics dal mese uno. Programmazione settimanale curata. Founding members program con lock-in.",
        },
        {
          title: "Sequenza disciplinata, mai scale-out",
          body: "Max 3 location nei primi 36 mesi. Quarta solo dopo 24 mesi a >90% occupancy. Il piano 10 città è una vision quinquennale, non un piano triennale.",
        },
      ],
      communityCaption:
        "La community come prodotto — programmazione settimanale curata, non marketing aspirational.",
    },

    roadmap: {
      eyebrow: "ROADMAP",
      title: "Primi 24 mesi — sequenza disciplinata",
      lead: "Sette fasi operative, ognuna con milestone chiari. Tamarindo apertura mese 21-22, Series A closing mese 22-24.",
      phases: [
        ["Mesi 0-6", "Fundraising round $5M soft-circle (6-8 LP target)"],
        ["Mesi 3-9", "Tamarindo property acquisition + JV term sheet"],
        ["Mesi 6-18", "Tamarindo design + remodeling + construction"],
        ["Mesi 9-21", "Hiring sequence: COO → Community Director → CFO → GM → ops team"],
        ["Mesi 12-18", "Málaga site scouting parallelo + JV pre-deal"],
        ["Mesi 16-21", "Soft launch + Founding Members Program (100 founders target)"],
        ["Mesi 18-24", "Series A fundraising $8-12M post-apertura Tamarindo"],
      ],
      timelineCaption: "Roadmap operativa dei primi 24 mesi — sette fasi con milestone chiari.",
    },

    cta: {
      title: "Per gli investitori che vogliono procedere",
      bullets: [
        "Modello finanziario di dettaglio (P&L per location anno 1-7, sensitivity, IRR scenarios) — entro 30 giorni dalla richiesta",
        "Site visit Tamarindo con candidate properties + meeting JV partner — entro 60 giorni",
        "Data room completa post-NDA",
        "Term sheet pronto per negoziazione",
      ],
      contact: "Angelo Magni · CEO & Founder, 1000 Feet Inc.",
      email: "bastoparty@gmail.com",
      cta: "Richiedi modello finanziario di dettaglio",
    },
  },

  en: {
    eyebrow: "INVESTOR PACK",
    title: "Executive Summary",
    subtitle:
      "Estimated investment per location, expected revenue, key success factors, and operational roadmap for the first 24 months.",
    note:
      "Standalone document for first conversations with investors. The detailed financial model (per-location P&L year 1-7, sensitivity, LP IRR scenarios) is released as a second deliverable to investors who want to proceed.",

    thesis: {
      eyebrow: "THE THESIS",
      quote:
        "The market today wants what Selina promised in 2018 — but with premium hospitality economics and community as the product, not as marketing.",
      note: "The market window exists, but it's narrow. And it requires execution that is the opposite of Selina's.",
    },

    product: {
      title: "The product",
      lead: "Nuovi Mondi is a network of community-driven coliving and long-stay residential homes in coastal cities, positioned mid-luxury, organized around a multi-country membership.",
      bullets: [
        {
          title: "Part-time residence, not vacation.",
          body: "Target average stay 4-12 weeks. Not a short-stay resort, not a tourist hotel — a second home with continuous services and community.",
        },
        {
          title: "Network membership.",
          body: "A Nuovi Mondi member pays $2,000-5,000 per year for continuous access to all 10 homes in the network, with a shared programming calendar and curated community.",
        },
        {
          title: "Community as product, not as marketing.",
          body: "Head of Community hired from month one. Retention metrics tracked per location. Weekly curated programming. This is exactly where Selina got it wrong.",
        },
      ],
      tagline: "Soho House meets the digital nomad.",
      exteriorCaption: "Exterior concept — mid-luxury coastal villa at sunset, community visible on the terrace.",
      interiorCaption: "Interior concept — communal kitchen-living where the weekly programming happens.",
    },

    market: {
      eyebrow: "THE MARKET",
      title: "Supply contracting, demand accelerating",
      lead: "The digital nomad wasn't a post-COVID bubble. 2025-2026 data confirms it.",
      stats: [
        { num: "35-40M", label: "full-time digital nomads globally" },
        { num: "$42B", label: "coliving market by 2030 (CAGR 27%)" },
        { num: "$89→$244B", label: "tourism segment 2025 → 2034" },
        { num: "$1-3K/yr", label: "uncovered membership positioning gap" },
      ],
      insight:
        "The segment is segmenting: from the pure nomad to the slow-nomad / long-stay part-time resident. This is exactly the product Nuovi Mondi serves.",
    },

    lighthouses: {
      eyebrow: "THE THREE LIGHTHOUSES",
      title: "Three cities — geographies uncovered by Habitas/Ennismore",
      lead: "Tamarindo lighthouse + Málaga scale proof + Lisbon/Cascais Atlantic axis. All three with an active digital nomad visa.",
      cities: [
        {
          num: "01",
          role: "LIGHTHOUSE",
          name: "Tamarindo",
          country: "Costa Rica",
          capex: "$6-8M",
          points: [
            "DNV $3K/month, income-tax exempt",
            "Existing HUB of Angelo (15Love, Casa Idea, Autogyro)",
            "White space — low saturation",
            "Habitas Santa Teresa risk, but different coast",
          ],
        },
        {
          num: "02",
          role: "SCALE PROOF",
          name: "Málaga",
          country: "Spain",
          capex: "$9-12M",
          points: [
            "Spain DNV €2,160/month · 5-year validity",
            "#1 expat city worldwide 2023",
            "Silicon Valley Costa del Sol · 320 sunny days",
            "Mid-luxury coastal still uncovered",
          ],
        },
        {
          num: "03",
          role: "ATLANTIC AXIS",
          name: "Lisbon / Cascais",
          country: "Portugal",
          capex: "$10-14M",
          points: [
            "Portugal DNV €3,480/month, renewable",
            "Cascais — Atlantic digital nomad capital",
            "Mature expat community · direct flights from LIS",
            "Zero Habitas/Ennismore coastal in PT",
          ],
        },
      ],
    },

    economics: {
      eyebrow: "UNIT ECONOMICS",
      title: "Per-location model",
      lead: "Directional estimates based on STR/HVS benchmarks for the upper-upscale + lifestyle resort segment. To be refined in the detailed financial model.",
      capexTitle: "Capex per location (40-60 keys)",
      capexRows: [
        ["Land / JV equity contribution", "$1.5-3.0M"],
        ["Renovation or build ($100-150K/key premium tier)", "$4.0-7.0M"],
        ["FF&E ($25-40K/key)", "$1.2-2.4M"],
        ["Pre-opening + working capital", "$1.0-1.5M"],
        ["Contingency (~10%)", "$0.8-1.4M"],
      ],
      capexTotal: ["Total capex per location", "$8.5-15.3M"],
      revenueTitle: "Steady-state revenue per location (year 3+)",
      revenueRows: [
        ["Rooms (50 keys · 78% occ · $240 blended ADR)", "$3.42M"],
        ["F&B + wellness (~30% of rooms)", "$1.02M"],
        ["Membership (location share ~$250K)", "$0.25M"],
        ["Events + programming (5-8% of rooms)", "$0.20M"],
      ],
      revenueTotal: ["Total recurring revenue Y3", "~$4.9M"],
      revenueOneOff: ["Branded residences (5 units × $400-800K, one-off)", "$2-4M"],
      opsTitle: "Operating economics & returns",
      opsRows: [
        ["EBITDA margin, steady-state Y3", "25-30%"],
        ["EBITDA Y3 per location", "$1.2-1.5M"],
        ["Simple payback (capex / EBITDA)", "7-9 years"],
        ["LP equity IRR (with branded residences exit)", "18-22%"],
        ["MOIC by year 7-10", "2.5-3.0x"],
      ],
      programTitle: "Total program (10 locations · 7 years)",
      programRows: [
        ["Total capex", "$80-120M (50% JV / 30% LP equity / 20% residences pre-sales)"],
        ["Cumulative LP equity", "$25-35M"],
        ["Steady-state EBITDA Y7", "$12-16M recurring"],
        ["Target valuation Y7-10", "$120-180M (8-10x EBITDA + residences book)"],
      ],
    },

    capital: {
      eyebrow: "CAPITAL ASK",
      title: "Current round: $5M soft-circle / pre-seed",
      lead: "Vehicle: Nuovi Mondi Holdings SPV (Delaware C-Corp or BVI HoldCo). Use of funds breakdown, months 0-18:",
      useOfFunds: [
        ["Tamarindo — JV equity + closing", "$2.2M"],
        ["Tamarindo — design + pre-construction", "$0.4M"],
        ["Working capital + team (4-5 key hires)", "$1.0M"],
        ["Málaga — site scouting + JV pre-deal", "$0.3M"],
        ["Investor relations + Series A prep", "$0.3M"],
        ["Marketing + community pre-launch (100 founders)", "$0.3M"],
        ["Legal + structuring SPV/JV", "$0.2M"],
        ["Contingency (6% buffer)", "$0.3M"],
      ],
      total: "$5.0M",
      followOn:
        "Follow-on round (months 18-24) $8-12M after Tamarindo opening. Series A (year 3, post decision gate) $25-35M for Lisbon/Cascais + locations 4-5.",
      returns: "Gross IRR 18-22% · MOIC 2.5-3.0x by year 7-10 · 2/20 PE-standard fee structure with 8% hurdle.",
    },

    successFactors: {
      eyebrow: "KEY SUCCESS FACTORS",
      title: "Five non-negotiable conditions",
      lead: "If any one is missing, the model breaks.",
      factors: [
        {
          title: "Asset-heavy capital structure with local JVs",
          body: "No master leases on other people's buildings (the Selina error). 30-50% JV equity with local landowners/developers — reduces capex, aligns incentives, sheds risk.",
        },
        {
          title: "Defensible premium pricing",
          body: "Minimum $2-5K/year membership. Premium $200-400/night stay rate. Explicit positioning as \"Soho House for coastal\" — not \"Selina, better\".",
        },
        {
          title: "Local asset partners in every city",
          body: "A local developer or property owner as JV partner per location. Reduces regulatory friction, accelerates time-to-market, gives local credibility.",
        },
        {
          title: "Community as product, not as marketing",
          body: "Head of Community before opening. Retention metrics from month one. Weekly curated programming. Founding members program with lock-in.",
        },
        {
          title: "Disciplined sequence, never scale-out",
          body: "Max 3 locations in the first 36 months. Fourth only after 24 months at >90% occupancy. The 10-city plan is a five-year vision, not a three-year plan.",
        },
      ],
      communityCaption:
        "Community as product — weekly curated programming, not aspirational marketing.",
    },

    roadmap: {
      eyebrow: "ROADMAP",
      title: "First 24 months — disciplined sequence",
      lead: "Seven operational phases, each with clear milestones. Tamarindo opening month 21-22, Series A closing month 22-24.",
      phases: [
        ["Months 0-6", "Fundraising round $5M soft-circle (6-8 target LPs)"],
        ["Months 3-9", "Tamarindo property acquisition + JV term sheet"],
        ["Months 6-18", "Tamarindo design + remodeling + construction"],
        ["Months 9-21", "Hiring sequence: COO → Community Director → CFO → GM → ops team"],
        ["Months 12-18", "Málaga parallel site scouting + JV pre-deal"],
        ["Months 16-21", "Soft launch + Founding Members Program (100 founders target)"],
        ["Months 18-24", "Series A fundraising $8-12M post Tamarindo opening"],
      ],
      timelineCaption: "First 24-month roadmap — seven phases with clear milestones.",
    },

    cta: {
      title: "For investors who want to proceed",
      bullets: [
        "Detailed financial model (per-location P&L year 1-7, sensitivity, IRR scenarios) — within 30 days of request",
        "Tamarindo site visit with candidate properties + JV partner meetings — within 60 days",
        "Full data room post-NDA",
        "Term sheet ready for negotiation",
      ],
      contact: "Angelo Magni · CEO & Founder, 1000 Feet Inc.",
      email: "bastoparty@gmail.com",
      cta: "Request detailed financial model",
    },
  },
} as const;

// ============================================================
// REUSABLE SUB-COMPONENTS
// ============================================================

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-amber-400/90 uppercase mb-3">
    {children}
  </p>
);

const SectionDivider = () => (
  <div className="flex items-center gap-4 my-16">
    <div className="h-px flex-1 bg-amber-400/20" />
    <div className="text-amber-400/60 text-xs tracking-[0.3em] uppercase">·</div>
    <div className="h-px flex-1 bg-amber-400/20" />
  </div>
);

const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs italic text-slate-400 mt-2 text-center">{children}</p>
);

interface FigureProps {
  src: string;
  alt: string;
  caption?: string;
  rounded?: boolean;
}
const Figure = ({ src, alt, caption, rounded = true }: FigureProps) => (
  <figure className="my-8">
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`w-full h-auto ${rounded ? "rounded-2xl" : ""} shadow-2xl shadow-slate-950/40 ring-1 ring-white/5`}
    />
    {caption && <Caption>{caption}</Caption>}
  </figure>
);

// Table row helper
interface RowProps {
  cells: readonly [string, string];
  emphasized?: boolean;
}
const Row = ({ cells, emphasized = false }: RowProps) => (
  <tr className={emphasized ? "bg-amber-400/5 font-semibold" : ""}>
    <td className="py-3 px-4 text-sm sm:text-base text-slate-200 border-t border-white/5">
      {cells[0]}
    </td>
    <td className="py-3 px-4 text-sm sm:text-base text-white text-right whitespace-nowrap border-t border-white/5">
      {cells[1]}
    </td>
  </tr>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function NuoviMondiInvestorPack({ lang = "it" }: Props) {
  const c = CONTENT[lang];

  return (
    <section
      id="investor-pack"
      className="relative w-full bg-slate-950 text-slate-100 py-20 sm:py-28"
    >
      {/* Soft gold accent in background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(201,169,97,0.08),_transparent_60%)]" />

      <div className="relative max-w-5xl mx-auto px-6 sm:px-8">
        {/* ============ HEADER ============ */}
        <header className="text-center mb-12">
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <h2 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-4">
            {c.title}
          </h2>
          <p className="text-lg text-slate-300 italic max-w-3xl mx-auto">
            {c.subtitle}
          </p>
          <p className="text-sm text-slate-400 max-w-3xl mx-auto mt-6">
            {c.note}
          </p>
        </header>

        {/* ============ HERO IMAGE (cover #10) ============ */}
        <Figure
          src="/images/nuovi-mondi/01.png"
          alt="Nuovi Mondi — coastal community dinner under stars"
        />

        {/* ============ THESIS (quote) ============ */}
        <div className="my-16 sm:my-20 max-w-3xl mx-auto text-center">
          <Eyebrow>{c.thesis.eyebrow}</Eyebrow>
          <blockquote className="relative">
            <span className="absolute -top-6 -left-2 text-7xl text-amber-400/40 font-serif leading-none">
              &ldquo;
            </span>
            <p className="text-2xl sm:text-3xl font-serif italic text-white leading-snug px-4">
              {c.thesis.quote}
            </p>
          </blockquote>
          <div className="mt-8 mx-auto w-16 h-px bg-amber-400" />
          <p className="mt-6 text-sm text-slate-300">{c.thesis.note}</p>
        </div>

        <SectionDivider />

        {/* ============ THE PRODUCT ============ */}
        <section className="my-16">
          <h3 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">
            {c.product.title}
          </h3>
          <p className="text-lg text-slate-200 mb-8 max-w-3xl">
            {c.product.lead}
          </p>

          <ul className="space-y-5 mb-12">
            {c.product.bullets.map((b, i) => (
              <li key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-1 bg-amber-400 rounded-full" />
                <div>
                  <p className="text-white font-semibold mb-1">{b.title}</p>
                  <p className="text-slate-300 text-sm sm:text-base">{b.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="text-xl sm:text-2xl font-serif italic text-amber-300 text-center my-12">
            {c.product.tagline}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            <Figure
              src="/images/nuovi-mondi/02.png"
              alt="Nuovi Mondi exterior at sunset"
              caption={c.product.exteriorCaption}
            />
            <Figure
              src="/images/nuovi-mondi/03.png"
              alt="Nuovi Mondi interior — Slow Pottery Tuesday"
              caption={c.product.interiorCaption}
            />
          </div>
        </section>

        <SectionDivider />

        {/* ============ THE MARKET ============ */}
        <section className="my-16">
          <Eyebrow>{c.market.eyebrow}</Eyebrow>
          <h3 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">
            {c.market.title}
          </h3>
          <p className="text-base text-slate-400 italic max-w-3xl mb-10">
            {c.market.lead}
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
            {c.market.stats.map((s, i) => (
              <div
                key={i}
                className="border-t border-amber-400/40 pt-4 px-2"
              >
                <p className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2">
                  {s.num}
                </p>
                <p className="text-xs sm:text-sm text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          <Figure
            src="/images/nuovi-mondi/08.png"
            alt="Market growth curves — coliving and digital nomad tourism 2020-2034"
          />

          <div className="mt-8 p-6 bg-amber-400/5 border-l-2 border-amber-400 rounded-r-lg">
            <p className="text-slate-200 italic">{c.market.insight}</p>
          </div>
        </section>

        <SectionDivider />

        {/* ============ THREE LIGHTHOUSES ============ */}
        <section className="my-16">
          <Eyebrow>{c.lighthouses.eyebrow}</Eyebrow>
          <h3 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">
            {c.lighthouses.title}
          </h3>
          <p className="text-base text-slate-400 italic max-w-3xl mb-10">
            {c.lighthouses.lead}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {c.lighthouses.cities.map((city, i) => (
              <article
                key={i}
                className="flex flex-col rounded-2xl overflow-hidden bg-slate-900/60 border border-white/5 hover:border-amber-400/30 transition-colors"
              >
                <img
                  src={`/images/nuovi-mondi/0${i === 0 ? 4 : i === 1 ? 5 : 6}.png`}
                  alt={`${city.name} concept`}
                  loading="lazy"
                  className="w-full h-56 object-cover"
                />
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-baseline gap-4 mb-3">
                    <span className="text-3xl font-serif font-bold text-amber-400">
                      {city.num}
                    </span>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-amber-400/70 uppercase">
                      {city.role}
                    </span>
                  </div>
                  <div className="h-px bg-amber-400/20 mb-4" />
                  <h4 className="text-2xl font-serif font-bold text-white mb-1">
                    {city.name}
                  </h4>
                  <p className="text-sm text-slate-400 italic mb-4">{city.country}</p>
                  <ul className="space-y-2 text-sm text-slate-300 mb-5 flex-1">
                    {city.points.map((p, j) => (
                      <li key={j} className="flex gap-2">
                        <span className="text-amber-400 flex-shrink-0">·</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4 border-t border-white/5 flex items-baseline justify-between">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">
                      Capex
                    </span>
                    <span className="text-xl font-serif font-bold text-white">
                      {city.capex}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* ============ UNIT ECONOMICS ============ */}
        <section className="my-16">
          <Eyebrow>{c.economics.eyebrow}</Eyebrow>
          <h3 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">
            {c.economics.title}
          </h3>
          <p className="text-base text-slate-400 italic max-w-3xl mb-10">
            {c.economics.lead}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* CAPEX table */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">
                {c.economics.capexTitle}
              </h4>
              <table className="w-full">
                <tbody>
                  {c.economics.capexRows.map((r, i) => (
                    <Row key={i} cells={r as readonly [string, string]} />
                  ))}
                  <Row cells={c.economics.capexTotal as readonly [string, string]} emphasized />
                </tbody>
              </table>
            </div>

            {/* REVENUE table */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">
                {c.economics.revenueTitle}
              </h4>
              <table className="w-full">
                <tbody>
                  {c.economics.revenueRows.map((r, i) => (
                    <Row key={i} cells={r as readonly [string, string]} />
                  ))}
                  <Row cells={c.economics.revenueTotal as readonly [string, string]} emphasized />
                  <Row cells={c.economics.revenueOneOff as readonly [string, string]} />
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* OPS table */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">
                {c.economics.opsTitle}
              </h4>
              <table className="w-full">
                <tbody>
                  {c.economics.opsRows.map((r, i) => (
                    <Row key={i} cells={r as readonly [string, string]} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* PROGRAM table */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">
                {c.economics.programTitle}
              </h4>
              <table className="w-full">
                <tbody>
                  {c.economics.programRows.map((r, i) => (
                    <Row key={i} cells={r as readonly [string, string]} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ============ CAPITAL ASK ============ */}
        <section className="my-16">
          <Eyebrow>{c.capital.eyebrow}</Eyebrow>
          <h3 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">
            {c.capital.title}
          </h3>
          <p className="text-base text-slate-300 max-w-3xl mb-10">{c.capital.lead}</p>

          <Figure
            src="/images/nuovi-mondi/10.png"
            alt="Capital ask — $5M soft-circle round use of funds breakdown"
          />

          <div className="mt-10 max-w-2xl mx-auto">
            <table className="w-full">
              <tbody>
                {c.capital.useOfFunds.map((r, i) => (
                  <Row key={i} cells={r as readonly [string, string]} />
                ))}
                <Row
                  cells={[lang === "it" ? "Totale round" : "Total round", c.capital.total]}
                  emphasized
                />
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            <div className="p-5 bg-slate-900/60 border border-white/5 rounded-lg">
              <p className="text-xs uppercase tracking-wider text-amber-400 mb-2 font-semibold">
                {lang === "it" ? "Round successivi" : "Follow-on rounds"}
              </p>
              <p className="text-sm text-slate-300">{c.capital.followOn}</p>
            </div>
            <div className="p-5 bg-slate-900/60 border border-white/5 rounded-lg">
              <p className="text-xs uppercase tracking-wider text-amber-400 mb-2 font-semibold">
                {lang === "it" ? "LP returns target" : "LP target returns"}
              </p>
              <p className="text-sm text-slate-300">{c.capital.returns}</p>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ============ KEY SUCCESS FACTORS ============ */}
        <section className="my-16">
          <Eyebrow>{c.successFactors.eyebrow}</Eyebrow>
          <h3 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">
            {c.successFactors.title}
          </h3>
          <p className="text-base text-slate-400 italic max-w-3xl mb-10">
            {c.successFactors.lead}
          </p>

          <div className="space-y-4 mb-12">
            {c.successFactors.factors.map((f, i) => (
              <article
                key={i}
                className="flex gap-5 sm:gap-6 p-5 sm:p-6 bg-slate-900/40 border border-white/5 rounded-lg hover:border-amber-400/20 transition-colors"
              >
                <div className="flex-shrink-0 text-3xl sm:text-4xl font-serif font-bold text-amber-400 leading-none">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg mb-2">{f.title}</h4>
                  <p className="text-sm sm:text-base text-slate-300">{f.body}</p>
                </div>
              </article>
            ))}
          </div>

          <Figure
            src="/images/nuovi-mondi/07.png"
            alt="Community programming — group meditation at sunset"
            caption={c.successFactors.communityCaption}
          />
        </section>

        <SectionDivider />

        {/* ============ ROADMAP ============ */}
        <section className="my-16">
          <Eyebrow>{c.roadmap.eyebrow}</Eyebrow>
          <h3 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">
            {c.roadmap.title}
          </h3>
          <p className="text-base text-slate-400 italic max-w-3xl mb-10">
            {c.roadmap.lead}
          </p>

          <Figure
            src="/images/nuovi-mondi/09.png"
            alt="First 24 months roadmap — seven phases"
            caption={c.roadmap.timelineCaption}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
            {c.roadmap.phases.map((phase, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 bg-slate-900/40 border border-white/5 rounded-lg"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-serif font-bold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/80 mb-1">
                    {phase[0]}
                  </p>
                  <p className="text-sm text-slate-200">{phase[1]}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* ============ CTA ============ */}
        <section className="my-16 max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 sm:p-12 rounded-2xl border border-amber-400/20">
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-6">
              {c.cta.title}
            </h3>
            <ul className="space-y-3 mb-8">
              {c.cta.bullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-slate-300 text-sm sm:text-base">
                  <span className="text-amber-400 flex-shrink-0 mt-1">→</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="pt-6 border-t border-white/10">
              <p className="text-white font-semibold">{c.cta.contact}</p>
              <a
                href={`mailto:${c.cta.email}?subject=Nuovi%20Mondi%20-%20Investor%20Inquiry`}
                className="inline-flex items-center gap-2 mt-4 px-5 py-3 bg-amber-400 text-slate-950 font-semibold rounded-lg hover:bg-amber-300 transition-colors"
              >
                {c.cta.cta}
                <span aria-hidden>→</span>
              </a>
              <p className="text-xs text-slate-400 mt-3">{c.cta.email}</p>
            </div>
          </div>
        </section>
      </div>

      {/* ============ DIVIDER TO MARKET ANALYSIS ============ */}
      <div className="relative max-w-5xl mx-auto px-6 sm:px-8 mt-20">
        <div className="border-t border-white/10 pt-12 text-center">
          <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-amber-400/70 font-semibold mb-3">
            {lang === "it" ? "Continua sotto" : "Continues below"}
          </p>
          <p className="text-xl sm:text-2xl font-serif italic text-slate-300">
            {lang === "it"
              ? "Analisi di Mercato e Fattibilità — deep-dive completo"
              : "Market Analysis & Feasibility — full deep-dive"}
          </p>
        </div>
      </div>
    </section>
  );
}
