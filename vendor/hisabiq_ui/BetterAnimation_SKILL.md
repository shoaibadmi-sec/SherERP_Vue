---
name: better-animation
description: Create, review, and improve UI motion and animation in a self-contained way. Use when the user wants animations added, reviewed, debugged, softened, made smoother, or wants advice on gestures, transitions, springs, or motion behavior in a frontend.
---

# UI Animation

Design, implement, review, and debug UI motion using a self-contained workflow focused on clarity, responsiveness, accessibility, and polish.

## Core Principles

1. **Animate with Purpose** — Motion should support feedback, orientation, continuity, hierarchy, or deliberate delight.
2. **Ask What Matters** — Before changing motion, ask what the user wants improved: smoothness, clarity, personality, responsiveness, gesture feel, or reduction of jank.
3. **Interruptible by Default** — UI motion should retarget cleanly when state changes quickly. Avoid brittle, predetermined animation patterns for interactive UI.
4. **Performance First** — Prefer animation patterns that avoid layout, repaint, and jank.
5. **Accessibility Matters** — Motion should never make the interface harder to use. Respect reduced motion and avoid disorienting transitions.

## What to Ask First

Before changing or reviewing motion, ask the user to clarify the scope in one message:

- What should be animated or reviewed:
  - a component
  - a page transition
  - a modal / drawer / popover
  - a button or hover interaction
  - a drag or swipe gesture
  - a loading or reveal sequence
  - the overall motion system

- What kind of help they want:
  - add animation
  - review current animation
  - debug jank
  - make it smoother
  - make it feel faster
  - decide whether it should animate at all

- What matters most:
  - polish
  - clarity
  - delight
  - performance
  - accessibility
  - mobile feel
  - desktop feel

- What stack they are using:
  - CSS transitions
  - CSS keyframes
  - Framer Motion
  - Motion
  - WAAPI
  - React
  - plain HTML/CSS/JS

If the user does not specify a stack, prefer the lightest implementation that fits the interaction.

---

## Phase 0: Detect Mode

Determine what the user wants:

- **Mode A: Add Motion** — Add animation to a UI that is static or under-animated.
- **Mode B: Review Motion** — Evaluate existing animation quality and identify problems.
- **Mode C: Debug Motion** — Fix jank, awkward timing, broken gestures, or inconsistent transitions.
- **Mode D: Decide Motion Strategy** — Help determine whether something should animate and how.

---

## Phase 1: Decide Whether It Should Animate

**Purpose:** Avoid unnecessary motion.

Before implementing anything, answer:

1. Should this interaction animate at all?
2. What is the purpose of the motion?
   - feedback
   - orientation
   - continuity
   - emphasis
   - delight
3. Is the interaction high-frequency or low-frequency?
4. Does motion help the user understand what changed?

### Motion Design Principles

- **Continuity over teleportation** — If an element exists in both states, transition it in place rather than hard-cutting.
- **Directional motion should match layout** — Forward and backward motion should reflect spatial position.
- **Emerge from the trigger** — Contextual UI like menus, popovers, and trays should feel connected to what opened them.
- **High-frequency interactions should be subtle** — Repeated actions need near-invisible polish, not theatrical motion.
- **Low-frequency interactions can carry more personality** — Rarer transitions have more room for character.
- **Motion should improve perceived speed** — Good transitions make state changes feel smoother and faster.

### Never Animate

- keyboard navigation itself
- focus traversal
- high-frequency state changes that become distracting
- anything that makes the interface harder to parse
- motion that delays urgent feedback

---

## Phase 2: Choose Timing and Feel

**Purpose:** Pick motion characteristics that fit the interaction.

Use these defaults:

| Element                       | Duration     | Easing                           |
| ----------------------------- | ------------ | -------------------------------- |
| Button press feedback         | 100–160ms    | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Tooltips, small popovers      | 125–200ms    | `ease-out` or enter curve        |
| Dropdowns, selects            | 150–250ms    | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Modals, drawers               | 200–350ms    | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Move/slide on screen          | 200–300ms    | `cubic-bezier(0.25, 1, 0.5, 1)`  |
| Simple hover (colour/opacity) | 200ms        | `ease`                           |
| Illustrative/marketing        | Up to 1000ms | Spring or custom                 |

### Default Curves

- **Enter:** `cubic-bezier(0.22, 1, 0.36, 1)`
- **Move:** `cubic-bezier(0.25, 1, 0.5, 1)`
- **Drawer:** `cubic-bezier(0.32, 0.72, 0, 1)`

### Timing Rules

- Enter can be slightly slower than exit
- Exit should be fast and responsive
- Staggers should usually stay between 30–50ms per item
- Total stagger should usually stay under 300ms
- Avoid `ease-in` for UI entrances

---

## Phase 3: Choose the Implementation Style

**Purpose:** Use the simplest animation system that fits the job.

Preferred order:

