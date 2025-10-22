# Advanced Refactoring: Logic Separation and Custom Hooks

## Overview

Following Next.js and React best practices, we've separated **business logic** from **presentation** by extracting custom hooks. This is the recommended architectural pattern for scalable React applications.

## Results

### Dramatic File Size Reduction

- **Before**: 885 lines (page.tsx with mixed logic and JSX)
- **After**: 319 lines (clean presentation component)
- **Reduction**: **566 lines extracted (~64% reduction)**
- **Total**: 6 custom hooks + 1 presentation component

### Architecture Transformation

#### Before (Anti-pattern)

```
page.tsx (885 lines)
├── Imports (50 lines)
├── Helper functions (30 lines)
├── Component function (805 lines)
    ├── State declarations (100 lines)
    ├── useEffect hooks (400 lines)
    ├── Handler functions (200 lines)
    └── JSX/Rendering (105 lines)
```

#### After (Best Practice)

```
page.tsx (319 lines) - PRESENTATION ONLY
└── Imports hooks & components
└── Render JSX with hook data

hooks/
├── useSearchParams.ts (20 lines) - URL management
├── useTranscriptData.ts (95 lines) - Data fetching
├── useVideoPlayer.ts (22 lines) - Video controls
├── useTabNavigation.ts (58 lines) - Tab state
├── useAIFeatures.ts (338 lines) - AI logic
├── useSearch.ts (32 lines) - Search logic
└── index.ts (6 lines) - Exports
```

## New File Structure

```
app/transcripts/[videoId]/
├── page.tsx (319 lines) ← Clean presentation component
├── page-old-backup.tsx (885 lines) ← Backup of old version
├── constants.ts (56 lines)
├── types.ts (5 lines)
├── components/
│   ├── summary-panel.tsx (65 lines)
│   ├── transcript-tab.tsx (46 lines)
│   ├── ai-analysis-tab.tsx (260 lines)
│   ├── search-tab.tsx (106 lines)
│   └── export-tab.tsx (23 lines)
└── hooks/
    ├── useSearchParams.ts (20 lines)
    ├── useTranscriptData.ts (95 lines)
    ├── useVideoPlayer.ts (22 lines)
    ├── useTabNavigation.ts (58 lines)
    ├── useAIFeatures.ts (338 lines)
    ├── useSearch.ts (32 lines)
    └── index.ts (6 lines)
```

## Custom Hooks Breakdown

### 1. `useSearchParams.ts` (20 lines)

**Purpose**: Centralize URL parameter management

```typescript
export function useSearchParamsManager() {
  const router = useRouter();
  const searchParams = useNextSearchParams();
  
  const updateSearchParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      updater(params);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );
  
  return { searchParams, updateSearchParams };
}
```

**Benefits**:

- Single source of truth for URL updates
- Prevents scroll jumps on param changes
- Reusable across components

---

### 2. `useTranscriptData.ts` (95 lines)

**Purpose**: Handle transcript fetching and caching logic

```typescript
export function useTranscriptData({
  videoId,
  transcriptParam,
  languageParam,
  updateSearchParams,
}) {
  const [transcriptData, setTranscriptData] = useState(null);
  const [transcriptLoading, setTranscriptLoading] = useState(true);
  const [transcriptError, setTranscriptError] = useState(null);
  
  // Complex fetching logic with caching
  useEffect(() => {
    // Fetch from API or cache
  }, [videoId, transcriptParam, languageParam]);
  
  return {
    transcriptData,
    transcriptLoading,
    transcriptError,
    transcriptId,
    transcriptVideoId,
  };
}
```

**Benefits**:

- Encapsulates all transcript loading logic
- Handles caching automatically
- Provides clean loading/error states
- Reusable for other transcript pages

---

### 3. `useVideoPlayer.ts` (22 lines)

**Purpose**: Manage video player state and controls

```typescript
export function useVideoPlayer() {
  const playerRef = useRef<YouTubePlayerRef>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  
  const handleSeek = useCallback((time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time);
    }
  }, []);
  
  return {
    playerRef,
    currentVideoTime,
    setCurrentVideoTime,
    handleSeek,
  };
}
```

**Benefits**:

- Clean separation of player logic
- Simple, focused API
- Easy to test
- Reusable for video features

---

### 4. `useTabNavigation.ts` (58 lines)

