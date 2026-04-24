import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Contact = () => {
  const contactInfo = [
    {
      icon: MapPin,
      title: "Location",
      details: ["San Francisco, CA", "Remote Worldwide"]
    },
    {
      icon: Phone,
      title: "Phone",
      details: ["+1 (786) 220 1185 (calls)", "0039 3356978194 (Whatsapp, Telegram, Signal, iMessage)"]
    },
    {
      icon: Mail,
      title: "Email",
      details: ["info@1000feetabove.com"]
    },
    {
      icon: Clock,
      title: "Business Hours",
      details: ["Mon-Sat: 6AM-6PM PST (San Francisco)", "24/7 Emergency Support"]
    }
  ];

  return (
    <section id="contact" className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Ready to Elevate Your AI?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Let's discuss how our cutting-edge AI solutions can transform your business and take it to new heights.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contactInfo.map((info, index) => (
              <Card key={index} className="bg-slate-800/50 border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                      <info.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{info.title}</h3>
                      {info.details.map((detail, detailIndex) => (
                        <p key={detailIndex} className="text-gray-300 text-sm mb-1">
                          {detail.includes('@') ? (
                            <a href={`mailto:${detail}`} className="hover:text-blue-400 transition-colors">
                              {detail}
                            </a>
                          ) : (
                            detail
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
