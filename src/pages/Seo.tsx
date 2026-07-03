import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight, Bot, Search, CheckCircle2, Sparkles, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const LAST_UPDATE = '2 luglio 2026';

const faqs = [
  {
    q: "Cos'è l'ottimizzazione AI/GEO e in cosa differisce dalla SEO classica?",
    a: "L'ottimizzazione GEO (Generative Engine Optimization) rende il tuo sito comprensibile e citabile dai motori AI come ChatGPT, Gemini, Perplexity e Claude. La SEO classica ottimizza per Google, che mostra dieci link blu; la GEO ottimizza per assistenti che leggono, sintetizzano e citano una sola risposta. Cambiano formato dei contenuti, dati strutturati e presenza nelle fonti che le AI consultano.",
  },
  {
    q: 'Come faccio a sapere se ChatGPT o Gemini conoscono già la mia attività?',
    a: "Aprendo ChatGPT, Gemini o Perplexity e chiedendo cose che un cliente reale chiederebbe: \"miglior [tuo settore] a [tua città]\", \"chi consigli per [tuo servizio]\", \"parlami di [nome della tua attività]\". Se l'AI non ti nomina, ti descrive male o consiglia solo i concorrenti, non sei ancora nel loro grafo di conoscenza. È esattamente il primo check che facciamo gratuitamente.",
  },
  {
    q: 'Quanto costa il servizio e quanto tempo serve per vedere risultati?',
    a: "Il check iniziale è gratuito. L'intervento di ottimizzazione parte da un progetto una-tantum, con prezzo definito dopo il check in base a dimensione del sito e settore. I motori AI aggiornano le proprie citazioni con tempi diversi: Perplexity in 2-4 settimane, ChatGPT e Gemini tipicamente in 6-12 settimane. Non promettiamo primi posti garantiti, ma miglioramenti misurabili e monitorati.",
  },
  {
    q: 'Il check iniziale è davvero gratuito, senza impegno?',
    a: "Sì, senza impegno e senza carta di credito. Ti inviamo un report che mostra come cinque diversi motori AI descrivono oggi la tua attività, cosa sbagliano, quali concorrenti citano al tuo posto e quali interventi ti servono in ordine di priorità. Se decidi di procedere ti facciamo un preventivo; se decidi di no, il report resta comunque tuo.",
  },
];

const formSchema = z.object({
  name: z.string().trim().min(2, 'Inserisci nome e cognome').max(100),
  email: z.string().trim().email('Email non valida').max(255),
  website: z.string().trim().min(3, 'Inserisci il tuo sito web').max(255),
  message: z.string().trim().max(1000).optional(),
});

