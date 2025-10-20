import { Route } from '@solidjs/router';
import { lazy } from 'solid-js';

const Home = lazy(() => import('@/pages/Home'));
const Download = lazy(() => import('@/pages/Download'));
const History = lazy(() => import('@/pages/History'));
const About = lazy(() => import('@/pages/About'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export const routes = (
  <>
    <Route path="/" component={Home} />
    <Route path="/download" component={Download} />
    <Route path="/history" component={History} />
    <Route path="/about" component={About} />
    <Route path="*" component={NotFound} />
  </>
);

export default routes;
