
import React, { useState } from 'react';
import { ExternalLink, Github, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Portfolio = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  
  const projects = [
    {
      id: 100,
      title: "DawLink AI",
      category: "machine-learning",
      image: "/portfolio/dawlinkai.png",
      description: "AI composition engine for DAWs featuring Text-to-MIDI, Melody-to-Orchestration, and MIDI Enhancement.",
      tech: ["AI Integration", "Music Tech", "Web App", "MIDI Processing"],
      link: "https://www.dawlinkai.com/"
    },
    {
      id: 101,
      title: "Fish & Cheeses",
      category: "food-tech",
      image: "/portfolio/fishandcheeses.png",
      description: "Italian restaurant website with speakeasy experience, gourmet market, and live music events in Costa Rica.",
      tech: ["Website Development", "Branding", "Restaurant Tech", "E-commerce"],
      link: "https://www.fishandcheeses.com/"
    },
    {
      id: 102,
      title: "Play Padel Tamarindo",
      category: "tourism",
      image: "/portfolio/playpadeltamarindo.png",
      description: "Padel court booking platform with community features, shop, and tournament management.",
      tech: ["Website Development", "Booking System", "E-commerce", "Community"],
      link: "https://www.playpadeltamarindo.com/"
    },
    {
      id: 103,
      title: "My Tamarindo Rentals",
      category: "real-estate",
      image: "/portfolio/mytamarindorentals.png",
      description: "Luxury vacation rentals and concierge service platform in Tamarindo, Costa Rica.",
      tech: ["Website Development", "Property Management", "Booking System", "Luxury Branding"],
      link: "https://www.mytamarindorentals.com/"
    },
    {
      id: 104,
      title: "Tennessee Tow Truck Association",
      category: "business",
      image: "/portfolio/tennesseetowtruckassociation.png",
      description: "Professional association website with membership management and event coordination since 2004.",
      tech: ["Website Development", "Membership Platform", "Event Management", "Branding"],
      link: "https://tennesseetowtruckassociation.com/"
    },
    {
      id: 105,
      title: "Palmetto State Quartet",
      category: "media",
      image: "/portfolio/palmettostatequartet.png",
      description: "Southern gospel music quartet website with bios, music catalog, press, and event scheduling.",
      tech: ["Website Development", "Music Platform", "Media Content", "Event Booking"],
      link: "https://www.palmettostatequartet.net/"
    },
    {
      id: 106,
      title: "ABBÀ",
      category: "business",
      image: "/portfolio/abba.png",
      description: "Non-profit organization supporting children's education in Africa with donation and sponsorship platform.",
      tech: ["Website Development", "Non-Profit", "Donation System", "Multilingual"],
      link: "https://www.a-b-b-a.org/"
    },
    {
      id: 107,
      title: "Rome with Kate",
      category: "tourism",
      image: "/portfolio/romewithkate.png",
      description: "Private tour guide service in Rome with booking system and multilingual support.",
      tech: ["Website Development", "Tourism", "Booking System", "Multilingual"],
      link: "https://www.romewithkate.com/"
    },
    {
      id: 1,
      title: "Naples Air Center",
      category: "aviation",
      image: "/lovable-uploads/8fc5f6e5-b394-4409-912d-f94bd88f3a97.png",
      description: "Complete aviation training website with 100,000+ Facebook followers, Google ads, and optimized SEO.",
      tech: ["Website Development", "Video Production", "Social Media", "SEO"],
      link: "https://www.naples-air-center.com/"
    },
    {
      id: 2,
      title: "I Love Panzerotti",
      category: "food-tech",
      image: "/lovable-uploads/785ff7ef-a01c-4a53-a3bf-9f4a6029fab8.png",
      description: "Food ordering platform with complete branding, product creation, and social media management.",
      tech: ["Website Development", "Mobile App", "Branding", "Social Media"],
      link: "http://www.ilovepanzerotti.com/"
    },
    {
      id: 3,
      title: "ILP Franchising",
      category: "business",
      image: "/lovable-uploads/b384ba68-9773-44d3-8436-cf28fe96f804.png",
      description: "Franchising platform with AI chatbot integration for automated customer support.",
      tech: ["Website Development", "AI Chatbot", "Video Production", "Automation"],
      link: "https://franchising.ilovepanzerotti.com/"
    },
    {
      id: 4,
      title: "Trevor's Activity Center",
      category: "tourism",
      image: "/lovable-uploads/16aa34ec-a96b-42fa-be21-2e5b2387b083.png",
      description: "Tourism and activity booking platform for the US Virgin Islands with comprehensive multimedia content.",
      tech: ["Website Development", "Booking System", "Video Production", "Photography"],
      link: "http://www.bestofusvi.com/"
    },
    {
      id: 5,
      title: "Much Better Life",
      category: "lifestyle",
      image: "/lovable-uploads/453b5956-e020-49d1-899b-a3f60f9e54d4.png",
      description: "AI-powered life improvement platform for tracking progress and personal development.",
      tech: ["AI Integration", "Progress Tracking", "Mobile App", "Data Analytics"],
      link: "https://muchbetter.life/"
    },
    {
      id: 6,
      title: "SmartieHub",
      category: "education",
      image: "/lovable-uploads/7effd4f1-4cb6-40fe-8576-c926e9964946.png",
      description: "Educational platform with interactive learning tools and engaging user interface.",
      tech: ["Educational Technology", "Interactive Design", "User Experience", "Learning Management"],
      link: "https://smartiehub.com/"
    },
    {
      id: 7,
      title: "Koalized",
      category: "design",
      image: "/lovable-uploads/e73d8c01-d947-4bfb-98d8-06604eefa8aa.png",
      description: "New Brand concept creation and Shopify Ecommerce Store",
      tech: ["Brand Design", "Shopify Development", "E-commerce", "Brand Strategy"],
      link: "https://koalized.com/"
    },
    {
      id: 8,
      title: "Wonderlogo",
      category: "design",
      image: "/lovable-uploads/79ed4ef6-3821-485c-95ee-0f44001938d8.png",
      description: "Professional AI-powered logo design service with modern branding and visual identity solutions.",
      tech: ["Logo Design", "Brand Identity", "Visual Design", "Creative Strategy"],
      link: "https://wonderlogo.art/"
    },
    {
      id: 9,
      title: "Amphibians Documentary",
      category: "media",
      image: "/lovable-uploads/055c27a5-e1ec-442a-83d4-ad58023a455d.png",
      description: "Aerial cinematography and pilot documentation project showcasing aviation expertise.",
      tech: ["Aerial Filming", "Documentary", "Aviation", "Cinematography"],
      link: "https://www.angelomagni.it/"
    },
    {
      id: 10,
      title: "WebCatechesi",
      category: "media",
      image: "/lovable-uploads/3bda14a5-2820-4680-85a4-aabf43b5f724.png",
      description: "Religious education platform with comprehensive video content and multimedia resources.",
      tech: ["Website Development", "Video Production", "Content Management", "Educational Media"],
      link: "http://www.webcatechesi.it/"
    },
    {
      id: 11,
      title: "Gitavillage Le Marze",
      category: "tourism",
      image: "/lovable-uploads/210a162a-5a28-4c50-a324-21464dd08f2a.png",
      description: "Luxury resort website with stunning oceanfront views and premium hospitality services.",
      tech: ["Website Development", "Hospitality Tech", "Booking System", "Luxury Branding"],
      link: "https://lemarze.it/"
    },
    {
      id: 12,
      title: "TheoloGPT",
      category: "education",
      image: "/lovable-uploads/2522aa93-2f25-47c0-86ed-7b59bc2bffc7.png",
      description: "AI-powered theological chatbot for religious education and spiritual guidance.",
      tech: ["AI Chatbot", "Natural Language Processing", "Religious Education", "Conversational AI"],
      link: "https://lemarze.it/"
    },
    {
      id: 13,
      title: "Realysta",
      category: "real-estate",
      image: "/lovable-uploads/565ad44c-ce58-4720-b6a6-5f41137009e7.png",
      description: "AI-driven real estate website builder with IDX and RETS integration for property listings.",
      tech: ["Real Estate Tech", "IDX Integration", "AI Website Builder", "Property Management"],
      link: "https://www.realysta.com/"
    },
    {
      id: 14,
      title: "Flash Logo",
      category: "design",
      image: "/lovable-uploads/f76f7134-a94e-40ec-8a81-a0d3b55232ac.png",
      description: "AI-powered logo creation platform for instant professional branding solutions.",
      tech: ["AI Logo Generation", "Brand Design", "Automated Design", "Creative AI"],
      link: "https://flashlogo.com/"
    },
    {
      id: 15,
      title: "Ultralight World Journey",
      category: "aviation",
      image: "/lovable-uploads/3636353e-d698-4eef-b45c-4577f8e011bd.png",
      description: "Global aviation journey documentation with ultralight aircraft expedition tracking.",
      tech: ["Aviation Documentation", "Journey Tracking", "Aerial Photography", "Travel Tech"],
      link: "https://www.facebook.com/ultralightworldjourney/"
    },
    {
      id: 16,
      title: "Predictive Analytics Platform",
      category: "machine-learning",
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500&h=300&fit=crop",
      description: "Advanced ML platform for predictive analytics and business intelligence.",
      tech: ["Python", "TensorFlow", "React", "AWS"]
    },
    {
      id: 17,
      title: "Computer Vision System",
      category: "computer-vision",
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=500&h=300&fit=crop",
      description: "Real-time object detection and classification system for industrial applications.",
      tech: ["OpenCV", "PyTorch", "Docker", "Kubernetes"]
    },
    {
      id: 18,
      title: "Natural Language Processor",
      category: "nlp",
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=500&h=300&fit=crop",
      description: "Intelligent text analysis and sentiment classification system.",
      tech: ["BERT", "Transformers", "FastAPI", "MongoDB"]
    },
    {
      id: 19,
      title: "Autonomous Data Pipeline",
      category: "automation",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&h=300&fit=crop",
      description: "Self-managing ETL pipeline with intelligent error handling and optimization.",
      tech: ["Apache Airflow", "Spark", "Kafka", "PostgreSQL"]
    },
    {
      id: 20,
      title: "AI-Powered Dashboard",
      category: "analytics",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=300&fit=crop",
      description: "Real-time analytics dashboard with AI-driven insights and recommendations.",
      tech: ["D3.js", "Node.js", "Redis", "GraphQL"]
    },
    {
      id: 21,
      title: "Smart Recommendation Engine",
      category: "machine-learning",
      image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=500&h=300&fit=crop",
      description: "Personalized recommendation system using collaborative filtering and deep learning.",
      tech: ["Scikit-learn", "Neo4j", "Flask", "Azure"]
    },
    {
      id: 22,
      title: "1000Bots",
      category: "machine-learning",
      image: "/lovable-uploads/25c99967-f690-4536-81ec-a0ecdff80d60.png",
      description: "AI Chat platform with superpowers featuring 500+ like prompts and 4.9-star rating with 98k user reviews.",
      tech: ["AI Chat", "Natural Language Processing", "Mobile App", "Conversational AI"],
      link: "https://1000bots.com/"
    },
    {
      id: 23,
      title: "Custom AI Chatbots",
      category: "machine-learning",
      image: "/lovable-uploads/896f6c46-2bda-45e1-a96d-7b54d528863b.png",
      description: "Custom AI chatbot development with personalized conversational interfaces and intelligent response systems.",
      tech: ["Custom AI", "Chatbot Development", "Mobile Integration", "Conversational Design"]
    },
    {
      id: 200,
      title: "15 Love Tamarindo",
      category: "tourism",
      image: "https://image.thum.io/get/width/800/crop/600/https://15lovetamarindo.com/",
      description: "Tennis club and community platform in Tamarindo, Costa Rica — lessons, court booking, and events.",
      tech: ["Website Development", "Booking System", "Community", "Branding"],
      link: "https://15lovetamarindo.com/"
    },
    {
      id: 201,
      title: "Sophia's Suites",
      category: "tourism",
      image: "https://image.thum.io/get/width/800/crop/600/https://sophiassuites.cr/",
      description: "Boutique hospitality suites in Costa Rica with elegant branding and direct booking experience.",
      tech: ["Website Development", "Hospitality Tech", "Booking System", "Luxury Branding"],
      link: "https://sophiassuites.cr/"
    },
    {
      id: 202,
      title: "Demo Adventures",
      category: "tourism",
      image: "https://image.thum.io/get/width/800/crop/600/https://demoadventures.1000feetabove.com/",
      description: "Adventure tours and activity booking demo platform built by 1000 Feet — immersive tourism experiences.",
      tech: ["Website Development", "Booking System", "Tourism", "UX Design"],
      link: "https://demoadventures.1000feetabove.com/"
    },
    {
      id: 203,
      title: "Alltec",
      category: "business",
      image: "https://image.thum.io/get/width/800/crop/600/https://alltec.cr/",
      description: "Technology and services company in Costa Rica — corporate website with services showcase and lead capture.",
      tech: ["Website Development", "Corporate Branding", "Lead Generation", "SEO"],
      link: "https://alltec.cr/"
    },
    {
      id: 300,
      title: "Nuovi Mondi",
      category: "real-estate",
      image: "/ventures/Nuovi-Mondi-Logo.png",
      description: "A new kind of coliving spaces — community-driven living for modern nomads and creators.",
      tech: ["Coliving", "Real Estate", "Community", "Branding"],
      link: "/nuovimondi"
    },
    {
      id: 301,
      title: "AIwege",
      category: "machine-learning",
      image: "/ventures/AIwege-Logo.jpg",
      description: "AI-powered website generator — build professional websites in minutes, no coding required.",
      tech: ["AI Integration", "Website Builder", "SaaS", "Automation"],
      link: "https://aiwege.com"
    },
    {
      id: 302,
      title: "ReservaMesa",
      category: "food-tech",
      image: "/ventures/reservamesa-logo.png",
      description: "AI-driven restaurant reservations and table management for the Spanish-speaking market.",
      tech: ["AI Integration", "Restaurant Tech", "Booking System", "SaaS"],
      link: "https://reservamesa.cr"
    },
    {
      id: 303,
      title: "Reserve A Table",
      category: "food-tech",
      image: "/ventures/RAT-Logo-Circle.png",
      description: "AI-driven restaurant booking and table management — seamless for both diners and venues.",
      tech: ["AI Integration", "Restaurant Tech", "Booking System", "SaaS"]
    },
    {
      id: 304,
      title: "ConciergeDesk",
      category: "tourism",
      image: "/ventures/ConciergeDesk-Logo.png",
      description: "AI-powered concierge service for hotels and hospitality businesses.",
      tech: ["AI Integration", "Hospitality Tech", "Concierge", "SaaS"]
    },
    {
      id: 305,
      title: "Time 4 Love",
      category: "business",
      image: "/ventures/Time-4-Love-Logo.png",
      description: "Volunteer recruitment and HR management platform for charity organizations and non-profits.",
      tech: ["Non-Profit", "HR Platform", "Volunteer Management", "SaaS"],
      link: "https://time4love.org"
    },
    {
      id: 306,
      title: "GyroTours",
      category: "tourism",
      image: "/ventures/GyroTours-Logo.png",
      description: "Gyrocopter tours in Costa Rica — an unforgettable aerial adventure over stunning landscapes.",
      tech: ["Tourism", "Booking System", "Aviation", "Branding"],
      link: "https://gyrotours.cr"
    },
    {
      id: 307,
      title: "NamesWiki",
      category: "media",
      image: "/ventures/nameswiki-logo.png",
      description: "The world's largest searchable database of names — meanings, origins, and cultural history.",
      tech: ["Content Platform", "SEO", "Search", "Database"],
      link: "https://nameswiki.com"
    },
    {
      id: 308,
      title: "WhatsApp Translator",
      category: "machine-learning",
      image: "/ventures/Whatsapp-Translator-Logo.png",
      description: "Real-time translation built directly into WhatsApp — break language barriers in any conversation.",
      tech: ["AI Translation", "Messaging", "NLP", "Mobile"]
    },
    {
      id: 309,
      title: "SaveMyBiz",
      category: "business",
      image: "/ventures/SaveMyBiz-Logo.png",
      description: "AI-powered business rescue and growth platform — turn struggling businesses around with data-driven insights.",
      tech: ["AI Integration", "Business Intelligence", "SaaS", "Analytics"],
      link: "https://savemybiz.netlify.app"
    },
    {
      id: 310,
      title: "DistressBerg",
      category: "real-estate",
      image: "/ventures/DistressBerg-Logo.png",
      description: "Distressed real estate terminal — Bloomberg-style intelligence for foreclosure, REO, and off-market opportunities.",
      tech: ["Real Estate Tech", "Data Intelligence", "SaaS", "Analytics"],
      link: "https://distressberg.netlify.app"
    }
  ];

  const filters = [
    { id: 'all', label: 'All Projects' },
    { id: 'aviation', label: 'Aviation' },
    { id: 'food-tech', label: 'Food Tech' },
    { id: 'business', label: 'Business' },
    { id: 'tourism', label: 'Tourism' },
    { id: 'lifestyle', label: 'Lifestyle' },
    { id: 'education', label: 'Education' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'design', label: 'Design' },
    { id: 'media', label: 'Media' },
    { id: 'real-estate', label: 'Real Estate' },
    { id: 'machine-learning', label: 'Machine Learning' },
    { id: 'computer-vision', label: 'Computer Vision' },
    { id: 'nlp', label: 'NLP' },
    { id: 'automation', label: 'Automation' },
    { id: 'analytics', label: 'Analytics' }
  ];

  const filteredProjects = activeFilter === 'all' 
    ? projects 
    : projects.filter(project => project.category === activeFilter);

  return (
    <section id="portfolio" className="py-20 bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Our Portfolio
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Showcasing our diverse range of digital solutions across aviation, food tech, tourism, education, and media industries.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                variant={activeFilter === filter.id ? "default" : "outline"}
                className={`transition-all duration-200 ${
                  activeFilter === filter.id
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                    : "border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
                }`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <Card 
              key={project.id}
              className="bg-slate-800/50 border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl backdrop-blur-sm group overflow-hidden"
            >
              <div className="relative overflow-hidden">
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {project.link && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => window.open(project.link, '_blank')}
                    >
                      <ExternalLink size={16} />
                    </Button>
                  </div>
                )}
              </div>
              
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-200">
                  {project.title}
                </h3>
                <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                  {project.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((tech, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
