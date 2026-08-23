"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";

import { EASE } from "@/components/landing/motion";
import { checkCoverage, type CoverageResult } from "@/mock/engines/coverage";
import { SEED_SETTINGS } from "@/mock/seed";

/**
 * The question people actually arrive on this page with.
 *
 * It reuses `checkCoverage` rather than matching the list again — that helper
 * is the gate the request flow uses, so an answer here cannot drift from the
 * answer the eight-step assistant gives two clicks later.
 *
 * **`outside` is stated in navy, not red.** Red means action everywhere in
 * this direction, and colouring a polite "we don't cover that postcode" as an
 * error turns a fact into a scold. `invalid` is not a refusal either: a
 * half-typed postcode is not an address outside the area, and treating it as
 * one rejects people mid-keystroke.
 *
 * This is also the first use of the field style derived for this direction —
 * the card surface at the small radius, because a 999px pill reads as a search
 * box and fights anything multi-line. See `.hv-field` in globals.css.
 */
export function CoverageCheck() {
  const t = useTranslations("site.display.regionsIndex");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<CoverageResult | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(checkCoverage(value, SEED_SETTINGS.servedPostcodes));
  }

  return (
    <div>
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="plz" className="text-ink-inverse/60 block text-[15px]">
            {t("checkLabel")}
          </label>
          <input
            id="plz"
            name="plz"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={4}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              /* Clear the previous answer the moment the question changes —
                 an old "yes" sitting under a new postcode is a wrong answer. */
              if (result) setResult(null);
            }}
            placeholder={t("checkPlaceholder")}
            className="hv-field mt-2 h-12 px-4 text-base"
          />
        </div>
        <button
          type="submit"
          className="hv-action bg-accent text-ink-inverse h-12 shrink-0 rounded-[var(--radius-action)] px-7 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
        >
          {t("checkAction")}
        </button>
      </form>

      {/* Announced, not just drawn — the answer appears below a control the
          visitor just used, which is exactly when a screen reader needs it. */}
      <p aria-live="polite" className="min-h-[1.5rem]">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.span
              key={result.state + ("postcode" in result ? result.postcode : "")}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="text-ink-inverse mt-4 block text-[17px] leading-[1.5]"
            >
              {result.state === "inside"
                ? t("inside", { region: result.region.name })
                : result.state === "outside"
                  ? t("outside", { postcode: result.postcode })
                  : t("invalid")}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </p>
    </div>
  );
}
