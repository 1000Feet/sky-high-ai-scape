import React, { useState, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Globe, Upload, Palette, Sparkles, CheckCircle, ArrowRight, ArrowLeft, 
  Loader2, User, Mail, Phone, Building, ExternalLink, Image
} from 'lucide-react';

const COLOR_PALETTES = [
  { name: 'Ocean Blue', colors: ['#0ea5e9', '#0284c7', '#f0f9ff', '#1e293b'], desc: 'Professional & trustworthy' },
  { name: 'Forest Green', colors: ['#22c55e', '#15803d', '#f0fdf4', '#1e293b'], desc: 'Natural & growth' },
  { name: 'Royal Purple', colors: ['#a855f7', '#7c3aed', '#faf5ff', '#1e293b'], desc: 'Creative & luxurious' },
  { name: 'Sunset Orange', colors: ['#f97316', '#ea580c', '#fff7ed', '#1e293b'], desc: 'Energetic & bold' },
  { name: 'Rose Pink', colors: ['#f43f5e', '#e11d48', '#fff1f2', '#1e293b'], desc: 'Modern & elegant' },
  { name: 'Midnight Dark', colors: ['#6366f1', '#4f46e5', '#0f172a', '#e2e8f0'], desc: 'Sleek & tech' },
  { name: 'Golden Luxury', colors: ['#eab308', '#ca8a04', '#fefce8', '#1c1917'], desc: 'Premium & exclusive' },
  { name: 'Teal Fresh', colors: ['#14b8a6', '#0d9488', '#f0fdfa', '#1e293b'], desc: 'Fresh & clean' },
];

interface WizardData {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  socialMedia: string;
  notes: string;
  logoFile: File | null;
  logoUrl: string;
  logoPreviewUrl: string;
  colorPalette: string;
  colorColors: string[];
  mockupImage: string;
}

