import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2, Phone, Globe, MapPin, Star, Users, Mail, Pencil, Check, X, Search, Send, StopCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import AuditReportModal from './AuditReportModal';

interface PotentialClient {
  id: string;
  name: string;
  phone: string | null;
  website: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  category: string | null;
  rating: number | null;
  reviews_count: number | null;
  google_id: string | null;
  source_query: string | null;
  contacted: boolean;
  notes: string | null;
  created_at: string;
}

const extractUploadCategory = (sourceQuery: string | null): string => {
  if (!sourceQuery) return '';
  return sourceQuery.split(',')[0].trim().toLowerCase();
};

const extractCountryCode = (sourceQuery: string | null): string => {
  if (!sourceQuery) return '';
  const parts = sourceQuery.split(',');
  return parts[parts.length - 1].trim().toUpperCase();
};

const PotentialClients: React.FC = () => {
  const [clients, setClients] = useState<PotentialClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [editingEmailValue, setEditingEmailValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Audit state
  const [audits, setAudits] = useState<Record<string, any>>({});
  const [auditingIds, setAuditingIds] = useState<Set<string>>(new Set());
  const [bulkAuditing, setBulkAuditing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [draftingIds, setDraftingIds] = useState<Set<string>>(new Set());
  const [bulkDrafting, setBulkDrafting] = useState(false);
  const [bulkDraftProgress, setBulkDraftProgress] = useState({ current: 0, total: 0 });

  // SMTP campaign state
  const [activeBatch, setActiveBatch] = useState<any>(null);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [campaignDialogData, setCampaignDialogData] = useState<{ ids: string[]; alreadySentCount: number; label: string } | null>(null);
  const [emailLog, setEmailLog] = useState<any[]>([]);
  const [sentEmailsSet, setSentEmailsSet] = useState<Set<string>>(new Set());
  const [logFilter, setLogFilter] = useState<'all' | 'sent' | 'failed' | 'skipped'>('all');
  const [showLog, setShowLog] = useState(false);
  const emailLogRef = useRef<HTMLDivElement>(null);

  // Quota tracking (matches edge function env defaults)
  const DAILY_CAP = 900;
  const HOURLY_CAP = 500;
  const [dailySent, setDailySent] = useState(0);
  const [hourlySent, setHourlySent] = useState(0);
  const [pauseCountdown, setPauseCountdown] = useState<string>('');
  const [logTotals, setLogTotals] = useState<{ sent: number; failed: number; skipped: number; total: number }>({ sent: 0, failed: 0, skipped: 0, total: 0 });

  const startEditEmail = (client: PotentialClient) => {
    setEditingEmailId(client.id);
    setEditingEmailValue(client.email || '');
  };

  const saveEmail = async (id: string) => {
    try {
      const { error } = await (supabase.from('potential_clients') as any)
        .update({ email: editingEmailValue || null })
        .eq('id', id);
      if (error) throw error;
      setClients(prev => prev.map(c => c.id === id ? { ...c, email: editingEmailValue || null } : c));
      setEditingEmailId(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const cancelEditEmail = () => {
    setEditingEmailId(null);
  };

  const fetchAllClients = async () => {
    try {
      let allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await (supabase.from('potential_clients') as any)
          .select('*')
          .order('created_at', { ascending: false })
          .order('name', { ascending: true })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      setClients(allData);
    } catch (error: any) {
      console.error('Error fetching potential clients:', error);
      toast({ title: "Error", description: "Failed to load potential clients.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAllClients(); }, []);

  // Fetch existing audits
  const fetchAudits = async () => {
    try {
      const { data, error } = await (supabase.from('website_audits') as any).select('*');
      if (error) throw error;
      const map: Record<string, any> = {};
      (data || []).forEach((a: any) => { map[a.lead_id] = a; });
      setAudits(map);
    } catch (e) {
      console.error('Error fetching audits:', e);
    }
  };
  useEffect(() => { fetchAudits(); }, []);

  const runAudit = async (client: PotentialClient, language: 'it' | 'en') => {
    if (!client.website) {
      toast({ title: 'No website', description: 'Questo lead non ha un sito web.', variant: 'destructive' });
      return;
    }
    setAuditingIds(prev => new Set(prev).add(client.id));
    try {
      const { data, error } = await supabase.functions.invoke('run-website-audit', {
        body: { lead_id: client.id, business_name: client.name, website_url: client.website, language },
      });
      if (error) throw error;
      toast({ title: '✅ Audit completato', description: `${client.name}: ${data.overall_score}/10` });
      await fetchAudits();
    } catch (error: any) {
      toast({ title: 'Errore audit', description: error.message, variant: 'destructive' });
    } finally {
      setAuditingIds(prev => { const s = new Set(prev); s.delete(client.id); return s; });
    }
  };

  const runBulkAudit = async () => {
    const eligible = filteredClients.filter(c => c.website && !audits[c.id]);
    if (eligible.length === 0) {
      toast({ title: 'Nessun lead', description: 'Tutti i lead con sito web sono già stati auditati.' });
      return;
    }
    setBulkAuditing(true);
    setBulkProgress({ current: 0, total: eligible.length });

    const concurrency = 5;
    let completed = 0;
    const queue = [...eligible];

    const worker = async () => {
      while (queue.length > 0) {
        const client = queue.shift()!;
        try {
          const language = extractCountryCode(client.source_query) === 'IT' ? 'it' : 'en';
          await supabase.functions.invoke('run-website-audit', {
            body: { lead_id: client.id, business_name: client.name, website_url: client.website, language },
          });
        } catch (e) {
          console.error(`Audit failed for ${client.name}:`, e);
        }
        completed++;
        setBulkProgress({ current: completed, total: eligible.length });
      }
    };

    await Promise.all(Array.from({ length: Math.min(concurrency, eligible.length) }, () => worker()));
    await fetchAudits();
    setBulkAuditing(false);
    toast({ title: '🎉 Bulk audit completato', description: `${completed}/${eligible.length} audit eseguiti.` });
  };

  const createGmailDraft = async (client: PotentialClient, language: 'it' | 'en') => {
    if (!client.email) {
      toast({ title: 'No email', description: 'This lead has no email.', variant: 'destructive' });
      return;
    }
    const key = `${client.id}-${language}`;
    setDraftingIds(prev => new Set(prev).add(key));
    try {
      const { data, error } = await supabase.functions.invoke('create-gmail-draft', {
        body: { prospect_id: client.id, language },
      });
      if (error) throw error;
      toast({ title: '✅ Draft created', description: `Gmail draft saved for ${client.name}` });
      if (!client.contacted) {
        await toggleContacted(client.id, false);
      }
    } catch (error: any) {
      toast({ title: 'Draft error', description: error.message, variant: 'destructive' });
    } finally {
      setDraftingIds(prev => { const s = new Set(prev); s.delete(key); return s; });
    }
  };

  const runBulkDraft = async () => {
    const eligible = filteredClients.filter(c => c.email && !c.contacted);
    if (eligible.length === 0) {
      toast({ title: 'Nessun lead', description: 'Nessun lead con email non ancora contattato.' });
      return;
    }
    if (!confirm(`Creare draft per ${eligible.length} lead?`)) return;
    setBulkDrafting(true);
    setBulkDraftProgress({ current: 0, total: eligible.length });

    let completed = 0;
    let errors = 0;
    for (const client of eligible) {
      const language: 'it' | 'en' = extractCountryCode(client.source_query) === 'IT' ? 'it' : 'en';
      try {
        const { error } = await supabase.functions.invoke('create-gmail-draft', {
          body: { prospect_id: client.id, language },
        });
        if (error) throw error;
        if (!client.contacted) {
          await toggleContacted(client.id, false);
        }
      } catch (e) {
        console.error(`Draft failed for ${client.name}:`, e);
        errors++;
      }
      completed++;
      setBulkDraftProgress({ current: completed, total: eligible.length });
    }
    setBulkDrafting(false);
    toast({
      title: '🎉 Bulk draft completato',
      description: `${completed - errors}/${eligible.length} draft creati.${errors > 0 ? ` ${errors} errori.` : ''}`,
    });
  };

  // ── SMTP Campaign ──────────────────────────────────────────────────────────

  const fetchActiveBatch = async () => {
    const { data } = await (supabase.from('email_batches') as any)
      .select('*')
      .in('status', ['running'])
      .order('started_at', { ascending: false })
      .limit(1);
    setActiveBatch(data && data.length > 0 ? data[0] : null);
  };

  const fetchEmailLog = async () => {
    // Fetch totals via count queries (not bound by 1000-row cap)
    const [allCnt, sentCnt, failedCnt, skippedCnt] = await Promise.all([
      (supabase.from('campaign_email_log') as any).select('id', { count: 'exact', head: true }),
      (supabase.from('campaign_email_log') as any).select('id', { count: 'exact', head: true }).eq('status', 'sent'),
      (supabase.from('campaign_email_log') as any).select('id', { count: 'exact', head: true }).eq('status', 'failed'),
      (supabase.from('campaign_email_log') as any).select('id', { count: 'exact', head: true }).eq('status', 'skipped'),
    ]);
    setLogTotals({
      total: allCnt.count ?? 0,
      sent: sentCnt.count ?? 0,
      failed: failedCnt.count ?? 0,
      skipped: skippedCnt.count ?? 0,
    });

    // Paginate full log (1000-row Supabase cap workaround)
    const pageSize = 1000;
    let allLog: any[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await (supabase.from('campaign_email_log') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);
      if (error || !data || data.length === 0) break;
      allLog = allLog.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    setEmailLog(allLog);

    // Paginate sent recipients for green-check indicator
    const sentEmails = new Set<string>();
    let sFrom = 0;
    while (true) {
      const { data, error } = await (supabase.from('campaign_email_log') as any)
        .select('recipient_email')
        .eq('status', 'sent')
        .range(sFrom, sFrom + pageSize - 1);
      if (error || !data || data.length === 0) break;
      for (const r of data) sentEmails.add((r.recipient_email || '').toLowerCase());
      if (data.length < pageSize) break;
      sFrom += pageSize;
    }
    setSentEmailsSet(sentEmails);
  };

  useEffect(() => { fetchActiveBatch(); fetchEmailLog(); }, []);

  // Fetch quota counts (rolling 24h + rolling 1h)
  const fetchQuotas = async () => {
    const nowMs = Date.now();
    const dayAgo = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString();
    const hourAgo = new Date(nowMs - 60 * 60 * 1000).toISOString();
    const [{ count: d }, { count: h }] = await Promise.all([
      (supabase.from('campaign_email_log') as any).select('id', { count: 'exact', head: true })
        .eq('status', 'sent').gte('sent_at', dayAgo),
      (supabase.from('campaign_email_log') as any).select('id', { count: 'exact', head: true })
        .eq('status', 'sent').gte('sent_at', hourAgo),
    ]);
    setDailySent(d ?? 0);
    setHourlySent(h ?? 0);
  };

  useEffect(() => { fetchQuotas(); }, []);

  // Poll active batch every 2s while running
  useEffect(() => {
    if (!activeBatch || activeBatch.status !== 'running') return;
    const interval = setInterval(async () => {
      const { data } = await (supabase.from('email_batches') as any)
        .select('*').eq('id', activeBatch.id).single();
      if (data) {
        setActiveBatch(data.status === 'running' ? data : null);
        if (data.status !== 'running') {
          fetchEmailLog();
          fetchAllClients();
          toast({
            title: data.status === 'completed' ? '✅ Campagna completata' : data.status === 'stopped' ? '🛑 Campagna fermata' : '❌ Campagna fallita',
            description: `Inviate: ${data.sent_count} · Fallite: ${data.failed_count} · Saltate: ${data.skipped_count}`,
            variant: data.status === 'failed' ? 'destructive' : 'default',
          });
        }
      }
      fetchQuotas();
    }, 2000);
    return () => clearInterval(interval);
  }, [activeBatch?.id, activeBatch?.status]);

  // Live mm:ss countdown to paused_until
  useEffect(() => {
    if (!activeBatch?.paused_until) { setPauseCountdown(''); return; }
    const tick = () => {
      const ms = new Date(activeBatch.paused_until).getTime() - Date.now();
      if (ms <= 0) { setPauseCountdown('0:00'); return; }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setPauseCountdown(`${m}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [activeBatch?.paused_until]);

  const openCampaignDialog = async (mode: 'selected' | 'uncontacted') => {
    if (activeBatch) {
      toast({ title: 'Campagna già attiva', description: 'Aspetta la fine o ferma la corrente.', variant: 'destructive' });
      return;
    }
    let pool: PotentialClient[];
    let label: string;
    if (mode === 'selected') {
      pool = filteredClients.filter(c => selectedIds.has(c.id) && c.email);
      label = `${pool.length} selezionati`;
    } else {
      pool = filteredClients.filter(c => c.email && !c.contacted);
      label = `${pool.length} non contattati`;
    }
    if (pool.length === 0) {
      toast({ title: 'Nessun destinatario', description: 'Nessun lead con email valida.', variant: 'destructive' });
      return;
    }
    // Count duplicates already sent
    const emails = pool.map(c => c.email!);
    const { data: dup } = await (supabase.from('campaign_email_log') as any)
      .select('recipient_email')
      .eq('status', 'sent')
      .in('recipient_email', emails);
    const dupSet = new Set((dup || []).map((r: any) => r.recipient_email));
    const alreadySentCount = pool.filter(c => dupSet.has(c.email!)).length;

    setCampaignDialogData({ ids: pool.map(c => c.id), alreadySentCount, label });
    setCampaignDialogOpen(true);
  };

  const launchCampaign = async () => {
    if (!campaignDialogData) return;
    const { ids } = campaignDialogData;
    try {
      // Create batch row
      const { data: batch, error } = await (supabase.from('email_batches') as any)
        .insert({
          status: 'running',
          total: ids.length,
          prospect_ids: ids,
        })
        .select()
        .single();
      if (error) throw error;
      // Trigger edge function (fire & forget)
      await supabase.functions.invoke('send-campaign-batch', { body: { batch_id: batch.id } });
      setActiveBatch(batch);
      setCampaignDialogOpen(false);
      setCampaignDialogData(null);
      toast({ title: '🚀 Campagna avviata', description: `Invio di ${ids.length} email in background.` });
    } catch (e: any) {
      toast({ title: 'Errore avvio campagna', description: e.message, variant: 'destructive' });
    }
  };

  const stopActiveBatch = async () => {
    if (!activeBatch) return;
    if (!confirm('Fermare la campagna in corso?')) return;
    try {
      await supabase.functions.invoke('stop-campaign-batch', { body: { batch_id: activeBatch.id } });
      toast({ title: '🛑 Stop richiesto', description: 'La campagna si fermerà entro pochi secondi.' });
    } catch (e: any) {
      toast({ title: 'Errore', description: e.message, variant: 'destructive' });
    }
  };

  const scoreBadgeClass = (score: number | null) => {
    if (!score) return '';
    if (score < 5) return 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30';
    if (score <= 7) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30';
    return 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30';
  };

  // Derive upload categories from actual data
  const uploadCategories = useMemo(() => {
    const catMap = new Map<string, number>();
    clients.forEach(c => {
      const cat = extractUploadCategory(c.source_query);
      if (cat) catMap.set(cat, (catMap.get(cat) || 0) + 1);
    });
    return Array.from(catMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [clients]);

  // Derive country codes from actual data
  const countryOptions = useMemo(() => {
    const countryMap = new Map<string, number>();
    clients.forEach(c => {
      const code = extractCountryCode(c.source_query);
      if (code) countryMap.set(code, (countryMap.get(code) || 0) + 1);
    });
    return Array.from(countryMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([code, count]) => ({ code, count }));
  }, [clients]);

  const countryFlag = (code: string): string => {
    const flags: Record<string, string> = { IT: '🇮🇹', US: '🇺🇸', UK: '🇬🇧', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', ES: '🇪🇸' };
    return flags[code] || '🌍';
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const catMatch = selectedCategory === 'all' || extractUploadCategory(c.source_query) === selectedCategory;
      const code = extractCountryCode(c.source_query);
      const langMatch = selectedLanguage === 'all' || (selectedLanguage === 'IT' ? code === 'IT' : (code !== 'IT' && code !== ''));
      return catMatch && langMatch;
    });
  }, [clients, selectedCategory, selectedLanguage]);

  const contactedCount = filteredClients.filter(c => c.contacted).length;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      let rows: any[];
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        // Try semicolon separator first (common in Italian locale CSVs)
        let workbook = XLSX.read(text, { type: 'string', FS: ';' });
        let sheet = workbook.Sheets[workbook.SheetNames[0]];
        let testRows = XLSX.utils.sheet_to_json(sheet);
        // If only 1 column per row, retry with comma separator
        if (testRows.length > 0 && Object.keys(testRows[0]).length <= 1) {
          workbook = XLSX.read(text, { type: 'string' });
          sheet = workbook.Sheets[workbook.SheetNames[0]];
          testRows = XLSX.utils.sheet_to_json(sheet);
        }
        rows = testRows;
      } else {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet);
      }

      // Build a case-insensitive getter for row fields
      const getField = (row: any, ...aliases: string[]): string | null => {
        for (const alias of aliases) {
          for (const key of Object.keys(row)) {
            if (key.toLowerCase().replace(/[\s_-]/g, '') === alias.toLowerCase().replace(/[\s_-]/g, '')) {
              const val = row[key];
              return val !== undefined && val !== null && String(val).trim() !== '' ? String(val).trim() : null;
            }
          }
        }
        return null;
      };

      console.log('CSV headers:', rows.length > 0 ? Object.keys(rows[0]) : 'empty');
      console.log('First row sample:', rows[0]);

      const records = rows.map(row => ({
        name: getField(row, 'name', 'nome', 'businessname', 'business_name', 'ragionesociale') || 'Unknown',
        phone: getField(row, 'phone', 'telefono', 'phonenumber', 'phone_number', 'tel'),
        website: getField(row, 'website', 'sitoweb', 'sito', 'site', 'url', 'web'),
        email: getField(row, 'email', 'emailaddress', 'email_address', 'mail', 'pec'),
        address: getField(row, 'address', 'indirizzo', 'fulladdress', 'full_address', 'street'),
        city: getField(row, 'city', 'città', 'citta', 'locality'),
        state: getField(row, 'state', 'stato', 'regione', 'region', 'provincia'),
        category: getField(row, 'category', 'categoria', 'subtypes', 'type', 'tipo', 'subcategories'),
        rating: (() => { const v = getField(row, 'rating', 'valutazione', 'stars', 'stelle'); return v ? Number(v) : null; })(),
        reviews_count: (() => { const v = getField(row, 'reviews', 'recensioni', 'reviewscount', 'reviews_count', 'numrecensioni'); return v ? Number(v) : null; })(),
        google_id: getField(row, 'google_id', 'googleid', 'placeid', 'place_id'),
        source_query: getField(row, 'query', 'sourcequery', 'source_query', 'ricerca'),
        contacted: false,
      }));
      let inserted = 0;
      for (let i = 0; i < records.length; i += 50) {
        const batch = records.slice(i, i + 50);
        const { error } = await (supabase.from('potential_clients') as any)
          .upsert(batch, { onConflict: 'google_id', ignoreDuplicates: true });
        if (error) throw error;
        inserted += batch.length;
      }
      toast({ title: "Importati!", description: `${inserted} potenziali clienti caricati.` });
      fetchAllClients();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: "Errore", description: error.message || "Upload fallito.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleContacted = async (id: string, current: boolean) => {
    try {
      const { error } = await (supabase.from('potential_clients') as any)
        .update({ contacted: !current })
        .eq('id', id);
      if (error) throw error;
      setClients(prev => prev.map(c => c.id === id ? { ...c, contacted: !current } : c));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this potential client?')) return;
    try {
      const { error } = await (supabase.from('potential_clients') as any).delete().eq('id', id);
      if (error) throw error;
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected clients? This cannot be undone.`)) return;
    try {
      const ids = Array.from(selectedIds);
      const { error } = await (supabase.from('potential_clients') as any).delete().in('id', ids);
      if (error) throw error;
      setClients(prev => prev.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      toast({ title: "Deleted", description: `${ids.length} clients removed.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Delete ALL potential clients? This cannot be undone.')) return;
    try {
      const { error } = await (supabase.from('potential_clients') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      setClients([]);
      setSelectedIds(new Set());
      toast({ title: "Deleted", description: "All potential clients removed." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="glass border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Potential Clients</CardTitle>
            <CardDescription>
              {filteredClients.length} leads · {contactedCount} contacted · {filteredClients.length - contactedCount} remaining
            </CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Uploading...</>
              ) : (
                <><Upload className="h-4 w-4 mr-1" />Upload .xlsx/.csv</>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={runBulkAudit}
              disabled={bulkAuditing}
            >
              {bulkAuditing ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Auditing {bulkProgress.current}/{bulkProgress.total}</>
              ) : (
                <><Search className="h-4 w-4 mr-1" />Bulk Audit</>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={runBulkDraft}
              disabled={bulkDrafting}
            >
              {bulkDrafting ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Drafting {bulkDraftProgress.current}/{bulkDraftProgress.total}</>
              ) : (
                <><Mail className="h-4 w-4 mr-1" />Bulk Draft</>
              )}
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => openCampaignDialog('selected')}
              disabled={!!activeBatch || selectedIds.size === 0}
              title="Invio SMTP via Hostinger ai selezionati"
            >
              <Send className="h-4 w-4 mr-1" />Send Campaign (Selected)
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => openCampaignDialog('uncontacted')}
              disabled={!!activeBatch}
              title="Invio SMTP via Hostinger a tutti i non contattati"
            >
              <Send className="h-4 w-4 mr-1" />Send Campaign (Uncontacted)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const next = !showLog;
                setShowLog(next);
                if (next) {
                  fetchEmailLog();
                  setTimeout(() => emailLogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                }
              }}
            >
              📋 Email Log
            </Button>
            {selectedIds.size > 0 && (
              <Button size="sm" variant="destructive" onClick={handleDeleteSelected}>
                <Trash2 className="h-4 w-4 mr-1" />Delete Selected ({selectedIds.size})
              </Button>
            )}
            {clients.length > 0 && (
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDeleteAll}>
                <Trash2 className="h-4 w-4 mr-1" />Clear All
              </Button>
            )}
          </div>
        </div>
        {/* Filter chips */}
        {uploadCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              size="sm"
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className="h-7 text-xs"
              onClick={() => setSelectedCategory('all')}
            >
              Tutte ({clients.length})
            </Button>
            {uploadCategories.map(({ name, count }) => (
              <Button
                key={name}
                size="sm"
                variant={selectedCategory === name ? 'default' : 'outline'}
                className="h-7 text-xs capitalize"
                onClick={() => setSelectedCategory(name)}
              >
                {name} ({count})
              </Button>
            ))}
          </div>
        )}
        {/* Language filter: Tutti / Italiani / Inglesi */}
        <div className="flex flex-wrap gap-2 mt-2">
          <Button
            size="sm"
            variant={selectedLanguage === 'all' ? 'default' : 'outline'}
            className="h-7 text-xs"
            onClick={() => setSelectedLanguage('all')}
          >
            🌍 Tutti ({clients.length})
          </Button>
          <Button
            size="sm"
            variant={selectedLanguage === 'IT' ? 'default' : 'outline'}
            className="h-7 text-xs"
            onClick={() => setSelectedLanguage('IT')}
          >
            🇮🇹 Italiani ({clients.filter(c => extractCountryCode(c.source_query) === 'IT').length})
          </Button>
          <Button
            size="sm"
            variant={selectedLanguage === 'EN' ? 'default' : 'outline'}
            className="h-7 text-xs"
            onClick={() => setSelectedLanguage('EN')}
          >
            🇬🇧 Inglesi ({clients.filter(c => extractCountryCode(c.source_query) !== 'IT' && extractCountryCode(c.source_query) !== '').length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No potential clients yet. Upload an Outscraper .xlsx or .csv file to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]">#</TableHead>
                  <TableHead className="w-[60px] pl-2 text-xs whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Checkbox
                      checked={selectedIds.size === filteredClients.length && filteredClients.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedIds(new Set(filteredClients.map(c => c.id)));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                      aria-label="Seleziona tutti"
                    />
                      <span>Mail To</span>
                    </div>
                  </TableHead>
                  <TableHead className="w-[50px]">✓</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="w-[120px]">Email</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="whitespace-nowrap">Date Added</TableHead>
                  <TableHead>Audit</TableHead>
                  <TableHead>Draft</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client, index) => (
                  <TableRow key={client.id} className={client.contacted ? 'opacity-50' : ''}>
                    <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="pl-2">
                      <div className="flex items-center gap-1.5">
                        <Checkbox
                          checked={selectedIds.has(client.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedIds);
                            if (checked) {
                              newSelected.add(client.id);
                            } else {
                              newSelected.delete(client.id);
                            }
                            setSelectedIds(newSelected);
                          }}
                          aria-label={`Seleziona ${client.name}`}
                        />
                        {client.email && sentEmailsSet.has(client.email.toLowerCase()) && (
                          <span title="Email già inviata in una campagna precedente">
                            <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="Email inviata" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={client.contacted}
                        onCheckedChange={() => toggleContacted(client.id, client.contacted)}
                        aria-label="Contacted"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-white">{client.name}</div>
                      {client.source_query && (
                        <div className="text-xs text-muted-foreground">from: {client.source_query}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {client.phone && (
                          <a href={`sms:${client.phone}&body=${encodeURIComponent("Hi, do you have an email address where I can reach you?")}`} className="text-sm flex items-center gap-1 text-primary hover:underline">
                            <Phone className="h-3 w-3" />{client.phone}
                          </a>
                        )}
                        {client.website && (
                          <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noopener noreferrer" className="text-sm flex items-center gap-1 text-white hover:underline">
                            <Globe className="h-3 w-3" />Website
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingEmailId === client.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editingEmailValue}
                            onChange={(e) => setEditingEmailValue(e.target.value)}
                            placeholder="email@example.com"
                            className="h-7 text-sm w-40"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEmail(client.id);
                              if (e.key === 'Escape') cancelEditEmail();
                            }}
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveEmail(client.id)}>
                            <Check className="h-3 w-3 text-green-500" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditEmail}>
                            <X className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {client.email ? (
                            <a href={`mailto:${client.email}`} className="text-sm text-primary hover:underline flex items-center gap-1 truncate max-w-[100px]" title={client.email}>
                              <Mail className="h-3 w-3 shrink-0" /><span className="truncate">{client.email}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-50 hover:opacity-100" onClick={() => startEditEmail(client)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {(client.city || client.state) && (
                        <div className="text-sm flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[client.city, client.state].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm">{client.rating}</span>
                          {client.reviews_count && (
                            <span className="text-xs text-muted-foreground">({client.reviews_count})</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.category && <Badge variant="outline" className="text-xs">{client.category}</Badge>}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {client.created_at ? new Date(client.created_at).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const audit = audits[client.id];
                        if (auditingIds.has(client.id)) {
                          return <span className="text-xs flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Analyzing...</span>;
                        }
                        if (audit?.status === 'completed') {
                          return (
                            <Badge
                              className={`cursor-pointer ${scoreBadgeClass(audit.overall_score)}`}
                              onClick={() => { setSelectedAudit({ ...audit, lead_email: client.email }); setAuditModalOpen(true); }}
                            >
                              {audit.overall_score}/10
                            </Badge>
                          );
                        }
                        if (audit?.status === 'running') {
                          return <span className="text-xs flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Running...</span>;
                        }
                        if (client.website) {
                          return (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => runAudit(client, 'it')}>
                                🇮🇹 Agente IT
                              </Button>
                              <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => runAudit(client, 'en')}>
                                🇬🇧 Agent ENG
                              </Button>
                            </div>
                          );
                        }
                        return <span className="text-xs text-muted-foreground">—</span>;
                      })()}
                    </TableCell>
                    <TableCell>
                      {client.email && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-6 text-xs"
                            disabled={draftingIds.has(`${client.id}-it`)}
                            onClick={() => createGmailDraft(client, 'it')}>
                            {draftingIds.has(`${client.id}-it`) ? <Loader2 className="h-3 w-3 animate-spin" /> : '🇮🇹'}
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 text-xs"
                            disabled={draftingIds.has(`${client.id}-en`)}
                            onClick={() => createGmailDraft(client, 'en')}>
                            {draftingIds.has(`${client.id}-en`) ? <Loader2 className="h-3 w-3 animate-spin" /> : '🇬🇧'}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(client.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Bulk progress bar */}
      {bulkAuditing && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">Auditing {bulkProgress.current}/{bulkProgress.total} leads...</span>
          </div>
          <Progress value={(bulkProgress.current / bulkProgress.total) * 100} className="h-2" />
        </div>
      )}

      {/* Active SMTP campaign progress panel */}
      {activeBatch && (
        <div className="px-6 pb-4">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium flex items-center gap-2">
                <Send className="h-4 w-4 text-primary animate-pulse" />
                Campagna SMTP in corso
              </div>
              <Button size="sm" variant="destructive" onClick={stopActiveBatch}>
                <StopCircle className="h-4 w-4 mr-1" />Stop Batch
              </Button>
            </div>
            <Progress
              value={((activeBatch.sent_count + activeBatch.failed_count + activeBatch.skipped_count) / Math.max(1, activeBatch.total)) * 100}
              className="h-2"
            />
            <div className="flex flex-wrap gap-3 text-xs">
              <span>✅ Sent: <strong>{activeBatch.sent_count}</strong></span>
              <span>❌ Failed: <strong>{activeBatch.failed_count}</strong></span>
              <span>⏭️ Skipped: <strong>{activeBatch.skipped_count}</strong></span>
              <span>⏳ Remaining: <strong>{activeBatch.total - activeBatch.sent_count - activeBatch.failed_count - activeBatch.skipped_count}</strong></span>
              <span className="text-muted-foreground">Totale: {activeBatch.total}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs pt-1">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30">
                📅 Daily quota: {Math.max(0, DAILY_CAP - dailySent)}/{DAILY_CAP} left (rolling 24h)
              </Badge>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30">
                ⏱ Rate: 1 email / 96s (~37/h)
              </Badge>
            </div>
            {activeBatch.paused_reason && pauseCountdown && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs p-2 flex items-center gap-2">
                ⏸️ <strong>Paused</strong> ({activeBatch.paused_reason === 'daily_cap' ? 'daily cap reached' : 'hourly cap reached'}) — resumes in <strong>{pauseCountdown}</strong>
              </div>
            )}
            {activeBatch.last_heartbeat_at && (
              <div className="text-xs text-muted-foreground">
                💓 Last heartbeat: {new Date(activeBatch.last_heartbeat_at).toLocaleTimeString()}
                {' '}({Math.round((Date.now() - new Date(activeBatch.last_heartbeat_at).getTime()) / 1000)}s ago)
              </div>
            )}
            {activeBatch.last_error && (
              <div className="text-xs text-destructive truncate">Ultimo errore: {activeBatch.last_error}</div>
            )}
          </div>
        </div>
      )}

      {/* Email Log */}
      {showLog && (
        <div ref={emailLogRef} className="px-6 pb-6 scroll-mt-4">
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium">
                  📋 Email Log — {logTotals.total.toLocaleString()} righe totali · {emailLog.length.toLocaleString()} caricate
                </div>
                <div className="text-xs text-muted-foreground flex gap-3 flex-wrap">
                  <span className="text-green-400">✓ Inviate: <strong>{logTotals.sent.toLocaleString()}</strong></span>
                  <span className="text-red-400">✗ Fallite: <strong>{logTotals.failed.toLocaleString()}</strong></span>
                  <span className="text-yellow-400">⊘ Saltate: <strong>{logTotals.skipped.toLocaleString()}</strong></span>
                  <span>👥 Clienti unici contattati: <strong>{sentEmailsSet.size.toLocaleString()}</strong></span>
                </div>
              </div>
              <div className="flex gap-1">
                {(['all', 'sent', 'failed', 'skipped'] as const).map(f => (
                  <Button key={f} size="sm" variant={logFilter === f ? 'default' : 'outline'}
                    className="h-6 text-xs capitalize" onClick={() => setLogFilter(f)}>
                    {f}
                  </Button>
                ))}
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={fetchEmailLog}>
                  🔄
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Recipient</TableHead>
                    <TableHead className="text-xs">Subject</TableHead>
                    <TableHead className="text-xs">Lang</TableHead>
                    <TableHead className="text-xs">When</TableHead>
                    <TableHead className="text-xs">Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailLog
                    .filter(l => logFilter === 'all' || l.status === logFilter)
                    .map(l => (
                      <TableRow key={l.id}>
                        <TableCell>
                          <Badge variant="outline" className={
                            l.status === 'sent' ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : l.status === 'failed' ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          }>
                            {l.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{l.recipient_email}</TableCell>
                        <TableCell className="text-xs max-w-[300px] truncate" title={l.subject}>{l.subject || '—'}</TableCell>
                        <TableCell className="text-xs">{l.language || '—'}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-xs max-w-[250px] truncate text-destructive" title={l.error_message}>{l.error_message || ''}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              {emailLog.filter(l => logFilter === 'all' || l.status === logFilter).length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-4">Nessun log da mostrare.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Campaign confirm dialog */}
      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma invio campagna SMTP</DialogTitle>
            <DialogDescription>
              Stai per inviare email via Hostinger SMTP a <strong>{campaignDialogData?.label}</strong>.
            </DialogDescription>
          </DialogHeader>
          {campaignDialogData && (
            <div className="space-y-2 text-sm">
              <div>📨 Destinatari totali: <strong>{campaignDialogData.ids.length}</strong></div>
              <div>⏭️ Già inviati in passato (verranno saltati): <strong>{campaignDialogData.alreadySentCount}</strong></div>
              <div>📧 Nuovi invii effettivi: <strong>{campaignDialogData.ids.length - campaignDialogData.alreadySentCount}</strong></div>
              {(() => {
                const newSends = campaignDialogData.ids.length - campaignDialogData.alreadySentCount;
                const dailyRemaining = Math.max(0, DAILY_CAP - dailySent);
                const overflow = newSends - dailyRemaining;
                return overflow > 0 ? (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs p-2">
                    ⚠️ Solo <strong>{dailyRemaining}</strong> di <strong>{newSends}</strong> verranno inviate oggi (cap: {DAILY_CAP}/24h). Le restanti <strong>{overflow}</strong> verranno mandate man mano che gli invii più vecchi escono dalla finestra di 24h.
                  </div>
                ) : null;
              })()}
              <div className="text-muted-foreground text-xs">
                Tempo stimato: ~{Math.ceil((campaignDialogData.ids.length - campaignDialogData.alreadySentCount) * 3 / 60)} min (3s tra un invio · cap {HOURLY_CAP}/h · {DAILY_CAP}/24h).
              </div>
              <div className="text-muted-foreground text-xs">
                Lingua decisa per ogni lead in base al suo source_query (IT → italiano, altrimenti inglese).
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCampaignDialogOpen(false)}>Annulla</Button>
            <Button onClick={launchCampaign}>
              <Send className="h-4 w-4 mr-1" />Avvia campagna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Report Modal */}
      <AuditReportModal
        audit={selectedAudit}
        open={auditModalOpen}
        onOpenChange={setAuditModalOpen}
      />

      {/* Back to top floating button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 z-50 shadow-lg"
        title="Torna su"
      >
        ↑ Back Up
      </Button>
    </Card>
  );
};

export default PotentialClients;
