import { NextResponse } from 'next/server';
import { requireIdentity, authErrorResponse } from '@/lib/server/auth';
import { getTurso } from '@/lib/server/turso';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await requireIdentity(request, ['admin']);
    const db = getTurso();

    const [
      bookingsCountRes,
      pendingWorkersRes,
      activeWorkersRes,
      customersCountRes,
      recentBookingsRes,
      recentApplicationsRes,
    ] = await Promise.all([
      db.execute({ sql: `SELECT COUNT(*) as count FROM bookings`, args: [] }),
      db.execute({
        sql: `SELECT COUNT(*) as count FROM users WHERE role = 'worker' AND account_status = 'pending'`,
        args: [],
      }),
      db.execute({
        sql: `SELECT COUNT(*) as count FROM users WHERE role = 'worker' AND account_status = 'active'`,
        args: [],
      }),
      db.execute({
        sql: `SELECT COUNT(*) as count FROM users WHERE role = 'customer'`,
        args: [],
      }),
      db.execute({
        sql: `SELECT b.id, b.service_name, b.status, b.quoted_amount_paise, b.created_at,
                     u.display_name as customer_name, u.phone as customer_phone
              FROM bookings b
              LEFT JOIN users u ON b.customer_id = u.id
              ORDER BY b.created_at DESC LIMIT 5`,
        args: [],
      }),
      db.execute({
        sql: `SELECT u.id, u.display_name, u.phone, u.email, u.account_status, u.created_at,
                     w.experience_years, w.district, w.state, w.pincode, w.approval_status, w.service_categories_json
              FROM users u
              LEFT JOIN worker_profiles w ON u.id = w.user_id
              WHERE u.role = 'worker'
              ORDER BY u.created_at DESC LIMIT 5`,
        args: [],
      }),
    ]);

    const stats = {
      totalBookings: Number(bookingsCountRes.rows[0]?.count || 0),
      pendingWorkers: Number(pendingWorkersRes.rows[0]?.count || 0),
      activeWorkers: Number(activeWorkersRes.rows[0]?.count || 0),
      totalCustomers: Number(customersCountRes.rows[0]?.count || 0),
    };

    const recentBookings = recentBookingsRes.rows.map((r) => ({
      id: String(r.id),
      serviceName: String(r.service_name || 'Service'),
      status: String(r.status || 'requested'),
      amount: Math.round(Number(r.quoted_amount_paise || 0) / 100),
      createdAt: String(r.created_at || ''),
      customerName: String(r.customer_name || 'Customer'),
      customerPhone: String(r.customer_phone || ''),
    }));

    const recentApplications = recentApplicationsRes.rows.map((r) => {
      let categories: string[] = [];
      try {
        if (r.service_categories_json) {
          categories = JSON.parse(String(r.service_categories_json));
        }
      } catch {
        categories = [];
      }
      return {
        id: String(r.id),
        name: String(r.display_name || 'Applicant'),
        phone: String(r.phone || ''),
        email: r.email ? String(r.email) : null,
        accountStatus: String(r.account_status || 'pending'),
        approvalStatus: String(r.approval_status || 'pending'),
        experienceYears: Number(r.experience_years || 0),
        state: String(r.state || ''),
        district: String(r.district || ''),
        pincode: String(r.pincode || ''),
        categories,
        createdAt: String(r.created_at || ''),
      };
    });

    return NextResponse.json({ stats, recentBookings, recentApplications });
  } catch (error) {
    return authErrorResponse(error);
  }
}
