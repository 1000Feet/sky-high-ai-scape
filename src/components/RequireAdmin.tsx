import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  children: React.ReactNode;
}

const RequireAdmin: React.FC<Props> = ({ children }) => {
  const [state, setState] = useState<'loading' | 'authorized' | 'denied' | 'forbidden'>('loading');

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
      // Signed in but not admin: stay here (redirecting to /auth would bounce back and loop)
      if (error || !data) setState('forbidden');
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
  if (state === 'forbidden') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-900 text-white/80 px-4 text-center">
        <p>This account does not have admin access.</p>
        <button
          type="button"
          className="underline"
          onClick={async () => {
            await supabase.auth.signOut();
            setState('denied');
          }}
        >
          Sign out and use a different account
        </button>
      </div>
    );
  }
  return <>{children}</>;
};

export default RequireAdmin;