const WebsiteWizard: React.FC = () => {
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPickingColors, setIsPickingColors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [data, setData] = useState<WizardData>({
    name: '', email: '', phone: '', businessName: '', businessType: '', socialMedia: '', notes: '',
    logoFile: null, logoUrl: '', logoPreviewUrl: '', colorPalette: '', colorColors: [], mockupImage: '',
  });

  const scrollPageToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  useLayoutEffect(() => {
    scrollPageToTop();
    const frame = window.requestAnimationFrame(scrollPageToTop);

    return () => window.cancelAnimationFrame(frame);
  }, [step, isComplete]);

  const updateData = (updates: Partial<WizardData>) => setData(prev => ({ ...prev, ...updates }));

  const handleLogoUpload = async (file: File) => {
    updateData({ logoFile: file, logoPreviewUrl: '', logoUrl: '' });
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      const { error } = await supabase.storage.from('logos').upload(fileName, file, {
        cacheControl: '3600',
        contentType: file.type || undefined,
      });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName);
      if (!urlData?.publicUrl) throw new Error('Could not create logo URL');

      updateData({ logoUrl: `${urlData.publicUrl}?t=${Date.now()}` });
      toast({ title: "Logo uploaded!", description: "Your logo will be used in the mockup." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const generateMockup = async () => {
    setIsGenerating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-website-mockup', {
        body: {
          businessName: data.businessName,
          businessType: data.businessType,
          colorPalette: data.colorPalette,
          logoUrl: data.logoUrl,
        },
      });

      if (error) {
        console.error('Edge function invoke error:', error);
        throw new Error(error.message || 'Failed to call generation service');
      }
      
      if (!result?.success) {
        const errorCode = result?.errorCode || 'unknown';
        const errorMsg = result?.error || 'Failed to generate mockup';
        console.error(`Generation failed [${errorCode}]:`, errorMsg);
        
        if (errorCode === 'rate_limit') {
          toast({ title: "Troppo veloce!", description: "Aspetta qualche secondo e riprova.", variant: "destructive" });
        } else if (errorCode === 'credits') {
          toast({ title: "Crediti AI esauriti", description: "Contattaci per assistenza.", variant: "destructive" });
        } else if (errorCode === 'no_image') {
          toast({ title: "Nessuna immagine generata", description: "L'AI non ha prodotto un'immagine. Riprova.", variant: "destructive" });
        } else {
          toast({ title: "Generazione fallita", description: errorMsg, variant: "destructive" });
        }
        return;
      }

      updateData({ mockupImage: result.mockupImage });

      // Update existing record with mockup data, or insert if missing
      if (requestId) {
        const { error: dbError } = await (supabase.from('website_requests') as any)
          .update({
            logo_url: data.logoUrl || null,
            color_palette: data.colorPalette,
            mockup_url: result.mockupImage || null,
          })
          .eq('id', requestId);
        if (dbError) console.error('Error updating request with mockup:', dbError);
      } else {
        const { data: insertedRow, error: dbError } = await (supabase.from('website_requests') as any).insert({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          business_name: data.businessName,
          business_type: data.businessType || null,
          logo_url: data.logoUrl || null,
          color_palette: data.colorPalette,
          mockup_url: result.mockupImage || null,
          notes: data.notes || null,
          status: 'pending',
        }).select('id').single();
        if (dbError) console.error('Error saving request:', dbError);
        else if (insertedRow) setRequestId(insertedRow.id);
      }

      toast({ title: "Mockup generato!", description: "Ecco un'anteprima del tuo futuro sito web!" });
    } catch (err: any) {
      console.error('Mockup error:', err);
      toast({ title: "Generazione fallita", description: err.message || "Riprova.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitRequest = async (status: 'approved' | 'feedback') => {
    setIsSubmitting(true);
    try {
      const combinedNotes = status === 'feedback' 
        ? [data.notes, feedbackNotes].filter(Boolean).join('\n\n--- Revision Notes ---\n') 
        : data.notes || null;

      if (requestId) {
        // Update the existing record
        const { error: dbError } = await (supabase.from('website_requests') as any)
          .update({ notes: combinedNotes, status })
          .eq('id', requestId);
        if (dbError) throw dbError;
      } else {
        // Fallback: insert if no requestId (shouldn't happen normally)
        const { error: dbError } = await (supabase.from('website_requests') as any).insert({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          business_name: data.businessName,
          business_type: data.businessType || null,
          logo_url: data.logoUrl || null,
          color_palette: data.colorPalette,
          mockup_url: data.mockupImage || null,
          notes: combinedNotes,
          status,
        });
        if (dbError) throw dbError;
      }

      await supabase.functions.invoke('send-website-request-email', {
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          businessName: data.businessName,
          businessType: data.businessType,
          socialMedia: data.socialMedia,
          notes: combinedNotes,
          colorPalette: data.colorPalette,
          logoUrl: data.logoUrl,
          mockupUrl: data.mockupImage,
          status,
        },
      });

      navigate('/signup/success');
      toast({ 
        title: status === 'approved' ? "Request sent!" : "Feedback sent!", 
        description: status === 'approved' ? "We'll be in touch soon!" : "We'll review your notes and get back to you!" 
      });
    } catch (err: any) {
      console.error('Submit error:', err);
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { icon: User, label: 'Your Info' },
    { icon: Image, label: 'Logo' },
    { icon: Palette, label: 'Colors' },
    { icon: Sparkles, label: 'Preview' },
  ];

  const canProceed = () => {
    switch (step) {
      case 0: return data.name && data.email && data.businessName;
      case 1: return true; // Logo is optional
      case 2: return !!data.colorPalette;
      case 3: return true; // Preview is always shown
      default: return false;
    }
  };

  const saveLeadToDatabase = async () => {
    try {
      const { data: insertedRow, error: dbError } = await (supabase.from('website_requests') as any).insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        business_name: data.businessName,
        business_type: data.businessType || null,
        logo_url: null,
        color_palette: 'pending',
        mockup_url: null,
        notes: data.notes || null,
        status: 'pending',
      }).select('id').single();

      if (dbError) {
        console.error('Error saving lead:', dbError);
      } else if (insertedRow) {
        setRequestId(insertedRow.id);
        console.log('Lead saved with id:', insertedRow.id);
      }
    } catch (err) {
      console.error('Error saving lead:', err);
    }
  };

  const handleNext = async () => {
    if (step === 0 && !requestId) {
      // Save lead immediately after first step
      await saveLeadToDatabase();
    }
    setStep(s => s + 1);
  };

  const hasUploadedLogo = Boolean(data.logoUrl);


  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
              i === step ? 'bg-blue-500 text-white scale-105' :
              i < step ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-500'
            }`}>
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < step ? 'bg-green-400' : 'bg-white/20'}`} />}
          </React.Fragment>
        ))}
      </div>

      <Card className="border border-white/20 bg-white/5 backdrop-blur-sm">
        <CardContent className="pt-6 pb-6">
          {/* Step 0: Info */}
          {step === 0 && (
            <div className="space-y-5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="h-5 w-5 text-blue-400" /> Tell Us About You
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Full Name *</Label>
                  <Input placeholder="John Doe" value={data.name} onChange={e => updateData({ name: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                </div>
                <div>
                  <Label className="text-gray-300">Email *</Label>
                  <Input placeholder="john@example.com" type="email" value={data.email} onChange={e => updateData({ email: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                </div>
                <div>
                  <Label className="text-gray-300">Phone</Label>
                  <Input placeholder="+1 (555) 123-4567" value={data.phone} onChange={e => updateData({ phone: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                </div>
                <div>
                  <Label className="text-gray-300">Business Name *</Label>
                  <Input placeholder="My Awesome Business" value={data.businessName} onChange={e => updateData({ businessName: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Business Type</Label>
                <Input placeholder="e.g., Restaurant, Tech Startup, E-commerce..." value={data.businessType} onChange={e => updateData({ businessType: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              </div>
              <div>
                <Label className="text-gray-300">Social Media</Label>
                <Input placeholder="e.g., @yourbrand on Instagram, Facebook page URL..." value={data.socialMedia} onChange={e => updateData({ socialMedia: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              </div>
              <div>
                <Label className="text-gray-300">Notes</Label>
                <textarea
                  placeholder="Tell us what you'd like for your website... (e.g., I want a modern look with a booking system, photo gallery, etc.)"
                  value={data.notes}
                  onChange={e => updateData({ notes: e.target.value })}
                  className="w-full min-h-[80px] rounded-md px-3 py-2 text-sm bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {/* Step 1: Logo */}
          {step === 1 && (
            <div className="space-y-5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Image className="h-5 w-5 text-blue-400" /> Upload Your Logo
              </h3>
              
              <div 
                className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {hasUploadedLogo ? (
                  <div className="space-y-3">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-green-400/30 bg-green-500/10">
                      <CheckCircle className="h-10 w-10 text-green-400" />
                    </div>
                    <p className="text-green-400 text-sm font-medium">✓ Logo uploaded successfully</p>
                    {data.logoFile && <p className="text-gray-400 text-xs">{data.logoFile.name}</p>}
                    <p className="text-gray-500 text-xs">We&apos;ll use it in the generated mockup. Click to change it.</p>
                  </div>
                ) : uploadingLogo ? (
                  <div className="space-y-3">
                    <Loader2 className="h-12 w-12 text-blue-400 mx-auto animate-spin" />
                    <p className="text-gray-300">Uploading...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <p className="text-gray-300">Click or drag to upload your logo</p>
                    <p className="text-gray-500 text-sm">PNG, JPG, SVG up to 5MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-300 font-semibold">Don't have a logo yet?</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Create one in seconds with our AI logo generator! 
                  </p>
                  <a 
                    href="https://flashlogo.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm mt-2 font-medium"
                  >
                    Visit FlashLogo.com <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Colors */}
          {step === 2 && (
            <div className="space-y-5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Palette className="h-5 w-5 text-blue-400" /> Choose Your Color Palette
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COLOR_PALETTES.map((palette) => (
                  <button
                    key={palette.name}
                    onClick={() => updateData({ colorPalette: palette.name, colorColors: palette.colors })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      data.colorPalette === palette.name
                        ? 'border-blue-400 bg-blue-500/10 scale-[1.02]'
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-1">
                        {palette.colors.map((color, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                      {data.colorPalette === palette.name && <CheckCircle className="h-4 w-4 text-blue-400 ml-auto" />}
                    </div>
                    <p className="text-white font-semibold text-sm">{palette.name}</p>
                    <p className="text-gray-400 text-xs">{palette.desc}</p>
                  </button>
                ))}
                <button
                  onClick={async () => {
                    if (isPickingColors) return;
                    setIsPickingColors(true);
                    try {
                      const { data: result, error } = await supabase.functions.invoke('generate-website-mockup', {
                        body: {
                          businessName: data.businessName,
                          businessType: data.businessType,
                          mode: 'pick-colors',
                        },
                      });
                      if (!error && result?.success && result?.colors) {
                        const colors = result.colors as string[];
                        updateData({ colorPalette: 'AI Selected', colorColors: colors });
                        toast({ title: '🎨 AI palette selected!', description: `Custom colors chosen for ${data.businessName}` });
                      } else {
                        const random = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
                        updateData({ colorPalette: random.name, colorColors: random.colors });
                        toast({ title: 'Palette selected', description: 'Used a recommended palette' });
                      }
                    } catch {
                      const random = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
                      updateData({ colorPalette: random.name, colorColors: random.colors });
                    } finally {
                      setIsPickingColors(false);
                    }
                  }}
                  disabled={isPickingColors}
                  className={`p-4 rounded-xl border-2 text-left transition-all sm:col-start-2 border-dashed border-purple-400/50 bg-gradient-to-br from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 hover:border-purple-400 ${isPickingColors ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {isPickingColors ? <Loader2 className="h-6 w-6 text-purple-400 animate-spin" /> : <Sparkles className="h-6 w-6 text-purple-400" />}
                  </div>
                  <p className="text-white font-semibold text-sm">{isPickingColors ? '🤖 AI is choosing...' : '✨ Pick the Best for Me!'}</p>
                  <p className="text-purple-300 text-xs">{isPickingColors ? 'Analyzing your business...' : 'Let AI choose the perfect palette'}</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div className="space-y-5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-400" /> Your Website Preview
              </h3>
              
              {!data.mockupImage && !isGenerating && (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm mb-4">
                    Click below to generate an AI mockup of your website!
                  </p>
                  <Button onClick={generateMockup} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Sparkles className="h-4 w-4 mr-2" /> Generate Mockup
                  </Button>
                </div>
              )}

              {isGenerating && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
                  <p className="text-gray-400 text-sm">🤖 AI is designing your website mockup...</p>
                  <p className="text-gray-500 text-xs">This may take up to 30 seconds</p>
                </div>
              )}

              {data.mockupImage && !isGenerating && (
                <div className="space-y-4">
                  <div 
                    className="rounded-xl overflow-hidden shadow-2xl border border-white/10 cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => setShowFullscreen(true)}
                  >
                    <img src={data.mockupImage} alt="Website Mockup" className="w-full" />
                    <p className="text-center text-gray-500 text-xs py-2 bg-black/30">Tap to view full size</p>
                  </div>
                  <div className="flex justify-center">
                    <Button onClick={generateMockup} variant="outline" size="sm" className="text-gray-400 border-white/10 hover:bg-white/5">
                      <Sparkles className="h-3 w-3 mr-1" /> Regenerate
                    </Button>
                  </div>
                </div>
              )}

              {/* Fullscreen mockup viewer */}
              {showFullscreen && data.mockupImage && (
                <div 
                  className="fixed inset-0 z-50 bg-black/95 flex items-start justify-center overflow-auto"
                  onClick={() => setShowFullscreen(false)}
                >
                  <button 
                    className="fixed top-4 right-4 z-50 text-white bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-xl backdrop-blur-sm"
                    onClick={() => setShowFullscreen(false)}
                  >
                    ✕
                  </button>
                  <img 
                    src={data.mockupImage} 
                    alt="Website Mockup Full Size" 
                    className="w-full max-w-2xl py-8 px-2"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-300 font-semibold">Like what you see?</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Click "I Love It!" and our team will build your full website within a few days. We'll send you an email notification when it's ready!
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 justify-center">
                <Button 
                  onClick={() => handleSubmitRequest('approved')} 
                  disabled={isSubmitting}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    <><CheckCircle className="mr-2 h-4 w-4" /> I Love It! Let's Go!</>
                  )}
                </Button>

                {!showFeedback ? (
                  <Button 
                    variant="outline"
                    size="lg"
                    onClick={() => setShowFeedback(true)}
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50"
                  >
                    We're on the right track, but…
                  </Button>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 text-left">
                    <p className="text-white font-semibold text-sm">Tell us what you'd like to change:</p>
                    <textarea
                      value={feedbackNotes}
                      onChange={(e) => setFeedbackNotes(e.target.value)}
                      placeholder="e.g. I'd prefer a darker background, bigger logo, different layout for the hero section…"
                      className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleSubmitRequest('feedback')} 
                        disabled={isSubmitting || !feedbackNotes.trim()}
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 flex-1"
                      >
                        {isSubmitting ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                        ) : (
                          'Send Feedback'
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => { setShowFeedback(false); setFeedbackNotes(''); }}
                        className="text-gray-400"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-white/10">
            <Button 
              variant="ghost" 
              onClick={() => setStep(s => s - 1)} 
              disabled={step === 0}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {step < 3 && (
              <Button 
                onClick={handleNext} 
                disabled={!canProceed()}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebsiteWizard;