**Purpose**: Manage tab state and URL synchronization

```typescript
export function useTabNavigation(
  searchParams,
  updateSearchParams
) {
  const [activeTab, setActiveTab] = useState("transcript");
  const [activeAITab, setActiveAITab] = useState("summary");
  const [searchValue, setSearchValue] = useState("");
  
  // Sync URL params to state
  useEffect(() => {
    // Parse and set tab states
  }, [tabParam, aiTabParam, summaryParam]);
  
  return {
    activeTab,
    setActiveTab,
    activeAITab,
    setActiveAITab,
    summaryParam,
    extractionParam,
    qaParams,
    queryParam,
    searchValue,
    setSearchValue,
  };
}
```

**Benefits**:

- Centralizes navigation logic
- Automatic URL sync
- Type-safe tab values
- Clear state management

---

### 5. `useAIFeatures.ts` (338 lines) ⭐ LARGEST HOOK

**Purpose**: Manage all AI features (Summary, Extraction, Q&A)

```typescript
export function useAIFeatures({
  transcriptId,
  summaryParam,
  extractionParam,
  qaParams,
  setActiveTab,
  setActiveAITab,
  updateSearchParams,
}) {
  // Summary state & logic
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  
  // Extraction state & logic
  const [activeExtraction, setActiveExtraction] = useState(null);
  const [extractionLoadingType, setExtractionLoadingType] = useState(null);
  
  // Q&A state & logic
  const [qaHistory, setQaHistory] = useState([]);
  const [qaLoading, setQaLoading] = useState(false);
  
  // All useEffect hooks for fetching
  // All handler functions
  
  return {
    // Summary
    summaryData,
    summaryLoading,
    summaryError,
    handleSelectSummary,
    handleClearSummary,
    // Extraction
    activeExtraction,
    extractionLoadingType,
    extractionError,
    handleSelectExtraction,
    handleClearExtraction,
    // Q&A
    qaHistory,
    qaLoading,
    qaBootstrapping,
    qaError,
    handleAskQuestion,
    handleClearQAHistory,
  };
}
```

**Benefits**:

- All AI logic in one place
- Clean, predictable API
- Easy to add new AI features
- Testable in isolation
- Handles caching automatically

---

### 6. `useSearch.ts` (32 lines)

**Purpose**: Handle search form logic

```typescript
export function useSearch(
  searchValue,
  setSearchValue,
  updateSearchParams
) {
  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      updateSearchParams((params) => {
        if (searchValue.trim()) {
          params.set("query", searchValue.trim());
        } else {
          params.delete("query");
        }
      });
    },
    [searchValue, updateSearchParams]
  );
  
  const handleClearSearch = useCallback(() => {
    setSearchValue("");
    updateSearchParams((params) => {
      params.delete("query");
    });
  }, [setSearchValue, updateSearchParams]);
  
  return { handleSearchSubmit, handleClearSearch };
}
```

**Benefits**:

- Encapsulates search form logic
- Clean handler functions
- Reusable for other search features

---

## New page.tsx - Presentation Only (319 lines)

### Structure

1. **Imports** (30 lines) - Components and hooks only
2. **Helper Functions** (15 lines) - Type guards
3. **Component** (274 lines):
   - Hook calls (30 lines)
   - Computed values (10 lines)
   - JSX rendering (234 lines)

### Key Features

✅ No business logic
✅ No useEffect hooks
✅ No state management
✅ Only presentation concerns
✅ Clean, readable JSX
✅ Easy to understand at a glance

### Example

```typescript
export default function TranscriptPage() {
  // 1. Hook calls (data fetching)
  const { searchParams, updateSearchParams } = useSearchParamsManager();
  const { transcriptData, transcriptLoading, transcriptError } = useTranscriptData({...});
  const { playerRef, currentVideoTime, handleSeek } = useVideoPlayer();
  const aiFeatures = useAIFeatures({...});
  
  // 2. Computed values
  const shareUrl = useMemo(() => {...}, []);
  const resolvedVideoId = transcriptData?.video_id ?? videoId;
  
  // 3. Pure JSX rendering
  return (
    <div>
      <aside>...</aside>
      <main>
        {transcriptLoading ? <Loading /> : null}
        {transcriptError ? <Error /> : null}
        {transcriptReady ? <Tabs>...</Tabs> : null}
      </main>
    </div>
  );
}
```

