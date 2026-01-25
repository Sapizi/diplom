import { supabase } from '../../../../lib/supabase';

export function subscribeAdminDashboard(onChange: () => void) {
  const channel = supabase
    .channel('admin-dashboard')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
