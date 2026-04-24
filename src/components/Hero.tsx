
import React from 'react';
import { ArrowRight, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Hero = () => {
  const scrollToServices = () => {
    const element = document.getElementById('services');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToPortfolio = () => {
    const element = document.getElementById('portfolio');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      {/* Realistic Hazy Clouds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Cloud 1 - Large puffy cloud */}
        <div className="cloud-drift absolute top-0 left-1/4 opacity-30" style={{ filter: 'blur(1.5px)' }}>
          <svg width="160" height="80" viewBox="0 0 160 80" className="drop-shadow-lg">
            <defs>
              <radialGradient id="cloudGradient1" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
                <stop offset="70%" stopColor="rgba(240, 248, 255, 0.6)" />
                <stop offset="100%" stopColor="rgba(200, 230, 255, 0.3)" />
              </radialGradient>
            </defs>
            <path 
              d="M20,50 C10,35 25,25 40,30 C45,20 65,20 75,30 C85,25 100,25 110,35 C125,30 140,40 130,55 C135,65 120,70 100,65 C90,75 70,75 60,65 C45,70 25,65 20,50 Z" 
              fill="url(#cloudGradient1)"
            />
            <path 
              d="M35,45 C30,35 40,30 50,35 C55,30 70,30 75,40 C85,35 95,40 90,50 C95,55 85,60 75,55 C70,60 55,60 50,55 C40,58 30,55 35,45 Z" 
              fill="rgba(255, 255, 255, 0.4)"
            />
          </svg>
        </div>

        {/* Cloud 2 - Medium wispy cloud */}
        <div className="cloud-drift-reverse absolute top-0 right-1/3 opacity-25" style={{ filter: 'blur(2px)' }}>
          <svg width="120" height="60" viewBox="0 0 120 60">
            <defs>
              <radialGradient id="cloudGradient2" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
                <stop offset="60%" stopColor="rgba(225, 245, 254, 0.5)" />
                <stop offset="100%" stopColor="rgba(186, 230, 253, 0.2)" />
              </radialGradient>
            </defs>
            <path 
              d="M15,35 C8,25 18,20 28,25 C32,18 45,18 52,25 C60,22 75,25 80,35 C90,32 100,38 95,48 C98,55 88,58 78,55 C72,60 58,60 52,55 C42,57 25,55 15,35 Z" 
              fill="url(#cloudGradient2)"
            />
          </svg>
        </div>

        {/* Cloud 3 - Small dense cloud */}
        <div className="cloud-drift-slow absolute top-0 right-1/4 opacity-35" style={{ filter: 'blur(1px)' }}>
          <svg width="100" height="50" viewBox="0 0 100 50">
            <defs>
              <radialGradient id="cloudGradient3" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
                <stop offset="80%" stopColor="rgba(248, 250, 252, 0.6)" />
                <stop offset="100%" stopColor="rgba(203, 213, 225, 0.3)" />
              </radialGradient>
            </defs>
            <path 
              d="M12,30 C6,22 14,18 22,22 C25,16 35,16 40,22 C46,20 55,22 58,30 C65,28 72,32 68,40 C70,45 62,47 55,45 C50,48 40,48 36,45 C28,46 18,44 12,30 Z" 
              fill="url(#cloudGradient3)"
            />
          </svg>
        </div>

        {/* Cloud 4 - Large sprawling cloud */}
        <div className="cloud-drift absolute top-0 left-2/3 opacity-20" style={{ filter: 'blur(2.5px)' }}>
          <svg width="180" height="90" viewBox="0 0 180 90">
            <defs>
              <radialGradient id="cloudGradient4" cx="50%" cy="40%" r="65%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.7)" />
                <stop offset="50%" stopColor="rgba(241, 245, 249, 0.5)" />
                <stop offset="100%" stopColor="rgba(226, 232, 240, 0.2)" />
              </radialGradient>
            </defs>
            <path 
              d="M25,55 C12,40 28,30 45,35 C50,25 70,25 80,35 C90,30 110,30 120,40 C135,35 155,45 145,60 C150,70 135,75 115,70 C105,80 85,80 75,70 C60,75 40,70 25,55 Z" 
              fill="url(#cloudGradient4)"
            />
            <path 
              d="M40,50 C35,40 45,35 55,40 C60,35 75,35 80,45 C90,40 100,45 95,55 C100,60 90,65 80,60 C75,65 60,65 55,60 C45,62 35,60 40,50 Z" 
              fill="rgba(255, 255, 255, 0.3)"
            />
          </svg>
        </div>

        {/* Cloud 5 - Thin wispy cloud */}
        <div className="cloud-drift-reverse absolute top-0 left-1/2 opacity-18" style={{ filter: 'blur(3px)' }}>
          <svg width="110" height="55" viewBox="0 0 110 55">
            <defs>
              <radialGradient id="cloudGradient5" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.6)" />
                <stop offset="70%" stopColor="rgba(236, 254, 255, 0.4)" />
                <stop offset="100%" stopColor="rgba(207, 250, 254, 0.1)" />
              </radialGradient>
            </defs>
            <path 
              d="M18,32 C10,24 20,20 30,24 C34,18 46,18 52,24 C58,22 68,24 72,32 C80,30 88,34 84,42 C86,47 78,49 70,47 C65,50 55,50 50,47 C42,48 28,46 18,32 Z" 
              fill="url(#cloudGradient5)"
            />
          </svg>
        </div>

        {/* Cloud 6 - Extra atmospheric layer */}
        <div className="cloud-drift absolute top-0 left-1/8 opacity-15" style={{ filter: 'blur(4px)' }}>
          <svg width="200" height="60" viewBox="0 0 200 60">
            <defs>
              <radialGradient id="cloudGradient6" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
                <stop offset="100%" stopColor="rgba(219, 234, 254, 0.1)" />
              </radialGradient>
            </defs>
            <path 
              d="M20,35 C10,25 25,20 40,25 C50,15 80,15 100,25 C120,20 150,25 160,35 C175,30 190,40 180,50 C185,55 170,58 150,55 C130,60 100,60 80,55 C60,58 40,55 20,35 Z" 
              fill="url(#cloudGradient6)"
            />
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in">
          <div className="mb-8">
            <img 
              src="/lovable-uploads/b97212d1-b771-4d37-add1-527f1cd324ae.png" 
              alt="1000 Feet AI" 
              className="h-40 w-auto mx-auto mb-6"
            />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-shimmer floating-element">
            AI Innovation
            <br />
            <span className="text-white">From Above</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Pioneering the future of artificial intelligence with cutting-edge development, 
            consulting, and solutions that elevate your business to new heights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={scrollToServices}
              variant="outline"
              className="border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white px-8 py-4 text-lg font-semibold rounded-full transform hover:scale-105 transition-all duration-200"
            >
              Explore Our Services
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              onClick={scrollToPortfolio}
              variant="outline"
              className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-white px-8 py-4 text-lg font-semibold rounded-full transform hover:scale-105 transition-all duration-200"
            >
              View Portfolio
            </Button>
            
            <Button asChild>
              <Link 
                to="/signup"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-4 text-lg font-semibold rounded-full transform hover:scale-105 transition-all duration-200 shadow-2xl"
              >
                <Rocket className="mr-2 h-5 w-5" />
                Get Started Now
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