1. **CSS transitions** — Best default for interactive UI
2. **WAAPI** — Good when timeline control is needed
3. **Spring animation** — Good for drag, gesture release, or natural-feeling movement
4. **CSS keyframes** — Good for predetermined sequences
5. **JavaScript frame loops** — Use only when truly necessary

### Implementation Rules

- Prefer `transform` and `opacity` for movement
- `color`, `background-color`, and `opacity` are acceptable for feedback
- Never use `transition: all`
- Never animate `width`, `height`, `top`, or `left` for interactive motion
- Avoid animating `filter` for core interaction
- If blur is used, keep it subtle
- Do not mix multiple transform owners on the same element without intent
- For SVG, transform a `<g>` wrapper when possible

### Interaction-Specific Guidance

Use the right motion type for the job:

- **Buttons / hover states** — short transitions, subtle scale or opacity shifts
- **Dropdowns / popovers** — anchored emergence, light scale + fade
- **Modals / drawers** — clear entrance direction, strong continuity, fast exit
- **Tabs / carousels** — directional movement must match navigation direction
- **Toasts / alerts** — quick entrance, quick dismissal, minimal distraction
- **Gestures / swipes / drag** — lock to pointer during direct manipulation, ease only after release
- **Shared UI between states** — animate persistent elements in place instead of replacing them

---

## Phase 4: Review or Debug the Motion

**Purpose:** Identify what is wrong with the current implementation.

When reviewing existing motion, check for:

- unclear purpose
- excessive duration
- sluggish entrances
- slow exits
- inconsistent easing
- broken continuity between states
- over-animation in high-frequency interactions
- hard cuts between related views
- duplicate persistent elements
- generic center-screen transitions for contextual UI
- gesture lag or detachment from the pointer
- layout thrashing or jank
- reduced motion not respected

### Common Problems to Look For

- `transition: all`
- animating layout properties
- `scale(0)` entrances
- keyframes on rapidly toggled UI
- symmetric enter/exit timing
- permanent `will-change`
- drag animation driven by CSS variables in a way that repaints heavily
- motion that restarts from zero instead of retargeting
- hover animation applying on touch devices

### Review Output Format

When reviewing, present findings as:

- **Before** — what the current motion does
- **After** — what should change
- **Why** — the reason for the recommendation

Keep the review concrete and tied to user experience, performance, and implementation quality.

---

## Phase 5: Accessibility and Device Behavior

**Purpose:** Make sure motion works for real users.

Always check:

- `prefers-reduced-motion`
- touch vs pointer behavior
- hover gating with `@media (hover: hover) and (pointer: fine)`
- keyboard usability
- whether motion obscures state changes
- whether gestures stay attached to the pointer during direct manipulation

### Accessibility Rules

- Respect reduced motion preferences
- Do not animate focus movement itself
- Do not make essential state changes depend only on motion
- Avoid disorienting entrances or large unnecessary travel
- Ensure animation supports understanding rather than replacing it

---

## Phase 6: Performance Validation

**Purpose:** Make sure the motion feels smooth in practice.

Validate:

1. No layout property animations
2. Motion mainly uses `transform` and `opacity`
3. Looping animations pause off-screen when appropriate
4. `will-change` is used temporarily, not permanently
5. Fast retoggles retarget smoothly
6. Motion looks correct at slower playback speeds
7. Touch interactions feel correct on real devices when relevant

If the motion feels janky, check:

- too many animated properties
- paint-heavy styles
- layout-triggering transitions
- too many simultaneous animations
- transform conflicts
- unnecessary JS control when CSS would suffice

---

## Phase 7: Delivery

When delivering motion work:

1. Summarize what was changed or recommended
2. State the purpose of the motion clearly
3. Mention the chosen implementation style
4. Call out timing and easing decisions
5. Mention accessibility considerations
6. Note any remaining manual checks, especially on touch devices or reduced-motion setups

---

## Validation Checklist

Copy and track this checklist:

```text
Animation progress:
- [ ] Step 1: Decide whether the interaction should animate
- [ ] Step 2: Choose purpose, easing, and duration
- [ ] Step 3: Pick the implementation style
- [ ] Step 4: Review behavior across device types
- [ ] Step 5: Validate timing, interruption, and performance
```

---

## What This Skill Does NOT Do

- It does not assume every UI needs animation
- It does not prioritize spectacle over usability
- It does not recommend layout animation for common UI feedback
- It does not guarantee perfect performance without real testing
- It does not replace real device testing for touch and gesture-heavy interactions
- It does not automatically rewrite code unless the user separately asks for implementation help

---

## Supporting Behavior

When deciding what to do:

- Prefer motion with a clear job over decorative movement
- Prefer continuity over hard cuts
- Prefer interruptible interaction over rigid timelines
- Prefer subtle polish for frequent actions
- Prefer lighter implementation approaches first
- Prefer motion that improves understanding, speed, and feel
