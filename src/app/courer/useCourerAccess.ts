'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, onAuthStateChange, redirectToHome } from '@/app/api/client/auth';
import { fetchAuthenticatedRoleProfile, type RoleProfile } from '@/app/api/client/profiles';
import { subscribeCourierProfile } from '@/app/api/client/realtime';

type CourerProfile = RoleProfile & {
  id: string;
  email: string;
};

function getRedirectPath(profile: RoleProfile | null) {
  if (!profile) {
    return '/';
  }

  if (profile.isCourer) {
    return null;
  }

  if (profile.isManager) {
    return '/manager/main';
  }

  if (profile.isAdmin) {
    return '/admin/main';
  }

  return '/';
}

export function useCourerAccess() {
  const router = useRouter();
  const [profile, setProfile] = useState<CourerProfile | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const handleSession = async (session: any) => {
      setIsChecking(true);

      const { data, error } = await fetchAuthenticatedRoleProfile(session.access_token);

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error('Courer profile load error:', error);
        setProfile(null);
        setIsChecking(false);
        router.replace('/');
        return;
      }

      const redirectPath = getRedirectPath(data?.profile ?? null);

      if (redirectPath) {
        setProfile(null);
        setIsChecking(false);
        router.replace(redirectPath);
        return;
      }

      setProfile({
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
          setProfile(null);
          setIsChecking(false);
          router.replace('/login');
          return;
        }

        await handleSession(session);
      } catch (error) {
        console.error('Courer auth init error:', error);
        if (!isMounted) {
          return;
        }
        setProfile(null);
        setIsChecking(false);
        router.replace('/login');
      }
    };

    const { data: authListener } = onAuthStateChange(async (event, session) => {
      if (!isMounted) {
        return;
      }

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setIsChecking(true);
        redirectToHome();
        return;
      }

      if (!session) {
        setProfile(null);
        setIsChecking(false);
        router.replace('/login');
        return;
      }

      await handleSession(session);
    });

    init();

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router, reloadKey]);

  useEffect(() => {
    if (!profile?.id) {
      return;
    }

    const unsubscribe = subscribeCourierProfile(
      profile.id,
      () => setReloadKey((current) => current + 1),
      `courier-profile-${profile.id}`
    );

    return () => {
      unsubscribe();
    };
  }, [profile?.id]);

  return {
    profile,
    isChecking,
    reloadProfile: () => setReloadKey((current) => current + 1),
  };
}
