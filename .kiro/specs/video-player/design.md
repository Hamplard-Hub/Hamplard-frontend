# Technical Design — Video Player & Learning Interface

## Overview

A new route `src/app/dashboard/courses/[id]/learn/page.tsx` replaces the existing native-video learn page with a fully-featured in-course learning interface. The implementation is entirely within the existing Next.js 14 + Tailwind + Lucide stack — no new runtime dependencies are added.

---

## Route

```
/dashboard/courses/[id]/learn  →  src/app/dashboard/courses/[id]/learn/page.tsx
```

The `[id]` param is the `courseId`. The active `lessonId` is tracked in React state (not in the URL) to avoid full page reloads on lecture navigation, preserving video player mount state.

---

## Component Tree

```
LearnPage  (page.tsx — 'use client')
├── CurriculumSidebar          (components/learn/CurriculumSidebar.tsx)
│   ├── ModuleRow (per module)
│   └── LessonRow (per lesson, highlights active)
├── LessonContent              (components/learn/LessonContent.tsx)
│   ├── VideoPlayer            (components/learn/VideoPlayer.tsx)  ← VIDEO type only
│   │   ├── <video ref>        (native HTML5)
│   │   ├── VideoControls      (play/pause, seek, volume, speed, subtitles, fullscreen)
│   │   ├── AutoAdvanceOverlay (5-second countdown)
│   │   └── VideoErrorOverlay  (error + retry)
│   ├── TextContent            (components/learn/TextContent.tsx)   ← TEXT type
│   └── QuizPlaceholder        (components/learn/QuizPlaceholder.tsx) ← QUIZ type
├── LectureNav                 (components/learn/LectureNav.tsx — prev/next buttons)
└── RightPanel                 (components/learn/RightPanel.tsx)
    ├── NotesTab
    ├── QATab
    └── ResourcesTab
```

All new components live under `src/components/learn/`.

