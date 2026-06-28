# Bugfix Requirements Document

## Introduction

The current learn page at `app/dashboard/courses/[id]/learn/page.tsx` uses the browser's native `<video controls>` element, which provides no control over playback speed, keyboard shortcuts, subtitle toggling, or custom seek/volume UX. Progress is not saved to the backend on pause or seek — only on manual "Mark complete" click. There is no next/previous lecture navigation, no auto-advance on completion, and no structured right-panel for notes, Q&A, and resources. The new route `app/learn/[courseSlug]/[lectureId]/page.tsx` must deliver a fully-featured in-course learning interface that fixes all of these gaps while preserving the existing enrollment, progress, and completion behaviors already working on the dashboard learn page.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a student opens a video lecture THEN the system renders a bare native `<video controls>` element with no custom playback speed control, no keyboard shortcut handling, and no subtitle toggle.

1.2 WHEN a student pauses or seeks in the video THEN the system does NOT save the watched-seconds progress to the backend, so progress is lost on navigation or page refresh.

1.3 WHEN a student finishes a video THEN the system does NOT detect completion automatically, does not prompt the student to advance, and does not auto-advance to the next lecture.

1.4 WHEN a student wants to navigate between lectures THEN the system provides no previous/next lecture buttons, requiring the student to manually click a lesson in the sidebar.

1.5 WHEN a student wants to take notes, view Q&A, or access resources for a lecture THEN the system provides no tabbed right-panel; all supplementary content is absent from the interface.

1.6 WHEN a student uses the keyboard during video playback THEN the system does not respond to Space (play/pause), F (fullscreen), M (mute), or arrow keys (±10 s seek).

1.7 WHEN the curriculum sidebar is open on a small viewport THEN the system does not allow the sidebar to be collapsed, permanently consuming horizontal space needed for the video.

### Expected Behavior (Correct)

2.1 WHEN a student opens a video lecture THEN the system SHALL render a custom HTML5 video player using only the native `<video>` element and React state — without any third-party video-player library.

2.1.1 WHEN the video player mounts THEN the system SHALL initialise in a paused state with volume at 100%, playback speed at 1×, subtitles off, and fullscreen off.

2.1.2 WHEN the video player renders THEN the system SHALL display the following controls in a single overlay bar: play/pause toggle, seek bar with elapsed/total time, volume slider, playback-speed selector (0.5×, 0.75×, 1×, 1.25×, 1.5×, 1.75×, 2×), subtitle/caption toggle, and fullscreen toggle.

2.1.3 WHEN a student selects a playback speed THEN the system SHALL apply that speed to `videoElement.playbackRate` immediately and the selector SHALL reflect the chosen value.

2.1.4 IF the active lesson has no caption track THEN the subtitle toggle SHALL be disabled and display a tooltip "No captions available".

2.1.5 IF the video source fails to load (network error or invalid URL) THEN the system SHALL display an inline error message "Video unavailable — please try again" and a retry button that reloads the `src`.

2.2 WHEN a student pauses the video THEN the system SHALL call `lessonsApi.updateProgress(lessonId, enrollmentId, Math.floor(videoElement.currentTime))` to persist the current watch position.

2.2.1 WHEN a student moves the seek bar and releases it THEN the system SHALL call `lessonsApi.updateProgress(lessonId, enrollmentId, Math.floor(videoElement.currentTime))` after the `seeked` event fires.

2.2.2 IF the `updateProgress` API call fails THEN the system SHALL silently retry once after 2 seconds; IF the retry also fails THEN the system SHALL log the error to the console without surfacing an error to the student.

2.2.3 WHILE a seek or pause event has triggered an in-flight `updateProgress` call THEN the system SHALL debounce any additional pause/seek events for 500 ms to prevent duplicate concurrent requests.

2.3 WHEN the video's `ended` event fires AND `LessonProgress.completed` is `false` for the active lesson THEN the system SHALL call `lessonsApi.markComplete(lessonId, enrollmentId)`.

2.3.1 WHEN `markComplete` succeeds AND a next lecture exists (determined by ascending `position` order across all modules) THEN the system SHALL display a 5-second countdown overlay ("Next up: [title] — starting in 5s") with a Cancel button; IF the countdown completes without cancellation THEN the system SHALL navigate to the next lecture.

2.3.2 WHEN `markComplete` succeeds AND no next lecture exists (last lesson in the course) THEN the system SHALL display the course-completion celebration UI instead of an auto-advance countdown.

2.3.3 IF the `markComplete` API call fails THEN the system SHALL display an inline error "Could not save completion — please try again" with a Retry button; the auto-advance countdown SHALL NOT start until `markComplete` succeeds.

