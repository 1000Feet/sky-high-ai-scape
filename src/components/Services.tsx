
import React from 'react';
import { Brain, Code, Database, Zap, Cpu, BarChart3, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Services = () => {
  const services = [
    {
      icon: Brain,
      title: "Machine Learning Solutions",
      description: "Custom ML models and algorithms tailored to your specific business needs and data patterns.",
      features: ["Deep Learning", "Neural Networks", "Predictive Analytics"]
    },
    {
      icon: Code,
      title: "AI Software Development",
      description: "End-to-end AI application development with cutting-edge frameworks and technologies.",
      features: ["Python/TensorFlow", "PyTorch", "Custom APIs"]
    },
    {
      icon: Database,
      title: "Data Engineering & Analytics",
      description: "Transform raw data into actionable insights with advanced processing and visualization.",
      features: ["Big Data Processing", "ETL Pipelines", "Real-time Analytics"]
    },
    {
      icon: Zap,
      title: "AI Automation",
      description: "Streamline business processes with intelligent automation and workflow optimization.",
      features: ["Process Automation", "Workflow Optimization", "Smart Integration"]
    },
    {
      icon: Cpu,
      title: "Computer Vision",
      description: "Advanced image and video processing solutions for visual intelligence applications.",
      features: ["Object Detection", "Image Recognition", "Video Analytics"]
    },
    {
      icon: BarChart3,
      title: "AI Consulting",
      description: "Strategic guidance on AI implementation, roadmapping, and digital transformation.",
      features: ["Strategy Planning", "Implementation Roadmap", "ROI Optimization"]
    }
  ];

  return (
    <section id="services" className="py-20 bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Cutting-Edge AI Services
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            From concept to deployment, we deliver comprehensive AI solutions that drive innovation and transform businesses.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className="bg-slate-800/50 border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl backdrop-blur-sm group"
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <service.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white mb-2">
                  {service.title}
                </CardTitle>
                <CardDescription className="text-gray-300 text-base">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-400">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="glass p-8 rounded-2xl border border-blue-500/20 max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Business with AI?
            </h3>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Let's discuss your project and create a custom AI solution that drives real results for your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link 
                  to="/signup"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 font-semibold rounded-full transform hover:scale-105 transition-all duration-200"
                >
                  Start Your AI Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white px-8 py-3 font-semibold rounded-full"
                asChild
              >
                <Link to="/signup">Schedule Consultation</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
