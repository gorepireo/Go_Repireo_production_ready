import { authErrorResponse, bootstrapCustomer, requireIdentity } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    return Response.json({ user: await requireIdentity(request) });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    return Response.json({ user: await bootstrapCustomer(request) });
  } catch (error) {
    return authErrorResponse(error);
  }
}
