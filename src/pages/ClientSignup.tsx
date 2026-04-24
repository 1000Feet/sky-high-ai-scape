import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Globe, Rocket } from 'lucide-react';
import ClientSignupForm from '@/components/ClientSignupForm';
import WebsiteWizard from '@/components/WebsiteWizard';

const ClientSignup: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              Back to Home
            </Link>
            <div className="text-2xl font-bold gradient-text">Digital Solutions</div>
          </div>
        </div>
      </header>

      {/* I NEED A WEBSITE - Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20" />
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-6 py-2 mb-6">
              <Rocket className="h-5 w-5 text-blue-400" />
              <span className="text-blue-300 font-semibold text-sm uppercase tracking-wider">New Interactive Experience</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-4">
              I Need A <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Website!</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-xl mx-auto">
              Tell us about your business, choose your style, and watch AI create a preview of your dream website in seconds FOR FREE!
              <br />
              If you like what you see we will build you professional website starting from only $295.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <WebsiteWizard />
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 max-w-4xl mx-auto py-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <span className="text-gray-400 text-sm font-medium uppercase tracking-widest">Or request any service</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>

      {/* Original Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Let's Build Something <span className="text-shimmer">Amazing Together</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Ready to transform your business with cutting-edge digital solutions? 
              Tell us about your vision and we'll make it reality.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <ClientSignupForm className="w-full" />
            </div>

            <div className="space-y-8">
              <div className="glass p-8 rounded-xl border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-6">Why Choose Us?</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-semibold">Expert Team</h4>
                      <p className="text-gray-300 text-sm">Experienced developers, designers, and strategists dedicated to your success.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-semibold">Custom Solutions</h4>
                      <p className="text-gray-300 text-sm">Tailored approaches that fit your unique business needs and goals.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-semibold">Proven Results</h4>
                      <p className="text-gray-300 text-sm">Track record of delivering successful projects that drive business growth.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-semibold">24/7 Support</h4>
                      <p className="text-gray-300 text-sm">Ongoing support and maintenance to keep your digital presence running smoothly.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass p-8 rounded-xl border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-4">Our Process</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                    <span className="text-gray-300">Discovery & Planning</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                    <span className="text-gray-300">Design & Development</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                    <span className="text-gray-300">Testing & Optimization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
                    <span className="text-gray-300">Launch & Support</span>
                  </div>
                </div>
              </div>

              <div className="glass p-6 rounded-xl border border-white/10 text-center">
                <p className="text-gray-300 mb-4">Need immediate assistance?</p>
                <Button variant="outline" asChild>
                  <a href="mailto:info@1000feetabove.com">Email Us</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientSignup;
