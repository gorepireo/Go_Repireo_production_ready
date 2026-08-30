import { NextResponse } from 'next/server';
import { turso } from '@/lib/turso';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const rs = await turso.execute("SELECT name FROM sqlite_master WHERE type='table';");
    const tableNames = rs.rows.map(r => String(r.name));

    return NextResponse.json({
      status: 'active',
      connected: true,
      provider: 'Turso (libsql / SQLite at Edge)',
      databaseUrl: 'libsql://gorepireo-gorepireo.aws-ap-south-1.turso.io',
      tablesCount: tableNames.length,
      tables: tableNames,
      message: '✅ Turso SQLite Database is 100% Connected, Active & Ready!'
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ connected: false, provider: 'Turso', error: err.message }, { status: 500 });
  }
}
