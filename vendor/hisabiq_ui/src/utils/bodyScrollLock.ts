/**
 * One scroll lock for the ERP's modal, action-sheet and mobile navigation.
 *
 * Independent components previously saved/restored body.overflow separately;
 * closing the first overlay could inadvertently unlock a second overlay.
 * Reference counting also prevents a scrollbar flash when a Party More sheet
 * opens a form dialog during the same React commit.
 */
let activeLocks = 0;
let originalOverflow: string | null = null;

export function lockBodyScroll(): () => void {
  if (activeLocks++ === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--activeLocks === 0) {
      document.body.style.overflow = originalOverflow ?? '';
      originalOverflow = null;
    }
  };
}
