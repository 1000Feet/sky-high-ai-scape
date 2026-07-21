import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';

const STATUSES = ['pending','awaiting_photos','paid','processing','generating','editing','delivered','failed','cancelled','refunded'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-slate-400',
  awaiting_photos: 'text-amber-300',
  paid: 'text-blue-300',
  processing: 'text-blue-300',
  generating: 'text-purple-300',
  editing: 'text-purple-300',
  delivered: 'text-emerald-300',
  failed: 'text-rose-300',
  cancelled: 'text-slate-500',
  refunded: 'text-slate-500',
};

const ReVideosAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('revideo_orders').select('*, revideo_assets(id)').order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    else setOrders(data || []);
    setLoading(false);
  };

  const updateOrder = async (id, updates) => {
    const { error } = await supabase.from('revideo_orders').update(updates).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Updated'); fetchOrders(); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Helmet><title>ReVideos Admin | 1000 Feet</title></Helmet>
      <Navigation />
      <div className="max-w-[98vw] mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold text-white mb-6">ReVideos Orders</h1>
        <div className="grid gap-4">
          {orders.map((o) => (
            <Card key={o.id} className="bg-slate-900/80 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white flex justify-between">
                  <span>#{o.id.slice(0,8)} — {o.property_address || 'No address'}</span>
                  <span className="text-slate-400">${(o.price_cents/100).toFixed(2)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-4 gap-4 text-sm">
                <div className="space-y-1"><Label>Status</Label>
                  <Select value={o.status} onValueChange={v => updateOrder(o.id, { status: v })}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3 space-y-1"><Label>Admin notes</Label>
                  <Input value={o.admin_notes || ''} onChange={e => updateOrder(o.id, { admin_notes: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
                </div>
                <div className="md:col-span-4 space-y-1"><Label>Delivery URLs (comma separated)</Label>
                  <Input value={o.delivered_urls ? o.delivered_urls.join(', ') : ''} onChange={e => updateOrder(o.id, { delivered_urls: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="bg-slate-800 border-slate-600 text-white" />
                </div>
                <div className="md:col-span-4 text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                  <span className={STATUS_COLORS[o.status] || ''}>● {o.status}</span>
                  <span>{o.revideo_assets?.length || 0} / {o.photo_count || '?'} photos</span>
                  <span>{o.package_name}</span>
                  <span>{o.customer_email}</span>
                  {o.special_requests && <span>· {o.special_requests}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReVideosAdmin;
