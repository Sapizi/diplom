import { supabase } from '../../../../lib/supabase';
import { requestJson } from './http';

export type ProfileSummary = {
  name: string | null;
  avatar_url: string | null;
  bonus_points: number | null;
};

export type ProfileSettings = {
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
};

export type HeaderProfile = {
  name: string | null;
  isAdmin: boolean | null;
  isCourer: boolean | null;
  isManager: boolean | null;
};

export type RoleProfile = {
  name: string | null;
  isAdmin: boolean | null;
  isCourer: boolean | null;
  isManager: boolean | null;
  avatar_url: string | null;
  isOpen: boolean | null;
};

export type AuthenticatedRoleProfile = {
  user: {
    id: string;
    email: string;
  };
  profile: RoleProfile | null;
};

export type AdminUserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  bonus_points: number | null;
  created_at: string | null;
  isOpen: boolean | null;
  isAdmin: boolean | null;
  isCourer: boolean | null;
  isManager: boolean | null;
};

async function fetchProfileView<T>(view: string, userId?: string) {
  const params = new URLSearchParams();
  params.set('view', view);

  if (userId) {
    params.set('userId', userId);
  }

  const { data, error } = await requestJson<{ profile: T | null }>(`/api/profiles?${params.toString()}`, {
    auth: true,
    fallbackError: 'profile_failed',
  });

  return {
    data: data?.profile ?? null,
    error,
  };
}

export async function fetchHeaderProfile(userId: string) {
  return fetchProfileView<HeaderProfile>('header', userId);
}

export async function fetchRoleProfile(userId: string) {
  return fetchProfileView<RoleProfile>('role', userId);
}

export async function fetchAuthenticatedRoleProfile(accessToken?: string) {
  const headers = new Headers();

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const { data, error } = await requestJson<AuthenticatedRoleProfile>('/api/auth/profile-role', {
    auth: !accessToken,
    headers,
    fallbackError: 'profile_role_failed',
  });

  return {
    data,
    error,
  };
}

export async function fetchProfileSummary(userId: string) {
  return fetchProfileView<ProfileSummary>('summary', userId);
}

export async function fetchProfileSettings(userId: string) {
  return fetchProfileView<ProfileSettings>('settings', userId);
}

export async function updateProfileById(
  userId: string,
  payload: {
    name?: string | null;
    email?: string | null;
    bonus_points?: number | null;
    avatar_url?: string | null;
    phone?: string | null;
  }
) {
  const { data, error } = await requestJson<{ profile: ProfileSettings | ProfileSummary | null }>(
    '/api/profiles',
    {
      method: 'PATCH',
      auth: true,
      fallbackError: 'update_failed',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, payload }),
    }
  );

  return {
    data: data?.profile ?? null,
    error,
  };
}

export async function updateProfileByIdAdmin(
  userId: string,
  payload: {
    name?: string | null;
    email?: string | null;
    bonus_points?: number | null;
    avatar_url?: string | null;
    phone?: string | null;
    isAdmin?: boolean | null;
    isCourer?: boolean | null;
    isManager?: boolean | null;
  }
) {
  const { data, error } = await requestJson('/api/admin/update-user', {
    method: 'POST',
    auth: true,
    fallbackError: 'update_failed',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, payload }),
  });

  return { data, error };
}

export async function createUserByAdmin(payload: {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  role: 'user' | 'manager' | 'courier';
}) {
  const { data, error } = await requestJson('/api/admin/create-user', {
    method: 'POST',
    auth: true,
    fallbackError: 'create_user_failed',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return { data, error };
}

export async function upsertProfileById(
  userId: string,
  payload: Record<string, string | null>
) {
  return updateProfileById(userId, payload);
}

export async function deleteProfileById(userId: string) {
  const { data, error } = await requestJson('/api/admin/delete-user', {
    method: 'POST',
    auth: true,
    fallbackError: 'delete_failed',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  return { data, error };
}

export async function fetchAdminUsers() {
  const { data, error } = await requestJson<{ users: AdminUserProfile[] }>('/api/admin/users', {
    auth: true,
    fallbackError: 'admin_users_failed',
  });

  return {
    data: data?.users ?? [],
    error,
  };
}

export async function uploadAvatar(fileName: string, file: File) {
  return supabase.storage.from('avatars').upload(fileName, file);
}

export function getAvatarPublicUrl(fileName: string) {
  return supabase.storage.from('avatars').getPublicUrl(fileName);
}

export async function getIsAdmin(userId: string) {
  const { data, error } = await fetchProfileView<{ isAdmin: boolean | null }>('is-admin', userId);

  return { data, error };
}

export async function fetchUserBonusPoints(userId: string) {
  return fetchProfileView<{ bonus_points: number | null }>('bonus', userId);
}
