# Implementation Tasks — Video Player & Learning Interface

## Task List

- [ ] 1. Scaffold component files and refactor LearnPage shell
  - Create `src/components/learn/` directory with empty barrel files for: `VideoPlayer.tsx`, `VideoControls.tsx`, `AutoAdvanceOverlay.tsx`, `VideoErrorOverlay.tsx`, `CurriculumSidebar.tsx`, `LessonContent.tsx`, `LectureNav.tsx`, `RightPanel.tsx`
  - Refactor `src/app/dashboard/courses/[id]/learn/page.tsx`: replace the monolithic component with the new three-column layout shell (`CurriculumSidebar | LessonContent | RightPanel`)
  - Add `sidebarOpen` boolean state (default `true`) and wire `onToggle` to sidebar
  - Derive `allLessons`, `activeIndex`, `prevLesson`, `nextLesson`, `isCompleted` via `useMemo` from `course` and `activeLesson`
  - Keep existing data-fetch logic (`coursesApi.get` + `enrollmentsApi.get`), loading spinner, and course-not-found guard unchanged
  - _Requirements: 2.7, 3.7_

- [ ] 2. Build CurriculumSidebar with collapsible behaviour
  - Implement `CurriculumSidebar` component accepting props: `course`, `enrollment`, `activeLessonId`, `onSelectLesson`, `isOpen`, `onToggle`
  - When `isOpen` is `true`: render full `w-72` sidebar with header (course title, progress bar, completed/total count) and scrollable module+lesson list
  - When `isOpen` is `false`: render a `w-10` strip containing only the re-open toggle button (`PanelLeftOpen` icon)
  - Collapse toggle button uses `PanelLeftClose` / `PanelLeftOpen` from `lucide-react`
  - Module rows: expand/collapse via local `expandedModules` state; show `ChevronDown` / `ChevronRight` icon and completed/total sub-count
  - Lesson rows: active lesson gets `bg-saffron-50 font-semibold text-saffron-700`; completed gets `CheckCircle2` in `text-leaf-500`; incomplete gets `Circle` in `text-ink-300`
  - _Requirements: 2.7, 2.7.1, 2.7.2, 2.7.3, 3.1, 3.2_

- [ ] 3. Build VideoPlayer with native HTML5 controls and state
  - Create `VideoPlayer` component with props: `lessonId`, `enrollmentId`, `videoUrl`, `captionUrl`, `isCompleted`, `nextLesson`, `onComplete`, `onNavigate`
  - Mount `<video ref={videoRef}>` with `controlsList="nodownload"` and no native `controls` attribute
  - Initialise state: `playing=false`, `volume=1`, `muted=false`, `speed=1`, `subtitlesOn=false`, `isFullscreen=false`, `videoError=false`
  - Wire video events: `onPlay`, `onPause`, `onTimeUpdate`, `onLoadedMetadata`, `onSeeked`, `onEnded`, `onError`
  - Render `<track>` element when `captionUrl` is provided; manage `video.textTracks[0].mode` based on `subtitlesOn`
  - _Requirements: 2.1, 2.1.1, 2.1.2_

- [ ] 4. Build VideoControls overlay bar
  - Create `VideoControls` component receiving video state and handler callbacks as props
  - Layout: `absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 flex items-center gap-2`
  - Play/pause: `Play` / `Pause` icon button toggling `video.paused`
  - Seek bar: `<input type="range" min={0} max={duration} value={currentTime}>` with `accent-saffron-500`; update `video.currentTime` on `onChange`
  - Elapsed/total time: formatted as `mm:ss / mm:ss` using the existing `formatDuration` utility
  - Volume slider: `<input type="range" min={0} max={1} step={0.05}>` controlling `video.volume`; mute button toggles `video.muted` with `Volume2` / `VolumeX` icon
  - Speed selector: `<select>` with options `[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]`; applies `video.playbackRate` on change
  - Subtitles button: `Subtitles` icon; `disabled` + tooltip "No captions available" when `captionUrl` is absent
  - Fullscreen button: `Maximize` / `Minimize` icon toggling Fullscreen API on the player container ref
  - _Requirements: 2.1.2, 2.1.3, 2.1.4_

- [ ] 5. Implement progress auto-save on pause and seek
  - Implement `saveProgress()` inside `VideoPlayer`: reads `Math.floor(videoRef.current.currentTime)`, calls `lessonsApi.updateProgress(lessonId, enrollmentId, secs)`
  - Add debounce guard using `progressSaving` ref: if `true`, skip call; set to `true` before call; reset to `false` after 500 ms via `setTimeout` in `finally`
  - Implement silent retry: on catch, `await setTimeout(2000)` then retry once; on second failure, `console.error` only
  - Call `saveProgress()` in `onPause` handler and `onSeeked` handler
  - _Requirements: 2.2, 2.2.1, 2.2.2, 2.2.3_

