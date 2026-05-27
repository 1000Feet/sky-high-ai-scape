
import React from 'react';
import Hero from '../components/Hero';
import Services from '../components/Services';
import About from '../components/About';
import Portfolio from '../components/Portfolio';
import Contact from '../components/Contact';
import Navigation from '../components/Navigation';
import { Link } from 'react-router-dom';
import { Rocket, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Navigation />
      <Hero />
      
      {/* Website Wizard CTA Banner */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
            <Rocket className="h-4 w-4 text-white" />
            <span className="text-white text-sm font-medium">New Service Available</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            I Need A Website!
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Get a professionally designed website in minutes. Tell us about your business, 
            pick your colors, and we'll generate a stunning mockup — powered by AI.
          </p>
          <Link 
            to="/signup"
            className="inline-flex items-center gap-2 bg-white text-blue-700 px-10 py-4 text-lg font-bold rounded-full transform hover:scale-105 hover:bg-gray-100 transition-all duration-200 shadow-2xl"
          >
            Get Started Now
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <Services />
      <About />
      <Portfolio />

      {/* Brands / Products Section for Meta verification */}
      <section id="brands" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Products</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Products and brands built by <strong className="text-white">1000 Feet, Inc.</strong>
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mb-6">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">ReservaMesa</h3>
              <p className="text-gray-300 mb-4">
                Restaurant booking and table management platform for Costa Rica. 
                Seamless reservations, intelligent seating, and real-time availability.
              </p>
              <a href="https://reservamesa.cr" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Visit reservamesa.cr
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center mb-6">
                <Rocket className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">AI Ascend</h3>
              <p className="text-gray-300 mb-4">
                AI-powered web development, design, and digital innovation services. 
                Transforming ideas into cutting-edge digital realities.
              </p>
              <span className="inline-flex items-center text-blue-400 font-medium">
                By 1000 Feet, Inc.
              </span>
            </div>
          </div>
        </div>
      </section>

      <Contact />
    </div>
  );
};

export default Index;
