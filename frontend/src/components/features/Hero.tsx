import { useNavigate } from '@solidjs/router';

import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600/90 to-surface-900 p-8 text-white shadow-[0_20px_50px_-12px_rgba(14,165,233,0.45)] sm:p-12">
      <div class="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.25),_transparent_60%)]" />
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="max-w-xl space-y-4">
          <p class="text-sm uppercase tracking-[0.3em] text-white/80">Lightning-fast transcripts</p>
          <h1 class="text-balance text-4xl font-black leading-tight tracking-tight drop-shadow md:text-5xl">
            YouTube Transcript Downloader
          </h1>
          <p class="text-lg text-white/90">
            Fetch complete captions, metadata, and analytics-ready transcripts in seconds. Built for
            creators, researchers, and teams who need trustworthy insight at speed.
          </p>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" class="w-full sm:w-auto" onClick={() => navigate('/download')}>
              Fetch a transcript
            </Button>
            <Button
              variant="ghost"
              size="lg"
              class="w-full border border-white/20 sm:w-auto"
              onClick={() => navigate('/about')}
            >
              View roadmap
            </Button>
          </div>
        </div>
        <Card class="w-full max-w-md space-y-4 bg-white/10 p-6">
          <p class="text-sm font-semibold uppercase tracking-wide text-white/80">Live snapshot</p>
          <dl class="grid grid-cols-2 gap-4 text-sm text-white/90">
            <div>
              <dt class="text-white/60">Avg. fetch time</dt>
              <dd class="text-lg font-semibold">1.2s</dd>
            </div>
            <div>
              <dt class="text-white/60">Success rate</dt>
              <dd class="text-lg font-semibold">99.4%</dd>
            </div>
            <div>
              <dt class="text-white/60">Captions analyzed</dt>
              <dd class="text-lg font-semibold">+180k</dd>
            </div>
            <div>
              <dt class="text-white/60">API latency</dt>
              <dd class="text-lg font-semibold">210ms</dd>
            </div>
          </dl>
        </Card>
      </div>
    </section>
  );
};

export default Hero;