---

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [≡ collapse]  CurriculumSidebar (w-72)  │  LessonContent  │  RightPanel (w-80) │
│                                           │  VideoPlayer    │  [Notes|Q&A|Res]   │
│  Module 1 ▾                              │  aspect-video   │                    │
│    ● Lesson 1 (active)                   │  VideoControls  │                    │
│    ○ Lesson 2                            │  LectureNav     │                    │
└─────────────────────────────────────────────────────────────┘
```

- Sidebar: `w-72 flex-shrink-0`, hideable via `sidebarOpen` boolean state.
- Center: `flex-1 overflow-y-auto` — holds video + nav + lesson meta.
- Right panel: `w-80 flex-shrink-0 border-l`.
- Full-height container: `h-[calc(100vh-3.5rem)] flex overflow-hidden` (matches existing learn page shell).

---

## VideoPlayer Component

### State

```ts
const videoRef = useRef<HTMLVideoElement>(null);
const [playing,       setPlaying]       = useState(false);
const [currentTime,   setCurrentTime]   = useState(0);
const [duration,      setDuration]      = useState(0);
const [volume,        setVolume]        = useState(1);
const [muted,         setMuted]         = useState(false);
const [speed,         setSpeed]         = useState(1);
const [isFullscreen,  setIsFullscreen]  = useState(false);
const [subtitlesOn,   setSubtitlesOn]   = useState(false);
const [videoError,    setVideoError]    = useState(false);
const [autoAdvance,   setAutoAdvance]   = useState<{ title: string; countdown: number } | null>(null);
const progressSaving = useRef(false);  // debounce flag
```

### Key Handlers

| Event | Action |
|---|---|
| `onPlay` | `setPlaying(true)` |
| `onPause` | `setPlaying(false)` → `saveProgress()` |
| `onTimeUpdate` | `setCurrentTime(video.currentTime)` |
| `onLoadedMetadata` | `setDuration(video.duration)` |
| `onSeeked` | `saveProgress()` |
| `onEnded` | `handleCompletion()` |
| `onError` | `setVideoError(true)` |

### `saveProgress()` — debounced + retry

```ts
async function saveProgress() {
  if (progressSaving.current) return;
  progressSaving.current = true;
  const secs = Math.floor(videoRef.current?.currentTime ?? 0);
  try {
    await lessonsApi.updateProgress(lessonId, enrollmentId, secs);
  } catch {
    await new Promise(r => setTimeout(r, 2000));
    try { await lessonsApi.updateProgress(lessonId, enrollmentId, secs); }
    catch (e) { console.error('[VideoPlayer] progress save failed', e); }
  } finally {
    setTimeout(() => { progressSaving.current = false; }, 500);
  }
}
```

### `handleCompletion()`

```ts
async function handleCompletion() {
  if (isCompleted) return;           // already done per lessonProgress
  try {
    await lessonsApi.markComplete(lessonId, enrollmentId);
    onComplete();                    // re-fetches enrollment in parent
    if (nextLesson) {
      setAutoAdvance({ title: nextLesson.title, countdown: 5 });
    }
    // no next lesson → parent shows celebration UI
  } catch {
    setCompletionError(true);
  }
}
```

Auto-advance countdown runs via `useEffect` with a 1-second `setInterval` on `autoAdvance`. On reaching 0, calls `onNavigate(nextLesson.id)`.

### Keyboard Shortcuts

```ts
useEffect(() => {
  function handleKey(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName;
    if (['INPUT','TEXTAREA'].includes(tag) ||
        (e.target as HTMLElement).isContentEditable) return;
    const v = videoRef.current;
    if (!v) return;
    switch (e.key) {
      case ' ': e.preventDefault(); v.paused ? v.play() : v.pause(); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case 'm': case 'M': v.muted = !v.muted; setMuted(v.muted); break;
      case 'ArrowLeft':  e.preventDefault(); v.currentTime = Math.max(0, v.currentTime - 10); break;
      case 'ArrowRight': e.preventDefault(); v.currentTime = Math.min(v.duration, v.currentTime + 10); break;
    }
  }
  document.addEventListener('keydown', handleKey);
  return () => document.removeEventListener('keydown', handleKey);
}, []);
```

### Fullscreen

```ts
function toggleFullscreen() {
  const container = containerRef.current;
  if (!document.fullscreenElement) container?.requestFullscreen();
  else document.exitFullscreen();
}
useEffect(() => {
  const handler = () => setIsFullscreen(!!document.fullscreenElement);
  document.addEventListener('fullscreenchange', handler);
  return () => document.removeEventListener('fullscreenchange', handler);
}, []);
```

### Subtitles

The `<video>` element renders `<track>` elements when `lesson.captionUrl` is present. Toggle is implemented by setting `video.textTracks[0].mode = subtitlesOn ? 'showing' : 'hidden'`. If no caption track exists, the button is `disabled` with a tooltip.

---

## VideoControls Layout

```
[▶/⏸]  [━━━━━━━━●━━━]  00:42 / 10:30  [🔊━━●━]  [1×▾]  [CC]  [⛶]
```

- Seek bar and volume slider: `<input type="range">` styled with Tailwind `accent-saffron-500`.
- Speed selector: `<select>` with options `[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]`.
- All icons from `lucide-react`: `Play`, `Pause`, `Volume2`, `VolumeX`, `Subtitles`, `Maximize`, `Minimize`.
- Controls overlay: `absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2` — shown always (not hover-hide, for accessibility).

---

## CurriculumSidebar

Props:
```ts
interface CurriculumSidebarProps {
  course: Course;
  enrollment: Enrollment;
  activeLessonId: string;
  onSelectLesson: (lesson: Lesson) => void;
  isOpen: boolean;
  onToggle: () => void;
}
```

- Collapse toggle button: `<button>` with `PanelLeftClose` / `PanelLeftOpen` icon, positioned at the top of the sidebar.
- When `!isOpen`: sidebar renders only the toggle button in a `w-10` strip.
- Module expand/collapse: local `expandedModules` state (`Record<string, boolean>`).
- Active lesson: `bg-saffron-50` row with `font-semibold text-saffron-700`.
- Completed lesson: `CheckCircle2` icon in `text-leaf-500`.
- Progress bar + completed/total count in the sidebar header.

---

## RightPanel

```ts
type Tab = 'notes' | 'qa' | 'resources';
const [activeTab, setActiveTab] = useState<Tab>('notes');
```

### Notes Tab

- `<textarea className="textarea w-full h-64 resize-none">` pre-populated from `localStorage.getItem(`lesson-note-${lessonId}`)`.
- `onChange`: `localStorage.setItem(`lesson-note-${lessonId}`, value)`.

### Q&A Tab

- Static placeholder: heading "Q&A", subtext "Q&A coming soon", disabled `<input className="input" disabled placeholder="Ask a question...">`.

### Resources Tab

- If `lesson.resourceUrl`: renders `<a href={lesson.resourceUrl} download>` with `FileDown` icon.
- If no resource: `<p className="text-sm text-ink-500">No resources for this lesson.</p>`.

---

## LectureNav

Props:
```ts
interface LectureNavProps {
  prevLesson: Lesson | null;
  nextLesson: Lesson | null;
  onNavigate: (lesson: Lesson) => Promise<void>;
}
```

- Two buttons side-by-side: `← Previous` and `Next →`.
- `disabled` + `opacity-50 pointer-events-none` when `prevLesson` / `nextLesson` is null.
- On click: calls `onNavigate` (which saves progress then updates `activeLesson` state in parent).

---

## LearnPage Orchestration

```ts
// Derived flat lesson list
const allLessons = useMemo(
  () => course?.modules?.flatMap(m => m.lessons) ?? [],
  [course]
);

