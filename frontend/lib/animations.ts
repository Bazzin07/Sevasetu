/* ─── SevaSetu Animation Presets (Framer Motion) ─────────── */

/** Page-level fade-in + slide-up transition */
export const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' as const },
};

/** Staggered card entry for grids */
export const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: 'easeOut' as const },
  }),
};

/** Score bar fill animation */
export function barFill(value: number, delay = 0) {
  return {
    initial: { scaleX: 0 },
    animate: { scaleX: value },
    transition: { duration: 0.5, delay, ease: 'easeOut' as const },
  };
}

/** Button press feedback */
export const buttonTap = { scale: 0.97 };
