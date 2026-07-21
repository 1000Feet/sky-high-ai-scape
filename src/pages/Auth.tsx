import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate('/admin', { replace: true });
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/admin', { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success('Account created. Check your inbox to confirm your email.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex flex-col">
      <header className="border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors">
            <ArrowLeft className="h-5 w-5" /> Back to Home
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-white">
          <h1 className="text-2xl font-bold mb-1">{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
          <p className="text-white/70 text-sm mb-6">Admin access only.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/10 border-white/20 text-white" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/10 border-white/20 text-white" />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? '...' : mode === 'login' ? 'Sign in' : 'Sign up'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-white/70">
            {mode === 'login' ? (
              <>No account? <button type="button" onClick={() => setMode('signup')} className="underline">Sign up</button></>
            ) : (
              <>Already registered? <button type="button" onClick={() => setMode('login')} className="underline">Sign in</button></>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
