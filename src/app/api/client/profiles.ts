import { supabase } from '../../../../lib/supabase';

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

export async function fetchHeaderProfile(userId: string) {
  return supabase
    .from('profiles')
    .select('name, "isAdmin", "isCourer", "isManager"')
    .eq('id', userId)
    .single();
}

export async function fetchRoleProfile(userId: string) {
  return supabase
    .from('profiles')
    .select('name, "isAdmin", "isCourer", "isManager", avatar_url, "isOpen"')
    .eq('id', userId)
    .single();
}

export async function fetchAuthenticatedRoleProfile(accessToken?: string) {
  const token =
    accessToken ||
    (await supabase.auth.getSession()).data.session?.access_token;

  if (!token) {
    return { data: null, error: new Error('missing_session') };
  }

  const res = await fetch('/api/auth/profile-role', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: null, error: new Error(data?.error ?? 'profile_role_failed') };
  }

  return { data: data as AuthenticatedRoleProfile, error: null };
}

async function getAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? '';
}

export async function fetchProfileSummary(userId: string) {
  return supabase
    .from('profiles')
    .select('name, avatar_url, bonus_points')
    .eq('id', userId)
    .single();
}

export async function fetchProfileSettings(userId: string) {
  return supabase
    .from('profiles')
    .select('name, phone, avatar_url')
    .eq('id', userId)
    .single();
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
  return supabase.from('profiles').update(payload).eq('id', userId);
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
  const token = await getAccessToken();

  if (!token) {
    return { data: null, error: new Error('missing_session') };
  }

  const res = await fetch('/api/admin/update-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, payload }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: null, error: new Error(data?.error ?? 'update_failed') };
  }

  return { data, error: null };
}

export async function createUserByAdmin(payload: {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  role: 'user' | 'manager' | 'courier';
}) {
  const token = await getAccessToken();

  if (!token) {
    return { data: null, error: new Error('missing_session') };
  }

  const res = await fetch('/api/admin/create-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: null, error: new Error(data?.error ?? 'create_user_failed') };
  }

  return { data, error: null };
}

export async function upsertProfileById(
  userId: string,
  payload: Record<string, string | null>
) {
  return supabase.from('profiles').upsert({ id: userId, ...payload });
}

export async function deleteProfileById(userId: string) {
  const token = await getAccessToken();

  if (!token) {
    return { data: null, error: new Error('missing_session') };
  }

  const res = await fetch('/api/admin/delete-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: null, error: new Error(data?.error ?? 'delete_failed') };
  }

  return { data, error: null };
}

export async function fetchAdminUsers() {
  return supabase
    .from('profiles')
    .select('id, name, email, phone, avatar_url, bonus_points, created_at, "isOpen", "isAdmin", "isCourer", "isManager"')
    .order('created_at', { ascending: true });
}

export async function uploadAvatar(fileName: string, file: File) {
  return supabase.storage.from('avatars').upload(fileName, file);
}

export function getAvatarPublicUrl(fileName: string) {
  return supabase.storage.from('avatars').getPublicUrl(fileName);
}

export async function getIsAdmin(userId: string) {
  return supabase
    .from('profiles')
    .select('isAdmin')
    .eq('id', userId)
    .single();
}

export async function fetchUserBonusPoints(userId: string) {
  return supabase
    .from('profiles')
    .select('bonus_points')
    .eq('id', userId)
    .single();
}
