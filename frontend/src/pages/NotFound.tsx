import { A } from '@solidjs/router';

const NotFound = () => (
  <section class="mx-auto flex max-w-lg flex-col items-center gap-6 text-center">
    <h1 class="text-5xl font-bold text-white">404</h1>
    <p class="text-base text-white/70">
      The page you are looking for does not exist. Double-check the URL or head back home to start
      fetching transcripts.
    </p>
    <A
      href="/"
      class="focus-visible:outline-primary-300 inline-flex items-center justify-center rounded-lg bg-primary-500 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      Return home
    </A>
  </section>
);

export default NotFound;