- [ ] 6. Implement video completion detection and auto-advance overlay
  - Create `AutoAdvanceOverlay` component: props `title: string`, `countdown: number`, `onCancel: () => void`
  - Overlay renders: semi-transparent backdrop over video, "Next up: [title] — starting in [n]s", Cancel button
  - In `VideoPlayer`: `handleCompletion()` fires on `onEnded` when `!isCompleted`; calls `lessonsApi.markComplete`; on success sets `autoAdvance` state to `{ title: nextLesson.title, countdown: 5 }` if `nextLesson` exists; calls `onComplete()` to re-fetch enrollment
  - `useEffect` on `autoAdvance`: runs `setInterval(1s)` decrementing `countdown`; at 0 calls `onNavigate(nextLesson)` and clears state
  - Cancel button: clears `autoAdvance` state and clears the interval
  - On `markComplete` failure: set `completionError=true` to show `VideoErrorOverlay` with retry
  - No next lesson path: `onComplete()` fires and parent shows completion celebration (existing logic)
  - _Requirements: 2.3, 2.3.1, 2.3.2, 2.3.3, 2.3.4, 3.3_

- [ ] 7. Implement VideoErrorOverlay and retry
  - Create `VideoErrorOverlay` component: props `message: string`, `onRetry: () => void`
  - Overlay renders centred in video container: error icon, message text, Retry button
  - Wire `onError` video event to set `videoError=true` in `VideoPlayer`
  - Retry handler: clears `videoError`, increments a `retrySeed` state integer; pass `retrySeed` as `key` prop to `<video>` to force remount and reload `src`
  - _Requirements: 2.1.5_

- [ ] 8. Implement keyboard shortcuts
  - Inside `VideoPlayer`, add `useEffect` that registers `document.addEventListener('keydown', handleKey)` on mount
  - `handleKey`: guard against `INPUT`, `TEXTAREA`, `isContentEditable` targets
  - Implement `Space` (preventDefault + play/pause toggle), `f/F` (fullscreen toggle), `m/M` (muted toggle + sync `muted` state), `ArrowLeft` (seek −10s, floor 0), `ArrowRight` (seek +10s, cap at duration)
  - Return cleanup: `document.removeEventListener('keydown', handleKey)`
  - _Requirements: 2.6, 2.6.1, 2.6.2_

- [ ] 9. Build LectureNav prev/next buttons
  - Create `LectureNav` component: props `prevLesson: Lesson | null`, `nextLesson: Lesson | null`, `onNavigate: (lesson: Lesson) => Promise<void>`
  - Render two buttons: `← Previous` and `Next →` using `ChevronLeft` / `ChevronRight` icons
  - `disabled` attribute + `opacity-50 pointer-events-none` classes when `prevLesson` / `nextLesson` is null
  - On click: call `onNavigate(lesson)` — parent's `handleNavigate` saves progress then updates `activeLesson`
  - In `LearnPage.handleNavigate`: for VIDEO lessons, invoke `lessonsApi.updateProgress` before setting `activeLesson`; on `updateProgress` failure, show a toast "Progress may not have saved" (inline `useState` toast, auto-dismiss after 3 s)
  - _Requirements: 2.4, 2.4.1, 2.4.2, 2.4.3, 2.4.4_

- [ ] 10. Build RightPanel with Notes, Q&A, and Resources tabs
  - Create `RightPanel` component: props `lesson: Lesson`
  - Tab bar: three buttons (`Notes`, `Q&A`, `Resources`) — active tab gets `border-b-2 border-saffron-500 text-saffron-700`; inactive gets `text-ink-500 hover:text-ink-700`
  - **Notes tab**: `<textarea className="textarea w-full h-64 resize-none">` with `defaultValue={localStorage.getItem('lesson-note-' + lesson.id) ?? ''}`; `onChange` handler writes to `localStorage.setItem('lesson-note-' + lesson.id, value)`; re-initialise textarea on `lesson.id` change via `key={lesson.id}`
  - **Q&A tab**: heading "Q&A", paragraph "Q&A coming soon", `<input className="input" disabled placeholder="Ask a question..."/>`
  - **Resources tab**: if `lesson.resourceUrl`, render `<a href={lesson.resourceUrl} download className="btn-secondary inline-flex gap-2"><FileDown className="w-4 h-4"/>Download resource</a>`; else `<p className="text-sm text-ink-500">No resources for this lesson.</p>`
  - _Requirements: 2.5, 2.5.1, 2.5.2, 2.5.3, 3.5_

- [ ] 11. Build LessonContent router and non-video lesson types
  - Create `LessonContent` component: props `lesson: Lesson` — renders `VideoPlayer` for `type === 'VIDEO'`, `TextContent` for `type === 'TEXT'`, `QuizPlaceholder` for `type === 'QUIZ'`
  - `TextContent`: renders `<div className="card p-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content ?? '' }}/>`
  - `QuizPlaceholder`: renders a card with "Quiz coming soon" message
  - Wire `LessonContent` into `LearnPage`; pass `prevLesson`, `nextLesson`, `onNavigate`, `onComplete`, `isCompleted`, `enrollment.id`
  - _Requirements: 3.4_

- [ ] 12. Verify build, fix type errors, and validate acceptance criteria
  - Run `npm run build` and resolve any TypeScript errors or missing imports
  - Manually verify in browser:
    - Video plays, pauses, seeks, changes speed, mutes, goes fullscreen
    - Keyboard shortcuts work (Space, F, M, ArrowLeft, ArrowRight)
    - Sidebar collapses and re-expands; active lesson highlighted
    - Progress saves on pause/seek (check Network tab)
    - Auto-advance countdown appears on video end; Cancel stops it
    - Notes persist in localStorage across lesson changes
    - Prev/Next buttons disable correctly at boundaries
  - _Requirements: all acceptance criteria_
