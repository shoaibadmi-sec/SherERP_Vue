/** HisabIQ Operate-mode motion budget; visual feedback must never delay transactions. */
export const MOTION_MS = {
  navHover: 110,
  navActive: 190,
  stepper: 120,
  sidebar: 220,
  tab: 200,
} as const;

export const MOTION_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
