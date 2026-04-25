import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2, Phone, Globe, MapPin, Star, Users, Mail, Pencil, Check, X, Send, StopCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import * as XLSX from 'xlsx';

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

const TABLE = 'potential_clients_reserva_mesa';
const LOG_TABLE = 'campaign_email_log_reserva_mesa';
const BATCH_TABLE = 'email_batches_reserva_mesa';
const SEND_FN = 'send-reserva-mesa-batch';

const PotentialClientsReservaMesa: React.FC = () => {
  const [clients, setClients] = useState<PotentialClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [editingEmailValue, setEditingEmailValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Campaign state
  const [activeBatch, setActiveBatch] = useState<any>(null);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [campaignDialogData, setCampaignDialogData] = useState<{ ids: string[]; alreadySentCount: number; label: string } | null>(null);
  const [emailLog, setEmailLog] = useState<any[]>([]);
  const [sentEmailsSet, setSentEmailsSet] = useState<Set<string>>(new Set());
  const [logFilter, setLogFilter] = useState<'all' | 'sent' | 'failed' | 'skipped'>('all');
  const [showLog, setShowLog] = useState(false);
  const emailLogRef = useRef<HTMLDivElement>(null);

  const DAILY_CAP = 900;
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
      const { error } = await (supabase.from(TABLE) as any)
        .update({ email: editingEmailValue || null })
        .eq('id', id);
      if (error) throw error;
      setClients(prev => prev.map(c => c.id === id ? { ...c, email: editingEmailValue || null } : c));
      setEditingEmailId(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const fetchAllClients = async () => {
    try {
      let allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await (supabase.from(TABLE) as any)
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
      console.error('Error fetching Reserva Mesa clients:', error);
      toast({ title: "Error", description: "Failed to load clients.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAllClients(); }, []);

  const fetchActiveBatch = async () => {
    const { data } = await (supabase.from(BATCH_TABLE) as any)
      .select('*')
      .in('status', ['running'])
      .order('started_at', { ascending: false })
      .limit(1);
    setActiveBatch(data && data.length > 0 ? data[0] : null);
  };

  const fetchEmailLog = async () => {
    const [allCnt, sentCnt, failedCnt, skippedCnt] = await Promise.all([
      (supabase.from(LOG_TABLE) as any).select('id', { count: 'exact', head: true }),
      (supabase.from(LOG_TABLE) as any).select('id', { count: 'exact', head: true }).eq('status', 'sent'),
      (supabase.from(LOG_TABLE) as any).select('id', { count: 'exact', head: true }).eq('status', 'failed'),
      (supabase.from(LOG_TABLE) as any).select('id', { count: 'exact', head: true }).eq('status', 'skipped'),
    ]);
    setLogTotals({
      total: allCnt.count ?? 0,
      sent: sentCnt.count ?? 0,
      failed: failedCnt.count ?? 0,
      skipped: skippedCnt.count ?? 0,
    });

    const pageSize = 1000;
    let allLog: any[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await (supabase.from(LOG_TABLE) as any)
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);
      if (error || !data || data.length === 0) break;
      allLog = allLog.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    setEmailLog(allLog);

    const sentEmails = new Set<string>();
    let sFrom = 0;
    while (true) {
      const { data, error } = await (supabase.from(LOG_TABLE) as any)
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

  const fetchQuotas = async () => {
    const nowMs = Date.now();
    const dayAgo = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString();
    const hourAgo = new Date(nowMs - 60 * 60 * 1000).toISOString();
    const [{ count: d }, { count: h }] = await Promise.all([
      (supabase.from(LOG_TABLE) as any).select('id', { count: 'exact', head: true })
        .eq('status', 'sent').gte('sent_at', dayAgo),
      (supabase.from(LOG_TABLE) as any).select('id', { count: 'exact', head: true })
        .eq('status', 'sent').gte('sent_at', hourAgo),
    ]);
    setDailySent(d ?? 0);
    setHourlySent(h ?? 0);
  };

  useEffect(() => { fetchQuotas(); }, []);

  // Poll while running
  useEffect(() => {
    if (!activeBatch || activeBatch.status !== 'running') return;
    const interval = setInterval(async () => {
      const { data } = await (supabase.from(BATCH_TABLE) as any)
        .select('*').eq('id', activeBatch.id).single();
      if (data) {
        setActiveBatch(data.status === 'running' ? data : null);
        if (data.status !== 'running') {
          fetchEmailLog();
          fetchAllClients();
          toast({
            title: data.status === 'completed' ? '✅ Campagna CR completata' : data.status === 'stopped' ? '🛑 Campagna CR fermata' : '❌ Campagna CR fallita',
            description: `Inviate: ${data.sent_count} · Fallite: ${data.failed_count} · Saltate: ${data.skipped_count}`,
            variant: data.status === 'failed' ? 'destructive' : 'default',
          });
        }
      }
      fetchQuotas();
    }, 2000);
    return () => clearInterval(interval);
  }, [activeBatch?.id, activeBatch?.status]);

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
      pool = clients.filter(c => selectedIds.has(c.id) && c.email);
      label = `${pool.length} selezionati`;
    } else {
      pool = clients.filter(c => c.email && !c.contacted);
      label = `${pool.length} non contattati`;
    }
    if (pool.length === 0) {
      toast({ title: 'Nessun destinatario', description: 'Nessun lead con email valida.', variant: 'destructive' });
      return;
    }
    const emails = pool.map(c => c.email!);
    const { data: dup } = await (supabase.from(LOG_TABLE) as any)
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
      const { data: batch, error } = await (supabase.from(BATCH_TABLE) as any)
        .insert({
          status: 'running',
          total: ids.length,
          prospect_ids: ids,
        })
        .select()
        .single();
      if (error) throw error;
      await supabase.functions.invoke(SEND_FN, { body: { batch_id: batch.id } });
      setActiveBatch(batch);
      setCampaignDialogOpen(false);
      setCampaignDialogData(null);
      toast({ title: '🚀 Campagna CR avviata', description: `Invio di ${ids.length} email in background.` });
    } catch (e: any) {
      toast({ title: 'Errore avvio campagna', description: e.message, variant: 'destructive' });
    }
  };

  const stopActiveBatch = async () => {
    if (!activeBatch) return;
    if (!confirm('Fermare la campagna in corso?')) return;
    try {
      await (supabase.from(BATCH_TABLE) as any)
        .update({ stop_requested: true })
        .eq('id', activeBatch.id);
      toast({ title: '🛑 Stop richiesto', description: 'La campagna si fermerà entro pochi secondi.' });
    } catch (e: any) {
      toast({ title: 'Errore', description: e.message, variant: 'destructive' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      let rows: any[];
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        let workbook = XLSX.read(text, { type: 'string', FS: ';' });
        let sheet = workbook.Sheets[workbook.SheetNames[0]];
        let testRows = XLSX.utils.sheet_to_json(sheet);
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

      const records = rows.map(row => ({
        name: getField(row, 'name', 'nombre', 'businessname', 'business_name') || 'Unknown',
        phone: getField(row, 'phone', 'telefono', 'phonenumber', 'phone_number', 'tel'),
        website: getField(row, 'website', 'sitio', 'sitioweb', 'site', 'url', 'web'),
        email: getField(row, 'email', 'correo', 'emailaddress', 'email_address', 'mail'),
        address: getField(row, 'address', 'direccion', 'fulladdress', 'full_address', 'street'),
        city: getField(row, 'city', 'ciudad', 'locality'),
        state: getField(row, 'state', 'estado', 'provincia', 'region'),
        category: getField(row, 'category', 'categoria', 'subtypes', 'type', 'tipo'),
        rating: (() => { const v = getField(row, 'rating', 'valoracion', 'stars', 'estrellas'); return v ? Number(v) : null; })(),
        reviews_count: (() => { const v = getField(row, 'reviews', 'reseñas', 'resenas', 'reviewscount', 'reviews_count'); return v ? Number(v) : null; })(),
        google_id: getField(row, 'google_id', 'googleid', 'placeid', 'place_id'),
        source_query: getField(row, 'query', 'sourcequery', 'source_query', 'busqueda'),
        contacted: false,
      }));
      let inserted = 0;
      for (let i = 0; i < records.length; i += 50) {
        const batch = records.slice(i, i + 50);
        const { error } = await (supabase.from(TABLE) as any)
          .upsert(batch, { onConflict: 'google_id', ignoreDuplicates: true });
        if (error) throw error;
        inserted += batch.length;
      }
      toast({ title: "Importati!", description: `${inserted} clienti CR caricati.` });
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
      const { error } = await (supabase.from(TABLE) as any)
        .update({ contacted: !current })
        .eq('id', id);
      if (error) throw error;
      setClients(prev => prev.map(c => c.id === id ? { ...c, contacted: !current } : c));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo cliente?')) return;
    try {
      const { error } = await (supabase.from(TABLE) as any).delete().eq('id', id);
      if (error) throw error;
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Eliminare ${selectedIds.size} clienti selezionati?`)) return;
    try {
      const ids = Array.from(selectedIds);
      const { error } = await (supabase.from(TABLE) as any).delete().in('id', ids);
      if (error) throw error;
      setClients(prev => prev.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      toast({ title: "Eliminati", description: `${ids.length} clienti rimossi.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Eliminare TUTTI i clienti CR? Non si può annullare.')) return;
    try {
      const { error } = await (supabase.from(TABLE) as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      setClients([]);
      setSelectedIds(new Set());
      toast({ title: "Eliminati", description: "Tutti i clienti CR rimossi." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const contactedCount = clients.filter(c => c.contacted).length;
  const filteredLog = useMemo(() => {
    if (logFilter === 'all') return emailLog;
    return emailLog.filter(l => l.status === logFilter);
  }, [emailLog, logFilter]);

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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle>🇨🇷 Potential Clients · Reserva Mesa</CardTitle>
            <CardDescription>
              {clients.length} leads · {contactedCount} contattati · {clients.length - contactedCount} rimanenti
              <span className="ml-3 text-xs">Quota: {dailySent}/{DAILY_CAP} (24h) · {hourlySent} (1h)</span>
            </CardDescription>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? (<><Loader2 className="h-4 w-4 mr-1 animate-spin" />Uploading...</>) : (<><Upload className="h-4 w-4 mr-1" />Upload .xlsx/.csv</>)}
            </Button>
            <Button size="sm" variant="default" onClick={() => openCampaignDialog('selected')} disabled={!!activeBatch || selectedIds.size === 0}>
              <Send className="h-4 w-4 mr-1" />Send (Selected)
            </Button>
            <Button size="sm" variant="default" onClick={() => openCampaignDialog('uncontacted')} disabled={!!activeBatch}>
              <Send className="h-4 w-4 mr-1" />Send (Uncontacted)
            </Button>
            {activeBatch && (
              <Button size="sm" variant="destructive" onClick={stopActiveBatch}>
                <StopCircle className="h-4 w-4 mr-1" />Stop
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => {
              const next = !showLog;
              setShowLog(next);
              if (next) {
                fetchEmailLog();
                setTimeout(() => emailLogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
              }
            }}>
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
        {activeBatch && (
          <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">🚀 Campagna in corso · {activeBatch.cursor}/{activeBatch.total}</span>
              <span className="text-xs text-muted-foreground">
                ✅ {activeBatch.sent_count} · ❌ {activeBatch.failed_count} · ⏭ {activeBatch.skipped_count}
              </span>
            </div>
            <Progress value={(activeBatch.cursor / Math.max(activeBatch.total, 1)) * 100} className="h-2" />
            {activeBatch.paused_until && (
              <div className="mt-2 text-xs text-yellow-400">⏸ In pausa ({activeBatch.paused_reason}) — riprende tra {pauseCountdown}</div>
            )}
            {activeBatch.last_error && (
              <div className="mt-2 text-xs text-red-400">⚠ {activeBatch.last_error}</div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nessun cliente CR ancora. Carica un file .xlsx o .csv per iniziare.</p>
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
                        checked={selectedIds.size === clients.length && clients.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedIds(new Set(clients.map(c => c.id)));
                          else setSelectedIds(new Set());
                        }}
                      />
                      <span>Mail To</span>
                    </div>
                  </TableHead>
                  <TableHead className="w-[50px]">✓</TableHead>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="w-[120px]">Email</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client, index) => (
                  <TableRow key={client.id} className={client.contacted ? 'opacity-50' : ''}>
                    <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="pl-2">
                      <div className="flex items-center gap-1.5">
                        <Checkbox
                          checked={selectedIds.has(client.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedIds);
                            if (checked) newSelected.add(client.id);
                            else newSelected.delete(client.id);
                            setSelectedIds(newSelected);
                          }}
                        />
                        {client.email && sentEmailsSet.has(client.email.toLowerCase()) && (
                          <span title="Email già inviata">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Checkbox checked={client.contacted} onCheckedChange={() => toggleContacted(client.id, client.contacted)} />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{client.name}</div>
                      {client.website && (
                        <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                          <Globe className="h-3 w-3" />{client.website}
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.phone && (
                        <div className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" />{client.phone}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingEmailId === client.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editingEmailValue}
                            onChange={(e) => setEditingEmailValue(e.target.value)}
                            className="h-7 text-xs"
                            type="email"
                          />
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveEmail(client.id)}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingEmailId(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 group">
                          <span className="text-xs">{client.email || <span className="text-muted-foreground italic">no email</span>}</span>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100" onClick={() => startEditEmail(client)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{[client.city, client.state].filter(Boolean).join(', ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.rating && (
                        <div className="text-xs flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />{client.rating} ({client.reviews_count || 0})
                        </div>
                      )}
                    </TableCell>
                    <TableCell><span className="text-xs">{client.category}</span></TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(client.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {showLog && (
          <div ref={emailLogRef} className="mt-6 border-t border-primary/20 pt-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="font-semibold">Email Log · CR</h3>
              <div className="flex gap-2 text-xs">
                <Button size="sm" variant={logFilter === 'all' ? 'default' : 'outline'} className="h-7" onClick={() => setLogFilter('all')}>
                  Tutti ({logTotals.total})
                </Button>
                <Button size="sm" variant={logFilter === 'sent' ? 'default' : 'outline'} className="h-7" onClick={() => setLogFilter('sent')}>
                  ✅ Inviate ({logTotals.sent})
                </Button>
                <Button size="sm" variant={logFilter === 'failed' ? 'default' : 'outline'} className="h-7" onClick={() => setLogFilter('failed')}>
                  ❌ Fallite ({logTotals.failed})
                </Button>
                <Button size="sm" variant={logFilter === 'skipped' ? 'default' : 'outline'} className="h-7" onClick={() => setLogFilter('skipped')}>
                  ⏭ Saltate ({logTotals.skipped})
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quando</TableHead>
                    <TableHead>Errore</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLog.slice(0, 200).map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs">{l.recipient_email}</TableCell>
                      <TableCell className="text-xs max-w-[300px] truncate">{l.subject}</TableCell>
                      <TableCell className="text-xs">
                        {l.status === 'sent' && '✅'}
                        {l.status === 'failed' && '❌'}
                        {l.status === 'skipped' && '⏭'}
                        {' '}{l.status}
                      </TableCell>
                      <TableCell className="text-xs">
                        {l.sent_at ? new Date(l.sent_at).toLocaleString() : new Date(l.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-red-400 max-w-[300px] truncate">{l.error_message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredLog.length > 200 && (
                <p className="text-xs text-muted-foreground mt-2">Mostrando prime 200 di {filteredLog.length} righe.</p>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🚀 Lanciare campagna Costa Rica?</DialogTitle>
            <DialogDescription>
              {campaignDialogData && (
                <>
                  Stai per inviare email in spagnolo a <strong>{campaignDialogData.label}</strong> dal mittente <strong>info@reservamesa.cr</strong>.
                  {campaignDialogData.alreadySentCount > 0 && (
                    <div className="mt-2 text-yellow-400">
                      ⚠ {campaignDialogData.alreadySentCount} di questi destinatari hanno già ricevuto un'email — verranno saltati automaticamente.
                    </div>
                  )}
                  <div className="mt-2 text-xs">Cap giornaliero: {DAILY_CAP} email/24h. Delay: ~96s tra invii.</div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCampaignDialogOpen(false)}>Annulla</Button>
            <Button onClick={launchCampaign}>
              <Send className="h-4 w-4 mr-1" />Avvia campagna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PotentialClientsReservaMesa;
