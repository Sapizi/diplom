'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, onAuthStateChange } from '@/app/api/client/auth';
import { fetchAuthenticatedRoleProfile, type RoleProfile } from '@/app/api/client/profiles';

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

  if (profile.isAdmin) {
    return '/admin/main';
  }

  return '/';
}

export function useCourerAccess() {
  const router = useRouter();
  const [profile, setProfile] = useState<CourerProfile | null>(null);
  const [isChecking, setIsChecking] = useState(true);

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

    const { data: authListener } = onAuthStateChange(async (_event, session) => {
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
    });

    init();

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return { profile, isChecking };
}
