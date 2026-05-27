import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import heroVilla from '@/assets/nuovi-mondi/hero-villa.png';
import selinaCollapse from '@/assets/nuovi-mondi/selina-collapse.png';
import colivingFailures from '@/assets/nuovi-mondi/coliving-failures.png';
import competitorMap from '@/assets/nuovi-mondi/competitor-map.png';
import marketGrowth from '@/assets/nuovi-mondi/market-growth.png';
import targetCities from '@/assets/nuovi-mondi/target-cities.png';
import selinaVsNuoviMondi from '@/assets/nuovi-mondi/selina-vs-nuovi-mondi.png';
import fiveNonNegotiables from '@/assets/nuovi-mondi/five-non-negotiables.png';
import nuoviMondiVsHabitas from '@/assets/nuovi-mondi/nuovi-mondi-vs-habitas.png';
import roadmapTimeline from '@/assets/nuovi-mondi/roadmap-timeline.png';

type Lang = 'en' | 'it';

const content = {
  en: {
    switchLabel: 'IT',
    eyebrow: '1000 FEET INC. / STRATEGY',
    title: 'Nuovi Mondi',
    subtitle: 'Coastal Coliving Membership — Market Analysis and Feasibility',
    intro:
      'First market analysis of a community coliving and long-stay network across 10 coastal cities. Comparison with the Selina Hospitality collapse (2024), mapping of surviving competitors, validation of Tamarindo, Málaga, and Lisbon/Cascais as initial locations, and preliminary feasibility verdict.',
    meta: 'Preliminary document — for internal use and first conversations with trusted investors.',
    byline: 'Rome, May 26, 2026 · Angelo Magni · bastoparty@gmail.com',
    sections: [
      {
        n: '1',
        h: 'Executive Summary',
        thesis:
          'Thesis in one sentence: the market today wants what Selina promised in 2018 — but with premium hospitality economics, and community as the product, not as marketing.',
        body: [
          'Selina Hospitality collapsed into insolvency in July 2024 after burning through $725M in accumulated deficit and $550M+ in debt, losing almost all of its $1.2 billion 2022 SPAC valuation. The fall was not isolated: Common Living, Remote Year, Quarters, and Hubhaus also shut down in the same year. Industry stat: over 60% of coliving operators fail within 24 months.',
          'Behind this graveyard, however, demand keeps growing. There are 35-40 million full-time digital nomads worldwide (72M including part-timers), the digital nomad tourism market is moving from $89.7B (2025) to $243.6B (2034), and coliving is growing at a 27% CAGR toward $42B by 2030. Supply contracted precisely as demand accelerated — this is the window.',
          "Selina's collapse does not invalidate the thesis. It invalidates Selina's execution: SPAC merger at the wrong moment, asset-light leaseback on 100+ locations without proven unit economics, mass-market backpacker positioning on a premium cost base, community used as marketing rather than as the product. All systemic errors, all avoidable.",
          'A clear white space exists: the "mid-luxury + slow/long-stay + multi-location membership" quadrant has no incumbents. Outsite is premium-mass ($199/year + low room rate). Habitas (Ennismore/Accor) is short-stay experiential resort at premium-upscale tier, concentrated in the Middle East, Latin America, and Southeast Asia — zero Europe, and with no real multi-country membership network. Soho House is urban. No one today serves the intermediate segment: premium nomad, part-time resident, willing to pay $2-5K/year in membership plus a premium stay for continuity across high-standard coastal locations.',
        ],
        callout: {
          title: 'Preliminary verdict',
          text: 'The model is feasible. The timing is favorable. A defensible positioning exists. Three conditions apply: (1) asset-heavy capital structure with local JVs, no leaseback; (2) premium pricing with membership at $2-5K/year; (3) surgical roll-out — 3 locations in the first 36 months, not 10. Main risk — Our Habitas / Ennismore (Accor) — reclassified after the May 2026 deep dive (Appendix A) as lateral, not frontal: they sell short-stay experiential resorts, not long-stay residence-community, and over the next 24-36 months they have not announced anything in our European Atlantic / Mediterranean coastal geography. The strategic window is open.',
        },
      },
      {
        n: '2',
        h: 'The Selina case — What stopped working',
        body: [
          'For a decade Selina was the face of the "live and work anywhere" promise. Founded in 2014/2015 by Rafael Museri and Daniel Rudasevski as a repositioning of distressed Latin American hotels into cool spaces for the millennial backpacker segment, it grew to over 100 locations in 25 countries before going public on Nasdaq via SPAC with BOA Acquisition Corp in October 2022 at a $1.2 billion valuation. On July 22, 2024 it declared insolvency. Five weeks later, Collective Hospitality (Singapore) bought its assets and repositioned the brand as a "hostel brand focused on young travelers" — effectively a definitive downgrade from the lifestyle segment.',
        ],
        subhead: 'The numbers of the collapse',
        table: {
          headers: ['Metric', 'Value'],
          rows: [
            ['SPAC IPO valuation (Oct 2022)', '$1.2 billion'],
            ['Revenue 2022', '$184 million'],
            ['Loss 2022', '$200 million (109% of revenue)'],
            ['Accumulated deficit end-2022', '$725 million'],
            ['Total debt at collapse', '$550M+'],
            ['Triggering default (Jul 15, 2024)', '$50M IDB Invest loan + $455K of unpaid interest'],
            ['Outcome August 2024', 'Assets sold to Collective Hospitality (Singapore)'],
          ],
        },
        subhead2: 'Five structural causes',
        list: [
          'SPAC merger at the wrong timing. The IPO arrived in October 2022, the peak of the global rate-hike cycle. The deal structure included short-term debt that became unpayable as interest payments grew.',
          'Overexpansion without proven unit economics. 100+ locations opened before any single one had been shown to be profitable at steady-state. When post-COVID occupancy didn\'t hold, every location added losses.',
          'Asset-light leaseback on distressed buildings. The original pitch was "we buy distressed hotels and transform them." But the contracts were long leases, not purchases. When occupancy dropped, the leases stayed — becoming massive liabilities.',
          'Community as marketing, not as product. The Mapmelon analysis is clear: Selina invested far more in aspirational branding than in building real per-location communities. The result: the product commodified as "cool hostel," with low retention and stagnant ARPU.',
          'Mass-market positioning on a premium cost base. Backpacker pricing with boutique-hotel costs — the math never closed. Operating margins under 20% in a sector where 25%+ steady-state is required to service the debt.',
        ],
        callout: {
          title: 'Fundamental lesson',
          text: 'Selina did not die because the digital nomad doesn\'t exist. It died because it tried to scale globally a product that requires niche economics, asset-heavy structure, and a premium-priced community. The "global Idea Factory" model behind Nuovi Mondi is structurally different from Selina — but only if the three rules derived from this case study (right capital structure, premium pricing, disciplined roll-out) are honored from day one.',
        },
      },
      {
        n: '3',
        h: 'The coliving graveyard 2023-2024',
        body: [
          'Selina is the most visible case but not the only one. 2024 saw forced consolidations and clean shutdowns across the sector. The pattern is consistent: operators that grew during the 2020-2021 QE era ended up stranded in the rate cycle.',
        ],
        table: {
          headers: ['Player', 'Status 2024', 'Model', 'Outcome'],
          rows: [
            ['Selina', 'Insolvent Jul-2024', 'Asset-light, leaseback, 100+ loc.', 'Assets sold to Collective Hospitality'],
            ['Common Living', 'Ceased Jun-2024', 'Urban coliving USA', 'Acquired by Habyt in 2023, shut down the year after'],
            ['Remote Year', 'Shutdown 2024', 'Membership + travel program', 'Travel-agency model, not scalable'],
            ['Quarters', 'Closed', 'Urban coliving DE/USA', 'Liquidated'],
            ['Hubhaus', 'Closed', 'USA urban coliving', 'Liquidated'],
            ['Starcity', 'Absorbed into Common, then closed', 'Single-site USA', 'Eliminated'],
          ],
        },
        bodyAfter: [
          'Industry stat (Everything Coliving 2025): over 60% of coliving operators fail within the first 24 months. To be triangulated against a Cushman/CBRE report before quoting to an investor, but the signal is clear: the execution barrier is very high — and that itself is a defensible moat for anyone entering now with discipline.',
        ],
      },
      {
        n: '4',
        h: "Who's left standing — Competitor map",
        body: [
          'Three distinct clusters survive: the premium-mass nomad pass (Outsite, Outpost, Nomadico), the urban lifestyle members club (Soho House), and the experiential lifestyle resort at premium-upscale tier (Our Habitas) and true luxury (Six Senses, Aman). Between these three clusters there is a structural void — this is where Nuovi Mondi belongs.',
        ],
        subhead: 'Comparison table — surviving players',
        table: {
          headers: ['Brand', 'Positioning', 'Network', 'Pricing'],
          rows: [
            ['Outsite', 'Premium-mass nomad pass', '~50 locations, 9 countries, 5K members', 'Membership $199/year or $499 lifetime; stays $50-200/night'],
            ['Outpost', 'Tropical boutique coliving', '3 locations (Bali Ubud, Canggu, Cambodia)', '$945/4 weeks, $2,552/12 weeks'],
            ['Sun and Co.', 'Artisanal single-site', '1 location (Jávea, Spain)', '$900-1,100/month'],
            ['Nomadico', 'Europe multi-location coliving', 'Multi-location Europe', 'Stay + hybrid membership'],
            ['NomadX', 'Community-driven coastal', 'Pipa, Madeira, Lisbon, Porto, Rio, Próspera, Cabo Verde', 'Stay + community events'],
            ['Habyt (post-merger Common)', 'Urban coliving residential', '30K+ urban units globally', 'Long-term rent'],
            ['Collective Hospitality (ex-Selina)', 'Cool hostel for young travelers', '100+ ex-Selina locations', 'Budget — repositioned down-market'],
            ['Our Habitas (Ennismore/Accor)', 'Premium-upscale experiential resort (not true luxury)', '~10 operating resorts + ~12-14 in pipeline. Middle East, Latin America, Southeast Asia. Zero in Europe', 'Tulum ADR ~$244 avg (range $142-326). Membership $2,200/year, US urban only (NYC/LA/Hudson)'],
            ['Soho House', 'Urban lifestyle members club', '40+ houses + Cities Without Houses (80+ cities)', 'Membership $3-5K/year + room rates'],
            ['Six Senses Residences', 'Wellness branded residences', 'Growing (Antognolla Umbria + others)', 'Unit sales $1M+ with hospitality services'],
          ],
        },
        subhead2: 'Positioning: where Nuovi Mondi lands',
        bodyAfter: [
          'Mapping the players on two axes — price/quality (horizontal) and customer rootedness (vertical) — an empty quadrant emerges. Outsite, Outpost, and Selina occupy the "nomadic + entry/mid" quadrant. Habyt and the urban coliving operators occupy "rooted + mid." Habitas sits in "short-stay premium experiential resort" (3-7 day stays, Tulum ADR ~$244 average) while Six Senses and Castello di Reschio occupy "rooted + true luxury." The "hybrid-rooted + mid-luxury + long-stay community-first" quadrant — where the same guest is a nomad for 3 months today and a part-time resident tomorrow, inside a continuous network of homes — has no dedicated incumbents. It\'s the adjacent product to Habitas, not a substitute.',
        ],
        callout: {
          title: 'Positioning insight',
          text: 'For investors, the pitch is not "let\'s redo Selina better." It\'s "Soho House for the 35 million global digital nomads who have stopped wanting hostels and want a home." The relevant comparable valuation is Soho House Inc. (NYSE: SHCO) and Habitas (private) — not pre-crash Selina.',
        },
      },
      {
        n: '5',
        h: 'The underlying market',
        body: [
          'Demand is solid and accelerating. The "digital nomad was a post-COVID bubble" narrative doesn\'t hold against 2025-2026 data: the population has doubled in five years, the segment is segmenting (pure nomads vs slow/long-stay), and willingness to spend on curated residential experiences grows with segment maturity.',
        ],
        subhead: 'Population sizing',
        list: [
          '35-40 million full-time digital nomads globally (2025-2026).',
          '72 million location-independent workers including part-timers.',
          '18.5 million in the United States alone (12% of the workforce, +153% since 2019, source MBO Partners).',
        ],
        subhead2: 'Market sizing',
        list2: [
          'Digital nomad tourism: $89.7B in 2025, projected $243.6B by 2034 (CAGR 11.7%).',
          'Digital nomad services: $35B in 2024, projected $100B by 2032 (CAGR 20%).',
          'Coliving market: $12.8B today, projected $42B by 2030 (27% CAGR per Coliving.com).',
        ],
        subhead3: 'Emerging consumption pattern',
        bodyAfter: [
          'The most relevant trend is the transition from "pure nomad changing country every month" to "slow nomad / long-stay part-time resident." Exactly the hybrid segment the Nuovi Mondi thesis is built to capture. Willingness to pay follows: Outsite has 5K members at $199/year; Soho House has over 250K members at $3-5K/year. The $1-3K/year positioning gap — premium community without urban exclusivity — is uncovered today.',
        ],
        subhead4: 'Sector unit economics',
        list3: [
          'Average ROI 22.3% for coliving (asset-heavy) vs 8-12% for traditional rentals.',
          'Break-even occupancy: 85%. Structurally profitable only above 90%.',
          'Ancillary revenue (F&B, events, parking, storage): +8-12% on base revenue.',
          '2025 trend confirmed: asset-heavy (ownership or JV) is becoming dominant again. Asset-light leaseback is precisely the model that killed Selina and Common.',
        ],
      },
      {
        n: '6',
        h: 'Preliminary validation of the first three cities',
        body: [
          "Three starting cities have been pre-selected based on geographic affinity with Angelo's existing network, international flight accessibility, and an active digital nomad visa.",
        ],
        table: {
          headers: ['City', 'Pros', 'Cons', 'Saturation'],
          rows: [
            ['Tamarindo, Costa Rica', 'DNV $3K/month income, income-tax exempt. Mid-range cost of living. Existing but small nomad community. EXISTING GEOGRAPHIC HUB for Angelo (15Love, Autogyro, Casa Idea).', 'Only 2 active coworking spaces (Sand & Surf, In the Shade). High seasonality (Dec-Apr high, May-Nov low). Small local market.', 'Low — white space available, asymmetric advantage'],
            ['Málaga, Spain', 'Spain DNV €2,160/month, 5-year validity. #1 expat city worldwide 2023 (Internations), #2 in 2024. "Silicon Valley Costa del Sol." 320 days of sun. Avg fiber 197 Mbps.', 'Coliving already abundant (€500-1,200/month). Real estate acquisition costs rising fast. Direct competition from budget coliving.', 'Medium-high — mid-luxury positioning still open if well differentiated'],
            ['Lisbon/Cascais, Portugal', 'Portugal DNV active (€3,480/month income, 1-year renewable). Cascais is already the Atlantic digital-nomad capital. Real estate still accessible vs central Lisbon. Direct international flights from Lisbon. Mature expat community, zero Habitas/Ennismore coastal presence announced in PT.', 'Real estate in Cascais and Estoril rising fast (+30% over three years). Personal tax (NHR regime) reformed in 2024. Budget coliving competition already present in central Lisbon (to be differentiated with coastal mid-luxury positioning).', 'Low-medium — dense market but residential-community positioning still uncovered. White space confirmed vs Habitas/Ennismore'],
          ],
        },
        callout: {
          title: 'Operating implication',
          text: 'Tamarindo is the natural lighthouse location: low saturation, pre-existing network advantage, manageable entry costs. Málaga is the scale proof on a dense and regulated market. Lisbon/Cascais (revised post Habitas deep dive, May 2026, replacing Bali) is the consolidation on the European Atlantic axis: solid DNV, mature nomad community, and geography uncovered by Habitas/Ennismore for at least 24-36 months. The fourth location should be decided only after at least two of the three lighthouses have closed 24 months above 90% occupancy. The remaining 7 cities are to be presented as a five-year vision, not a three-year plan.',
        },
        subhead: 'Gap: 10-city long-list',
        bodyAfter: [
          'Detailed data is missing for the remaining 7 cities. Logical candidates to validate in the next round, revised post Habitas deep dive (Appendix A) to prioritize geographies uncovered by the main competitor — Atlantic Europe and coastal Mediterranean in pole position, Southeast Asia and Mexican Pacific excluded due to frontal collision:',
        ],
        list: [
          'Madeira (Funchal or Ponta do Sol) — Portugal, low cost, NomadX already present',
          'Lisbon/Cascais or Algarve (Lagos) — Portugal, DNV active',
          'Algarve (Sagres, Lagos, Vilamoura) — Portugal, surf coast, zero premium-membership competitor announced',
          'Cape Town — South Africa, low costs, decent infrastructure',
          'Limassol — Cyprus, DNV active, favorable taxation',
          'Taghazout or Essaouira — Morocco, coastal, emerging infrastructure',
          'Mauritius — DNV active, natural premium positioning',
          'Ko Pha-ngan or southern Phuket — Thailand, low cost, DTV visa',
          'Mandrem (Goa) — India, low cost, existing community',
          'Roatán — Honduras, Caribbean coast, low entry cost',
        ],
      },
      {
        n: '7',
        h: 'Financial model direction',
        body: [
          'The three rules derived directly from the Selina case study become the construction principles of the Nuovi Mondi model.',
        ],
        subhead: 'Rule 1 — Asset-heavy, not leaseback',
        para1:
          "Joint ventures with local landowners or developers (30-50% equity), not master leases on others' buildings. The descent of Selina and Common showed that leasing on repositioned buildings is suicide in a high-rate cycle. Target model inspired by Six Senses Residences (unit sales + management fee with hospitality services) or equity JVs with local family offices. It reduces initial capex, aligns incentives, and offloads part of the risk to local partners.",
        subhead2: 'Rule 2 — Multi-revenue stream',
        list: [
          'Annual membership: target $2-5K/year, positioning "Soho House for premium nomads."',
          'Stay revenue: $200-400/night for premium nights, discounts for long-stay and members.',
          'Branded residences: unit sales with a managed program. Habitas/Six Senses playbook applied to the mid-luxury positioning.',
          'F&B and wellness: high margins, differentiation lever, retention vehicle.',
          'Events and programming: community is the product, therefore also a revenue line (workshops, retreats, curator-led residencies).',
        ],
        subhead3: 'Rule 3 — Surgical roll-out, not scale-out',
        para3:
          'Max 3 locations in the first 36 months, each proven at steady-state before opening the fourth. Selina had 100+ locations open without a single one proven profitable. The 10-city plan should be presented as a five-year vision (years 5-7), not as an aggressive three-year plan. The informed investor who watched Selina fall appreciates the pacing.',
        subhead4: 'Indicative capex per typical location',
        para4:
          "A credible mid-luxury coastal location (40-60 units, signed design, common area, F&B, spa, community-led programming) requires, as a first approximation, $5-15M between land acquisition/JV, renovation, and working capital. The figure should be validated against a specific property with a developer — it's an order-of-magnitude estimate, not a pitch number. On a 10-location plan, total commitment is in the $50-150M range — hospitality fund and family office syndicate territory, not Series A startup.",
        callout: {
          title: 'Capital structure implication',
          text: "The structure is not venture capital. It's real-estate / hospitality private equity with a 7-10 year horizon, with possible LP family offices + small sovereign wealth allocations, integrated with branded residences sales as pre-equity for locations 2 and 3. No SPAC. No short-term debt. The pitch to investors must explicitly differentiate the capital structure from Selina's approach.",
        },
      },
      {
        n: '8',
        h: 'Preliminary feasibility verdict',
        body: [
          'The model is feasible. The timing is favorable — competitive supply contracted in 2024 precisely as demand accelerated. The positioning is defensible: the mid-luxury + slow/long-stay + multi-location membership quadrant is not seriously occupied today. There are five conditions for execution.',
        ],
        ol: [
          'Asset-heavy capital structure with local JVs, not leaseback. Equity or quasi-equity from family offices or hospitality funds with a 7-10 year horizon. No SPAC, no short-term debt, no operating leases as the primary asset.',
          'Premium pricing with membership at minimum $2-5K/year. Explicit positioning as "Soho House for coastal lifestyle," not "Selina with better service."',
          'Local asset partners in every city. A JV with a developer or property owner reduces initial capex, reduces regulatory friction, and aligns incentives.',
          'Community as product, not as marketing. Weekly programming, residence chef, cultural curator, retention metrics tracked from month one. This is exactly where Selina got it wrong.',
          'Disciplined sequence. Tamarindo as lighthouse location, Málaga as scale proof, third location decided only after the first two have closed 24 months above 90% occupancy.',
        ],
        subhead: 'Main risk identified',
        bodyAfter: [
          'Our Habitas / Ennismore (Accor Group) is the player to watch. The May 2026 deep dive (Appendix A) reclassified the risk from frontal to lateral. Three pieces of evidence: (a) their pricing is ADR ~$244 average at Tulum, premium-upscale and not true luxury, and the $2,200/year membership is US urban only with no multi-city resort network; (b) their DNA is short-stay experiential resort, not long-stay residence-community — adjacent products, not substitutes; (c) their ~22-24 operating+pipeline properties are concentrated in the Middle East, Latin America, and Southeast Asia, with zero European presence, and the entire Ennismore group (Mondrian, Hyde, Rixos, SLS, 25hours, Delano) has announced no European coastal residential. The capital advantage (Saudi PIF + Starwood + Accor at €2B+ valuation) remains — but in geographies and segments different from ours. Operational vigilance: quarterly review of Ennismore press releases to catch new European coastal/residential announcements; if that signal arrives, accelerate the Tamarindo pilot + European lighthouse before the window closes.',
        ],
      },
      {
        n: '9',
        h: 'Proposed next steps',
        body: [
          'This is the first market and feasibility analysis. The five natural next steps, in order, are:',
        ],
        ol: [
          '[COMPLETED — May 2026] Our Habitas / Ennismore deep dive. Summary in Appendix A. Inventory of 22-24 operating+pipeline properties, real ADR ~$244 pricing, capital stack at €2B+ valuation, 2025-2027 geography confirmed Middle East / Americas / Southeast Asia — zero Europe. Risk reclassified to lateral. 10-city long-list and first three lighthouses updated accordingly in this document.',
          'Financial model for a typical location. CapEx for a 40-60 unit coastal location, year 1-5 P&L base/bull/bear, sensitivity on occupancy and ADR, IRR for LPs.',
          '10-city long-list with explicit scoring criteria. DNV regulatory, RE costs, international flight infrastructure, existing community, climate stability, Our Habitas overlap.',
          'Investor narrative. 10-15 slides with the "Soho House meets digital nomad" framing and the differential vs Selina made explicit from slide 2 onward.',
          'Tamarindo pilot. Verify whether a candidate property exists on the Tamarindo or Playa Grande coast where the model can be tested via JV with a local owner — leveraging the 15Love and Casa Idea network.',
        ],
      },
      {
        n: 'A',
        h: 'Appendix A — Competitive Intelligence Update (May 2026): Habitas Deep Dive Summary',
        thesis:
          'Updated May 26, 2026. Operational summary of an autonomous 7-section deep dive that reconstructed Our Habitas / Ennismore (Accor) across five fronts: operating locations, branded residences, real pricing tier, capital stack, 2025-2027 roadmap.',
        subhead: 'Five key findings',
        list: [
          'Real inventory: 10 operating properties (Tulum, Bacalar, Atacama, Santa Teresa CR, AlUla, Caravan AlUla, Ras Abrouq, Caravan Agafay, Caravan Dakhla, Namibia) + 12-14 in confirmed pipeline. Total ~22-24, not 45+/20 countries — that number is the Ennismore-wide branded residences total. Zero Habitas properties in Europe.',
          'Real pricing tier: Habitas Tulum ADR ~$244 average, range $142-326. Premium upper-upscale, not true luxury. Membership $2,200/year US urban only (NYC firehouse + LA Venice + Hudson Valley), zero multi-country resort network.',
          'Branded residences: the "Our Habitas Residences" concept was announced in May 2025, but no specific location has been publicly named as of May 26, 2026. The 45+ Ennismore-wide residences are concentrated in Dubai, Madrid, Istanbul, Miami, Palm Jumeirah — urban, not coastal-residential, no Portugal or coastal Italy.',
          'Capital stack: Habitas raised $71.5M pre-Ennismore (Saudi sovereign PIF + Starwood Capital + others). June 2024 Ennismore integration. Ennismore = Accor 62.2% + Pasricha + Qatari consortium 10.8% (valuation €2B+, deal €185M). Deep and patient capital — not vulnerable to the Selina mechanism.',
          'Roadmap 2025-2027: Habitas concentrated in Middle East + Americas + (incoming) Southeast Asia. Ennismore wider opens Delano London 2026, Mama Shelter Lake Como 2026, LUURA Paros 2027 — but in urban hotel / resort format, not coastal residential. Atlantic Europe and coastal Mediterranean residential is uncovered for at least 24-36 months.',
        ],
        callout: {
          title: 'Three operational recommendations',
          text: '1. Cities to avoid. Tulum (Habitas brand cradle), Bali Canggu/Uluwatu/Bingin, Todos Santos/Sayulita Baja Pacific, AlUla/Middle East. Alternatives: Puerto Escondido Oaxaca, Lombok/Gili, Ko Pha-ngan/Sri Lanka south coast. 2. Segments to go after. Atlantic Europe and coastal Mediterranean residential is the true white space. Priority long-list: Málaga + Costa del Sol, Lisbon/Cascais/Estoril, Algarve, Madeira, non-Paros Cyclades. Establish 1-2 European lighthouses within 18 months, before Ennismore arrives. 3. Differentiation narrative. "Habitas sells short-stay experiential resorts under Accor. Nuovi Mondi sells part-time multi-country residence-community. They are adjacent products, not substitutes."',
        },
        bodyAfter: [
          'Residual risk + vigilance. If Ennismore launches a Habitas Residences in Cascais, Madeira, or Costa del Sol, it hits our value prop directly on the markets we want to own. Indicators to monitor every 6 months: Ennismore "branded residences" press releases in new European countries; announcements of new Habitas properties in Europe (zero today); Accor M&A on residence-community brands; Ennismore IPO timing.',
        ],
      },
    ],
    sourcesTitle: 'Main sources',
    sources: [
      'Selina collapse: Skift (July 2024), Hospitality Investor, Mapmelon, Colombia One.',
      'Coliving market and unit economics: Everything Coliving, Coliving.com, Coliving Insights.',
      'Digital nomad market: MBO Partners State of Independence 2025, Nomads.com 2026 Stats, Dataintelo Tourism Report.',
      'Competitors: Outsite.co, Outpost destinationoutpost.co, Sun and Co. sun-and-co.com, Habyt corporate, Our Habitas Ennismore/Accor announcement. For Appendix A: ourhabitas.com, Ennismore press releases (Jun 2024, May 2025, Jan 2026), Skift, Hospitality Net, Bloomberg, CoStar, PitchBook, Crunchbase (consulted May 26, 2026).',
      'Target cities: GuideToMalaga, Citizen Remote (Costa Rica DNV), Bali E33G Visa (BaliVisa.co).',
    ],
  },
  it: {
    switchLabel: 'EN',
    eyebrow: '1000 FEET INC. / STRATEGIA',
    title: 'Nuovi Mondi',
    subtitle: 'Coliving Membership Costiero — Analisi Mercato e Fattibilità',
    intro:
      'Prima analisi di mercato sul modello di rete di community coliving e long-stay in 10 città costiere. Confronto con il fallimento di Selina Hospitality (2024), mappatura dei competitor sopravvissuti, validazione di Tamarindo, Malaga e Bali come prime location, e verdetto preliminare di fattibilità.',
    meta: 'Documento preliminare — uso interno e prime conversazioni con investitori di fiducia.',
    byline: 'Roma, 26 maggio 2026 · Angelo Magni · bastoparty@gmail.com',
    sections: [
      {
        n: '1',
        h: 'Executive Summary',
        thesis:
          'Tesi in una frase: il mercato vuole oggi quello che Selina prometteva nel 2018, ma con economics da hospitality premium e community come prodotto — non come marketing.',
        body: [
          'Selina Hospitality è collassata in insolvenza nel luglio 2024 dopo aver bruciato $725M di deficit accumulato e $550M+ di debito, perdendo quasi tutta la valutazione da $1,2 miliardi del SPAC del 2022. La caduta non è stata isolata: nello stesso anno hanno chiuso anche Common Living, Remote Year, Quarters e Hubhaus. Statistica trasversale: oltre il 60% dei coliving operator fallisce entro 24 mesi.',
          "Dietro questo cimitero, però, la domanda continua a crescere. Ci sono 35-40 milioni di digital nomad full-time nel mondo (72M se si includono i part-time), il mercato digital nomad tourism passa da $89,7B (2025) a $243,6B (2034), e il coliving cresce a un CAGR del 27% verso $42B entro il 2030. L'offerta si è contratta proprio mentre la domanda accelera — questa è la finestra.",
          'Il fallimento di Selina non smentisce la tesi. Smentisce la sua esecuzione: SPAC merger nel momento sbagliato, asset-light leaseback su 100+ location senza unit economics provate, posizionamento mass-market backpacker con cost base premium, community usata come marketing invece che come prodotto. Tutti errori sistemici evitabili.',
          'Esiste un white space chiaro: il quadrante "mid-luxury + slow/long-stay + multi-location membership" non ha occupanti. Outsite è premium-mass ($199/anno + room rate basso). Habitas è luxury vero. Soho House è urbano. Nessuno serve oggi il segmento intermedio: nomade premium, residente part-time, willingness to pay $2-5K/anno di membership più stay premium per continuità tra location costiere di standard alto.',
        ],
        callout: {
          title: 'Verdetto preliminare',
          text: 'Il modello è fattibile. Il timing è favorevole. Esiste un posizionamento difendibile. Le condizioni sono tre: (1) capital structure asset-heavy con JV locali, niente leaseback; (2) pricing premium con membership $2-5K/anno; (3) roll-out chirurgico — 3 location nei primi 36 mesi, non 10. Rischio principale identificato: Our Habitas / Ennismore (Accor Group) che ha appena lanciato un programma residential 45+ progetti in 20 paesi e potrebbe scendere di tier.',
        },
      },
      {
        n: '2',
        h: 'Il caso Selina — Cosa ha smesso di funzionare',
        body: [
          'Selina è stata per un decennio il volto della promessa "vivi e lavora ovunque". Fondata nel 2014/2015 da Rafael Museri e Daniel Rudasevski come riconversione di hotel distressed in Latin America in spazi cool per il segmento millennial backpacker, è cresciuta fino a oltre 100 location in 25 paesi prima di andare in Nasdaq via SPAC con BOA Acquisition Corp nell\'ottobre 2022 a una valutazione di $1,2 miliardi. Il 22 luglio 2024 ha dichiarato insolvenza. Cinque settimane dopo, Collective Hospitality (Singapore) ne ha acquistato gli asset riposizionandola come "hostel brand focused on young travelers" — di fatto un downgrade definitivo dal segmento lifestyle.',
        ],
        subhead: 'I numeri del crollo',
        table: {
          headers: ['Metrica', 'Valore'],
          rows: [
            ['Valutazione SPAC IPO (ott 2022)', '$1,2 miliardi'],
            ['Revenue 2022', '$184 milioni'],
            ['Loss 2022', '$200 milioni (109% del revenue)'],
            ['Deficit accumulato fine 2022', '$725 milioni'],
            ['Debito totale al collasso', '$550M+'],
            ['Default scatenante (15 lug 2024)', 'Loan $50M IDB Invest + $455K interessi non pagati'],
            ['Esito agosto 2024', 'Asset venduti a Collective Hospitality (Singapore)'],
          ],
        },
        subhead2: 'Cinque cause strutturali',
        list: [
          "SPAC merger nel timing sbagliato. L'IPO è arrivato a ottobre 2022, picco del rialzo tassi globali. La struttura del deal prevedeva debito a breve termine che è diventato impagabile man mano che gli interest payment crescevano.",
          "Overexpansion senza unit economics. 100+ location aperte prima di aver dimostrato che una singola location era profittevole a steady-state. Quando l'occupancy non ha tenuto post-COVID, ogni location aggiungeva perdita.",
          'Asset-light leaseback su edifici distressed. La pitch originale era "compriamo hotel distressed e li trasformiamo". Ma i contratti erano lease lunghi, non acquisti. Quando l\'occupancy è scesa, i lease sono rimasti — diventando passività enormi.',
          "Community come marketing, non come prodotto. L'analisi Mapmelon è netta: Selina ha investito molto più in branding aspirational che in costruzione di community vere a livello di singola location. Risultato: il prodotto si è commodificato come \"ostello cool\", retention bassa, ARPU stagnante.",
          'Posizionamento mass-market con cost base premium. Backpacker pricing con costi da boutique hotel — la matematica non chiudeva mai. Margini operativi sotto il 20% in un settore dove serve 25%+ steady-state per coprire il debito.',
        ],
        callout: {
          title: 'Lezione fondamentale',
          text: 'Selina non è morta perché il digital nomad non esiste. È morta perché ha provato a fare a scala globale un prodotto che richiede economia di nicchia, asset-heavy e community premium-priced. Il modello che abbiamo in mente è strutturalmente diverso da Selina — ma solo se le tre regole derivate da questo case study (capital structure giusta, pricing premium, roll-out disciplinato) vengono rispettate dal giorno uno.',
        },
      },
      {
        n: '3',
        h: 'Il cimitero del coliving 2023-2024',
        body: [
          'Selina è il caso più visibile ma non è solo. Il 2024 ha visto consolidamenti forzati e chiusure pulite in tutto il settore. Il pattern è coerente: operatori cresciuti durante il QE 2020-2021 sono finiti incagliati nel ciclo dei tassi.',
        ],
        table: {
          headers: ['Player', 'Status 2024', 'Modello', 'Esito'],
          rows: [
            ['Selina', 'Insolvent lug-2024', 'Asset-light, leaseback, 100+ loc', 'Asset venduti a Collective Hospitality'],
            ['Common Living', 'Cessate operazioni giu-2024', 'Urban coliving USA', "Acquisita da Habyt nel 2023, chiusa l'anno dopo"],
            ['Remote Year', 'Shutdown 2024', 'Membership + travel program', 'Modello agenzia viaggi non scalabile'],
            ['Quarters', 'Chiuso', 'Urban coliving DE/USA', 'Liquidato'],
            ['Hubhaus', 'Chiuso', 'USA urban coliving', 'Liquidato'],
            ['Starcity', 'Assorbita in Common, poi chiusa', 'Single-site USA', 'Eliminata'],
          ],
        },
        bodyAfter: [
          'Statistica trasversale (Everything Coliving 2025): oltre il 60% dei coliving operator fallisce nei primi 24 mesi. Da triangolare con un report Cushman/CBRE prima di citarla a un investitore, ma il segnale è chiaro: la barriera all\'esecuzione è altissima, e questo è di per sé un vantaggio difendibile per chi entra ora con disciplina.',
        ],
      },
      {
        n: '4',
        h: 'Chi è rimasto vivo — Mappa competitor',
        body: [
          "Sopravvivono tre cluster distinti: il nomad pass premium-mass (Outsite, Outpost, Nomadico), il members club lifestyle urbano (Soho House), e il branded residential luxury experiential (Our Habitas, Six Senses, Aman). Tra questi tre cluster c'è un vuoto strutturale — è dove va posizionata Nuovi Mondi.",
        ],
        subhead: 'Tabella comparativa player vivi',
        table: {
          headers: ['Brand', 'Posizionamento', 'Network', 'Pricing'],
          rows: [
            ['Outsite', 'Premium-mass nomad pass', '~50 location, 9 paesi, 5K membri', 'Membership $199/anno o $499 lifetime; stays $50-200/notte'],
            ['Outpost', 'Coliving boutique tropicale', '3 location (Bali Ubud, Canggu, Cambogia)', '$945/4 settimane, $2.552/12 settimane'],
            ['Sun and Co.', 'Artigianale single-site', '1 location (Jávea, Spagna)', '$900-1.100/mese'],
            ['Nomadico', 'Coliving Europa multi-location', 'Multi-location Europa', 'Stay + membership ibrida'],
            ['NomadX', 'Community-driven coastal', 'Pipa, Madeira, Lisbon, Porto, Rio, Próspera, Cabo Verde', 'Stay + community events'],
            ['Habyt (post-merger Common)', 'Urban coliving residential', '30K+ unità urbane globali', 'Long-term rent'],
            ['Collective Hospitality (ex-Selina)', 'Hostel cool young travelers', '100+ location ex-Selina', 'Budget — riposizionata down-market'],
            ['Our Habitas (Ennismore/Accor)', 'Luxury experiential resort', '10+ resort + 45+ branded residences in 20 paesi', '$500+/notte stay + vendita residences'],
            ['Soho House', 'Members club urbano lifestyle', '40+ houses + Cities Without Houses (80+ città)', 'Membership $3-5K/anno + room rates'],
            ['Six Senses Residences', 'Branded residences wellness', 'Crescente (Antognolla Umbria + altri)', 'Vendita unit $1M+ con servizi hospitality'],
          ],
        },
        subhead2: 'Posizionamento: dove cade Nuovi Mondi',
        bodyAfter: [
          'Mappando i player su due assi — price/quality (orizzontale) e stanzialità del cliente (verticale) — emerge un quadrante vuoto. Outsite, Outpost e Selina occupano il quadrante "nomadico + entry/mid". Habyt e i coliving urbani occupano "stanziale + mid". Habitas, Six Senses, Castello di Reschio occupano "stanziale + luxury". Il quadrante "stanziale-ibrido + mid-luxury" — dove uno stesso ospite oggi è nomade per 3 mesi e domani residente part-time — non ha occupanti dedicati.',
        ],
        callout: {
          title: 'Insight di posizionamento',
          text: 'Per gli investitori, la pitch non è "rifacciamo Selina meglio". È "Soho House per i 35 milioni di digital nomad globali che hanno smesso di volere ostelli e vogliono casa". Il riferimento di valutazione comparabile è Soho House Inc. (NYSE: SHCO) e Habitas (privata), non la Selina pre-crash.',
        },
      },
      {
        n: '5',
        h: 'Il mercato sottostante',
        body: [
          'La domanda è solida e in accelerazione. La narrativa "il digital nomad era una bolla post-COVID" non regge ai dati 2025-2026: la popolazione è raddoppiata in cinque anni, il segmento si sta segmentando (nomadi puri vs slow/long-stay) e la disponibilità a spendere su esperienze residenziali curate cresce con la maturità del segmento.',
        ],
        subhead: 'Dimensioni della popolazione',
        list: [
          '35-40 milioni di digital nomad full-time globali (2025-2026).',
          '72 milioni di location-independent worker se si includono i part-time.',
          '18,5 milioni solo negli Stati Uniti (12% della workforce, +153% dal 2019, fonte MBO Partners).',
        ],
        subhead2: 'Dimensioni del mercato',
        list2: [
          'Digital nomad tourism: $89,7B nel 2025, proiezione $243,6B entro il 2034 (CAGR 11,7%).',
          'Digital nomad services: $35B nel 2024, proiezione $100B entro il 2032 (CAGR 20%).',
          'Coliving market: $12,8B oggi, proiezione $42B entro il 2030 (CAGR 27% secondo Coliving.com).',
        ],
        subhead3: 'Pattern di consumo emergente',
        bodyAfter: [
          'Il trend più rilevante è la transizione dal "nomade puro che cambia paese ogni mese" al "slow nomad / long-stay residente part-time". Cioè proprio il segmento ibrido che la tesi Nuovi Mondi vuole cogliere. La willingness to pay segue: Outsite ha 5K membri a $199/anno; Soho House ha oltre 250K membri a $3-5K/anno. Il gap di posizionamento $1-3K/anno — community premium senza esclusività urbana — è oggi scoperto.',
        ],
        subhead4: 'Unit economics di settore',
        list3: [
          'ROI medio 22,3% per il coliving (asset-heavy) vs 8-12% per affitti tradizionali.',
          'Break-even occupancy: 85%. Profittevole strutturalmente solo sopra il 90%.',
          'Ancillary revenue (F&B, eventi, parking, storage): +8-12% sui ricavi base.',
          'Trend 2025 confermato: asset-heavy (ownership o JV) sta tornando dominante. Asset-light leaseback è proprio il modello che ha ucciso Selina e Common.',
        ],
      },
      {
        n: '6',
        h: 'Validazione preliminare delle prime tre città',
        body: [
          'Tre città di partenza sono state pre-selezionate sulla base di affinità geografica con il network esistente di Angelo, accessibilità via aereo internazionale, e presenza di una digital nomad visa attiva.',
        ],
        table: {
          headers: ['Città', 'Pro', 'Contro', 'Saturazione'],
          rows: [
            ['Tamarindo, Costa Rica', 'DNV $3K/mese reddito, esente income tax. Costo vita medio. Community nomadica esistente ma piccola. HUB GEOGRAFICO ESISTENTE per Angelo (15Love, Autogyro, Casa Idea).', 'Solo 2 coworking attivi (Sand & Surf, In the Shade). Alta stagionalità (dic-apr alta, mag-nov bassa). Mercato locale piccolo.', 'Bassa — white space disponibile, vantaggio asimmetrico'],
            ['Malaga, Spagna', 'Spain DNV €2.160/mese, valida 5 anni. #1 expat city al mondo 2023 (Internations), #2 nel 2024. "Silicon Valley Costa del Sol". 320 giorni di sole. Fiber 197 Mbps media.', 'Coliving già abbondante (€500-1.200/mese). Costi acquisizione real estate in salita rapida. Concorrenza diretta dei coliving budget.', 'Media-alta — posizionamento mid-luxury ancora aperto se ben differenziato'],
            ['Bali (Canggu/Ubud), Indonesia', 'Visa E33G (1 anno, $60K/anno income). Coliving market più maturo al mondo. Costo operativo basso.', 'Saturazione altissima (Outpost dominante + decine di alternative). "Bali fatigue" tra nomadi senior. Reputazione "party nomad" rema contro il mid-luxury.', 'Alta — più difficile differenziarsi. Valutare Uluwatu/Bingin invece di Canggu'],
          ],
        },
        callout: {
          title: 'Implicazione operativa',
          text: 'Tamarindo è la lighthouse location naturale: bassa saturazione, vantaggio di rete preesistente, costi di entrata gestibili. Malaga è lo scale proof: validare che il modello regge in un mercato denso e regolato. La terza location va decisa solo dopo che Tamarindo e Malaga hanno chiuso 24 mesi sopra il 90% di occupancy. Le altre 7 città vanno raccontate come vision quinquennale, non come piano triennale.',
        },
        subhead: 'Gap: long-list 10 città',
        bodyAfter: [
          'Per le altre 7 città mancano dati. Candidate logiche da validare nel prossimo round, con criteri di scoring da definire (DNV regulatory, costi RE, infrastruttura volo, community esistente, overlap con Our Habitas, climate stability):',
        ],
        list: [
          'Madeira (Funchal o Ponta do Sol) — Portugal, basso costo, NomadX presente',
          'Lisbona/Cascais o Algarve (Lagos) — Portugal, DNV attiva',
          'Sayulita o Tulum — Messico, già Habitas presente — possibile overlap',
          'Cape Town — Sud Africa, costi bassi, infrastruttura ok',
          'Limassol — Cipro, DNV attiva, fiscalità favorevole',
          'Taghazout o Essaouira — Marocco, costiero, infrastruttura nascente',
          'Mauritius — DNV attiva, posizionamento premium naturale',
          'Ko Pha-ngan o Phuket sud — Thailandia, costo basso, DTV',
          'Mandrem (Goa) — India, costo basso, community esistente',
          'Roatán — Honduras, costiero caraibico, basso costo entrata',
        ],
      },
      {
        n: '7',
        h: 'Direzione del modello finanziario',
        body: [
          'Le tre regole derivate direttamente dal case study Selina diventano principi di costruzione del modello Nuovi Mondi.',
        ],
        subhead: 'Regola 1 — Asset-heavy, non leaseback',
        para1:
          'Joint venture con landowner o developer locali (equity 30-50%), non master lease su edifici altrui. La discesa di Selina e Common ha dimostrato che il leasing su edifici riposizionati è suicidio in un ciclo di tassi alti. Modello target ispirato a Six Senses Residences (vendita unit + management fee con servizi hospitality) o JV equity con family office locali. Riduce capex iniziale, allinea incentivi, scarica una parte del rischio sui partner locali.',
        subhead2: 'Regola 2 — Multi-revenue stream',
        list: [
          'Membership annuale: target $2-5K/anno, posizionamento "Soho House per nomadi premium".',
          'Stay revenue: room rate $200-400/notte premium nights, sconti per long-stay e member.',
          'Branded residences: vendita unit con managed program. Playbook Habitas/Six Senses applicato al posizionamento mid-luxury.',
          'F&B e wellness: margini alti, leva differenziativa, retention vehicle.',
          'Eventi e programmazione: la community è il prodotto, quindi è anche una linea di ricavo (workshop, retreat, curator-led residencies).',
        ],
        subhead3: 'Regola 3 — Roll-out chirurgico, non scale-out',
        para3:
          "Massimo 3 location nei primi 36 mesi, ognuna provata steady-state prima di aprire la quarta. Selina aveva 100+ location aperte senza una sola provata profittevole. Il piano 10-città va presentato come vision quinquennale (anno 5-7), non come piano triennale aggressivo. L'investitore informato che ha visto cadere Selina apprezza il pacing.",
        subhead4: 'Capex indicativo per location-tipo',
        para4:
          "Una location costiera mid-luxury credibile (40-60 unità, design firmato, area comune, F&B, spa, programmazione community-led) richiede in prima approssimazione $5-15M tra acquisto/JV terreno, ristrutturazione, capitale di lavoro. Il numero va validato con un developer su una proprietà specifica — è una stima d'ordine, non una cifra da pitch. Su un piano 10-location il commitment totale ordina di grandezza è $50-150M, ovvero territorio di hospitality fund e family office syndicate, non di Series A startup.",
        callout: {
          title: 'Implicazione per la struttura del capitale',
          text: 'La struttura non è venture capital. È fondo immobiliare/hospitality private equity con orizzonte 7-10 anni, possibili LP family office + sovereign wealth in piccola quota, integrato con vendita di branded residences come pre-equity per le location 2 e 3. Niente SPAC. Niente debito a breve. La pitch agli investitori deve esplicitamente differenziare la struttura del capitale dalle modalità di Selina.',
        },
      },
      {
        n: '8',
        h: 'Verdetto preliminare di fattibilità',
        body: [
          "Il modello è fattibile. Il timing è favorevole — l'offerta competitiva si è contratta nel 2024 proprio mentre la domanda accelera. Il posizionamento è difendibile: il quadrante mid-luxury + slow/long-stay + multi-location membership non è oggi occupato in modo serio. Le condizioni per realizzarlo sono cinque.",
        ],
        ol: [
          'Capital structure asset-heavy con JV locali, non leaseback. Equity o quasi-equity da family office o hospitality fund con orizzonte 7-10 anni. No SPAC, no debito a breve termine, no leasing operativo come asset principale.',
          'Pricing premium con membership $2-5K/anno minimo. Posizionamento esplicito "Soho House per costiero/lifestyle", non "Selina con servizi migliori".',
          'Asset partner locali in ogni città. JV con un developer o property owner riduce capex iniziale, riduce frizione regolatoria, allinea gli incentivi.',
          'Community come prodotto, non come marketing. Programmazione settimanale, residence chef, curator culturale, retention metrics tracciate dal mese uno. È esattamente dove Selina ha sbagliato.',
          'Sequenza disciplinata. Tamarindo come lighthouse location, Malaga come scale proof, terza location decisa solo dopo che le prime due hanno chiuso 24 mesi sopra il 90% di occupancy.',
        ],
        subhead: 'Rischio principale identificato',
        bodyAfter: [
          'Our Habitas / Ennismore (Accor Group) è il giocatore da osservare. Ha già la formula "luxury + community + multi-location + branded residences" e ha appena annunciato 45+ progetti residenziali in 20 paesi. Se decide di scendere di tier dal luxury vero al mid-luxury, ha alle spalle Accor e relativi miliardi di CapEx — Nuovi Mondi non può vincere su quel terreno. La strategia mitigante è differenziarsi su "long-stay community-first" vs il loro DNA "resort experiential". Sono in realtà segmenti diversi e vanno raccontati come tali.',
        ],
      },
      {
        n: '9',
        h: 'Prossimi step proposti',
        body: [
          'Questa è la prima analisi di mercato e fattibilità. I cinque step successivi naturali, in ordine, sono:',
        ],
        ol: [
          'Deep dive Our Habitas / Ennismore. Capire esattamente dove sono già presenti, quali residenze hanno annunciato, dove si stanno espandendo — per evitare collisioni e identificare i complement.',
          'Modello finanziario di una location-tipo. CapEx per location costiera 40-60 unità, P&L year 1-5 base/bull/bear, sensitivity su occupancy e ADR, IRR per LP.',
          'Long-list 10 città con criteri di scoring espliciti. DNV regulatory, costi RE, infrastruttura volo internazionale, community esistente, climate stability, overlap Our Habitas.',
          'Investor narrative. 10-15 slide con il framing "Soho House meets digital nomad" e il differential vs Selina esplicito dalla slide 2.',
          'Pilot Tamarindo. Verificare se esiste una proprietà candidata sulla costa di Tamarindo o Playa Grande dove provare il modello tramite JV con un proprietario locale — leveraging il network 15Love e Casa Idea.',
        ],
      },
    ],
    sourcesTitle: 'Fonti principali',
    sources: [
      'Selina collapse: Skift (luglio 2024), Hospitality Investor, Mapmelon, Colombia One.',
      'Coliving market e unit economics: Everything Coliving, Coliving.com, Coliving Insights.',
      'Digital nomad market: MBO Partners State of Independence 2025, Nomads.com 2026 Stats, Dataintelo Tourism Report.',
      'Competitor: Outsite.co, Outpost destinationoutpost.co, Sun and Co. sun-and-co.com, Habyt corporate, Our Habitas Ennismore/Accor announcement.',
      'Città target: GuideToMalaga, Citizen Remote (Costa Rica DNV), Bali E33G Visa (BaliVisa.co).',
    ],
  },
} as const;

