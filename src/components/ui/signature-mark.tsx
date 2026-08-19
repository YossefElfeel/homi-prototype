import { cn } from '@/lib/cn';

/**
 * The box every signature in this app is drawn and stored in.
 *
 * One constant, because the pad on the customer's screen, the pad in settings
 * and every place a mark is rendered have to agree on the coordinate space —
 * otherwise a signature drawn in one appears clipped or afloat in another.
 */
export const SIGNATURE_BOX = { width: 720, height: 220 };

/**
 * A signature, as ink rather than as an image.
 *
 * Marks are stored as SVG path data (see `Signature` in the schema). Drawn
 * here with `currentColor`, which is the reason for the format: a mark
 * captured in the light theme is invisible in the dark one if it is a raster,
 * and a contract is a document — it has to survive being read at any size.
 */
export function SignatureMark({
  path,
  label,
  className,
}: {
  path: string;
  /** Whose mark this is — an SVG with no name is an unlabelled image. */
  label: string;
  className?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${SIGNATURE_BOX.width} ${SIGNATURE_BOX.height}`}
      role="img"
      aria-label={label}
      fill="none"
      stroke="currentColor"
      strokeWidth={6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-14 w-auto', className)}
    >
      <path d={path} />
    </svg>
  );
}

/**
 * Pointer strokes → path data.
 *
 * The pad used to draw straight onto a canvas and keep nothing, so what
 * reached the store was a timestamp and the drawing was gone the moment the
 * page unmounted. Recording the points alongside the canvas costs one array
 * and makes the mark something the contract can actually show.
 *
 * Coordinates are rounded: a path is a string in `localStorage`, and six
 * decimal places of pointer precision is noise nobody can see.
 */
export function strokesToPath(strokes: [number, number][][]) {
  return strokes
    .filter((stroke) => stroke.length > 0)
    .map((stroke) =>
      stroke
        .map(
          ([x, y], i) => `${i === 0 ? 'M' : 'L'} ${Math.round(x)} ${Math.round(y)}`,
        )
        .join(' '),
    )
    .join(' ');
}
