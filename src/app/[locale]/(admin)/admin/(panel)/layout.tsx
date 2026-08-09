import { AdminShell } from '@/components/admin/admin-shell';

/**
 * The route group keeps /admin/anmelden outside the shell — a sign-in screen
 * wrapped in the navigation it is guarding would be odd.
 */
export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
