import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Upload, CheckCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';

const DEFAULT_MAX = 12;

const ReVideosSuccess = () => {
  const [params] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [assets, setAssets] = useState([]);
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

  const maxFiles: number = order?.photo_count || DEFAULT_MAX;

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!order || !files.length) return;
    const remaining = maxFiles - assets.length;
    if (files.length > remaining) { toast.error(`You can upload up to ${remaining} more files`); return; }
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
    toast.success('Upload complete');
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
            <CardTitle className="text-slate-50 flex items-center gap-2"><CheckCircle className="text-green-400"/> Order confirmed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-slate-300">Order <strong>#{order.id.slice(0,8)}</strong> is paid. Upload your {maxFiles} photos to start production.</p>
            <div className="p-4 border border-dashed border-slate-600 rounded-lg text-center">
              <input id="upload" type="file" multiple accept="image/*" className="hidden" onChange={handleFiles} />
              <label htmlFor="upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="text-blue-400" />
                <span className="text-sm text-slate-300">Click to upload photos</span>
              </label>
              {uploading && <Loader2 className="animate-spin mt-2" />}
            </div>
            {assets.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-slate-400">{assets.length} / {maxFiles} uploaded</p>
                <ul className="text-sm text-slate-300 space-y-1">
                  {assets.map((a, i) => <li key={i}>{a.original_filename}</li>)}
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
