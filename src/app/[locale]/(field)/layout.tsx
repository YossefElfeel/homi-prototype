import { FieldShell } from '@/components/field/field-shell';

/**
 * The field interface has no site chrome at all.
 *
 * It is opened one-handed, outdoors, between two jobs — a header with a
 * services menu and a locale switcher is noise there. The shell provides the
 * role gate and the phone-width frame; nothing else.
 */
export default function FieldLayout({ children }: { children: React.ReactNode }) {
  return <FieldShell>{children}</FieldShell>;
}
