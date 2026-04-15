import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/app/api/server/supabaseService';

export async function GET() {
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from('categories').select('id, name').order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ categories: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load categories';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
