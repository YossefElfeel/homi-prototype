'use client';

/**
 * The last resort: a crash in the root layout, before next-intl or any theme
 * has loaded. It renders its own <html> and cannot use translations, tokens or
 * components — so it is deliberately plain German with the phone number, which
 * is the one thing that always works.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          color: '#12141a',
          background: '#ffffff',
        }}
      >
        <main style={{ maxWidth: '32rem' }}>
          <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Das hat nicht geklappt</h1>
          <p style={{ marginTop: '1rem', lineHeight: 1.6 }}>
            Bitte laden Sie die Seite neu. Bleibt es dabei, rufen Sie uns an — wir
            nehmen Ihre Anfrage auch telefonisch entgegen.
          </p>
          <p style={{ marginTop: '1.5rem' }}>
            <a href="tel:+41445999136" style={{ color: '#17306B' }}>
              +41 44 599 91 36
            </a>
          </p>
          {error.digest && (
            <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#5e6880' }}>
              Fehlerkennung {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '2rem',
              minHeight: '2.75rem',
              padding: '0 1.25rem',
              border: 'none',
              borderRadius: '2px',
              background: '#17306B',
              color: '#ffffff',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Nochmals versuchen
          </button>
        </main>
      </body>
    </html>
  );
}
