import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, TrendingUp, Clock, Mail, Phone, Globe, MessageSquare, Palette, Image, Code, Copy, Check, Trash2, Rocket, ExternalLink, Download, Pencil, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import PotentialClients from './PotentialClients';
import PotentialClientsReservaMesa from './PotentialClientsReservaMesa';
import AuditsTab from './AuditsTab';
import ReVideosAdminTab from './ReVideosAdminTab';

interface ClientSignup {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_type: string | null;
  website: string | null;
  social_media: string | null;
  desired_services: string;
  created_at: string;
  updated_at: string;
}

interface WebsiteRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string;
  business_type: string | null;
  logo_url: string | null;
  color_palette: string;
  mockup_url: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  demo_url: string | null;
  demo_site_id: string | null;
  demo_deployed_at: string | null;
  demo_status: string;
  generated_code: string | null;
  generation_session_id: string | null;
  generation_status: string;
  generation_error: string | null;
  generation_started_at: string | null;
  generation_completed_at: string | null;
}

const AdminDashboard: React.FC = () => {
  const [signups, setSignups] = useState<ClientSignup[]>([]);
  const [websiteRequests, setWebsiteRequests] = useState<WebsiteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, thisMonth: 0 });
  const [generatingCodeFor, setGeneratingCodeFor] = useState<string | null>(null);
  const [fetchingResultFor, setFetchingResultFor] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [generatedCodes, setGeneratedCodes] = useState<Record<string, string>>({});
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deployingDemoFor, setDeployingDemoFor] = useState<string | null>(null);
  const [copiedDemoUrl, setCopiedDemoUrl] = useState<string | null>(null);
  const [editingNotesFor, setEditingNotesFor] = useState<string | null>(null);
  const [editNotesValue, setEditNotesValue] = useState('');
  const [potentialClientsCount, setPotentialClientsCount] = useState<number>(0);
  const [reservaMesaCount, setReservaMesaCount] = useState<number>(0);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [signupsRes, websiteRes, potentialCountRes, reservaCountRes] = await Promise.all([
        supabase.from('client_signups').select('*').order('created_at', { ascending: false }),
        (supabase.from('website_requests') as any).select('*').order('created_at', { ascending: false }),
        supabase.from('potential_clients').select('*', { count: 'exact', head: true }),
        (supabase.from('potential_clients_reserva_mesa') as any).select('*', { count: 'exact', head: true }),
      ]);
      setPotentialClientsCount(potentialCountRes.count || 0);
      setReservaMesaCount(reservaCountRes.count || 0);

      if (signupsRes.error) throw signupsRes.error;
      setSignups(signupsRes.data || []);
      const wsData = websiteRes.data || [];
      setWebsiteRequests(wsData);

      // Pre-populate generatedCodes from DB
      const codesFromDb: Record<string, string> = {};
      wsData.forEach((r: any) => {
        if (r.generated_code) codesFromDb[r.id] = r.generated_code;
      });
      setGeneratedCodes(prev => ({ ...prev, ...codesFromDb }));

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const allData = [...(signupsRes.data || []), ...(websiteRes.data || [])];

      setStats({
        total: allData.length,
        thisWeek: allData.filter(d => new Date(d.created_at) >= weekAgo).length,
        thisMonth: allData.filter(d => new Date(d.created_at) >= monthAgo).length,
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatServiceName = (service: string) =>
    service.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const getServiceBadgeVariant = (service: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'web-development': 'default', 'mobile-apps': 'secondary', 'ui-ux-design': 'outline',
      'digital-marketing': 'destructive', 'e-commerce': 'default', 'branding': 'secondary',
      'consultation': 'outline', 'multiple': 'destructive', 'other': 'secondary',
    };
    return variants[service] || 'outline';
  };

  const handleGenerateCode = async (req: WebsiteRequest) => {
    setGeneratingCodeFor(req.id);
    try {
      await (supabase.from('website_requests') as any).update({ generated_code: null, generation_status: 'starting', generation_error: null }).eq('id', req.id);
      const { data, error } = await supabase.functions.invoke('convert-mockup-to-code', {
        body: {
          mockupUrl: req.mockup_url,
          businessName: req.business_name,
          businessType: req.business_type,
          colorPalette: req.color_palette,
          notes: req.notes,
          requestId: req.id,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to start generation');

      // Update local state with session info
      setWebsiteRequests(prev => prev.map(r => r.id === req.id ? {
        ...r,
        generation_session_id: data.sessionId,
        generation_status: 'processing',
        generation_started_at: new Date().toISOString(),
        generated_code: null,
        generation_error: null,
      } : r));

      toast({ title: "✅ Generazione avviata!", description: "L'agente sta lavorando. Tra 5-10 minuti clicca '📥 Recupera Codice' per scaricare il risultato." });
    } catch (error: any) {
      console.error('Error starting generation:', error);
      toast({ title: "Errore", description: error.message || "Avvio generazione fallito.", variant: "destructive" });
    } finally {
      setGeneratingCodeFor(null);
    }
  };

  const handleFetchResult = async (req: WebsiteRequest) => {
    if (!req.generation_session_id) {
      toast({ title: "Errore", description: "Nessuna sessione attiva. Avvia prima la generazione.", variant: "destructive" });
      return;
    }
    setFetchingResultFor(req.id);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-agent-result', {
        body: {
          sessionId: req.generation_session_id,
          requestId: req.id,
        },
      });

      if (error) throw error;

      if (data?.agentStatus === 'running' || data?.agentStatus === 'processing') {
        toast({ title: "⏳ Ancora in corso", description: "L'agente sta ancora lavorando. Riprova tra qualche minuto." });
        return;
      }

      if (!data?.success) {
        const errMsg = data?.error || 'Nessun codice trovato';
        setWebsiteRequests(prev => prev.map(r => r.id === req.id ? { ...r, generation_status: 'failed', generation_error: errMsg } : r));
        toast({ title: "Errore", description: errMsg, variant: "destructive" });
        return;
      }

      // Reload the record from DB to get the saved code
      const { data: record } = await (supabase.from('website_requests') as any)
        .select('generated_code, generation_status')
        .eq('id', req.id)
        .single();

      if (record?.generated_code) {
        setGeneratedCodes(prev => ({ ...prev, [req.id]: record.generated_code }));
        setGeneratedCode(record.generated_code);
        setCodeDialogOpen(true);
        setWebsiteRequests(prev => prev.map(r => r.id === req.id ? { ...r, generated_code: record.generated_code, generation_status: 'completed' } : r));
        toast({ title: "🎉 Codice recuperato!", description: `${data.codeLength} caratteri di codice React pronti.` });
      }
    } catch (error: any) {
      console.error('Error fetching result:', error);
      toast({ title: "Errore", description: error.message || "Recupero risultato fallito.", variant: "destructive" });
    } finally {
      setFetchingResultFor(null);
    }
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copiato!", description: "Codice copiato negli appunti." });
  };

  const handleDownloadHtml = (req: WebsiteRequest) => {
    const code = generatedCodes[req.id];
    if (!code) return;

    let cleanCode = code
      .replace(/^\s*import\s+.*?['";\n]/gm, '')
      .replace(/^\s*export\s+default\s+\w+;?\s*$/gm, '')
      .replace(/^\s*export\s+default\s+function\s+/gm, 'function ')
      .replace(/^\s*export\s+function\s+/gm, 'function ');
    if (/function\s+WebsitePage/.test(cleanCode) && !/function\s+App/.test(cleanCode)) {
      cleanCode += '\nconst App = WebsitePage;';
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${req.business_name} - Website Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; margin: 0; }</style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${cleanCode}
    const Component = typeof App !== 'undefined' ? App : (typeof Default !== 'undefined' ? Default : () => React.createElement('div', null, 'Component not found'));
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Component));
  <\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${req.business_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-preview.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeployDemo = async (req: WebsiteRequest) => {
    const code = generatedCodes[req.id];
    if (!code) {
      toast({ title: "Errore", description: "Genera prima il codice React.", variant: "destructive" });
      return;
    }
    setDeployingDemoFor(req.id);
    try {
      const { data, error } = await supabase.functions.invoke('deploy-demo', {
        body: {
          request_id: req.id,
          business_name: req.business_name,
          react_code: code,
          existing_site_id: req.demo_site_id,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Deploy failed');
      setWebsiteRequests(prev => prev.map(r => r.id === req.id ? { ...r, demo_url: data.demo_url, demo_site_id: data.site_id, demo_status: 'live', demo_deployed_at: new Date().toISOString() } : r));
      toast({ title: "🚀 Demo live!", description: data.demo_url });
    } catch (error: any) {
      console.error('Deploy demo error:', error);
      toast({ title: "Errore deploy", description: error.message, variant: "destructive" });
    } finally {
      setDeployingDemoFor(null);
    }
  };

  const handleCopyDemoUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedDemoUrl(url);
    setTimeout(() => setCopiedDemoUrl(null), 2000);
    toast({ title: "Copiato!", description: "URL copiato negli appunti." });
  };

  const handleDeleteSignup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this signup?')) return;
    try {
      const { error } = await supabase.from('client_signups').delete().eq('id', id);
      if (error) throw error;
      setSignups(prev => prev.filter(s => s.id !== id));
      toast({ title: "Deleted", description: "Client signup removed." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteWebsiteRequest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this website request?')) return;
    try {
      const { error } = await (supabase.from('website_requests') as any).delete().eq('id', id);
      if (error) throw error;
      setWebsiteRequests(prev => prev.filter(r => r.id !== id));
      toast({ title: "Deleted", description: "Website request removed." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage client inquiries and website requests.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card className="glass border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        <Card className="glass border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="websites" className="space-y-4">
        <TabsList>
          <TabsTrigger value="websites">Website Requests ({websiteRequests.length})</TabsTrigger>
          <TabsTrigger value="signups">Client Signups ({signups.length})</TabsTrigger>
          <TabsTrigger value="potential">Potential Clients ({potentialClientsCount})</TabsTrigger>
          <TabsTrigger value="reserva-mesa">🇨🇷 Reserva Mesa ({reservaMesaCount})</TabsTrigger>
          <TabsTrigger value="audits">🔍 Audits</TabsTrigger>
          <TabsTrigger value="revideos">🎬 ReVideos</TabsTrigger>
        </TabsList>

        <TabsContent value="signups">
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle>Client Signups</CardTitle>
              <CardDescription>Service inquiries from potential clients.</CardDescription>
            </CardHeader>
            <CardContent>
              {signups.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No signups yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Business</TableHead>
                        <TableHead>Services</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {signups.map((signup) => (
                        <TableRow key={signup.id}>
                          <TableCell>
                            <div className="font-medium">{signup.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />{signup.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {signup.phone && <div className="text-sm flex items-center gap-1"><Phone className="h-3 w-3" />{signup.phone}</div>}
                              {signup.website && (
                                <div className="text-sm flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  <a href={signup.website.startsWith('http') ? signup.website : `https://${signup.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Website</a>
                                </div>
                              )}
                              {signup.social_media && <div className="text-sm flex items-center gap-1"><MessageSquare className="h-3 w-3" />{signup.social_media}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {signup.business_type ? <Badge variant="outline">{signup.business_type}</Badge> : <span className="text-muted-foreground text-sm">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getServiceBadgeVariant(signup.desired_services)}>{formatServiceName(signup.desired_services)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{format(new Date(signup.created_at), 'MMM dd, yyyy')}</div>
                            <div className="text-xs text-muted-foreground">{format(new Date(signup.created_at), 'HH:mm')}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" asChild><a href={`mailto:${signup.email}`}><Mail className="h-3 w-3 mr-1" />Email</a></Button>
                              {signup.phone && <Button size="sm" variant="outline" asChild><a href={`tel:${signup.phone}`}><Phone className="h-3 w-3 mr-1" />Call</a></Button>}
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteSignup(signup.id)}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="websites">
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle>Website Requests</CardTitle>
              <CardDescription>Clients who want a new website built.</CardDescription>
            </CardHeader>
            <CardContent>
              {websiteRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No website requests yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {websiteRequests.map((req) => (
                    <Card key={req.id} className="border border-primary/10">
                      <CardContent className="pt-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                          {/* Info */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-lg">{req.business_name}</h4>
                              <Badge variant={req.status === 'approved' ? 'default' : req.status === 'feedback' ? 'destructive' : 'secondary'}>{req.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{req.name} · {req.email}{req.phone ? ` · ${req.phone}` : ''}</p>
                            {req.business_type && <p className="text-sm">Type: {req.business_type}</p>}
                            <div className="flex items-center gap-2">
                              <Palette className="h-4 w-4" />
                              <span className="text-sm">{req.color_palette}</span>
                            </div>
                            {req.logo_url && (
                              <div className="flex items-center gap-2">
                                <Image className="h-4 w-4" />
                                <a href={req.logo_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">View Logo</a>
                                <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-destructive hover:text-destructive" onClick={async () => {
                                  await (supabase.from('website_requests') as any).update({ logo_url: null }).eq('id', req.id);
                                  setWebsiteRequests(prev => prev.map(r => r.id === req.id ? { ...r, logo_url: null } : r));
                                  toast({ title: 'Logo rimosso' });
                                }}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            <div className="mt-2 p-3 rounded-md bg-muted/50 border border-border">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-semibold text-muted-foreground">
                                  {req.status === 'feedback' ? '📝 Client Feedback' : '📋 Notes'}
                                </p>
                                {editingNotesFor === req.id ? (
                                  <Button size="sm" variant="ghost" className="h-5 px-1" onClick={async () => {
                                    await (supabase.from('website_requests') as any).update({ notes: editNotesValue }).eq('id', req.id);
                                    setWebsiteRequests(prev => prev.map(r => r.id === req.id ? { ...r, notes: editNotesValue } : r));
                                    setEditingNotesFor(null);
                                    toast({ title: 'Notes saved' });
                                  }}>
                                    <Save className="h-3 w-3" />
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="ghost" className="h-5 px-1" onClick={() => {
                                    setEditingNotesFor(req.id);
                                    setEditNotesValue(req.notes || '');
                                  }}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              {editingNotesFor === req.id ? (
                                <textarea
                                  className="w-full text-sm bg-background border border-input rounded p-2 min-h-[80px] resize-y"
                                  value={editNotesValue}
                                  onChange={e => setEditNotesValue(e.target.value)}
                                  autoFocus
                                />
                              ) : (
                                <p className="text-sm whitespace-pre-wrap">{req.notes || <span className="text-muted-foreground italic">No notes — click ✏️ to add</span>}</p>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{format(new Date(req.created_at), 'MMM dd, yyyy HH:mm')}</p>
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" variant="outline" asChild><a href={`mailto:${req.email}`}><Mail className="h-3 w-3 mr-1" />Email</a></Button>
                              {req.phone && <Button size="sm" variant="outline" asChild><a href={`tel:${req.phone}`}><Phone className="h-3 w-3 mr-1" />Call</a></Button>}
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteWebsiteRequest(req.id)}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          </div>
                          {/* Mockup & Actions */}
                          <div className="lg:w-64 flex-shrink-0 space-y-2">
                            {req.mockup_url && (
                              <div className="relative group">
                                <a href={req.mockup_url} download={`mockup-${req.business_name.replace(/\s+/g, '-').toLowerCase()}.png`} target="_blank" rel="noopener noreferrer" title="Click to download full resolution">
                                  <img src={req.mockup_url} alt="Mockup" className="w-full rounded-lg border border-primary/20 cursor-pointer hover:opacity-80 transition-opacity" />
                                </a>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={async () => {
                                    await (supabase.from('website_requests') as any).update({ mockup_url: null }).eq('id', req.id);
                                    setWebsiteRequests(prev => prev.map(r => r.id === req.id ? { ...r, mockup_url: null } : r));
                                    toast({ title: 'Mockup rimosso' });
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => handleGenerateCode(req)}
                              disabled={generatingCodeFor === req.id}
                            >
                              {generatingCodeFor === req.id ? (
                                <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Avvio in corso...</>
                              ) : (
                                <><Code className="h-3 w-3 mr-1" />{req.generation_status === 'processing' ? '🔄 Rigenera Website' : 'Generate Website'}</>
                              )}
                            </Button>

                            {/* Generation status indicator */}
                            {req.generation_status === 'processing' && (
                              <div className="flex items-center gap-1 text-xs text-amber-400">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Agente in esecuzione{req.generation_started_at ? ` (avviato ${format(new Date(req.generation_started_at), 'HH:mm')})` : ''}...</span>
                              </div>
                            )}

                            {/* Recupera Codice - always visible when there's a session */}
                            {req.generation_session_id && (
                              <Button
                                size="sm"
                                variant="default"
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={() => handleFetchResult(req)}
                                disabled={fetchingResultFor === req.id}
                              >
                                {fetchingResultFor === req.id ? (
                                  <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Recupero in corso...</>
                                ) : (
                                  <>📥 Recupera Codice</>
                                )}
                              </Button>
                            )}

                            {req.generation_status === 'failed' && req.generation_error && (
                              <p className="text-xs text-destructive">❌ {req.generation_error}</p>
                            )}

                            {/* View Code button */}
                            {generatedCodes[req.id] && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => {
                                    setGeneratedCode(generatedCodes[req.id]);
                                    setCodeDialogOpen(true);
                                  }}
                                >
                                  <Code className="h-3 w-3 mr-1" />👁 Code
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadHtml(req)}
                                  title="Download HTML"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            )}

                            {/* Deploy Demo button */}
                            {(generatedCodes[req.id] || req.demo_url) && (
                              <Button
                                size="sm"
                                variant="default"
                                className="w-full"
                                onClick={() => handleDeployDemo(req)}
                                disabled={deployingDemoFor === req.id}
                              >
                                {deployingDemoFor === req.id ? (
                                  <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Deploying...</>
                                ) : (
                                  <><Rocket className="h-3 w-3 mr-1" />{req.demo_url ? 'Re-deploy Demo' : '🚀 Deploy Demo'}</>
                                )}
                              </Button>
                            )}

                            {/* Demo URL display */}
                            {req.demo_url && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <a href={req.demo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate flex items-center gap-1">
                                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{req.demo_url}</span>
                                  </a>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 flex-shrink-0" onClick={() => handleCopyDemoUrl(req.demo_url!)}>
                                    {copiedDemoUrl === req.demo_url ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                  </Button>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full text-xs"
                                  asChild
                                >
                                  <a href={`mailto:${req.email}?subject=${encodeURIComponent(`${req.business_name} - Your New Website Preview`)}&body=${encodeURIComponent(`Hi ${req.name},\n\nHere's a preview of your new website:\n${req.demo_url}\n\nLet us know what you think!\n\nBest regards`)}`}>
                                    <Mail className="h-3 w-3 mr-1" />📧 Send to Client
                                  </a>
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="potential">
          <PotentialClients />
        </TabsContent>
        <TabsContent value="reserva-mesa">
          <PotentialClientsReservaMesa />
        </TabsContent>
        <TabsContent value="audits">
          <AuditsTab />
        </TabsContent>
      </Tabs>

      {/* Code Dialog */}
      <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Generated React Code</DialogTitle>
            <DialogDescription>Copy this code and paste it into a new Lovable project.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={handleCopyCode}>
              {copied ? <><Check className="h-3 w-3 mr-1" />Copied!</> : <><Copy className="h-3 w-3 mr-1" />Copy Code</>}
            </Button>
          </div>
          <ScrollArea className="h-[60vh] rounded-md border bg-muted/50 p-4">
            <pre className="text-xs whitespace-pre-wrap font-mono">{generatedCode}</pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