const Seo: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', website: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const scrollToForm = () => {
    document.getElementById('richiedi-check')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      toast({ title: 'Controlla i dati', description: parsed.error.errors[0].message, variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('client_signups').insert({
        name: parsed.data.name,
        email: parsed.data.email,
        website: parsed.data.website,
        desired_services: 'GEO / AEO — Check gratuito visibilità AI',
        social_media: parsed.data.message || null,
      });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: 'Richiesta inviata', description: 'Ti contattiamo entro 48 ore con il tuo check gratuito.' });
    } catch (err) {
      toast({ title: 'Errore', description: 'Riprova tra qualche istante o scrivici a info@1000feetabove.com', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Ottimizzazione GEO / AEO — Visibilità sui motori AI',
    serviceType: 'Generative Engine Optimization',
    provider: {
      '@type': 'Organization',
      name: '1000 Feet, Inc.',
      url: 'https://1000feetabove.com',
      email: 'info@1000feetabove.com',
    },
    areaServed: 'Worldwide',
    description:
      'Servizio di ottimizzazione del sito web per essere trovati, compresi e citati dai motori AI come ChatGPT, Gemini, Perplexity e Claude. Include check gratuito iniziale e intervento tecnico e di contenuto.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Check iniziale gratuito della visibilità AI',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      <Helmet>
        <html lang="it" />
        <title>La tua attività la consigliano i chatbot? | Ottimizzazione AI — 1000 Feet</title>
        <meta
          name="description"
          content="Servizio GEO/AEO per essere trovati e citati da ChatGPT, Gemini, Perplexity e Claude. Check gratuito della visibilità AI della tua attività."
        />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href="https://1000feetabove.com/seo" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://1000feetabove.com/seo" />
        <meta property="og:title" content="La tua attività la consigliano i chatbot?" />
        <meta
          property="og:description"
          content="Rendi il tuo sito trovabile dagli assistenti AI. Check gratuito della visibilità su ChatGPT, Gemini, Perplexity e Claude."
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="La tua attività la consigliano i chatbot?" />
        <meta
          name="twitter:description"
          content="Ottimizzazione GEO/AEO: rendi la tua attività visibile agli assistenti AI. Check gratuito."
        />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(serviceJsonLd)}</script>
      </Helmet>

      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Torna alla home</span>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <img src="/lovable-uploads/b97212d1-b771-4d37-add1-527f1cd324ae.png" alt="1000 Feet" className="h-8 w-auto" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-2 mb-6">
            <Bot className="h-4 w-4 text-blue-300" />
            <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">GEO / AEO — Visibilità AI</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            La tua attività la <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">consigliano i chatbot</span>?
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">
            Sempre più clienti chiedono a ChatGPT, Gemini e Perplexity prima di cercare su Google. Se l'intelligenza artificiale non ti conosce, consiglia il tuo concorrente.
          </p>
          <p className="text-base text-gray-400 mb-10">
            Ti facciamo un check gratuito per scoprire come le principali AI descrivono oggi la tua attività — e cosa serve per farti trovare.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={scrollToForm}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-2xl"
            >
              Richiedi il check gratuito
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <a href="#come-funziona">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-blue-300/60 bg-transparent text-blue-200 hover:bg-blue-400/10 hover:text-white px-8 py-6 text-lg font-semibold rounded-full"
              >
                Come funziona
              </Button>
            </a>
          </div>
          <p className="text-xs text-gray-500 mt-6">
            Ultimo aggiornamento: {LAST_UPDATE} · A cura del team 1000 Feet, Inc.
          </p>
        </div>
      </section>

      {/* Problema */}
      <section className="py-20 bg-slate-900/40">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Search className="h-6 w-6 text-cyan-400" />
            <span className="text-cyan-300 uppercase text-sm font-semibold tracking-wider">Il problema</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-8">La ricerca è cambiata. Il tuo sito no.</h2>
          <div className="space-y-6 text-lg text-gray-300 leading-relaxed">
            <p>
              Fino a due anni fa, un potenziale cliente apriva Google, scriveva "miglior dentista Milano" e sceglieva tra i primi risultati. Oggi apre ChatGPT o Gemini e chiede direttamente: "dammi tre dentisti bravi in zona Navigli, aperti il sabato". L'AI risponde con un nome, un consiglio, una raccomandazione. Uno solo.
            </p>
            <p>
              Se l'intelligenza artificiale non ha informazioni chiare, aggiornate e strutturate sulla tua attività, semplicemente non ti nomina. Il cliente non vede dieci link: vede una risposta, e quella risposta contiene il tuo concorrente. Non c'è una seconda pagina su cui scorrere.
            </p>
            <p>
              Il problema non è che il tuo sito sia "brutto" o "vecchio". Il problema è che è stato costruito per Google — per un algoritmo che indicizza pagine. I motori AI leggono, sintetizzano e citano: hanno bisogno di segnali diversi, di contenuti in formato risposta e di dati strutturati che oggi il 90% dei siti italiani non ha.
            </p>
          </div>
        </div>
      </section>

      {/* Soluzione */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="h-6 w-6 text-blue-400" />
            <span className="text-blue-300 uppercase text-sm font-semibold tracking-wider">La soluzione</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Rendiamo il tuo sito leggibile e citabile dalle AI.</h2>
          <p className="text-lg text-gray-300 mb-10 leading-relaxed">
            In parole semplici: prendiamo il tuo sito così com'è e lo trasformiamo in una fonte che ChatGPT, Gemini, Perplexity e Claude riescono a capire, memorizzare e citare quando qualcuno chiede della tua attività o del tuo settore. Non è magia, è un intervento tecnico e di contenuto molto specifico.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Contenuti in formato risposta',
                text: 'Riscriviamo le pagine chiave in modo che ogni domanda tipica del cliente abbia una risposta diretta, autonoma, che una AI possa estrarre e citare senza doverla interpretare.',
              },
              {
                title: 'Dati strutturati (Schema.org)',
                text: "Aggiungiamo al codice del sito il markup che permette agli assistenti AI di riconoscere cosa fai, dove sei, quali servizi offri e a quali domande rispondi.",
              },
              {
                title: 'Presenza nelle fonti giuste',
                text: 'Verifichiamo che il tuo sito sia raggiungibile dai crawler AI (GPTBot, ClaudeBot, PerplexityBot) e presente nelle fonti aggregate che le AI consultano quando costruiscono una risposta.',
              },
              {
                title: 'Monitoraggio continuo',
                text: "Testiamo periodicamente su cinque motori AI cosa dicono di te, come cambia nel tempo la citazione e dove serve intervenire ancora. Ti mandiamo un report leggibile in 5 minuti.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-cyan-400 mt-1 shrink-0" />
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                </div>
                <p className="text-gray-400 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section id="come-funziona" className="py-20 bg-slate-900/40">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Come funziona</h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">Tre passi, tempi chiari, nessun impegno per iniziare.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: '01',
                title: 'Check gratuito',
                text: 'Interroghiamo ChatGPT, Gemini, Perplexity, Claude e Copilot su domande reali che i tuoi clienti farebbero. Ti mandiamo un report con quello che le AI dicono oggi di te, dei tuoi concorrenti e cosa serve sistemare.',
                time: '48 ore lavorative',
              },
              {
                n: '02',
                title: 'Intervento',
                text: 'Rimettiamo mano al sito: contenuti in formato risposta, dati strutturati, accessibilità ai crawler AI, pagina FAQ, presenza nelle fonti aggregate. Lavoriamo sul tuo sito attuale, non lo rifacciamo da zero.',
                time: '2-4 settimane',
              },
              {
                n: '03',
                title: 'Monitoraggio',
                text: 'Ogni mese testiamo su cinque motori AI come vieni citato e ti mandiamo un report. Se qualcosa peggiora interveniamo, se migliora vediamo insieme dove spingere di più.',
                time: 'Continuativo, opzionale',
              },
            ].map((step) => (
              <div key={step.n} className="relative bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-400/20 rounded-2xl p-6">
                <div className="text-5xl font-black text-blue-400/30 mb-3">{step.n}</div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-300 mb-4 leading-relaxed">{step.text}</p>
                <div className="text-xs uppercase tracking-wider text-cyan-300 font-semibold">{step.time}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center gap-3 mb-6 justify-center">
            <MessageSquare className="h-6 w-6 text-blue-400" />
            <span className="text-blue-300 uppercase text-sm font-semibold tracking-wider">Domande frequenti</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Le risposte che ci chiedono più spesso</h2>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="bg-white/5 border border-white/10 rounded-xl px-5 !border-b"
              >
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline hover:text-blue-300">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed text-base">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Form */}
      <section id="richiedi-check" className="py-20 bg-gradient-to-br from-blue-900/60 via-slate-900 to-slate-900">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Richiedi il tuo check gratuito</h2>
          <p className="text-center text-gray-300 mb-10">
            Ti mandiamo entro 48 ore un report con quello che ChatGPT, Gemini, Perplexity, Claude e Copilot dicono oggi della tua attività — e cosa serve per farti trovare.
          </p>
          {submitted ? (
            <div className="bg-green-500/10 border border-green-400/30 rounded-2xl p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Richiesta ricevuta.</h3>
              <p className="text-gray-300">Ti scriviamo entro 48 ore lavorative all'indirizzo che hai indicato.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-5">
              <div>
                <Label htmlFor="name" className="text-white">Nome e cognome *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  maxLength={100}
                  className="mt-2 bg-slate-900/50 border-white/20 text-white placeholder:text-gray-500"
                  placeholder="Mario Rossi"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-white">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  maxLength={255}
                  className="mt-2 bg-slate-900/50 border-white/20 text-white placeholder:text-gray-500"
                  placeholder="mario@tuaazienda.it"
                />
              </div>
              <div>
                <Label htmlFor="website" className="text-white">Sito web della tua attività *</Label>
                <Input
                  id="website"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  required
                  maxLength={255}
                  className="mt-2 bg-slate-900/50 border-white/20 text-white placeholder:text-gray-500"
                  placeholder="https://tuaazienda.it"
                />
              </div>
              <div>
                <Label htmlFor="message" className="text-white">Messaggio (opzionale)</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  maxLength={1000}
                  rows={4}
                  className="mt-2 bg-slate-900/50 border-white/20 text-white placeholder:text-gray-500"
                  placeholder="Raccontaci brevemente cosa fai e cosa vorresti sapere"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold text-lg py-6 rounded-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Invio in corso...
                  </>
                ) : (
                  <>
                    Richiedi il check gratuito <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Nessuna carta di credito richiesta. I tuoi dati restano privati e non vengono condivisi.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-500">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} 1000 Feet, Inc. — <a className="underline hover:text-blue-300" href="mailto:info@1000feetabove.com">info@1000feetabove.com</a></p>
        </div>
      </footer>
    </div>
  );
};

export default Seo;
