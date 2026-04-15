'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, onAuthStateChange, redirectToHome } from '@/app/api/client/auth';
import { fetchAuthenticatedRoleProfile, type RoleProfile } from '@/app/api/client/profiles';

export type AdminAccessProfile = RoleProfile & {
  id: string;
  email: string;
};

function getRedirectPath(profile: RoleProfile | null) {
  if (!profile) {
    return '/';
  }

  if (profile.isAdmin) {
    return null;
  }

  if (profile.isManager) {
    return '/manager/main';
  }

  if (profile.isCourer) {
    return '/courer/main';
  }

  return '/';
}

export function useAdminAccess() {
  const router = useRouter();
  const [profile, setProfile] = useState<AdminAccessProfile | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const profileRef = useRef<AdminAccessProfile | null>(null);

  useEffect(() => {
    let isMounted = true;

    const setResolvedProfile = (nextProfile: AdminAccessProfile | null) => {
      profileRef.current = nextProfile;
      setProfile(nextProfile);
    };

    const handleSession = async (session: any, options?: { force?: boolean }) => {
      const sessionUserId = session?.user?.id ?? null;

      if (!session?.access_token || !sessionUserId) {
        setResolvedProfile(null);
        setIsChecking(false);
        router.replace('/login');
        return;
      }

      if (!options?.force && profileRef.current?.id === sessionUserId) {
        setIsChecking(false);
        return;
      }

      setIsChecking(true);

      const { data, error } = await fetchAuthenticatedRoleProfile(session.access_token);

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error('Admin profile load error:', error);
        setResolvedProfile(null);
        setIsChecking(false);
        router.replace('/');
        return;
      }

      const redirectPath = getRedirectPath(data?.profile ?? null);

      if (redirectPath) {
        setResolvedProfile(null);
        setIsChecking(false);
        router.replace(redirectPath);
        return;
      }

      setResolvedProfile({
        id: data?.user.id ?? session.user.id,
        email: data?.user.email ?? session.user.email ?? '',
        name: data?.profile?.name ?? null,
        isAdmin: Boolean(data?.profile?.isAdmin),
        isCourer: Boolean(data?.profile?.isCourer),
        isManager: Boolean(data?.profile?.isManager),
        avatar_url: data?.profile?.avatar_url ?? null,
        isOpen: data?.profile?.isOpen ?? null,
      });
      setIsChecking(false);
    };

    const init = async () => {
      try {
        const {
          data: { session },
        } = await getSession();

        if (!isMounted) {
          return;
        }

        if (!session) {
          setResolvedProfile(null);
          setIsChecking(false);
          router.replace('/login');
          return;
        }

        await handleSession(session, { force: true });
      } catch (error) {
        console.error('Admin auth init error:', error);
        if (!isMounted) {
          return;
        }

        setResolvedProfile(null);
        setIsChecking(false);
        router.replace('/login');
      }
    };

    const { data: authListener } = onAuthStateChange(async (event, session) => {
      if (!isMounted) {
        return;
      }

      if (event === 'SIGNED_OUT') {
        setResolvedProfile(null);
        setIsChecking(true);
        redirectToHome();
        return;
      }

      if (!session) {
        setResolvedProfile(null);
        setIsChecking(false);
        router.replace('/login');
        return;
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        await handleSession(session, {
          force: event === 'USER_UPDATED' || profileRef.current?.id !== session.user.id,
        });
      }
    });

    init();

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return {
    profile,
    isChecking,
  };
}
