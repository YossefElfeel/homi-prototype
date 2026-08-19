'use client';

import { useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SIGNATURE_BOX, strokesToPath } from '@/components/ui/signature-mark';

/**
 * Somewhere to sign.
 *
 * Two screens need one — the customer accepting a contract and the owner
 * storing the mark that goes on every contract — and they need the same one:
 * a pad that captures at 720×220 in one place and 700×200 in the other stores
 * marks that render at different weights on the same document.
 *
 * The canvas is the live feedback; `strokes` is the record. Keeping only the
 * canvas is what the original pad did, and it is why a signed quote used to
 * carry a timestamp and no signature.
 */
export function SignaturePad({
  label,
  hint,
  clearLabel,
  onChange,
  className,
}: {
  /** Accessible name for the canvas — it has no text of its own. */
  label: string;
  hint: string;
  clearLabel: string;
  /** Path data on release, and `''` when the pad is cleared. */
  onChange: (path: string) => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const strokes = useRef<[number, number][][]>([]);
  const [hasInk, setHasInk] = useState(false);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = point(event);
    /* Read off the theme rather than hard-coded, so the ink is visible in dark
       mode. The stored mark is a path and inherits `currentColor`, so this
       only ever affects what is on screen while drawing. */
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--content-primary')
      .trim();
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    drawing.current = true;
    strokes.current.push([[p.x, p.y]]);
    canvasRef.current!.setPointerCapture(event.pointerId);
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = point(event);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    strokes.current[strokes.current.length - 1]!.push([p.x, p.y]);
    setHasInk(true);
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(strokesToPath(strokes.current));
  }

  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    strokes.current = [];
    setHasInk(false);
    onChange('');
  }

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        width={SIGNATURE_BOX.width}
        height={SIGNATURE_BOX.height}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        aria-label={label}
        className="w-full touch-none rounded-[var(--radius-lg)] border border-dashed border-line bg-page"
        style={{ aspectRatio: `${SIGNATURE_BOX.width} / ${SIGNATURE_BOX.height}` }}
      />
      <div className="mt-2 flex items-center justify-between gap-4">
        <p className="text-sm text-ink-tertiary">{hint}</p>
        <Button variant="ghost" size="sm" onClick={clear} disabled={!hasInk}>
          <RotateCcw className="size-3.5" aria-hidden />
          {clearLabel}
        </Button>
      </div>
    </div>
  );
}
