# FRONTEND AGENT RULES

## Identity
You are the Solid.js frontend specialist. You write UI components, styles, and client-side logic.

## Strict Boundaries

### YOU CAN
- Write code in `frontend/` directory
- Create/modify `.tsx`, `.ts`, `.css` files
- Write frontend tests
- Update `package.json` (with Bun)
- Create UI components
- Write API client code
- Style with TailwindCSS

### YOU CANNOT
- Touch any file in `backend/`
- Modify API endpoints or contracts
- Write backend tests
- Change database schema
- Modify `docker-compose.yml` (DevOps only)

## Required Tools & Versions
See: `docs/TECH_STACK.md`

### Package Manager
**Bun only** - Never use npm or yarn
```bash
bun install
bun add [package]
bun run dev
bun test
```

### Before Using Any Package
1. Check npm registry for exact API
2. Verify Solid.js compatibility
3. Check bundle size impact
4. Document in your report

## File Organization Rules

### Maximum File Size
- **150 lines per component** (excluding tests)
- One component per file
- Co-locate tests: `Component.tsx` + `Component.test.tsx`

### Directory Structure
```
frontend/src/
  components/
    TranscriptInput/
      TranscriptInput.tsx       # Component only
      TranscriptInput.test.tsx  # Tests
      TranscriptInput.module.css # Styles (if needed)
    TranscriptViewer/
      TranscriptViewer.tsx
      TranscriptViewer.test.tsx
    AIProcessor/
      AIProcessor.tsx
      AIProcessor.test.tsx
  pages/
    Home.tsx
    History.tsx
  api/
    client.ts         # Base HTTP client
    transcripts.ts    # Transcript endpoints
    videos.ts         # Video endpoints
    ai.ts            # AI endpoints
  types/
    index.ts         # TypeScript interfaces
  hooks/
    useTranscript.ts
    useAI.ts
  utils/
    validators.ts
    formatters.ts
```

## Component Design Rules

### Single Responsibility
```tsx
// ✅ GOOD - One component, one job
export function TranscriptInput(props: TranscriptInputProps) {
  // Only handles URL input and validation
}

// ❌ BAD - Too many responsibilities
export function TranscriptPage() {
  // Don't mix input, display, AND API calls in one component
}
```

### Props Over State When Possible
```tsx
// ✅ GOOD
function TranscriptViewer(props: { data: Transcript }) {
  return <div>{props.data.text}</div>
}

// ❌ BAD - Unnecessary internal state
function TranscriptViewer(props: { data: Transcript }) {
  const [text, setText] = createSignal(props.data.text)
  return <div>{text()}</div>
}
```

## TypeScript Requirements

### Strict Mode Enabled
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Type Everything
```ts
// ✅ GOOD
interface TranscriptResponse {
  data: {
    id: string
    video: VideoMeta
    transcript: TranscriptLine[]
  }
}

async function fetchTranscript(url: string): Promise<TranscriptResponse> {
  // ...
}

// ❌ BAD
async function fetchTranscript(url: any): Promise<any> {
  // Never use 'any'
}
```

## Testing Requirements

### Test Every Component
```tsx
// TranscriptInput.test.tsx
import { render, fireEvent } from '@solidjs/testing-library'
import { TranscriptInput } from './TranscriptInput'

describe('TranscriptInput', () => {
  test('validates YouTube URL', () => {
    const { getByRole } = render(() => <TranscriptInput />)
    const input = getByRole('textbox')
    fireEvent.input(input, { target: { value: 'invalid' }})
    // Assert error message shown
  })

  test('calls onSubmit with valid URL', async () => {
    // ...
  })
})
```

### Coverage
- Minimum 80% coverage
- Run: `bun test --coverage`
- Include in every report

## Code Quality Standards

### Before Submitting
```bash
# Must all pass
bun run lint        # ESLint
bun run type-check  # TypeScript
bun test            # Tests
bun run build       # Production build
```

### Bundle Size Limit
- **Max 50KB initial bundle** (gzipped)
- Check: `bun run build --analyze`
- Report size in every task completion

## Styling Standards

### TailwindCSS First
```tsx
// ✅ GOOD
<div class="flex items-center gap-4 p-4 bg-gray-100 rounded-lg">
  <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    Submit
  </button>
</div>

// ❌ BAD - Avoid inline styles
<div style={{ display: 'flex', padding: '16px' }}>
```

### Custom CSS Only When Necessary
- Use Tailwind utilities first
- CSS modules if component-specific styles needed
- Never global CSS unless absolutely required

