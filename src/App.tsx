
import React, { createContext, useContext, useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { supabase } from './integrations/supabase/client';
import InstallPrompt from './components/InstallPrompt';

// Lazy load pages
const Login = lazy(() => import('./pages/Login'));
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
    <div className="animate-spin-slow h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
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
    return <div className="h-screen flex items-center justify-center">Carregando...</div>;
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
    // Check active session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        
        // Verificar se o email do usuário é de administrador
        // O email cleissoncardoso@gmail.com é administrador, os demais são locutores
        const isAdmin = session.user.email === 'cleissoncardoso@gmail.com';
        setUserRole(isAdmin ? 'admin' : 'locutor');
      } else {
        setUser(null);
        setUserRole(null);
      }
      
      setIsLoading(false);
    };
    
    getSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      
      if (session?.user) {
        // Verificar se o email do usuário é de administrador
        const isAdmin = session.user.email === 'cleissoncardoso@gmail.com';
        setUserRole(isAdmin ? 'admin' : 'locutor');
      } else {
        setUserRole(null);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, isLoading, userRole }}>
      <Toaster />
      <InstallPrompt />
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
