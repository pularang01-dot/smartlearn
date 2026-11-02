export type Theme = 'system' | 'light' | 'dark';
export const getTheme = (): Theme => (localStorage.getItem('theme') as Theme) || 'system';
export function applyTheme(t: Theme) {
  localStorage.setItem('theme', t);
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}
export function toggleTheme(): 'light' | 'dark' {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
