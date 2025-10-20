export type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'theme';
const subscribers = new Set<(theme: Theme) => void>();

const getStoredTheme = (): Theme | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = window.localStorage.getItem(THEME_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : null;
};

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyThemeClass = (theme: Theme) => {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  root.classList.toggle('dark', resolved === 'dark');
};

let currentTheme: Theme = getStoredTheme() ?? 'system';
applyThemeClass(currentTheme);

if (typeof window !== 'undefined') {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', () => {
    if (currentTheme === 'system') {
      applyThemeClass('system');
      subscribers.forEach((callback) => callback(currentTheme));
    }
  });
}

export const theme = {
  get(): Theme {
    return currentTheme;
  },
  set(next: Theme) {
    currentTheme = next;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_KEY, next);
    }
    applyThemeClass(next);
    subscribers.forEach((callback) => callback(next));
  },
  toggle() {
    const resolved = currentTheme === 'system' ? applyThemeClassAndGet() : currentTheme;
    const next = resolved === 'dark' ? 'light' : 'dark';
    this.set(next);
  },
  subscribe(callback: (theme: Theme) => void) {
    subscribers.add(callback);
    callback(currentTheme);
    return () => subscribers.delete(callback);
  },
};

function applyThemeClassAndGet(): 'light' | 'dark' {
  const resolved =
    currentTheme === 'system' ? getSystemTheme() : (currentTheme as 'light' | 'dark');
  applyThemeClass(currentTheme);
  return resolved;
}
