import { supabase } from '../../../../lib/supabase';

export async function fetchDashboardCounts() {
  const { count: users } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: menu } = await supabase
    .from('menu_items')
    .select('*', { count: 'exact', head: true });

  const { count: orders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  return { users: users ?? 0, menu: menu ?? 0, orders: orders ?? 0 };
}
