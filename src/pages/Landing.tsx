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
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Animation Background */}
      <div className="absolute inset-0 w-full h-full">
        <DataTransformAnimation />
      </div>
    </div>
  );
};

export default Landing;
