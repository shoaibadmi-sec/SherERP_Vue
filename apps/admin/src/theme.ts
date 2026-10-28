import { ref } from 'vue';

export type ControlTheme = 'light' | 'dark';

const STORAGE_KEY = 'sher.control.theme';
const theme = ref<ControlTheme>('dark');

function apply(next: ControlTheme): void {
  theme.value = next;
  document.documentElement.dataset['theme'] = next;
  localStorage.setItem(STORAGE_KEY, next);
}

export function initialiseTheme(): void {
  const saved = localStorage.getItem(STORAGE_KEY);
  apply(saved === 'light' ? 'light' : 'dark');
}

export function useControlTheme() {
  return {
    theme,
    toggle: () => apply(theme.value === 'dark' ? 'light' : 'dark'),
  };
}
