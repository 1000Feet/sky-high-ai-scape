import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Upload, CheckCircle, Clock, X } from 'lucide-react';
import Navigation from '@/components/Navigation';

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ReVideosSuccess = () => {
  const [params] = useSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const sessionId = params.get('session_id');
      const orderId = params.get('order_id');
      if (!sessionId && !orderId) { setLoading(false); return; }
      const { data, error } = await supabase.functions.invoke('verify-revideo-payment', {
        body: { session_id: sessionId, order_id: orderId }
      });
      if (error || !data?.order) { toast.error(error?.message || 'Payment verification failed'); setLoading(false); return; }
      setOrder(data.order);
      setAssets(data.assets || []);
      setLoading(false);
    };
    verify();
  }, [params]);

  const requiredPhotos: number = order?.photo_count || 0;
  const remaining = Math.max(0, requiredPhotos - assets.length);
  const isComplete = requiredPhotos > 0 && assets.length >= requiredPhotos;

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    e.target.value = '';
    if (!order || !files.length) return;

    if (files.length > remaining) {
      toast.error(`You can upload up to ${remaining} more photo${remaining === 1 ? '' : 's'}`);
      return;
    }
    for (const f of files) {
      if (!ALLOWED_MIME.includes(f.type.toLowerCase())) {
        toast.error(`${f.name}: only JPG, PNG or WEBP allowed`);
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name}: file exceeds 10 MB`);
        return;
      }
    }

    setUploading(true);
    for (const file of files) {
      const { data: urlData, error: urlErr } = await supabase.functions.invoke('create-revideo-upload-url', {
        body: { order_id: order.id, filename: file.name, file_size: file.size, mime_type: file.type }
      });
      if (urlErr || !urlData?.signedUrl) { toast.error(urlErr?.message || 'Upload failed'); continue; }
      const res = await fetch(urlData.signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!res.ok) { toast.error(`Upload failed: ${res.statusText}`); continue; }
      setAssets(prev => [...prev, { original_filename: file.name, file_size_bytes: file.size }]);
    }
    setUploading(false);

    // Finalize if we now have all photos
    const total = assets.length + files.length;
    if (total >= requiredPhotos) {
      const { data: fin } = await supabase.functions.invoke('finalize-revideo-upload', {
        body: { order_id: order.id },
      });
      if (fin?.ready) {
        toast.success('All photos uploaded — production is starting.');
        setOrder((o: any) => o ? { ...o, status: 'paid' } : o);
      }
    } else {
      toast.success('Photos uploaded');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-blue-400" /></div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">Order not found.</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Helmet><title>Order confirmed | ReVideos</title></Helmet>
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 py-24">
        <Card className="bg-slate-900/80 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-50 flex items-center gap-2"><CheckCircle className="text-green-400" /> Order confirmed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-slate-300">
              Order <strong>#{order.id.slice(0, 8)}</strong> is paid. Upload exactly <strong>{requiredPhotos}</strong> photos to start production.
            </p>

            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 flex items-start gap-3">
              <Clock className="text-blue-400 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-medium text-blue-200">We're on it — your video lands in your inbox within 24 hours.</p>
                <p className="text-sm text-slate-300 mt-1">
                  We'll send the download link to <strong className="text-slate-100">{order.customer_email || 'your email'}</strong> as soon as it's ready.
                </p>
              </div>
            </div>

            {/* Photo tips */}
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 text-sm text-slate-200 space-y-1">
              <p className="font-semibold text-blue-300">Photo tips for best results</p>
              <ul className="list-disc pl-5 text-slate-300 space-y-1">
                <li>Horizontal (landscape) photos only</li>
                <li>No people or pets in the frame</li>
                <li>Good natural light, minimal clutter</li>
                <li>JPG, PNG or WEBP · min. 1920×1080 · max 10 MB per photo</li>
              </ul>
            </div>

            {!isComplete && (
              <div className="p-4 border border-dashed border-slate-600 rounded-lg text-center">
                <input
                  id="upload"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFiles}
                  disabled={uploading}
                />
                <label htmlFor="upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="text-blue-400" />
                  <span className="text-sm text-slate-300">
                    Click to upload photos ({assets.length}/{requiredPhotos})
                  </span>
                  <span className="text-xs text-slate-500">JPG, PNG or WEBP · max 10 MB each</span>
                </label>
                {uploading && <Loader2 className="animate-spin mt-2 mx-auto" />}
              </div>
            )}

            {isComplete && (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm">
                All {requiredPhotos} photos received. Your video is now being produced.
              </div>
            )}

            {assets.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-slate-400">{assets.length} / {requiredPhotos} uploaded</p>
                <ul className="text-sm text-slate-300 space-y-1">
                  {assets.map((a, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-400 shrink-0" />
                      {a.original_filename}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReVideosSuccess;