2.3.4 IF the student clicks Cancel during the 5-second countdown THEN the system SHALL dismiss the overlay and remain on the current lecture without navigating.

2.4 WHEN a student clicks the "Next lecture" button THEN the system SHALL first call `lessonsApi.updateProgress` to persist accumulated `watchedSecs` for the current VIDEO lesson, then navigate to the immediately next lesson by ascending `position` order across all modules.

2.4.1 WHEN a student clicks the "Previous lecture" button THEN the system SHALL first call `lessonsApi.updateProgress` to persist accumulated `watchedSecs` for the current VIDEO lesson, then navigate to the immediately previous lesson by ascending `position` order across all modules.

2.4.2 IF the current lecture is the first lesson across all modules THEN the "Previous lecture" button SHALL be disabled and visually indicate it is unavailable.

2.4.3 IF the current lecture is the last lesson across all modules THEN the "Next lecture" button SHALL be disabled and visually indicate it is unavailable.

2.4.4 IF the `updateProgress` call fails before navigation THEN the system SHALL still navigate to the adjacent lecture and display a non-blocking toast "Progress may not have saved".

2.5 WHEN a student selects the Notes tab in the right panel THEN the system SHALL display a `<textarea>` pre-populated with any previously saved note for the active lesson; WHEN the student edits the text THEN the system SHALL save the note to `localStorage` keyed by `lessonId` on each `onChange` event.

2.5.1 WHEN a student selects the Q&A tab THEN the system SHALL display a placeholder UI with the message "Q&A coming soon" and a disabled input field styled to match the design system.

2.5.2 WHEN a student selects the Resources tab THEN the system SHALL display a list of downloadable items derived from `lesson.resourceUrl`; each item SHALL render as an anchor tag with the `download` attribute and a file-type icon.

2.5.3 IF `lesson.resourceUrl` is null or empty THEN the Resources tab SHALL display the message "No resources for this lesson".

2.6 WHEN the video player is mounted and the `keydown` event fires on `document` THEN:
- IF the key is `Space` THEN the system SHALL toggle play/pause on the active video element.
- IF the key is `f` or `F` THEN the system SHALL toggle fullscreen using the Fullscreen API.
- IF the key is `m` or `M` THEN the system SHALL toggle `videoElement.muted`.
- IF the key is `ArrowLeft` THEN the system SHALL seek `videoElement.currentTime` backward by 10 seconds (floored at 0).
- IF the key is `ArrowRight` THEN the system SHALL seek `videoElement.currentTime` forward by 10 seconds (capped at `videoElement.duration`).

2.6.1 WHILE the student's focus is inside a text input, textarea, or contenteditable element THEN the system SHALL NOT intercept any keyboard shortcut to avoid interfering with typing.

2.6.2 WHEN the video player unmounts THEN the system SHALL remove all `keydown` event listeners added by the player.

2.7 WHEN a student clicks the sidebar collapse toggle THEN IF the sidebar is currently visible THEN the system SHALL hide the sidebar panel and expand the video/content area to occupy the full available width.

2.7.1 WHEN a student clicks the sidebar collapse toggle AND the sidebar is currently hidden THEN the system SHALL restore the sidebar to its default width (288 px / `w-72`) and return the video/content area to its previous width.

2.7.2 WHEN the sidebar is collapsed THEN the collapse toggle button SHALL remain visible so the student can re-expand the sidebar.

2.7.3 WHEN the page is re-mounted or the active lesson changes THEN the sidebar collapse state SHALL be preserved for the duration of the session (stored in React state, not persisted to `localStorage`).

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the module/lesson list is rendered in the sidebar THEN the system SHALL CONTINUE TO highlight the current lecture, show per-module completion counts, and allow expanding/collapsing individual modules.

3.2 WHEN a lecture is already marked complete in `enrollment.lessonProgress` THEN the system SHALL CONTINUE TO display the green checkmark state in the sidebar and suppress the "Mark complete" prompt for that lesson.

3.3 WHEN the overall course progress reaches 100% THEN the system SHALL CONTINUE TO display the course-completion celebration and link to the certificates page.

3.4 WHEN a student navigates to a TEXT or QUIZ lesson type THEN the system SHALL CONTINUE TO render the appropriate non-video content (rich text or quiz UI) rather than a video player.

3.5 WHEN a lesson has a `resourceUrl` THEN the system SHALL CONTINUE TO offer a downloadable resource link alongside the lesson content.

3.6 WHEN the API returns a 401 response THEN the system SHALL CONTINUE TO clear the stored token and redirect to `/auth/login` via the existing `apiClient` interceptor.

3.7 WHEN the enrollment or course data is loading THEN the system SHALL CONTINUE TO display a centered spinner and prevent interaction with lesson controls until data is ready.
