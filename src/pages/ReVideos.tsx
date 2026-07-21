import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Video, Camera, Check, Sparkles, X } from 'lucide-react';
import Navigation from '@/components/Navigation';

type Pkg = {
  id: 'p7_hd' | 'p15_hd' | 'p7_4k' | 'p15_4k';
  name: string;
  priceCents: number;
  photos: 7 | 15;
  resolution: '1080p' | '4K Ultra HD';
  duration: string;
};

const packages: Pkg[] = [
  { id: 'p7_hd',  name: '7 Photos · Full HD',  priceCents: 4900,  photos: 7,  resolution: '1080p', duration: '~30s video' },
  { id: 'p15_hd', name: '15 Photos · Full HD', priceCents: 9900,  photos: 15, resolution: '1080p', duration: '~60s video' },
  { id: 'p7_4k',  name: '7 Photos · 4K',        priceCents: 12900, photos: 7,  resolution: '4K Ultra HD', duration: '~30s video' },
  { id: 'p15_4k', name: '15 Photos · 4K',       priceCents: 24900, photos: 15, resolution: '4K Ultra HD', duration: '~60s video' },
];

const includedFeatures = [
  'Cinematic AI camera movements',
  'Day / night scene ordering',
  'Smooth transitions',
  'License for Airbnb, Booking & social',
  '24h delivery',
];

const faqs = [
  { q: 'How does it work?', a: 'You pick a package, pay, and upload the exact number of photos required. Our AI pipeline turns them into a cinematic listing video with camera moves and transitions, ready in 24 hours.' },
  { q: 'What photos work best?', a: 'Horizontal, high-resolution photos of empty rooms and exteriors. Avoid people, pets, or cluttered scenes. Good natural light produces the best results.' },
  { q: 'Can I use the video commercially?', a: 'Yes. The delivered video comes with a license to publish on Airbnb, Booking, your website and social channels.' },
  { q: 'What if I have more than 15 photos?', a: 'Pick the 15-photo package and send us your best 15. If you need a longer edit, contact us for a custom quote.' },
  { q: 'Do you offer refunds?', a: 'If we cannot deliver a usable video from your photos we will issue a full refund. Refunds are not available after delivery.' },
];