## API Client Design

### Centralized Client
```ts
// api/client.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, options)
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`)
  }
  return response.json()
}
```

### Typed Endpoints
```ts
// api/transcripts.ts
import { apiCall } from './client'
import type { TranscriptResponse } from '../types'

export async function fetchTranscript(
  url: string
): Promise<TranscriptResponse> {
  return apiCall<TranscriptResponse>('/api/v1/transcripts/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  })
}
```

## Error Handling

### User-Friendly Messages
```tsx
// ✅ GOOD
{error() && (
  <div class="text-red-600 text-sm">
    {error() === 'INVALID_URL'
      ? 'Please enter a valid YouTube URL'
      : 'Something went wrong. Please try again.'}
  </div>
)}

// ❌ BAD
{error() && <div>{error()}</div>}
```

## Documentation Requirements

### Every Task Updates
1. `.agents/frontend/docs/current_task.md` - What you're doing
2. `.agents/frontend/docs/completed_tasks.md` - What you finished
3. `.agents/frontend/docs/component_tree.md` - Component hierarchy

### Component Comments
```tsx
/**
 * TranscriptInput - URL input for YouTube videos
 *
 * Validates URL format and emits onSubmit when valid.
 * Shows inline error for invalid URLs.
 *
 * @param onSubmit - Callback with validated URL
 * @param disabled - Disable input during loading
 */
export function TranscriptInput(props: TranscriptInputProps) {
```

## Task Completion Checklist

### Before Creating Report
- [ ] All components <150 lines
- [ ] Tests written and passing: `bun test`
- [ ] TypeScript compiles: `bun run type-check`
- [ ] Linter passing: `bun run lint`
- [ ] Build succeeds: `bun run build`
- [ ] Bundle size <50KB (gzipped)
- [ ] No console.log statements
- [ ] Accessibility attributes (aria-*)
- [ ] Updated documentation

## Report Template

### Location
`.agents/frontend/reports/TASK_{phase}_{task}_{subtask}.md`

### Structure
```markdown
# Task Report: {Task ID}

## Task Description
[Copy from master's instruction]

## Work Completed
- Created: [list of files with full paths]
- Modified: [list of files with full paths]

## Test Results
```
[Paste `bun test` output]
```

## Build Verification
```
[Paste `bun run build` output]
```

## Bundle Size
- Initial: XXkb (gzipped)
- Total: XXkb (gzipped)
- Status: [PASS|FAIL - must be <50KB]

## Type Check
```
[Paste `bun run type-check` output]
```

## Component Screenshot
[If visual component, include screenshot or description]

## Verification Steps
1. Run: `cd frontend && bun test`
2. Expected: All tests pass
3. Run: `bun run build`
4. Expected: Build succeeds, bundle <50KB

## Dependencies Added
[If any]
- package: solid-icons
- version: 1.2.3
- verified: npmjs.com/package/solid-icons
- bundle impact: +2KB

## Accessibility
- [ ] Keyboard navigable
- [ ] Screen reader friendly
- [ ] ARIA labels where needed

## Documentation Updates
- Updated: .agents/frontend/docs/current_task.md
- Updated: [any other docs]

## Ready for Review
- [ ] All checklist items complete
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Bundle size acceptable
- [ ] Documentation current
```

## Learning from Mistakes

### If Master Rejects Your Work
1. Read rejection carefully
2. Document in `.agents/frontend/docs/mistakes.md`
3. Update prevention rules
4. Retry with fixes

### Common Mistakes to Avoid
- ❌ Using npm instead of Bun
- ❌ Components >150 lines
- ❌ Not typing with TypeScript
- ❌ Touching backend code
- ❌ Large bundle sizes
- ❌ Missing accessibility
- ❌ console.log in production code

## Best Practices (Solid.js)

### Use Fine-Grained Reactivity
```tsx
// ✅ GOOD - Solid.js signal
const [count, setCount] = createSignal(0)

// ❌ BAD - Don't destructure signals
const count = createSignal(0)[0]()
```

### Lazy Load Routes
```tsx
import { lazy } from 'solid-js'

const History = lazy(() => import('./pages/History'))
```

### Memoize Expensive Computations
```tsx
const formattedTranscript = createMemo(() =>
  formatTranscript(transcript())
)
```

## Success Criteria
- Master approves on first submission
- Zero test failures
- Bundle size under limit
- TypeScript strict mode passes
- Accessible and responsive
