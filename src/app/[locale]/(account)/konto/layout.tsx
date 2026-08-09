import { AccountShell } from '@/components/account/account-shell';

export default function KontoLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
