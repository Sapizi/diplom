'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSession, onAuthStateChange, signOut } from '@/app/api/client/auth';
import { fetchAuthenticatedRoleProfile } from '@/app/api/client/profiles';

interface UserProfile {
  id: string;
  name: string;
  isAdmin: boolean;
  isCourer: boolean;
  isManager: boolean;
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
      const fallbackName = session.user.email.split('@')[0] || 'Пользователь';

      try {
        const { data, error } = await fetchAuthenticatedRoleProfile(session.access_token);

        if (error || !data) {
          setUser({
            id: session.user.id,
            name: fallbackName,
            isAdmin: false,
            isCourer: false,
            isManager: false,
          });
          return;
        }

        setUser({
          id: data.user.id,
          name: data.profile?.name || fallbackName,
          isAdmin: Boolean(data.profile?.isAdmin),
          isCourer: Boolean(data.profile?.isCourer),
          isManager: Boolean(data.profile?.isManager),
        });
      } catch (err) {
        console.error('Profile error:', err);
        setUser({
          id: session.user.id,
          name: fallbackName,
          isAdmin: false,
          isCourer: false,
          isManager: false,
        });
      }
    };

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await getSession();

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

    const { data: authListener } = onAuthStateChange(async (_event, session) => {
      if (session) {
        await loadUserProfile(session);
      } else {
        setUser(null);
      }
    });

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
