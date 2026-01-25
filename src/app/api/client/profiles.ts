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
};

export type AdminUserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  bonus_points: number | null;
  created_at: string | null;
};

export async function fetchHeaderProfile(userId: string) {
  return supabase
    .from('profiles')
    .select('name, "isAdmin"')
    .eq('id', userId)
    .single();
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

export async function upsertProfileById(
  userId: string,
  payload: Record<string, string | null>
) {
  return supabase.from('profiles').upsert({ id: userId, ...payload });
}

export async function deleteProfileById(userId: string) {
  return supabase.from('profiles').delete().eq('id', userId);
}

export async function fetchAdminUsers() {
  return supabase
    .from('profiles')
    .select('id, name, email, avatar_url, bonus_points, created_at')
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