const ReVideos = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Pkg['id']>('p15_hd');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [rights, setRights] = useState(false);

  const pkg = useMemo(() => packages.find(p => p.id === selected)!, [selected]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user?.email) setEmail(data.user.email);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => {
      setUser(s?.user ?? null);
      if (s?.user?.email) setEmail(s.user.email);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // trim files if package downgrades photo count
    if (files.length > pkg.photos) {
      const trimmed = files.slice(0, pkg.photos);
      setFiles(trimmed);
    }
  }, [pkg.photos]); // eslint-disable-line

  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [files]);

  const onFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    const combined = [...files, ...incoming].slice(0, pkg.photos);
    setFiles(combined);
    e.target.value = '';
  };

  const removeFile = (idx: number) => setFiles(files.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in to place an order'); return; }
    if (!email.trim()) { toast.error('Email is required'); return; }
    if (!rights) { toast.error('Please confirm you own the rights to the photos'); return; }
    if (files.length !== pkg.photos) {
      toast.error(`This package requires exactly ${pkg.photos} photos. You have ${files.length}.`);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('create-revideo-checkout', {
      body: {
        package_name: pkg.id,
        price_cents: pkg.priceCents,
        photo_count: pkg.photos,
        resolution: pkg.resolution,
        customer_email: email.trim(),
        special_requests: notes.trim(),
        rights_accepted: true,
      }
    });
    setLoading(false);
    if (error || !data?.url) { toast.error(error?.message || 'Checkout failed'); return; }
    // Photos will be uploaded on the success page after payment
    sessionStorage.setItem('revideo_pending_photo_count', String(pkg.photos));
    window.location.href = data.url;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Helmet>
        <title>Real Estate AI Videos in 24h | 1000 Feet</title>
        <meta name="description" content="Turn your property photos into cinematic listing videos with AI. Delivered in 24 hours. From $49." />
      </Helmet>
      <Navigation />

      {/* HERO */}
      <section className="max-w-4xl mx-auto px-4 pt-24 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs mb-6">
          <Sparkles size={14} /> AI real estate video studio
        </div>
        <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-6">Turn your property photos into a cinematic video</h1>
        <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-4">
          Send us 7 or 15 photos of your property. Our AI pipeline transforms them into a professional listing video with cinematic camera movements, day-to-night scene flow, and smooth transitions — ready to publish on Airbnb, Booking, your website and social channels.
        </p>
        <p className="text-base text-slate-400 max-w-2xl mx-auto">
          No shoots, no crews, no editing. Just upload, pay, and receive your video in 24 hours.
        </p>
      </section>

      {/* FROM PHOTOS TO FILM — moved to top as real example */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs mb-4">
            <Check size={14} /> Real example
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-3">From photos to film</h2>
          <p className="text-slate-300 max-w-2xl mx-auto">
            This is a real project we delivered for <span className="text-slate-100 font-semibold">Casa Idea</span>: the 15 photos below were transformed by our AI pipeline into the cinematic <span className="text-slate-100 font-semibold">4K video</span> you can watch underneath.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
            <div key={n} className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
              <img
                src={`/revideos/casa-idea/${n}.jpg`}
                alt={`Casa Idea photo ${n}`}
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                loading="lazy"
              />
            </div>
          ))}
        </div>
        <div className="aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/PJTZBu0pGvk"
            title="Casa Idea AI video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <p className="text-center text-sm text-slate-500 mt-4">15 photos → 1 cinematic 4K video, delivered in 24 hours.</p>
      </section>

      {/* PACKAGES 2x2 — now below the example */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-3">Choose your package</h2>
          <p className="text-slate-400">Pick the number of photos and the resolution that fits your listing.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {packages.map((p) => {
            const isSel = selected === p.id;
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`text-left rounded-2xl border p-6 transition bg-slate-900/60 backdrop-blur ${
                  isSel ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10' : 'border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-50">{p.name}</h3>
                    <p className="text-sm text-slate-400 mt-1">{p.duration} · {p.resolution}</p>
                  </div>
                  <div className="text-3xl font-bold text-blue-400">${(p.priceCents/100).toFixed(0)}</div>
                </div>
                <ul className="text-sm text-slate-300 space-y-2">
                  <li className="flex items-center gap-2"><Camera size={16} className="text-blue-400"/> {p.photos} photos → 1 video</li>
                  {includedFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-2"><Check size={16} className="text-blue-400"/> {f}</li>
                  ))}
                </ul>
                {isSel && (
                  <div className="mt-4 text-xs text-blue-300 font-medium">Selected</div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ORDER FORM */}
      <section className="max-w-2xl mx-auto px-4 pb-24">
        <Card className="bg-slate-900/80 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-50">Order — {pkg.name}</CardTitle>
            <p className="text-sm text-slate-400">Upload exactly {pkg.photos} photos to continue.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tips */}
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 text-sm text-slate-200 space-y-1">
                <p className="font-semibold text-blue-300">Photo tips for best results</p>
                <ul className="list-disc pl-5 text-slate-300 space-y-1">
                  <li>Horizontal (landscape) photos only</li>
                  <li>No people or pets in the frame</li>
                  <li>Good natural light, minimal clutter</li>
                  <li>High resolution (min. 1920×1080)</li>
                </ul>
              </div>

              {/* Uploader */}
              <div className="space-y-2">
                <Label className="text-slate-200">Photos ({files.length}/{pkg.photos})</Label>
                <label
                  htmlFor="revideo-upload"
                  className="block cursor-pointer rounded-lg border border-dashed border-slate-600 hover:border-blue-500 p-6 text-center transition"
                >
                  <Camera className="mx-auto text-blue-400 mb-2" />
                  <div className="text-sm text-slate-300">
                    {files.length < pkg.photos
                      ? `Click to add ${pkg.photos - files.length} more photo${pkg.photos - files.length === 1 ? '' : 's'}`
                      : 'All photos ready'}
                  </div>
                  <input
                    id="revideo-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onFilesChange}
                    disabled={files.length >= pkg.photos}
                  />
                </label>
                {previews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                    {previews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded overflow-hidden border border-slate-700 group">
                        <img src={src} alt={`Upload ${i+1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 bg-black/70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          aria-label="Remove photo"
                        >
                          <X size={14} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-500">Photos will be uploaded securely after payment.</p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-slate-50 placeholder:text-slate-500"
                  placeholder="you@example.com"
                />
              </div>

              {/* Optional note */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-slate-200">Note (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Property name + anything we should know"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-slate-50 placeholder:text-slate-500"
                />
              </div>

              {/* Rights checkbox */}
              <label className="flex items-start gap-3 text-sm text-slate-200 cursor-pointer">
                <Checkbox
                  checked={rights}
                  onCheckedChange={(v) => setRights(Boolean(v))}
                  className="mt-1 border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <span>
                  I confirm I own the rights to the uploaded photos and authorize 1000 Feet to process them into an AI video.
                </span>
              </label>

              {!user && (
                <div className="p-4 rounded-lg bg-slate-800 text-sm text-slate-300">
                  <Link to="/auth?redirect=/revideos" className="text-blue-400 underline">Sign in</Link> to place an order.
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !user || files.length !== pkg.photos || !rights}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:opacity-90"
              >
                {loading ? <Loader2 className="animate-spin" /> : `Pay $${(pkg.priceCents/100).toFixed(0)} & continue`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 pb-24">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-50 text-center mb-10">FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <details key={f.q} className="rounded-lg border border-slate-700 bg-slate-900/60 p-5 group">
              <summary className="cursor-pointer font-semibold text-slate-50 list-none flex justify-between items-center">
                {f.q}
                <span className="text-blue-400 group-open:rotate-45 transition">+</span>
              </summary>
              <p className="mt-3 text-slate-300 text-sm leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ReVideos;