## Benefits of This Architecture

### 1. **Separation of Concerns** ⭐

- **Logic**: Isolated in custom hooks
- **Presentation**: Clean JSX in page component
- **Types**: Centralized in types.ts
- **Config**: Extracted to constants.ts

### 2. **Reusability**

- Hooks can be used in other components
- Easy to create new pages with same logic
- Example: Could create a "Quick View" page using same hooks

### 3. **Testability**

```typescript
// Test hooks in isolation
describe('useAIFeatures', () => {
  it('fetches summary on param change', () => {
    const { result } = renderHook(() => useAIFeatures({...}));
    // Test logic
  });
});

// Test component rendering
describe('TranscriptPage', () => {
  it('renders tabs correctly', () => {
    render(<TranscriptPage />);
    // Test UI
  });
});
```

### 4. **Maintainability**

- Bug in summary? Check `useAIFeatures.ts`
- Bug in search? Check `useSearch.ts`
- UI issue? Check `page.tsx`
- Clear boundaries = faster debugging

### 5. **Developer Experience**

- Faster file navigation
- Better IDE performance
- Easier code reviews
- Clear mental model
- Less cognitive load

### 6. **Scalability**

- Easy to add new features
- Can split hooks further if needed
- Clean extension points
- Future-proof architecture

## Next Steps

### Now Possible

1. ✅ **Implement Sticky Header** - Clean JSX makes this trivial
2. ✅ **Add More AI Features** - Extend `useAIFeatures` hook
3. ✅ **Create Mobile View** - Reuse hooks with different UI
4. ✅ **Add Loading Skeletons** - Easy to add to presentation layer
5. ✅ **Write Unit Tests** - Hooks are testable

### Future Enhancements

- Extract `useTranscriptSync` for video/transcript synchronization
- Create `usePersistence` for local storage caching
- Add `useKeyboardShortcuts` for power users
- Split `useAIFeatures` into 3 separate hooks if it grows

## Comparison: Before vs After

### Before (Anti-pattern)

```typescript
export default function TranscriptPage() {
  // 100 lines of state
  const [transcriptData, setTranscriptData] = useState(null);
  const [transcriptLoading, setTranscriptLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  // ... 97 more lines
  
  // 400 lines of useEffect
  useEffect(() => {
    // Complex fetching logic
  }, [dep1, dep2, dep3]);
  
  useEffect(() => {
    // More logic
  }, [dep4, dep5]);
  
  // 200 lines of handlers
  const handleSelectSummary = useCallback(() => {
    // Complex logic
  }, [deps]);
  
  // 105 lines of JSX buried at the end
  return <div>...</div>;
}
```

**Problems**:

- ❌ Logic and presentation mixed
- ❌ Hard to find specific functionality
- ❌ 885 lines too long to understand
- ❌ Difficult to test
- ❌ Hard to reuse logic

### After (Best Practice)

```typescript
export default function TranscriptPage() {
  // Clean hook calls
  const transcript = useTranscriptData({...});
  const player = useVideoPlayer();
  const ai = useAIFeatures({...});
  
  // Simple computed values
  const shareUrl = useMemo(() => {...}, []);
  
  // Clean, readable JSX
  return (
    <div>
      <Sidebar>
        <VideoPlayer ref={player.playerRef} />
        <Metadata data={transcript.data} />
      </Sidebar>
      <Main>
        <Tabs>
          <TranscriptTab {...} />
          <AIAnalysisTab {...ai} />
          <SearchTab {...} />
        </Tabs>
      </Main>
    </div>
  );
}
```

**Benefits**:

- ✅ Clear separation of concerns
- ✅ Easy to locate functionality
- ✅ 319 lines, scannable in seconds
- ✅ Highly testable
- ✅ Hooks are reusable

## Conclusion

This refactoring exemplifies **modern React architecture**:

1. **Custom Hooks** for business logic
2. **Presentation Components** for UI
3. **Type Safety** with TypeScript
4. **Separation of Concerns** throughout
5. **Composability** and reusability

**Result**: A **64% reduction** in main file size, with logic properly organized into focused, testable modules.

This is the **Next.js recommended approach** for building maintainable, scalable applications. 🎉

---

**Status**: ✅ Complete - Production-ready architecture
**Next**: Ready for sticky header implementation in clean codebase
