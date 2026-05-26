import React from 'react';
import Navigation from '../components/Navigation';

const NuoviMondi = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Navigation />
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <img
            src="/ventures/Nuovi-Mondi-Logo.png"
            alt="Nuovi Mondi"
            className="mx-auto h-32 bg-white rounded-2xl p-6 mb-8"
          />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Nuovi Mondi</h1>
          <p className="text-xl text-gray-300">A new kind of coliving spaces.</p>
          <p className="text-gray-500 mt-8 italic">Content coming soon.</p>
        </div>
      </section>
    </div>
  );
};

export default NuoviMondi;
