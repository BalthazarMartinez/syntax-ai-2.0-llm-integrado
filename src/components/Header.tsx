import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Cierre de sesión exitoso');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white">
      <div className="container flex h-20 items-center justify-between px-8">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => navigate('/')}
        >
          <span className="text-2xl font-bold text-foreground font-brand">
            Syntax.AI
          </span>
        </div>
        
        <div className="flex items-center justify-center flex-1">
          <img 
            src={logo} 
            alt="Syntax Logo" 
            className="h-14 w-14 cursor-pointer" 
            onClick={() => navigate('/')}
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">
            Hola, {user?.email?.split('@')[0] || 'Usuario'}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="gap-2 hover:bg-white/50"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </header>
  );
}
