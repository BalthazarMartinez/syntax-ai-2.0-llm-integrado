import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import DataTransformAnimation from '@/components/DataTransformAnimation';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/opportunities');
    }
  }, [user, navigate]);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col">
      {/* Animation Background */}
      <div className="absolute inset-0 w-full h-full">
        <DataTransformAnimation />
      </div>

      {/* Top Content - Title and Description */}
      <div className="relative z-10 pt-8 pb-4 px-4 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground font-brand mb-4">
          SYNTAX.AI
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Syntax.AI centralizes Santex Lab opportunities and enables the agile generation of commercial artifacts using Generative AI
        </p>
      </div>

      {/* Spacer to push button to bottom */}
      <div className="flex-1" />

      {/* Bottom Content - Login Button */}
      <div className="relative z-10 pb-8 px-4 text-center">
        <Button 
          size="lg" 
          onClick={() => navigate('/auth')}
          className="text-lg px-8 py-3"
        >
          Log in
        </Button>
      </div>
    </div>
  );
};

export default Landing;
