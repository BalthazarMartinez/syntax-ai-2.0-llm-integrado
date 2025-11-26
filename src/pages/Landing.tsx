import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/opportunities');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* Logo/Brand Name */}
        <h1 className="text-6xl md:text-7xl font-bold text-foreground font-brand">
          Syntax.AI
        </h1>

        {/* Brief Description */}
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Transforma tus oportunidades de negocio en estrategias ganadoras con 
          inteligencia artificial avanzada
        </p>

        {/* Animation Space - Placeholder for future animation */}
        <div className="w-full h-64 md:h-80 bg-muted/30 rounded-lg border border-border/50 flex items-center justify-center my-12">
          <span className="text-muted-foreground">Espacio para animación</span>
        </div>

        {/* Login Button */}
        <div className="pt-8">
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-6"
          >
            Iniciar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
