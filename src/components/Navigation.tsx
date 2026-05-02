
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-slate-900/95 backdrop-blur-md border-b border-blue-500/20' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollToSection('hero')}>
            <img src="/lovable-uploads/b97212d1-b771-4d37-add1-527f1cd324ae.png" alt="1000 Feet AI" className="h-10 w-auto" />
            
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-baseline space-x-8">
              {['Services', 'About', 'Portfolio', 'Contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-105"
                >
                  {item}
                </button>
              ))}
              <Link
                to="/ventures"
                className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-105"
              >
                Ventures
              </Link>
            </div>
            <Button asChild size="sm">
              <Link 
                to="/signup"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 text-sm font-semibold rounded-full transform hover:scale-105 transition-all duration-200"
              >
                Get Started
              </Link>
            </Button>
          </div>
          
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-md border-b border-blue-500/20">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {['Services', 'About', 'Portfolio', 'Contact'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                className="text-gray-300 hover:text-blue-400 block px-3 py-2 text-base font-medium w-full text-left"
              >
                {item}
              </button>
            ))}
            <Link
              to="/ventures"
              className="text-gray-300 hover:text-blue-400 block px-3 py-2 text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Ventures
            </Link>
            <div className="px-3 py-2">
              <Button asChild size="sm" className="w-full">
                <Link 
                  to="/signup"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 text-sm font-semibold rounded-full"
                >
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
