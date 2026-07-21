import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Video, Camera, Check } from 'lucide-react';
import Navigation from '@/components/Navigation';

const packages = [
  { id: 'starter', name: 'Starter', priceCents: 9900, videos: 1, photos: 15, description: '1 AI video + up to 15 photos' },
  { id: 'pro', name: 'Pro', priceCents: 24900, videos: 3, photos: 40, description: '3 AI videos + up to 40 photos' },
  { id: 'premium', name: 'Premium', priceCents: 49900, videos: 6, photos: 100, description: '6 AI videos + up to 100 photos, 4K delivery' },
];

const ReVideos = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState('pro');
  const [form, setForm] = useState({ address: '', type: '', notes: '' });
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in to place an order'); return; }
    setLoading(true);
    const pkg = packages.find(p => p.id === selected);
    const { data, error } = await supabase.functions.invoke('create-revideo-checkout', {
      body: {
        package_name: selected,
        price_cents: pkg.priceCents,
        property_address: form.address,
        property_type: form.type,
        special_requests: form.notes,
      }
    });
    setLoading(false);
    if (error || !data?.url) { toast.error(error?.message || 'Checkout failed'); return; }
    window.location.href = data.url;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Helmet>
        <title>Real Estate AI Videos | 1000 Feet</title>
        <meta name="description" content="Self-service AI video production for real estate listings." />
      </Helmet>
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-6">Real Estate AI Videos</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Upload property photos and get cinematic listing videos in 48 hours.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {packages.map((pkg) => (
            <Card key={pkg.id} className={`bg-slate-900/60 border-slate-700 cursor-pointer hover:border-blue-500 transition ${selected === pkg.id ? 'border-blue-500 ring-2 ring-blue-500/30' : ''}`} onClick={() => setSelected(pkg.id)}>
              <CardHeader><CardTitle className="text-2xl text-white">{pkg.name}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold text-blue-400">${(pkg.priceCents/100).toFixed(0)}</div>
                <p className="text-slate-300 text-sm">{pkg.description}</p>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li className="flex items-center gap-2"><Video size={16}/> {pkg.videos} AI video{pkg.videos>1?'s':''}</li>
                  <li className="flex items-center gap-2"><Camera size={16}/> Up to {pkg.photos} photos</li>
                  <li className="flex items-center gap-2"><Check size={16}/> 48h delivery</li>
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="max-w-2xl mx-auto bg-slate-900/80 border-slate-700">
          <CardHeader><CardTitle className="text-white">Order your package</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="address">Property address</Label>
                <Input id="address" required value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Property type</Label>
                <Input id="type" placeholder="House, apartment, villa, land..." value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Special requests</Label>
                <Textarea id="notes" placeholder="Music mood, key features, branding..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="bg-slate-800 border-slate-600 text-white" />
              </div>
              {!user && (
                <div className="p-4 rounded-lg bg-slate-800 text-sm text-slate-300">
                  <Link to="/auth?redirect=/revideos" className="text-blue-400 underline">Sign in</Link> to place an order.
                </div>
              )}
              <Button type="submit" disabled={loading || !user} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                {loading ? <Loader2 className="animate-spin" /> : 'Proceed to payment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReVideos;
