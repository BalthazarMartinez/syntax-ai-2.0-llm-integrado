import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'syntax-ai-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'en' || stored === 'es') ? stored : 'es';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

const translations = {
  es: {
    landing: {
      title: 'SYNTAX.AI',
      description: 'Syntax.AI centraliza las oportunidades de Santex Lab y permite la generación ágil de artefactos comerciales usando IA Generativa',
      login: 'Iniciar sesión'
    },
    header: {
      hello: 'Hola',
      logout: 'Cerrar Sesión',
      logoutSuccess: 'Cierre de sesión exitoso'
    },
    auth: {
      welcomeBack: 'Bienvenido de nuevo',
      createAccount: 'Crear Cuenta',
      signInDescription: 'Inicia sesión para acceder a tus oportunidades',
      getStarted: 'Comienza con Syntax.AI',
      fullName: 'Nombre Completo',
      fullNamePlaceholder: 'Juan Pérez',
      email: 'Correo Electrónico',
      emailPlaceholder: 'tu@ejemplo.com',
      password: 'Contraseña',
      passwordPlaceholder: '••••••••',
      signIn: 'Iniciar Sesión',
      signUp: 'Registrarse',
      loading: 'Cargando...',
      noAccount: '¿No tienes cuenta? Regístrate',
      hasAccount: '¿Ya tienes cuenta? Inicia sesión',
      loginSuccess: '¡Inicio de sesión exitoso!',
      signupSuccess: '¡Cuenta creada exitosamente!',
      invalidEmail: 'Correo electrónico inválido',
      passwordMinLength: 'La contraseña debe tener al menos 6 caracteres',
      nameMinLength: 'El nombre debe tener al menos 2 caracteres',
      emailExists: 'Este correo ya está registrado. Por favor inicia sesión.',
      errorOccurred: 'Ocurrió un error'
    }
  },
  en: {
    landing: {
      title: 'SYNTAX.AI',
      description: 'Syntax.AI centralizes Santex Lab opportunities and enables the agile generation of commercial artifacts using Generative AI',
      login: 'Log in'
    },
    header: {
      hello: 'Hello',
      logout: 'Log Out',
      logoutSuccess: 'Successfully logged out'
    },
    auth: {
      welcomeBack: 'Welcome Back',
      createAccount: 'Create Account',
      signInDescription: 'Sign in to access your opportunities',
      getStarted: 'Get started with Syntax.AI',
      fullName: 'Full Name',
      fullNamePlaceholder: 'John Doe',
      email: 'Email',
      emailPlaceholder: 'you@example.com',
      password: 'Password',
      passwordPlaceholder: '••••••••',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      loading: 'Loading...',
      noAccount: "Don't have an account? Sign up",
      hasAccount: 'Already have an account? Sign in',
      loginSuccess: 'Logged in successfully!',
      signupSuccess: 'Account created successfully!',
      invalidEmail: 'Invalid email address',
      passwordMinLength: 'Password must be at least 6 characters',
      nameMinLength: 'Name must be at least 2 characters',
      emailExists: 'This email is already registered. Please login instead.',
      errorOccurred: 'An error occurred'
    }
  }
};
