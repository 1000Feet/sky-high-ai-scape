
import React from 'react';
import { Target, Award, Users, TrendingUp } from 'lucide-react';

const About = () => {
  const stats = [
    { icon: Users, label: "AI Projects", value: "500+" },
    { icon: Award, label: "Years Experience", value: "15+" },
    { icon: Target, label: "Success Rate", value: "98%" },
    { icon: TrendingUp, label: "Client Satisfaction", value: "100%" }
  ];

  return (
    <section id="about" className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Elevating AI Innovation
            </h2>
            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
              At 1000 Feet AI, we combine decades of technical expertise with cutting-edge artificial intelligence 
              to deliver solutions that soar above the competition. Our aerial perspective on AI development 
              ensures comprehensive, innovative approaches to every challenge.
            </p>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              From machine learning algorithms to complete AI-powered applications, we provide the strategic 
              altitude needed to navigate the complex landscape of artificial intelligence and emerge victorious.
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-6 bg-slate-800/50 rounded-lg backdrop-blur-sm border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:scale-105">
                  <div className="mx-auto mb-3 p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full w-12 h-12 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl"></div>
            <img 
              src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop"
              alt="AI Technology"
              className="relative rounded-2xl shadow-2xl w-full h-96 object-cover border border-blue-500/20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent rounded-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