const activeIndex  = allLessons.findIndex(l => l.id === activeLesson?.id);
const prevLesson   = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
const nextLesson   = activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;
const isCompleted  = enrollment?.lessonProgress?.some(
  p => p.lessonId === activeLesson?.id && p.completed
) ?? false;

async function handleNavigate(lesson: Lesson) {
  // VideoPlayer calls saveProgress internally before this is invoked
  setActiveLesson(lesson);
}

async function handleComplete() {
  const updated = await enrollmentsApi.get(id);
  setEnrollment(updated);
}
```

---

## File Structure

```
src/
  app/
    dashboard/courses/[id]/learn/
      page.tsx                        ← refactored LearnPage
  components/
    learn/
      VideoPlayer.tsx
      VideoControls.tsx
      AutoAdvanceOverlay.tsx
      VideoErrorOverlay.tsx
      CurriculumSidebar.tsx
      LessonContent.tsx
      LectureNav.tsx
      RightPanel.tsx
```

---

## Data Flow

```
LearnPage
  │  useEffect → coursesApi.get(id) + enrollmentsApi.get(id)
  │  state: course, enrollment, activeLesson, sidebarOpen
  │
  ├─► VideoPlayer (lessonId, enrollmentId, videoUrl, isCompleted)
  │     │  onPause/onSeeked → lessonsApi.updateProgress
  │     │  onEnded → lessonsApi.markComplete → props.onComplete()
  │     └─► AutoAdvanceOverlay → props.onNavigate(nextLesson)
  │
  ├─► CurriculumSidebar (course, enrollment, activeLessonId, onSelectLesson)
  ├─► LectureNav (prevLesson, nextLesson, onNavigate)
  └─► RightPanel (lesson)
```

---

## No New Dependencies

All functionality is implemented with:
- React `useRef`, `useState`, `useEffect`, `useMemo`
- Native HTML5 `<video>` + `<track>` elements
- Native Web APIs: Fullscreen API, `localStorage`, `document.addEventListener`
- Existing: `lucide-react`, Tailwind utility classes, `lessonsApi` / `enrollmentsApi` from `src/lib/api/services.ts`
