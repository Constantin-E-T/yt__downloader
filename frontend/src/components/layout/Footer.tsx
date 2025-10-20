import { A } from '@solidjs/router';
import { createMemo } from 'solid-js';

export const Footer = () => {
  const currentYear = createMemo(() => new Date().getFullYear());

  return (
    <footer class="border-t border-white/10 bg-surface-900/80 backdrop-blur transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/80">
      <div class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-white/60 transition-colors duration-300 dark:text-slate-300 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>
          &copy; {currentYear()} YouTube Transcript Downloader. Crafted with Solid.js for speed and
          accessibility.
        </p>
        <nav aria-label="Footer">
          <ul class="flex flex-wrap items-center gap-5 text-white/70 dark:text-slate-300">
            <li>
              <A
                class="dark:hover:text-primary-200 transition hover:text-white"
                href="https://github.com/yt-transcripts"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </A>
            </li>
            <li>
              <A class="dark:hover:text-primary-200 transition hover:text-white" href="/about">
                Documentation
              </A>
            </li>
            <li>
              <A class="dark:hover:text-primary-200 transition hover:text-white" href="/about#team">
                About
              </A>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
