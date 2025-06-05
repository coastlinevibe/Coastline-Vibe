import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Directly fetch the Wild West Hotel by ID
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        category:category_id(id, name),
        subcategory:subcategory_id(id, name)
      `)
      .eq('id', '5bdc653b-256b-46a1-b853-ebd99468d255')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ business: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 