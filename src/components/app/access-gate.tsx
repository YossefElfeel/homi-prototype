import { Lock } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';

/**
 * What a signed-in area shows to the wrong role.
 *
 * Rendered outside the shell on purpose: someone who cannot open the console
 * should not be looking at its navigation. It also keeps data-scope="app" off
 * the page, so the gate inherits the marketing theme it is standing in.
 */
export function AccessGate({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <main id="main" className="mx-auto max-w-2xl px-gutter py-section">
      <EmptyState
        icon={Lock}
        headingLevel={1}
        title={title}
        body={body}
        action={action}
      />
    </main>
  );
}
