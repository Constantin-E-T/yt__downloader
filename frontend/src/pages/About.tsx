import { For } from 'solid-js';

import Card from '@/components/ui/Card';

const techStack = [
  'Solid.js',
  'Vite',
  'Tailwind CSS',
  'TanStack Query',
  'TypeScript',
  'pnpm',
  'Supabase (planned)',
];

const About = () => (
  <section class="space-y-12">
    <header class="space-y-4">
      <p class="text-primary-200 text-sm uppercase tracking-[0.3em]">About</p>
      <h1 class="text-4xl font-bold text-white md:text-5xl">Built for creators and researchers</h1>
      <p class="max-w-3xl text-lg text-white/70">
        The YouTube Transcript Downloader is a modern toolchain designed to deliver reliable,
        analytics-ready transcripts from YouTube in seconds. Crafted with accessibility,
        performance, and automation in mind, the platform is ready for the workflows of 2025 and
        beyond.
      </p>
    </header>

    <Card class="grid gap-6 bg-surface-900/80 p-8 md:grid-cols-2">
      <div class="space-y-3">
        <h2 class="text-2xl font-semibold text-white">Why we’re building this</h2>
        <p class="text-white/70">
          Whether you’re transforming videos into blogs, fuelling AI workflows, or archiving
          research, transcripts unlock insights. We focus on quality data extraction, speed, and a
          delightful UX so your team can stay in flow.
        </p>
      </div>
      <div class="space-y-3">
        <h3 class="text-lg font-semibold text-white">What’s coming next</h3>
        <ul class="list-disc space-y-2 pl-5 text-sm text-white/60">
          <li>Automated transcript syncing with scheduled jobs.</li>
          <li>Collaboration features with annotations and comments.</li>
          <li>Advanced analytics dashboards and export options.</li>
        </ul>
      </div>
    </Card>

    <section class="space-y-6" id="team">
      <h2 class="text-2xl font-semibold text-white">Technology stack</h2>
      <p class="text-sm text-white/60">
        A fast, reliable stack built with developer experience in mind.
      </p>
      <div class="flex flex-wrap gap-3">
        <For each={techStack}>
          {(tech) => (
            <span class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80">
              {tech}
            </span>
          )}
        </For>
      </div>
    </section>

    <Card class="space-y-4 bg-surface-900/80 p-8">
      <h2 class="text-2xl font-semibold text-white">Open source and extensible</h2>
      <p class="text-white/70">
        Contributions are welcome! From command palette enhancements to localisation, every piece of
        feedback helps us craft a better experience for teams everywhere.
      </p>
      <a
        href="https://github.com/yt-transcripts"
        target="_blank"
        rel="noreferrer"
        class="text-primary-200 focus-visible:outline-primary-300 inline-flex items-center gap-2 text-sm font-semibold transition hover:text-primary-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Explore the repository →
      </a>
    </Card>
  </section>
);

export default About;
