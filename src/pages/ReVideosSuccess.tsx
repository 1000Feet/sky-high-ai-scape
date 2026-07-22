import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Loader2, CheckCircle, Clock, AlertCircle, Film, Download } from 'lucide-react';
import Navigation from '@/components/Navigation';

const ReVideosSuccess = () => {
  const [params] = useSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [clips, setClips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const orderId = order?.id || params.get('order_id');

  const loadOrder = async () => {
    const sessionId = params.get('session_id');
    const idParam = params.get('order_id');
    if (!sessionId && !idParam) { setLoading(false); return; }

    const { data, error } = await supabase.functions.invoke('verify-revideo-payment', {
      body: { session_id: sessionId, order_id: idParam }
    });
    if (error || !data?.order) {
      toast.error(error?.message || 'Payment verification failed');
      setLoading(false);
      return;
    }
    setOrder(data.order);
    setAssets(data.assets || []);
    if (data.order?.id) await loadClips(data.order.id);
    setLoading(false);
  };

  const loadClips = async (id: string) => {
    const { data, error } = await supabase.from('revideo_clips').select('*').eq('order_id', id).order('seq', { ascending: true });
    if (!error) setClips(data || []);
  };

  useEffect(() => { loadOrder(); }, [params]);

  useEffect(() => {
    if (!orderId || order?.status === 'delivered') return;
    const interval = setInterval(loadOrder, 10000);
    return () => clearInterval(interval);
  }, [orderId, order?.status]);

  const clipProgress = clips.length > 0
    ? Math.round((clips.filter(c => c.status === 'done').length / clips.length) * 100)
    : 0;

  const statusNode = () => {
    if (!order) return null;

    if (order.status === 'delivered') {
      return (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-emerald-200 font-medium">
            <Film size={18} /> Your video is ready
          </div>
          <p className="text-sm text-emerald-100/80">
            We've sent the download link to <strong>{order.customer_email}</strong>.
          </p>
          {order.final_video_url && (
            <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <a href={order.final_video_url} target="_blank" rel="noreferrer">
                <Download size={16} className="mr-2" /> Download your video
              </a>
            </Button>
          )}
        </div>
      );
    }

    if (order.status === 'failed') {
      return (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-medium text-red-200">Something went wrong during production.</p>
            <p className="text-sm text-slate-300 mt-1">
              Contact us at <a href="mailto:info@1000feetabove.com" className="underline">info@1000feetabove.com</a> and we'll fix it.
            </p>
          </div>
        </div>
      );
    }

    if (order.status === 'generating') {
      return (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-blue-200 font-medium">
            <Loader2 className="animate-spin" size={18} /> Generating your clips
          </div>
          <Progress value={clipProgress} className="h-2 bg-blue-900/50" />
          <p className="text-xs text-blue-200/70">{clips.filter(c => c.status === 'done').length} of {clips.length} clips ready</p>
        </div>
      );
    }

    if (order.status === 'editing') {
      return (
        <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4 flex items-start gap-3">
          <Loader2 className="animate-spin text-purple-400 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-medium text-purple-200">All clips are ready — editing the final film now.</p>
            <p className="text-sm text-slate-300 mt-1">You'll receive an email with the download link as soon as it's done.</p>
          </div>
        </div>
      );
    }

    // awaiting_photos / paid / awaiting_payment fallback
    return (
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 flex items-start gap-3">
        <Clock className="text-blue-400 shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm font-medium text-blue-200">We're on it — your video lands in your inbox within 24 hours.</p>
          <p className="text-sm text-slate-300 mt-1">
            We'll send the download link to <strong className="text-slate-100">{order.customer_email || 'your email'}</strong> as soon as it's ready.
          </p>
        </div>
      </div>
    );
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
            <CardTitle className="text-slate-50 flex items-center gap-2">
              <CheckCircle className="text-green-400" /> Order confirmed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-slate-300">
              Order <strong>#{order.id.slice(0, 8)}</strong> is paid. Your {assets.length} photo{assets.length === 1 ? '' : 's'} were received before checkout — production is starting automatically.
            </p>

            {statusNode()}

            <div className="text-xs text-slate-500 text-center pt-2">
              You can safely close this page — we'll email <strong className="text-slate-300">{order.customer_email}</strong> when the video is ready.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReVideosSuccess;
