import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/LanguageSelector';
import DataTransformAnimation from '@/components/DataTransformAnimation';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

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

      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      {/* Top Content - Title and Description */}
      <div className="relative z-10 pt-8 pb-4 px-4 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground font-brand mb-4">
          {t('landing.title')}
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          {t('landing.description')}
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
          {t('landing.login')}
        </Button>
      </div>
    </div>
  );
};

export default Landing;
