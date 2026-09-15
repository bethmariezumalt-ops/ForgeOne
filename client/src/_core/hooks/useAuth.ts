import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

type AppUser = {
  id: string;
  email: string | null;
  name: string;
  role: string;
};

function mapUser(user: SupabaseUser | null): AppUser | null {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    name:
      user.user_metadata?.name ??
      user.user_metadata?.full_name ??
      user.email?.split("@")[0] ??
      "User",
    role:
      user.app_metadata?.role ??
      user.user_metadata?.role ??
      "user",
  };
}

export function useAuth(options?: UseAuthOptions) {
  const {
    redirectOnUnauthenticated = false,
    redirectPath = "/",
  } = options ?? {};

  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase.auth.getUser();

    if (error) {
      setError(error);
      setUser(null);
    } else {
      setError(null);
      setUser(mapUser(data.user));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setError(error);
        setUser(null);
      } else {
        setUser(mapUser(data.session?.user ?? null));
      }

      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session?.user ?? null));
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (
      redirectOnUnauthenticated &&
      !loading &&
      !user &&
      typeof window !== "undefined" &&
      window.location.pathname !== redirectPath
    ) {
      window.location.href = redirectPath;
    }
  }, [redirectOnUnauthenticated, redirectPath, loading, user]);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setUser(null);
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
    refresh,
    logout,
  };
}
