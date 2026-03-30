import { supabase } from '../../../../lib/supabase';

export function subscribeAdminDashboard(onChange: () => void) {
  const channel = supabase
    .channel('admin-dashboard')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeOrdersFeed(onChange: () => void, channelName = 'orders-feed') {
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => onChange())
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        onChange();
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeManagerWorkspace(onChange: () => void, channelName = 'manager-workspace') {
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_shifts' }, () => onChange())
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        onChange();
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeCourierWorkspace(
  userId: string,
  onChange: () => void,
  channelName = 'courier-workspace'
) {
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
      () => onChange()
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_shifts' }, () => onChange())
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        onChange();
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeCourierProfile(userId: string, onChange: () => void, channelName = 'courier-profile') {
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
      () => onChange()
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        onChange();
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
