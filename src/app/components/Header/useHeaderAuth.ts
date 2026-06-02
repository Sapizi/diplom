'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
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
  const resolvedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const applyUser = (nextUser: UserProfile | null) => {
      resolvedUserIdRef.current = nextUser?.id ?? null;
      if (isMounted) {
        setUser(nextUser);
      }
    };

    const loadUserProfile = async (session: Session | null, options?: { force?: boolean }) => {
      const sessionUserId = session?.user?.id ?? null;

      if (!session?.access_token || !sessionUserId) {
        applyUser(null);
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      if (!options?.force && resolvedUserIdRef.current === sessionUserId) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      const fallbackName = session.user.email?.split('@')[0] || 'Пользователь';

      try {
        const { data, error } = await fetchAuthenticatedRoleProfile(session.access_token);

        if (error || !data) {
          applyUser({
            id: session.user.id,
            name: fallbackName,
            isAdmin: false,
            isCourer: false,
            isManager: false,
          });
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        applyUser({
          id: data.user.id,
          name: data.profile?.name || fallbackName,
          isAdmin: Boolean(data.profile?.isAdmin),
          isCourer: Boolean(data.profile?.isCourer),
          isManager: Boolean(data.profile?.isManager),
        });
      } catch (err) {
        console.error('Profile error:', err);
        applyUser({
          id: session.user.id,
          name: fallbackName,
          isAdmin: false,
          isCourer: false,
          isManager: false,
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await getSession();

        if (session) {
          await loadUserProfile(session, { force: true });
        } else {
          applyUser(null);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        applyUser(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const { data: authListener } = onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        return;
      }

      window.setTimeout(() => {
        void loadUserProfile(session, {
          force: event === 'SIGNED_IN' || event === 'USER_UPDATED',
        });
      }, 0);
    });

    void initializeAuth();

    return () => {
      isMounted = false;
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
