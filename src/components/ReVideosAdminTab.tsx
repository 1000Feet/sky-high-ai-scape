import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Download, ExternalLink, Film, Image as ImageIcon, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';

const STATUSES = ['pending','awaiting_payment','awaiting_photos','paid','processing','generating','editing','delivered','failed','cancelled','refunded'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  awaiting_payment: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  awaiting_photos: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  paid: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  processing: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  generating: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  editing: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
  delivered: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  failed: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
  refunded: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
};

const clipStatusColor = (s: string) => {
  if (s === 'done') return 'text-emerald-400';
  if (s === 'running') return 'text-blue-400';
  if (s === 'failed') return 'text-rose-400';
  if (s === 'queued') return 'text-slate-400';
  return 'text-slate-500';
};

const ReVideosAdminTab: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [details, setDetails] = useState<Record<string, { assets: any[]; clips: any[]; signed: Record<string, string> }>>({});
  const [filter, setFilter] = useState<string>('all');

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('revideo_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    else setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const toggleExpand = async (orderId: string) => {
    const next = !expanded[orderId];
    setExpanded({ ...expanded, [orderId]: next });
    if (next && !details[orderId]) {
      const [{ data: assets }, { data: clips }] = await Promise.all([
        supabase.from('revideo_assets').select('*').eq('order_id', orderId).order('uploaded_at', { ascending: true }),
        supabase.from('revideo_clips').select('*').eq('order_id', orderId).order('seq', { ascending: true }),
      ]);
      const signed: Record<string, string> = {};
      if (assets && assets.length > 0) {
        const paths = assets.map(a => a.storage_path);
        const { data: signedData } = await supabase.storage.from('revideo-assets').createSignedUrls(paths, 3600);
        signedData?.forEach((s, i) => { if (s.signedUrl) signed[paths[i]] = s.signedUrl; });
      }
      setDetails(d => ({ ...d, [orderId]: { assets: assets || [], clips: clips || [], signed } }));
    }
  };

  const updateOrder = async (id: string, updates: any) => {
    const { error } = await supabase.from('revideo_orders').update(updates).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Updated');
    setOrders(os => os.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const restartProduction = async (order: any) => {
    toast.info('Triggering production...');
    const { error } = await supabase.functions.invoke('finalize-revideo-upload', { body: { order_id: order.id } });
    if (error) return toast.error(error.message);
    toast.success('Production trigger sent');
    fetchOrders();
  };

  const filtered = orders.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'active') return !['delivered','cancelled','refunded','failed','pending','awaiting_payment'].includes(o.status);
    if (filter === 'abandoned') return o.status === 'awaiting_payment';
    return o.status === filter;
  });

  const counts = {
    total: orders.length,
    paid: orders.filter(o => !['pending','awaiting_payment','cancelled','refunded'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    inProgress: orders.filter(o => ['awaiting_photos','paid','processing','generating','editing'].includes(o.status)).length,
    abandoned: orders.filter(o => o.status === 'awaiting_payment').length,
    revenue: orders.filter(o => !['pending','awaiting_payment','cancelled','refunded'].includes(o.status))
      .reduce((s, o) => s + (o.price_cents || 0), 0) / 100,
  };

  return (
    <Card className="glass border-primary/20">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2"><Film className="h-5 w-5" /> ReVideos Orders</CardTitle>
          <CardDescription>AI real-estate video orders — photos, clips, and final delivery.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
          <Stat label="Total" value={counts.total} />
          <Stat label="Paid" value={counts.paid} />
          <Stat label="In production" value={counts.inProgress} color="text-purple-300" />
          <Stat label="Delivered" value={counts.delivered} color="text-emerald-300" />
          <Stat label="Abandoned" value={counts.abandoned} color="text-orange-300" />
          <Stat label="Revenue" value={`$${counts.revenue.toFixed(0)}`} color="text-blue-300" />
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {['all','active','abandoned','delivered','failed'].map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>{f}</Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No orders in this filter.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(o => {
              const det = details[o.id];
              const isOpen = expanded[o.id];
              return (
                <div key={o.id} className="rounded-lg border border-slate-700 bg-slate-900/40 overflow-hidden">
                  {/* Row header */}
                  <button onClick={() => toggleExpand(o.id)} className="w-full text-left p-4 hover:bg-slate-800/40 transition flex items-start gap-3">
                    {isOpen ? <ChevronDown className="h-4 w-4 mt-1 shrink-0" /> : <ChevronRight className="h-4 w-4 mt-1 shrink-0" />}
                    <div className="flex-1 grid md:grid-cols-6 gap-3 items-center">
                      <div className="md:col-span-2">
                        <div className="font-mono text-xs text-slate-400">#{o.id.slice(0,8)}</div>
                        <div className="font-medium text-slate-100">{o.customer_name || '—'}</div>
                        <div className="text-xs text-slate-400">{o.customer_email || '—'}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-slate-300">{o.package_name}</div>
                        <div className="text-xs text-slate-500">{o.photo_count} photos · {o.resolution || 'HD'}</div>
                      </div>
                      <div className="text-sm text-slate-300">${((o.price_cents||0)/100).toFixed(0)}</div>
                      <Badge className={`${STATUS_COLORS[o.status] || ''} border w-fit`} variant="outline">{o.status}</Badge>
                      <div className="text-xs text-slate-500">{new Date(o.created_at).toLocaleString()}</div>
                    </div>
                    {o.final_video_url && (
                      <a href={o.final_video_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                        className="shrink-0 inline-flex items-center gap-1 text-xs bg-emerald-600/20 text-emerald-300 border border-emerald-600/40 px-2 py-1 rounded">
                        <Download className="h-3 w-3" /> Video
                      </a>
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-700 p-4 space-y-4 bg-slate-950/40">
                      {/* Controls */}
                      <div className="grid md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Status</label>
                          <Select value={o.status} onValueChange={v => updateOrder(o.id, { status: v })}>
                            <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs text-slate-400 block mb-1">Admin notes</label>
                          <Input defaultValue={o.admin_notes || ''} onBlur={e => e.target.value !== (o.admin_notes || '') && updateOrder(o.id, { admin_notes: e.target.value })} className="bg-slate-800 border-slate-600 text-white h-9" />
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-xs text-slate-400 block mb-1">Final video URL</label>
                          <Input defaultValue={o.final_video_url || ''} onBlur={e => e.target.value !== (o.final_video_url || '') && updateOrder(o.id, { final_video_url: e.target.value || null })} className="bg-slate-800 border-slate-600 text-white h-9" placeholder="https://..." />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => restartProduction(o)}>
                          <RefreshCw className="h-3 w-3 mr-1" /> Trigger / restart production
                        </Button>
                        {o.stripe_payment_intent_id && (
                          <a href={`https://dashboard.stripe.com/test/payments/${o.stripe_payment_intent_id}`} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-slate-600 rounded hover:bg-slate-800">
                            <ExternalLink className="h-3 w-3" /> Stripe
                          </a>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="grid md:grid-cols-4 gap-2 text-xs text-slate-400">
                        <Meta label="Rights" value={o.rights_accepted ? '✓' : '—'} />
                        <Meta label="Photos uploaded" value={o.photos_uploaded_at ? new Date(o.photos_uploaded_at).toLocaleString() : '—'} />
                        <Meta label="Auto started" value={o.automation_started_at ? new Date(o.automation_started_at).toLocaleString() : '—'} />
                        <Meta label="Auto completed" value={o.automation_completed_at ? new Date(o.automation_completed_at).toLocaleString() : '—'} />
                        <Meta label="Customer notified" value={o.customer_notified_at ? new Date(o.customer_notified_at).toLocaleString() : '—'} />
                        <Meta label="Creatomate render" value={o.creatomate_render_id || '—'} mono />
                        <Meta label="Reminders" value={`${o.reminder_count || 0} sent`} />
                        <Meta label="Abandoned reminders" value={`${o.abandoned_reminder_count || 0} sent`} />
                      </div>

                      {o.error_message && (
                        <div className="text-xs bg-rose-950/40 border border-rose-800/40 text-rose-200 rounded p-2">
                          <strong>Error:</strong> {o.error_message}
                        </div>
                      )}
                      {o.special_requests && (
                        <div className="text-xs bg-slate-800/40 border border-slate-700 rounded p-2 text-slate-200">
                          <strong>Customer note:</strong> {o.special_requests}
                        </div>
                      )}

                      {/* Photos */}
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-200 mb-2">
                          <ImageIcon className="h-4 w-4" /> Photos ({det?.assets.length || 0}/{o.photo_count || 0})
                        </div>
                        {det ? (
                          det.assets.length === 0 ? (
                            <div className="text-xs text-slate-500">No photos uploaded yet.</div>
                          ) : (
                            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
                              {det.assets.map((a, i) => {
                                const url = det.signed[a.storage_path];
                                return (
                                  <a key={a.id} href={url} target="_blank" rel="noreferrer" title={a.original_filename}
                                    className="aspect-square rounded overflow-hidden border border-slate-700 bg-slate-800 relative group">
                                    {url ? <img src={url} alt={`Photo ${i+1}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">#{i+1}</div>}
                                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1 py-0.5 opacity-0 group-hover:opacity-100 truncate">{a.original_filename}</div>
                                  </a>
                                );
                              })}
                            </div>
                          )
                        ) : <Loader2 className="animate-spin h-4 w-4 text-slate-500" />}
                      </div>

                      {/* Clips */}
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-200 mb-2">
                          <Film className="h-4 w-4" /> Clips ({det?.clips.filter(c => c.status === 'done').length || 0}/{det?.clips.length || 0} done)
                        </div>
                        {det ? (
                          det.clips.length === 0 ? (
                            <div className="text-xs text-slate-500">No clips generated yet.</div>
                          ) : (
                            <div className="grid gap-1">
                              {det.clips.map(c => (
                                <div key={c.id} className="grid grid-cols-12 gap-2 items-center text-xs bg-slate-800/40 rounded px-2 py-1.5">
                                  <div className="col-span-1 text-slate-400">#{c.seq}</div>
                                  <div className={`col-span-2 font-medium ${clipStatusColor(c.status)}`}>● {c.status}</div>
                                  <div className="col-span-3 text-slate-500 truncate" title={c.higgsfield_job_id}>{c.higgsfield_job_id?.slice(0,16) || '—'}</div>
                                  <div className="col-span-2 text-slate-500">{c.duration_seconds || 5}s · {c.resolution || '1080p'}</div>
                                  <div className="col-span-2 text-slate-500">att. {c.attempts || 0}</div>
                                  <div className="col-span-2 text-right">
                                    {c.video_url ? (
                                      <a href={c.video_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-300 hover:underline">
                                        <ExternalLink className="h-3 w-3" /> view
                                      </a>
                                    ) : c.error ? <span className="text-rose-400" title={c.error}>error</span> : <span className="text-slate-600">—</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        ) : <Loader2 className="animate-spin h-4 w-4 text-slate-500" />}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Stat: React.FC<{ label: string; value: React.ReactNode; color?: string }> = ({ label, value, color }) => (
  <div className="rounded border border-slate-700 bg-slate-900/40 px-3 py-2">
    <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className={`text-lg font-semibold ${color || 'text-slate-100'}`}>{value}</div>
  </div>
);

const Meta: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="rounded bg-slate-800/30 px-2 py-1.5">
    <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className={`text-xs text-slate-200 ${mono ? 'font-mono truncate' : ''}`}>{value}</div>
  </div>
);

export default ReVideosAdminTab;
