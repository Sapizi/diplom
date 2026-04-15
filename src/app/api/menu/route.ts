import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/app/api/server/supabaseService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get('sort');
    const supabase = createServiceSupabase();

    let query = supabase.from('menu_items').select('*');

    if (sort === 'asc') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'desc') {
      query = query.order('price', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load menu';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
