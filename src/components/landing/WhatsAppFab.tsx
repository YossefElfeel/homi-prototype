"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { contact } from "@/content/landing";
import { useContent } from "@/components/landing/use-landing-content";

/** Single-path mark: the handset is a hole in the bubble, not a second shape. */
function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-6 w-6">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91a9.85 9.85 0 0 0-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.32a8.19 8.19 0 0 1-1.26-4.37c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}

/**
 * Chat shortcut that rides along the whole page. It appears once the hero is
 * behind you and expands to a labelled pill on hover. The halo is a sibling of
 * the pill rather than a child, so the pill can clip its own label without
 * clipping the halo.
 */
export function WhatsAppFab() {
  const t = useContent();
  const { scrollY } = useScroll();
  const [shown, setShown] = useState(false);

  useMotionValueEvent(scrollY, "change", (v) => setShown(v > 420));

  const number = contact.mobile.replace(/\D/g, "").replace(/^0/, "41");
  const href = `https://wa.me/${number}?text=${encodeURIComponent(
    "Hello Homivaro, I would like a quote.",
  )}`;

  return (
    <AnimatePresence>
      {shown ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 24 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="fixed right-5 bottom-5 z-70 sm:right-8 sm:bottom-8"
        >
          <span
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full bg-[#25D366] motion-safe:animate-[pulse-ring_2.8s_cubic-bezier(0.4,0,0.6,1)_infinite]"
          />
          {/* h-14 with px-4 either side of a 24px glyph is exactly 56 across
              while the label is collapsed, so it rests as a true circle and
              grows sideways into a pill on hover. */}
          <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t.actions.chat} — WhatsApp ${contact.mobile}`}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            className="group flex h-14 items-center justify-center overflow-hidden rounded-full bg-[#25D366] px-4 text-ink-inverse shadow-[0_14px_34px_-12px_rgba(37,211,102,0.9)]"
          >
            <WhatsAppGlyph />
            <span className="grid grid-cols-[0fr] transition-[grid-template-columns] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:grid-cols-[1fr]">
              <span className="overflow-hidden">
                <span className="block pl-3 text-[15px] font-medium whitespace-nowrap">
                  {t.actions.chat}
                </span>
              </span>
            </span>
          </motion.a>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
