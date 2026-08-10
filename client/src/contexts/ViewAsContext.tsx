import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

type ViewAsState = {
  /** The role being impersonated, or null if not impersonating */
  viewAsRole: string | null;
  /** The user name being impersonated (for display), or null */
  viewAsName: string | null;
  /** The effective role to use for UI rendering */
  effectiveRole: string;
  /** Whether currently impersonating */
  isImpersonating: boolean;
  /** Can the current real user use View As? */
  canViewAs: boolean;
  /** Start impersonating a role */
  setViewAs: (role: string, name?: string) => void;
  /** Stop impersonating */
  exitViewAs: () => void;
  /** Roles available to impersonate (based on real user's role) */
  availableRoles: { value: string; label: string }[];
};

const ViewAsContext = createContext<ViewAsState | null>(null);

export function ViewAsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [viewAsRole, setViewAsRole] = useState<string | null>(null);
  const [viewAsName, setViewAsName] = useState<string | null>(null);

  const realRole = user?.role || "user";
  const isOwner = realRole === "owner";
  const isAdmin = realRole === "admin";
  const canViewAs = isOwner || isAdmin;

  const availableRoles = useMemo(() => {
    if (isOwner) {
      return [
        { value: "admin", label: "Admin" },
        { value: "technician", label: "Technician" },
        { value: "customer", label: "Customer" },
        { value: "user", label: "User (Subcontractor)" },
      ];
    }
    if (isAdmin) {
      // Admin cannot view as Owner
      return [
        { value: "technician", label: "Technician" },
        { value: "customer", label: "Customer" },
        { value: "user", label: "User (Subcontractor)" },
      ];
    }
    return [];
  }, [isOwner, isAdmin]);

  const setViewAs = useCallback((role: string, name?: string) => {
    setViewAsRole(role);
    setViewAsName(name || null);
  }, []);

  const exitViewAs = useCallback(() => {
    setViewAsRole(null);
    setViewAsName(null);
  }, []);

  const effectiveRole = viewAsRole || realRole;
  const isImpersonating = viewAsRole !== null;

  const value = useMemo(() => ({
    viewAsRole,
    viewAsName,
    effectiveRole,
    isImpersonating,
    canViewAs,
    setViewAs,
    exitViewAs,
    availableRoles,
  }), [viewAsRole, viewAsName, effectiveRole, isImpersonating, canViewAs, setViewAs, exitViewAs, availableRoles]);

  return (
    <ViewAsContext.Provider value={value}>
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs(): ViewAsState {
  const ctx = useContext(ViewAsContext);
  if (!ctx) {
    throw new Error("useViewAs must be used within a ViewAsProvider");
  }
  return ctx;
}
