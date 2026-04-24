import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const SignupSuccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center px-4">
      <Card className="border-2 border-green-500/30 bg-green-500/5 backdrop-blur-sm max-w-lg w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <CheckCircle className="h-20 w-20 text-green-400 mx-auto" />
          <h3 className="text-3xl font-bold text-white">Awesome! We're On It! 🎉</h3>
          <p className="text-gray-300 text-lg max-w-md mx-auto">
            Your website request has been submitted. Our team will contact you within 24 hours to start building your dream website!
          </p>
          <div className="pt-4">
            <Button variant="outline" asChild>
              <Link to="/" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupSuccess;
