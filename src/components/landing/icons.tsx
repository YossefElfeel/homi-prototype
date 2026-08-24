import type { SVGProps } from "react";

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ArrowRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden {...base} {...props}>
      <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" />
    </svg>
  );
}

export function ArrowUpRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden {...base} {...props}>
      <path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" />
    </svg>
  );
}

export function ChevronLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden {...base} {...props}>
      <path d="M12.5 4.5 7 10l5.5 5.5" />
    </svg>
  );
}

export function ChevronRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden {...base} {...props}>
      <path d="M7.5 4.5 13 10l-5.5 5.5" />
    </svg>
  );
}

export function Check(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden {...base} strokeWidth={2} {...props}>
      <path d="m3 8.5 3.2 3.2L13 5" />
    </svg>
  );
}

export function Phone(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden {...base} strokeWidth={1.4} {...props}>
      <path d="M5.6 2.6H3.2c-.6 0-1.1.5-1.1 1.1 0 5.7 4.6 10.3 10.3 10.3.6 0 1.1-.5 1.1-1.1v-2.4l-2.6-1-1.3 1.6a8.6 8.6 0 0 1-4-4l1.6-1.3-1.6-3.2Z" />
    </svg>
  );
}

export function Chat(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden {...base} strokeWidth={1.4} {...props}>
      <path d="M14 7.6c0 3-2.7 5.4-6 5.4-.8 0-1.6-.1-2.3-.4L2 14l1.1-2.7A5.1 5.1 0 0 1 2 7.6c0-3 2.7-5.4 6-5.4s6 2.4 6 5.4Z" />
    </svg>
  );
}

export function Mail(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden {...base} strokeWidth={1.4} {...props}>
      <rect x="1.8" y="3.4" width="12.4" height="9.2" rx="1.6" />
      <path d="m2.4 4.6 5.6 4 5.6-4" />
    </svg>
  );
}

export function Star(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 19" fill="currentColor" aria-hidden {...props}>
      <path d="m10 0 2.47 6.33 6.78.4-5.25 4.3 1.72 6.57L10 13.94 4.28 17.6 6 11.03.75 6.73l6.78-.4L10 0Z" />
    </svg>
  );
}

/**
 * The Swiss flag, drawn rather than set as an emoji.
 *
 * 🇨🇭 is a regional-indicator pair, and Windows renders those as the letters
 * "CH" in a box — no flag at all, on the platform most of this audience is
 * reading from. Drawing it also lets it keep the brand's own red instead of
 * whatever red the system font vendor picked.
 *
 * Official construction: a square field, the cross arms one sixth longer than
 * they are wide. On a 32-unit square that is a bar 6 thick and 20 long, which
 * is what the two rects below are — not an eyeballed plus sign.
 */
export function SwissFlag(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden {...props}>
      <rect width="32" height="32" rx="3" className="fill-accent" />
      <path d="M13 6h6v7h7v6h-7v7h-6v-7H6v-6h7V6Z" fill="#fff" />
    </svg>
  );
}

const social = {
  fill: "currentColor",
  viewBox: "0 0 24 24",
};

export function Facebook(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...social} aria-hidden {...props}>
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6c-.29-.04-1.27-.12-2.41-.12-2.39 0-4.03 1.46-4.03 4.14V9.9H7.5V13h2.76v8h3.24Z" />
    </svg>
  );
}

export function LinkedIn(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...social} aria-hidden {...props}>
      <path d="M6.94 8.4H3.9V21h3.04V8.4ZM5.42 3A1.77 1.77 0 1 0 5.4 6.54 1.77 1.77 0 0 0 5.42 3ZM20.1 13.6c0-3.2-1.7-4.7-4-4.7-1.84 0-2.67 1.02-3.13 1.73V8.4H9.94c.04.86 0 12.6 0 12.6h3.03v-7.04c0-.27.02-.54.1-.74.22-.54.71-1.1 1.55-1.1 1.1 0 1.54.83 1.54 2.06V21h3.04v-7.4Z" />
    </svg>
  );
}