const Callout = ({ title, text }: { title: string; text: string }) => (
  <div className="my-8 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-6">
    <div className="text-xs uppercase tracking-widest text-blue-300 mb-2 font-semibold">{title}</div>
    <p className="text-gray-200 leading-relaxed">{text}</p>
  </div>
);

const DataTable = ({ headers, rows }: { headers: readonly string[]; rows: readonly (readonly string[])[] }) => (
  <div className="my-6 overflow-x-auto rounded-xl border border-white/10">
    <table className="w-full text-sm text-left text-gray-300">
      <thead className="bg-white/5 text-gray-200">
        <tr>
          {headers.map((h, i) => (
            <th key={i} className="px-4 py-3 font-semibold">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-white/10 align-top">
            {r.map((c, j) => (
              <td key={j} className="px-4 py-3">{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);


type VisualPosition = 'afterBody' | 'afterTable' | 'afterList' | 'afterList2' | 'afterBodyAfter' | 'afterOl';

type SectionVisualEntry = {
  src: string;
  position: VisualPosition;
  alt: Record<Lang, string>;
  caption: Record<Lang, string>;
};

const heroVisual = {
  src: heroVilla,
  alt: {
    en: 'Nuovi Mondi coastal villa concept at sunset.',
    it: 'Concept di villa costiera Nuovi Mondi al tramonto.',
  },
  caption: {
    en: 'Early visual direction for the first Nuovi Mondi coastal residence.',
    it: 'Prima direzione visiva per la prima residenza costiera Nuovi Mondi.',
  },
};

const sectionVisuals: Record<string, SectionVisualEntry> = {
  '2': {
    src: selinaCollapse,
    position: 'afterBody',
    alt: {
      en: 'Chart showing Selina rise, SPAC peak, and collapse.',
      it: 'Grafico che mostra crescita, picco SPAC e collasso di Selina.',
    },
    caption: {
      en: 'Selina scaled fast, peaked at the SPAC, then collapsed under debt and weak fundamentals.',
      it: 'Selina è cresciuta rapidamente, ha toccato il picco con lo SPAC e poi è collassata sotto il peso di debito e fondamentali fragili.',
    },
  },
  '3': {
    src: colivingFailures,
    position: 'afterBody',
    alt: {
      en: 'Visual summary of major coliving brands that failed within 24 months.',
      it: 'Sintesi visiva dei principali brand coliving falliti entro 24 mesi.',
    },
    caption: {
      en: 'The failure pattern is sector-wide, not an isolated Selina anomaly.',
      it: 'Il pattern di fallimento è trasversale al settore, non un’anomalia isolata di Selina.',
    },
  },
  '4': {
    src: competitorMap,
    position: 'afterBodyAfter',
    alt: {
      en: 'Competitive map placing Nuovi Mondi between nomadic and luxury segments.',
      it: 'Mappa competitiva che colloca Nuovi Mondi tra segmenti nomadici e luxury.',
    },
    caption: {
      en: 'Nuovi Mondi occupies the open white space between nomadic coliving and branded luxury residences.',
      it: 'Nuovi Mondi occupa il white space tra il coliving nomadico e le branded residences di lusso.',
    },
  },
  '5': {
    src: marketGrowth,
    position: 'afterList2',
    alt: {
      en: 'Market growth chart for coliving and digital nomad tourism.',
      it: 'Grafico di crescita del mercato coliving e del turismo digital nomad.',
    },
    caption: {
      en: 'Demand is compounding across both coliving and digital nomad travel.',
      it: 'La domanda accelera sia nel coliving sia nel digital nomad travel.',
    },
  },
  '6': {
    src: targetCities,
    position: 'afterTable',
    alt: {
      en: 'Illustrated comparison of Tamarindo, Málaga, and Bali as candidate locations.',
      it: 'Confronto illustrato tra Tamarindo, Malaga e Bali come location candidate.',
    },
    caption: {
      en: 'The first three cities span proof of model, European scale validation, and Southeast Asia benchmarking.',
      it: 'Le prime tre città coprono prova del modello, validazione europea della scala e benchmark nel Sud-est asiatico.',
    },
  },
  '7': {
    src: selinaVsNuoviMondi,
    position: 'afterList',
    alt: {
      en: 'Comparison between Selina asset-light model and Nuovi Mondi asset-heavy joint venture model.',
      it: 'Confronto tra il modello asset-light di Selina e il modello asset-heavy in joint venture di Nuovi Mondi.',
    },
    caption: {
      en: 'The capital structure is the core strategic divergence from Selina.',
      it: 'La struttura del capitale è la divergenza strategica fondamentale rispetto a Selina.',
    },
  },
  '8': {
    src: fiveNonNegotiables,
    position: 'afterOl',
    alt: {
      en: 'Five non-negotiable execution principles for Nuovi Mondi.',
      it: 'Cinque principi esecutivi non negoziabili per Nuovi Mondi.',
    },
    caption: {
      en: 'These five rules turn the concept into a disciplined operating model.',
      it: 'Queste cinque regole trasformano il concept in un modello operativo disciplinato.',
    },
  },
  '9': {
    src: roadmapTimeline,
    position: 'afterOl',
    alt: {
      en: 'Three-year roadmap from Tamarindo lighthouse to expansion decision gate.',
      it: 'Roadmap triennale dalla lighthouse di Tamarindo al decision gate per l’espansione.',
    },
    caption: {
      en: 'The roll-out should prove travelability before wider expansion.',
      it: 'Il roll-out deve dimostrare la trasferibilità del modello prima di espandersi.',
    },
  },
  'A': {
    src: nuoviMondiVsHabitas,
    position: 'afterList',
    alt: {
      en: 'Comparison between Nuovi Mondi and Our Habitas / Ennismore positioning.',
      it: 'Confronto tra il posizionamento di Nuovi Mondi e quello di Our Habitas / Ennismore.',
    },
    caption: {
      en: 'Same broad direction, but clearly different segment, scale, and stay logic.',
      it: 'Stessa direzione generale, ma segmento, scala e logica di soggiorno chiaramente diversi.',
    },
  },
};

const SectionVisual = ({ src, alt, caption }: { src: string; alt: string; caption: string }) => (
  <figure className="my-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
    <img src={src} alt={alt} className="w-full rounded-xl object-cover" loading="lazy" />
    <figcaption className="px-2 pt-3 text-sm leading-relaxed text-gray-400">{caption}</figcaption>
  </figure>
);

const NuoviMondi = () => {
  const [lang, setLang] = useState<Lang>('en');
  const t = content[lang];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Navigation />

      {/* Language switcher */}
      <div className="fixed top-20 right-4 z-40">
        <button
          onClick={() => setLang(lang === 'en' ? 'it' : 'en')}
          className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition"
          aria-label="Switch language"
        >
          {t.switchLabel}
        </button>
      </div>

      {/* Hero */}
      <section className="pt-32 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <img
            src="/ventures/Nuovi-Mondi-Logo.png"
            alt="Nuovi Mondi"
            className="mx-auto h-56 md:h-72 bg-white rounded-3xl p-8 mb-10"
          />
          <div className="text-xs tracking-[0.3em] text-blue-300 mb-3">{t.eyebrow}</div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{t.title}</h1>
          <p className="text-lg md:text-xl text-gray-300 mb-6">{t.subtitle}</p>

          <div className="my-10 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
            <video
              key={lang}
              src={lang === 'it' ? '/nuovi-mondi/Nuovi_Mondi_Investor_Deck_ITA.mp4' : '/nuovi-mondi/Nuovi_Mondi_Investor_Deck_EN.mp4'}
              controls
              playsInline
              preload="metadata"
              className="w-full h-auto block"
            />
          </div>

          <p className="italic text-gray-400 max-w-3xl mx-auto leading-relaxed">{t.intro}</p>
          <div className="mt-8 text-sm text-gray-500">
            <p>{t.meta}</p>
            <p className="mt-2">{t.byline}</p>
          </div>


          <SectionVisual
            src={heroVisual.src}
            alt={heroVisual.alt[lang]}
            caption={heroVisual.caption[lang]}
          />
        </div>
      </section>

      {/* Sections */}
      <section className="pb-20 px-4">
        <div className="max-w-4xl mx-auto space-y-16">
          {t.sections.map((s: any) => {
            const visual = sectionVisuals[s.n];
            const renderVisual = (position: VisualPosition) =>
              visual && visual.position === position ? (
                <SectionVisual
                  src={visual.src}
                  alt={visual.alt[lang]}
                  caption={visual.caption[lang]}
                />
              ) : null;

            return (
              <article key={s.n} className="text-gray-300">
                <div className="flex items-baseline gap-4 mb-6">
                  <span className="text-3xl font-bold text-blue-400">{s.n}.</span>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">{s.h}</h2>
                </div>

                {s.thesis && (
                  <p className="italic text-blue-200 border-l-2 border-blue-400 pl-4 mb-6">{s.thesis}</p>
                )}

                {s.body?.map((p: string, i: number) => (
                  <p key={i} className="mb-4 leading-relaxed">{p}</p>
                ))}
                {renderVisual('afterBody')}

                {s.subhead && <h3 className="text-xl font-semibold text-white mt-8 mb-3">{s.subhead}</h3>}
                {s.table && <DataTable headers={s.table.headers} rows={s.table.rows} />}
                {renderVisual('afterTable')}
                {s.para1 && <p className="mb-4 leading-relaxed">{s.para1}</p>}

                {s.subhead2 && <h3 className="text-xl font-semibold text-white mt-8 mb-3">{s.subhead2}</h3>}
                {s.list && (
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    {s.list.map((it: string, i: number) => <li key={i}>{it}</li>)}
                  </ul>
                )}
                {renderVisual('afterList')}
                {s.ol && (
                  <ol className="list-decimal pl-6 space-y-2 mb-4">
                    {s.ol.map((it: string, i: number) => <li key={i}>{it}</li>)}
                  </ol>
                )}
                {renderVisual('afterOl')}

                {s.subhead3 && <h3 className="text-xl font-semibold text-white mt-8 mb-3">{s.subhead3}</h3>}
                {s.para3 && <p className="mb-4 leading-relaxed">{s.para3}</p>}
                {s.list2 && (
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    {s.list2.map((it: string, i: number) => <li key={i}>{it}</li>)}
                  </ul>
                )}
                {renderVisual('afterList2')}

                {s.subhead4 && <h3 className="text-xl font-semibold text-white mt-8 mb-3">{s.subhead4}</h3>}
                {s.para4 && <p className="mb-4 leading-relaxed">{s.para4}</p>}
                {s.list3 && (
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    {s.list3.map((it: string, i: number) => <li key={i}>{it}</li>)}
                  </ul>
                )}

                {s.bodyAfter?.map((p: string, i: number) => (
                  <p key={i} className="mb-4 leading-relaxed">{p}</p>
                ))}
                {renderVisual('afterBodyAfter')}

                {s.callout && <Callout title={s.callout.title} text={s.callout.text} />}
              </article>
            );
          })}

          {/* Sources */}
          <article className="text-gray-400 border-t border-white/10 pt-10">
            <h2 className="text-xl font-bold text-white mb-4">{t.sourcesTitle}</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              {t.sources.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </article>

          <InvestorInterestForm lang={lang} />
        </div>
      </section>
    </div>
  );
};

const formCopy = {
  en: {
    eyebrow: 'INVESTOR RELATIONS',
    title: 'Express your interest',
    sub: 'If the thesis resonates, leave your details and we will reach out to share the full deck and discuss next steps.',
    name: 'Full name',
    email: 'Email',
    phone: 'Phone (optional)',
    company: 'Company / Fund (optional)',
    capital: 'Capital you would consider investing',
    capitalPh: 'Select a range',
    message: 'Message (optional)',
    messagePh: 'Anything you want us to know…',
    submit: 'Send interest',
    sending: 'Sending…',
    successTitle: 'Thank you',
    successDesc: 'We received your interest and will be in touch shortly.',
    errorTitle: 'Something went wrong',
    errorDesc: 'Please try again in a moment.',
    ranges: [
      'Under €25k',
      '€25k – €100k',
      '€100k – €250k',
      '€250k – €500k',
      '€500k – €1M',
      '€1M – €5M',
      'Over €5M',
      'Prefer to discuss',
    ],
  },
  it: {
    eyebrow: 'INVESTOR RELATIONS',
    title: 'Manifesta il tuo interesse',
    sub: 'Se la tesi ti convince, lasciaci i tuoi dati: ti contatteremo per condividere il deck completo e discutere i prossimi passi.',
    name: 'Nome e cognome',
    email: 'Email',
    phone: 'Telefono (opzionale)',
    company: 'Azienda / Fondo (opzionale)',
    capital: 'Capitale che valuteresti di investire',
    capitalPh: 'Seleziona un range',
    message: 'Messaggio (opzionale)',
    messagePh: 'Qualcosa che vuoi farci sapere…',
    submit: 'Invia interesse',
    sending: 'Invio…',
    successTitle: 'Grazie',
    successDesc: 'Abbiamo ricevuto il tuo interesse, ti contatteremo a breve.',
    errorTitle: 'Qualcosa è andato storto',
    errorDesc: 'Riprova tra un momento.',
    ranges: [
      'Sotto €25k',
      '€25k – €100k',
      '€100k – €250k',
      '€250k – €500k',
      '€500k – €1M',
      '€1M – €5M',
      'Oltre €5M',
      'Preferisco discuterne',
    ],
  },
} as const;

const InvestorInterestForm: React.FC<{ lang: Lang }> = ({ lang }) => {
  const c = formCopy[lang];
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    capital_range: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('investor_interests').insert({
      name: form.name.trim().slice(0, 200),
      email: form.email.trim().slice(0, 200),
      phone: form.phone.trim().slice(0, 50) || null,
      company: form.company.trim().slice(0, 200) || null,
      capital_range: form.capital_range || null,
      message: form.message.trim().slice(0, 2000) || null,
      language: lang,
    });
    setLoading(false);
    if (error) {
      toast({ title: c.errorTitle, description: c.errorDesc, variant: 'destructive' });
      return;
    }
    setDone(true);
    toast({ title: c.successTitle, description: c.successDesc });
  };

  const inputCls =
    'w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors';

  return (
    <article id="invest" className="border-t border-white/10 pt-12 mt-8 scroll-mt-24">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs tracking-[0.2em] text-white/50 mb-3">{c.eyebrow}</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{c.title}</h2>
        <p className="text-gray-300 mb-8 leading-relaxed">{c.sub}</p>

        {done ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">{c.successTitle}</h3>
            <p className="text-gray-300">{c.successDesc}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">{c.name} *</label>
                <input required name="name" value={form.name} onChange={handleChange} className={inputCls} maxLength={200} />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">{c.email} *</label>
                <input required type="email" name="email" value={form.email} onChange={handleChange} className={inputCls} maxLength={200} />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">{c.phone}</label>
                <input name="phone" value={form.phone} onChange={handleChange} className={inputCls} maxLength={50} />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">{c.company}</label>
                <input name="company" value={form.company} onChange={handleChange} className={inputCls} maxLength={200} />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">{c.capital}</label>
              <select
                name="capital_range"
                value={form.capital_range}
                onChange={handleChange}
                className={inputCls + ' appearance-none cursor-pointer'}
              >
                <option value="" className="bg-neutral-900">{c.capitalPh}</option>
                {c.ranges.map((r) => (
                  <option key={r} value={r} className="bg-neutral-900">{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">{c.message}</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder={c.messagePh}
                rows={4}
                maxLength={2000}
                className={inputCls + ' resize-none'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-8 py-3 rounded-lg bg-white text-black font-semibold hover:bg-white/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? c.sending : c.submit}
            </button>
          </form>
        )}
      </div>
    </article>
  );
};

export default NuoviMondi;
