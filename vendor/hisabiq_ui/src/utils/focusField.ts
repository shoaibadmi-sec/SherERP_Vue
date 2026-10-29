/** Scroll a field into view and focus its control (or the first control inside it). */
export function focusField(id: string) {
  const element = document.getElementById(id);
  if (!element) return;
  const target = element.matches('input,textarea,button,select')
    ? element
    : element.querySelector<HTMLElement>('input,textarea,button');
  element.scrollIntoView({ block: 'center' });
  (target ?? element).focus({ preventScroll: true });
}
