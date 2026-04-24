import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AdminDashboard from '@/components/AdminDashboard';

const Admin: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="max-w-[98vw] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              Back to Home
            </Link>
            <div className="text-2xl font-bold gradient-text">Admin Dashboard</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[98vw] mx-auto px-4 py-8">
        <AdminDashboard />
      </main>
    </div>
  );
};

export default Admin;