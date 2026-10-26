import { authErrorResponse, requireIdentity } from '@/lib/server/auth';
import { clearSessionCookie, deleteSession } from '@/lib/server/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    return Response.json({ user: await requireIdentity(request) });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  await deleteSession(request);
  return new Response(null, { status: 204, headers: { 'Set-Cookie': clearSessionCookie() } });
}
