import { Meta, MetaProvider, Title } from '@solidjs/meta';
import { Route } from '@solidjs/router';
import { Suspense } from 'solid-js';

import { Layout } from '@/components/layout/Layout';
import routes from '@/routes';

const App = () => (
  <MetaProvider>
    <Title>YouTube Transcript Downloader — Solid.js Frontend</Title>
    <Meta
      name="description"
      content="Download and analyse YouTube transcripts instantly with a responsive, SEO-optimised Solid.js interface."
    />
    <Meta name="theme-color" content="#0ea5e9" />
    <Meta name="apple-mobile-web-app-capable" content="yes" />
    <Meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

    <Suspense
      fallback={
        <div class="flex min-h-screen items-center justify-center bg-surface-900 text-white/70">
          Loading experience…
        </div>
      }
    >
      <Route path="/" component={Layout}>
        {routes}
      </Route>
    </Suspense>
  </MetaProvider>
);

export default App;
