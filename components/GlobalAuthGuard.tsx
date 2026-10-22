'use client';

// Public pages remain available to signed-out visitors. Authorization belongs
// to the customer, worker, and admin route boundaries.
export default function GlobalAuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
