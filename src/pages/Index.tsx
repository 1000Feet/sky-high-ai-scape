
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
      <Contact />
    </div>
  );
};

export default Index;
