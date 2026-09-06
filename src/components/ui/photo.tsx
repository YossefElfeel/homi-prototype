import Image from 'next/image';

/**
 * A picture that may live in this project or somewhere else entirely.
 *
 * Since the office can paste a URL, a photograph's `src` is no longer always a
 * path under `/public`. `next/image` refuses a remote host that is not in
 * `remotePatterns`, and it is right to: the optimizer will fetch whatever it is
 * pointed at, so a wildcard there turns this app into an open image proxy.
 *
 * Widening the allow-list was the obvious fix and is the wrong one. A remote
 * picture is rendered by a plain `<img>` instead — unoptimised, which is the
 * honest cost of not knowing the host in advance, and exactly what a prototype
 * pasting a link should pay. Anything under `/` keeps the optimizer, which is
 * every seeded photograph and every file in the project.
 */
export function isRemote(src: string) {
  return /^https?:\/\//i.test(src);
}

export function Photo({
  src,
  alt,
  width,
  height,
  className,
  priority,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}) {
  if (isRemote(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- the optimizer cannot be pointed at an arbitrary host safely; see the note above
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        className={className}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}

/**
 * The same choice, for the one place that fills its parent instead of carrying
 * its own size — the before/after slider, where both halves are absolutely
 * positioned and `fill` is what makes them line up.
 */
export function PhotoFill({
  src,
  alt,
  sizes,
  className,
  priority,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  if (isRemote(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- as above.
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        className={`absolute inset-0 h-full w-full ${className ?? ''}`}
      />
    );
  }

  return (
    <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />
  );
}
