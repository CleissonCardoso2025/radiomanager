
import { Navigate } from "react-router-dom";
import { useAuth } from "@/App";
import { useRole, UserRole } from "@/contexts/RoleContext";

interface RoleRouteProps {
  children: JSX.Element;
  allowedRoles: UserRole[];
}

const RoleRoute = ({ children, allowedRoles }: RoleRouteProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const { userRole, isLoading: roleLoading } = useRole();
  
  // Show loading state while checking auth and roles
  if (authLoading || roleLoading) {
    return <div className="h-screen flex items-center justify-center">Carregando...</div>;
  }
  
  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has allowed role
  const hasAllowedRole = userRole && allowedRoles.includes(userRole);
  
  // If user is a locutor with no allowed role for this route, redirect to agenda
  if (!hasAllowedRole && userRole === 'locutor') {
    return <Navigate to="/agenda" replace />;
  }
  
  // If user is not a locutor and doesn't have allowed role, but is trying to access login
  // Allow access to login page
  const currentPath = window.location.pathname;
  if (currentPath === '/login') {
    return children;
  }
  
  // If user doesn't have allowed role, show access denied
  if (!hasAllowedRole) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Acesso negado</h1>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }
  
  // User has allowed role, render the page
  return children;
};

export default RoleRoute;