export function Twitter(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...social} aria-hidden {...props}>
      <path d="M21 5.9c-.66.3-1.37.5-2.12.59a3.7 3.7 0 0 0 1.62-2.04c-.71.42-1.5.73-2.34.9a3.69 3.69 0 0 0-6.29 3.36A10.47 10.47 0 0 1 4.27 4.8a3.69 3.69 0 0 0 1.14 4.92 3.66 3.66 0 0 1-1.67-.46v.05a3.69 3.69 0 0 0 2.96 3.61c-.54.15-1.11.17-1.66.07a3.7 3.7 0 0 0 3.45 2.56A7.4 7.4 0 0 1 3 17.08a10.44 10.44 0 0 0 5.66 1.66c6.79 0 10.5-5.62 10.5-10.5v-.48A7.5 7.5 0 0 0 21 5.9Z" />
    </svg>
  );
}

export function Instagram(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...social} aria-hidden {...props}>
      <path d="M12 4.62c2.4 0 2.69.01 3.64.05.88.04 1.35.19 1.67.31.42.16.72.36 1.03.67.31.31.51.61.67 1.03.12.32.27.79.31 1.67.04.95.05 1.24.05 3.65s-.01 2.7-.05 3.65c-.04.88-.19 1.35-.31 1.67-.16.42-.36.72-.67 1.03-.31.31-.61.51-1.03.67-.32.12-.79.27-1.67.31-.95.04-1.23.05-3.64.05s-2.69-.01-3.64-.05c-.88-.04-1.35-.19-1.67-.31a2.78 2.78 0 0 1-1.03-.67c-.31-.31-.51-.61-.67-1.03-.12-.32-.27-.79-.31-1.67-.04-.95-.05-1.24-.05-3.65s.01-2.7.05-3.65c.04-.88.19-1.35.31-1.67.16-.42.36-.72.67-1.03.31-.31.61-.51 1.03-.67.32-.12.79-.27 1.67-.31.95-.04 1.24-.05 3.64-.05ZM12 3c-2.44 0-2.75.01-3.71.05-.96.05-1.61.2-2.19.42-.6.23-1.1.54-1.61 1.05-.5.5-.82 1.01-1.05 1.6-.22.58-.37 1.24-.42 2.2C3 9.28 3 9.58 3 12.02c0 2.44.01 2.75.05 3.71.05.96.2 1.61.42 2.19.23.6.54 1.1 1.05 1.61.5.5 1.01.82 1.61 1.05.58.22 1.23.37 2.19.42.96.04 1.27.05 3.71.05s2.75-.01 3.71-.05c.96-.05 1.61-.2 2.19-.42.6-.23 1.1-.54 1.61-1.05.5-.5.82-1.01 1.05-1.61.22-.58.37-1.23.42-2.19.04-.96.05-1.27.05-3.71s-.01-2.75-.05-3.71c-.05-.96-.2-1.61-.42-2.19a4.4 4.4 0 0 0-1.05-1.61 4.4 4.4 0 0 0-1.61-1.05c-.58-.22-1.23-.37-2.19-.42C14.78 3.01 14.47 3 12.03 3H12Zm0 4.38a4.63 4.63 0 1 0 0 9.25 4.63 4.63 0 0 0 0-9.25Zm0 7.63a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm5.88-7.81a1.08 1.08 0 1 1-2.16 0 1.08 1.08 0 0 1 2.16 0Z" />
    </svg>
  );
}

export function YouTube(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...social} aria-hidden {...props}>
      <path d="M21.58 7.19a2.5 2.5 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42a2.5 2.5 0 0 0-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81a2.5 2.5 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.5 2.5 0 0 0 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81ZM10 15.02V8.98L15.2 12 10 15.02Z" />
    </svg>
  );
}
