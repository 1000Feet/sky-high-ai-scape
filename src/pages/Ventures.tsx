import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import VenturesGraph from '../components/VenturesGraph';

const Ventures = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Navigation />
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Ventures</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            A portfolio of products and companies built and owned by 1000 Feet Inc. Click any venture to learn more.
          </p>
        </div>
        <VenturesGraph />
      </section>
    </div>
  );
};

export default Ventures;
