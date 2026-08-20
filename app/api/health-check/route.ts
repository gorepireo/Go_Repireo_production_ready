import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);

    if (error) {
      if (error.message?.includes('Invalid API key') || error.code === 'PGRST301') {
        return NextResponse.json({
          status: 'needs_anon_key',
          connected: false,
          projectRef: 'ewyoqmpqqcntohdrmmsa',
          message: 'Supabase Project Connected! Please copy your anon API key from Supabase Dashboard -> Project Settings -> API into .env.local',
          dashboardUrl: 'https://supabase.com/dashboard/project/ewyoqmpqqcntohdrmmsa/settings/api'
        }, { status: 200 });
      }

      return NextResponse.json({
        status: 'table_needs_setup',
        connected: true,
        message: 'Connected to Supabase! Run supabase_master_schema.sql in Supabase SQL Editor to create tables.',
        error: error.message
      }, { status: 200 });
    }

    return NextResponse.json({
      status: 'active',
      connected: true,
      projectRef: 'ewyoqmpqqcntohdrmmsa',
      message: '✅ Supabase PostgreSQL Database is 100% Connected, Active & Ready!'
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ connected: false, error: err.message }, { status: 500 });
  }
}
