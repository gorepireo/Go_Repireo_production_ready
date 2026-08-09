import ProtectedRoute from '@/components/ProtectedRoute';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function TrackLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
