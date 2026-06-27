import ProtectedRoute from '@/components/ProtectedRoute';

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
