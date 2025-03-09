
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RoleProvider } from "@/contexts/RoleContext";
import RoleRoute from "@/components/RoleRoute";
import Index from "./pages/Index";
import GerenciamentoProgramas from "./pages/GerenciamentoProgramas";
import Agenda from "./pages/Agenda";
import Relatorios from "./pages/Relatorios";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

const queryClient = new QueryClient();

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">Carregando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

const App = () => {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check active session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setIsLoading(false);
    };
    
    getSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user, isLoading }}>
        <RoleProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                  <RoleRoute allowedRoles={['admin']}>
                    <Index />
                  </RoleRoute>
                } />
                <Route path="/gerenciamento" element={
                  <RoleRoute allowedRoles={['admin']}>
                    <GerenciamentoProgramas />
                  </RoleRoute>
                } />
                <Route path="/agenda" element={
                  <RoleRoute allowedRoles={['admin', 'locutor']}>
                    <Agenda />
                  </RoleRoute>
                } />
                <Route path="/relatorios" element={
                  <RoleRoute allowedRoles={['admin']}>
                    <Relatorios />
                  </RoleRoute>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </RoleProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

export default App;
