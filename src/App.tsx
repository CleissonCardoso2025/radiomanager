
import React, { createContext, useContext, useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { supabase, loadUserEmailMap, updateUserEmailMap } from './integrations/supabase/client';
import InstallPrompt from './components/InstallPrompt';
import Login from './pages/Login'; // Import directly instead of lazy loading

// Lazy load other pages
const Index = lazy(() => import('./pages/Index'));
const GerenciamentoProgramas = lazy(() => import('./pages/GerenciamentoProgramas'));
const Producao = lazy(() => import('./pages/Producao'));
const Agenda = lazy(() => import('./pages/Agenda'));
const Relatorios = lazy(() => import('./pages/Relatorios'));
const Perfil = lazy(() => import('./pages/Perfil'));
const Configuracoes = lazy(() => import('./pages/Configuracoes'));
const AcessoNegado = lazy(() => import('./pages/AcessoNegado'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading component
const LoadingFallback = () => (
  <div className="h-screen flex items-center justify-center">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    <span className="ml-3">Carregando...</span>
  </div>
);

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  userRole: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  userRole: null,
});

export const useAuth = () => useContext(AuthContext);

function ProtectedRoute({ children, allowedRoles = ['admin', 'locutor'] }: { children: JSX.Element, allowedRoles?: string[] }) {
  const { user, isLoading, userRole } = useAuth();
  
  if (isLoading) {
    return <LoadingFallback />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Se o usuário for admin, permitir acesso a qualquer rota
  if (userRole === 'admin') {
    return children;
  }
  
  // Para outros papéis, verificar se têm permissão
  if (!allowedRoles.includes(userRole || '')) {
    return <Navigate to="/acesso-negado" replace />;
  }
  
  return children;
}

const App = () => {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  useEffect(() => {
    // Set up auth state listener FIRST to prevent missing auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setUser(session?.user || null);
      
      // Handle user role updates but avoid infinite loops by not making any Supabase calls directly here
      if (session?.user) {
        if (session.user.email) {
          updateUserEmailMap(session.user.id, session.user.email);
        }
        
        // Use setTimeout to defer Supabase calls and prevent deadlocks
        setTimeout(() => {
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single()
            .then(({ data, error }) => {
              if (data && !error) {
                setUserRole(data.role);
              } else {
                // Fallback para o email do administrador
                const isAdmin = session.user.email === 'cleissoncardoso@gmail.com';
                setUserRole(isAdmin ? 'admin' : 'locutor');
              }
              setIsLoading(false);
            });
        }, 0);
      } else {
        setUserRole(null);
        setIsLoading(false);
      }
    });
    
    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setUser(session?.user || null);
      
      if (session?.user) {
        // Armazenar o email do usuário no mapeamento local
        if (session.user.email) {
          updateUserEmailMap(session.user.id, session.user.email);
        }
        
        // Verificar papel do usuário com timeout para evitar deadlocks
        setTimeout(() => {
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single()
            .then(({ data, error }) => {
              if (data && !error) {
                setUserRole(data.role);
              } else {
                // Fallback para o email do administrador
                const isAdmin = session.user.email === 'cleissoncardoso@gmail.com';
                setUserRole(isAdmin ? 'admin' : 'locutor');
              }
              setIsLoading(false);
            });
        }, 0);
      } else {
        setIsLoading(false);
      }
    });
    
    // Try to load email mapping on init
    loadUserEmailMap();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Add a safeguard - if still loading after 5 seconds, force stop loading
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.log('Force stopping loading state after timeout');
        setIsLoading(false);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);
  
  return (
    <AuthContext.Provider value={{ user, isLoading, userRole }}>
      <Toaster />
      <InstallPrompt />
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={
              isLoading ? <LoadingFallback /> : (user ? <Navigate to="/" replace /> : <Login />)
            } />
            <Route path="/" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/gerenciamento" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <GerenciamentoProgramas />
              </ProtectedRoute>
            } />
            <Route path="/agenda" element={
              <ProtectedRoute allowedRoles={['admin', 'locutor']}>
                <Agenda />
              </ProtectedRoute>
            } />
            <Route path="/producao" element={
              <ProtectedRoute allowedRoles={['admin', 'locutor']}>
                <Producao />
              </ProtectedRoute>
            } />
            <Route path="/relatorios" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Relatorios />
              </ProtectedRoute>
            } />
            <Route path="/perfil" element={
              <ProtectedRoute allowedRoles={['admin', 'locutor']}>
                <Perfil />
              </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Configuracoes />
              </ProtectedRoute>
            } />
            <Route path="/acesso-negado" element={<AcessoNegado />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
