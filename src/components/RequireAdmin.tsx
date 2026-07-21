import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  children: React.ReactNode;
}

const RequireAdmin: React.FC<Props> = ({ children }) => {
  const [state, setState] = useState<'loading' | 'authorized' | 'denied'>('loading');

  useEffect(() => {
    let mounted = true;

    const check = async (userId: string | undefined) => {
      if (!userId) {
        if (mounted) setState('denied');
        return;
      }
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin',
      });
      if (!mounted) return;
      if (error || !data) setState('denied');
      else setState('authorized');
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      check(session?.user?.id);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      check(session?.user?.id);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white/70">
        Verifying access…
      </div>
    );
  }
  if (state === 'denied') return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

export default RequireAdmin;
