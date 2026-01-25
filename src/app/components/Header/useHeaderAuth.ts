'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSession, onAuthStateChange, signOut } from '@/app/api/client/auth';
import { fetchHeaderProfile } from '@/app/api/client/profiles';

interface UserProfile {
  id: string;
  name: string;
  isAdmin: boolean;
}

interface UseHeaderAuthResult {
  user: UserProfile | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

export function useHeaderAuth(): UseHeaderAuthResult {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async (session: any) => {
      try {
        const { data: profile, error } = await fetchHeaderProfile(session.user.id);

        if (error || !profile) {
          setUser({
            id: session.user.id,
            name: session.user.email.split('@')[0] || 'Пользователь',
            isAdmin: false,
          });
        } else {
          setUser({
            id: session.user.id,
            name: profile.name || session.user.email.split('@')[0] || 'Пользователь',
            isAdmin: Boolean(profile.isAdmin),
          });
        }
      } catch (err) {
        console.error('Profile error:', err);
        setUser({
          id: session.user.id,
          name: session.user.email.split('@')[0] || 'Пользователь',
          isAdmin: false,
        });
      }
    };

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await getSession();
        if (session) {
          await loadUserProfile(session);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    const { data: authListener } = onAuthStateChange(
      async (event, session) => {
        if (session) {
          await loadUserProfile(session);
        } else {
          setUser(null);
        }
      }
    );

    initializeAuth();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    const { error } = await signOut();
    if (error) {
      throw error;
    }
    setUser(null);
  }, []);

  return { user, isLoading, logout };
}


