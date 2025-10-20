/**
 * Feature showcase data for the home page
 * This data powers the comparison table and feature highlights
 */

export interface FeatureComparison {
  feature: string;
  youtube: string;
  ourApp: string;
  highlight: boolean;
}

export const featureComparisons: FeatureComparison[] = [
  {
    feature: 'Find transcripts',
    youtube: 'Hidden, 3 clicks',
    ourApp: 'Paste URL, 1 click',
    highlight: true,
  },
  {
    feature: 'Reading experience',
    youtube: 'Tiny panel',
    ourApp: 'Full screen, dark mode',
    highlight: true,
  },
  {
    feature: 'Search',
    youtube: 'No search',
    ourApp: '✅ Full-text search',
    highlight: true,
  },
  {
    feature: 'Export TXT',
    youtube: '❌ No',
    ourApp: '✅ Yes',
    highlight: false,
  },
  {
    feature: 'Export JSON',
    youtube: '❌ No',
    ourApp: '✅ Yes',
    highlight: false,
  },
  {
    feature: 'Save history',
    youtube: '❌ No',
    ourApp: '✅ Yes (50 items)',
    highlight: false,
  },
  {
    feature: 'Offline access',
    youtube: '❌ No',
    ourApp: '✅ Yes (localStorage + DB)',
    highlight: false,
  },
  {
    feature: 'Multi-language',
    youtube: 'Limited UI',
    ourApp: '✅ 10+ languages',
    highlight: false,
  },
  {
    feature: 'AI Summarization',
    youtube: '❌ No',
    ourApp: '🔜 Phase 6',
    highlight: true,
  },
  {
    feature: 'Bulk operations',
    youtube: '❌ No',
    ourApp: '🔜 Future',
    highlight: false,
  },
  {
    feature: 'Speed',
    youtube: 'Slow (UI navigation)',
    ourApp: '⚡ Fast (1-2 seconds!)',
    highlight: true,
  },
];

export interface Benefit {
  icon: string;
  title: string;
  description: string;
}

export const benefits: Benefit[] = [
  {
    icon: '⚡',
    title: 'Speed',
    description: '1-2 seconds vs. manual navigation',
  },
  {
    icon: '📦',
    title: 'Export',
    description: 'TXT, JSON downloads',
  },
  {
    icon: '🔍',
    title: 'Search',
    description: 'Find keywords instantly',
  },
  {
    icon: '💾',
    title: 'History',
    description: 'Save and organize',
  },
  {
    icon: '🌙',
    title: 'UX',
    description: 'Dark mode, clean interface',
  },
  {
    icon: '🤖',
    title: 'Future AI',
    description: 'AI analysis (Phase 6)',
  },
];

export interface UseCase {
  emoji: string;
  title: string;
  persona: string;
  problem: string;
  solution: string;
  timeSaved: string;
}

export const useCases: UseCase[] = [
  {
    emoji: '📚',
    title: 'Students & Researchers',
    persona: 'Student',
    problem: 'I need to cite exact quotes from educational videos',
    solution: 'Search transcripts, export with timestamps, reference specific moments',
    timeSaved: '8+ hours per week',
  },
  {
    emoji: '💻',
    title: 'Developers',
    persona: 'Software Engineer',
    problem: 'I watched coding tutorials and need the code snippets',
    solution: 'Export transcript, AI extracts code blocks automatically (Phase 6)',
    timeSaved: '4+ hours per tutorial session',
  },
  {
    emoji: '🎨',
    title: 'Content Creators',
    persona: 'YouTuber',
    problem: 'I watch 10 competitor videos and need to analyze their talking points',
    solution: 'Batch download transcripts, search across all, find patterns',
    timeSaved: '10+ hours per analysis',
  },
  {
    emoji: '🌍',
    title: 'Language Learners',
    persona: 'ESL Student',
    problem: 'I understand written English better than spoken',
    solution: 'Read full transcripts at your own pace, search for vocabulary',
    timeSaved: 'Improved comprehension',
  },
  {
    emoji: '♿',
    title: 'Accessibility',
    persona: 'Deaf/Hard of Hearing',
    problem: 'I need reliable transcripts that work offline',
    solution: 'Clean, searchable transcripts that work offline',
    timeSaved: 'Equal access to content',
  },
];

export interface TechDetail {
  category: string;
  technologies: string[];
}

export const techStack: TechDetail[] = [
  {
    category: 'Frontend',
    technologies: ['Solid.js', 'TypeScript', 'TailwindCSS', 'TanStack Query', 'Vite'],
  },
  {
    category: 'Backend',
    technologies: ['Go 1.25', 'Chi Router', 'pgx v5', 'kkdai/youtube'],
  },
  {
    category: 'Database',
    technologies: ['PostgreSQL 16', 'JSONB Storage', 'Docker'],
  },
  {
    category: 'Quality',
    technologies: ['91 Tests', '85.4% Coverage', 'WCAG Compliant'],
  },
];

export interface PerformanceMetric {
  metric: string;
  value: string;
  icon: string;
}

export const performanceMetrics: PerformanceMetric[] = [
  {
    metric: 'Transcript Fetch',
    value: '1-2 seconds',
    icon: '⚡',
  },
  {
    metric: 'Frontend Load',
    value: '<1 second',
    icon: '🚀',
  },
  {
    metric: 'Bundle Size',
    value: '39.6 KB gzipped',
    icon: '📦',
  },
  {
    metric: 'Test Coverage',
    value: '85.4%',
    icon: '✅',
  },
  {
    metric: 'Accessibility',
    value: 'WCAG 2.1 AA',
    icon: '♿',
  },
  {
    metric: 'SEO Score',
    value: '95+',
    icon: '📊',
  },
];
