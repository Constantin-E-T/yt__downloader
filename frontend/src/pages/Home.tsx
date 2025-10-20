import { A } from '@solidjs/router';
import { For } from 'solid-js';

import Hero from '@/components/features/Hero';
import { TranscriptFetcher } from '@/components/features/TranscriptFetcher';
import Card from '@/components/ui/Card';

const features = [
  {
    icon: '⚡️',
    title: 'SEO ready',
    description:
      'Structured transcript data designed for search visibility, podcast repurposing, and multilingual reach.',
  },
  {
    icon: '🎯',
    title: 'Research grade',
    description:
      'Precision timestamps, speaker cues, and analytics-friendly output tailored for insights teams.',
  },
  {
    icon: '🔒',
    title: 'Privacy centric',
    description:
      'Transient requests with zero transcript persistence on the frontend ensure compliance and trust.',
  },
  {
    icon: '🧠',
    title: 'AI native',
    description:
      'Formatted output optimised for language models, vector pipelines, and automation frameworks.',
  },
];

const Home = () => (
  <div class="flex flex-col gap-16">
    <Hero />
    <TranscriptFetcher />

    <section class="grid gap-6 rounded-3xl border border-white/5 bg-gradient-to-br from-white/10 via-surface-900 to-surface-900 p-6 shadow-lg shadow-primary-500/10 md:grid-cols-[2fr_1fr] md:p-10">
      <div class="space-y-6">
        <h2 class="text-3xl font-semibold text-white">
          Ready to accelerate your transcript workflow?
        </h2>
        <p class="text-lg text-white/70">
          Start with a single URL, or plug straight into the API for large-scale operations. The
          download interface below is engineered for clarity, speed, and powerful feedback states.
        </p>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <A
            href="/download"
            class="hover:bg-primary-400 focus-visible:outline-primary-200 inline-flex w-full items-center justify-center rounded-xl bg-primary-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-primary-500/30 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto"
          >
            Start downloading
          </A>
          <A
            href="/about"
            class="hover:border-primary-400 focus-visible:outline-primary-300 inline-flex w-full items-center justify-center rounded-xl border border-white/10 px-6 py-3 text-base font-semibold text-white/80 backdrop-blur transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto"
          >
            Explore the roadmap
          </A>
        </div>
      </div>
      <Card class="bg-surface-900/70 p-6 text-sm text-white/70">
        <h3 class="text-lg font-semibold text-white">What you’ll need</h3>
        <ul class="mt-3 space-y-2">
          <li class="flex items-start gap-3">
            <span class="bg-primary-300 mt-1 h-2 w-2 rounded-full" />
            <span>Public or unlisted YouTube video URL.</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="bg-primary-300 mt-1 h-2 w-2 rounded-full" />
            <span>Optional language preference for multi-track captions.</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="bg-primary-300 mt-1 h-2 w-2 rounded-full" />
            <span>No authentication required during public beta.</span>
          </li>
        </ul>
      </Card>
    </section>

    <section id="capabilities" class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <For each={features}>
        {(feature) => (
          <Card class="h-full bg-surface-900/70 p-6 transition motion-safe:animate-fade-in">
            <span class="text-2xl">{feature.icon}</span>
            <h3 class="mt-3 text-lg font-semibold text-white">{feature.title}</h3>
            <p class="mt-2 text-sm text-white/70">{feature.description}</p>
          </Card>
        )}
      </For>
    </section>
  </div>
);

export default Home;
