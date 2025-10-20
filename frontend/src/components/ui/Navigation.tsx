import { A } from '@solidjs/router';
import { For, type Component } from 'solid-js';

export type NavItem = {
  path: string;
  label: string;
};

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Home' },
  { path: '/download', label: 'Download' },
  { path: '/history', label: 'History' },
  { path: '/about', label: 'About' },
];

type NavigationProps = {
  direction?: 'row' | 'column';
  onNavigate?: () => void;
};

export const Navigation: Component<NavigationProps> = (props) => {
  return (
    <nav aria-label="Primary navigation">
      <ul
        classList={{
          'flex items-center gap-6 text-sm font-medium': props.direction !== 'column',
          'flex flex-col gap-4 text-base font-medium': props.direction === 'column',
        }}
      >
        <For each={NAV_ITEMS}>
          {(item) => (
            <li>
              <A
                href={item.path}
                activeClass="text-primary-300"
                class="hover:text-primary-200 focus-visible:outline-primary-300 text-white/80 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-slate-200"
                onClick={props.onNavigate}
              >
                {item.label}
              </A>
            </li>
          )}
        </For>
      </ul>
    </nav>
  );
};

export default Navigation;
