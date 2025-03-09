
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/App";

export type UserRole = "admin" | "locutor";

interface RoleContextType {
  userRole: UserRole | null;
  isLoading: boolean;
  checkUserRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType>({
  userRole: null,
  isLoading: true,
  checkUserRole: async () => {},
});

export const useRole = () => useContext(RoleContext);

export const RoleProvider = ({ children }: { children: React.ReactNode }) => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();

  const checkUserRole = async () => {
    if (!user) {
      setUserRole(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        setUserRole(null);
      } else {
        setUserRole(data.role as UserRole);
      }
    } catch (error) {
      console.error("Failed to fetch user role:", error);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUserRole();
  }, [user]);

  return (
    <RoleContext.Provider value={{ userRole, isLoading, checkUserRole }}>
      {children}
    </RoleContext.Provider>
  );
};
