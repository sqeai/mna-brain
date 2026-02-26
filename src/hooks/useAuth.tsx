'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { Tables } from '@/integrations/supabase/types';
import posthog from 'posthog-js';
import { signInWithPassword } from '@/lib/api/pipeline';

type User = Tables<'users'>;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;

  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'mna_tracker_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
        localStorage.removeItem(USER_STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const data = await signInWithPassword(email, password);
      if (!data) {
        return { error: new Error('Invalid email or password') };
      }

      // Store user in state and localStorage
      setUser(data);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('An unexpected error occurred') };
    }
  }, []);



  const signOut = useCallback(async () => {
    // Capture sign-out event before resetting PostHog
    posthog.capture('user_signed_out');
    posthog.reset();

    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
