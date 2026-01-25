import { supabase } from '../../../../lib/supabase';

export async function fetchAddressesCountByUser(userId: string) {
  return supabase
    .from('addresses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
}
