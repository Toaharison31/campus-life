# CAMPUS LIFE QA/UI Audit

**Audit date:** 2026-11-11  
**Scope:** React/Vite routes, components, localStorage, translations, styles, and the shared browser preview.

## Baseline checks

- `npm run build` and `npm run lint` pass.
- All application routes, including global search, load in the browser without console warnings or page errors.
- English and French locale files each contain 350 matching keys.
- No broken images were present. There are no content `<img>` elements in the current UI.
- No horizontal overflow was observed at 375px, 768px, or 1280px.
- The four theme token foreground/background pairs checked meet WCAG AA contrast; this does not certify every individual component color.

## Errors

| Problem | Location | Severity | Suggested fix | Status |
|---|---|---|---|---|
| An invalid stored collection could fall back to `[]` and be written over the original value; incomplete records could also reach views. | [src/services/storage.js](./src/services/storage.js#L50), [src/hooks/useLocalStorage.js](./src/hooks/useLocalStorage.js#L4) | Major | Preserve invalid persisted values until a user edit and guard optional record fields. | Fixed |
| Invalid profile and notification JSON or field shapes could be replaced by defaults during mount. | [src/App.jsx](./src/App.jsx#L27), [src/App.jsx](./src/App.jsx#L70) | Major | Preserve malformed values until a deliberate user edit and report storage write failures. | Fixed; browser-tested |
| i18next read and wrote localStorage during initialization without handling storage-access errors. | [src/i18n/i18n.js](./src/i18n/i18n.js#L8) | Major | Guard preference reads/writes while keeping in-memory language switching available. | Fixed |
| No broken imports, route crashes, React key warnings, or console errors were reproduced during the route smoke test. | [src/App.jsx](./src/App.jsx#L59) | — | No change required. | Verified |

## Missing code

| Problem | Location | Severity | Suggested fix | Status |
|---|---|---|---|---|
| Modal dialogs supported Escape and backdrop dismissal but did not move focus into the dialog, trap Tab navigation, or restore focus on close. | [src/components/Modal.jsx](./src/components/Modal.jsx#L9) | Major | Focus the first form field, trap keyboard focus, and restore focus to the trigger. | Fixed; keyboard-tested |
| CRUD changes lacked save/delete feedback, and localStorage failures were not surfaced consistently. | [src/components/Toast.jsx](./src/components/Toast.jsx#L10), [src/App.jsx](./src/App.jsx#L105) | Major | Connect CRUD persistence results and storage failures to localized toast feedback. | Fixed; save verified |
| No content images or image fallback/lazy-loading behavior exist. Current screens use icons and an inline SVG empty state, so there are no broken images to recover from. | [src/components/EmptyState.jsx](./src/components/EmptyState.jsx#L8) | Minor | No image handler was added because there are no images to load; apply `loading="lazy"` and an `onError` fallback if image content is introduced. | Not applicable |
| Unused Vite starter assets/styles were not referenced by the application. | [src/App.css](./src/App.css), [src/assets/react.svg](./src/assets/react.svg), [src/assets/vite.svg](./src/assets/vite.svg) | Minor | Remove the dead starter files. | Fixed |

## Missing features

| Problem | Location | Severity | Suggested fix | Status |
|---|---|---|---|---|
| Seed announcements, tasks, courses, and resources were English-language data even when the interface was French. | [src/data/initialData.js](./src/data/initialData.js#L9) | Minor | Localize fresh-install examples without rewriting existing collections. | Fixed; tested |
| The main requested student modules are present (tasks, timetable, announcements, resources, notifications, profile/settings, and global search). Clubs remain intentionally out of scope from the earlier project decision. | [src/App.jsx](./src/App.jsx#L138) | — | No change required. | Verified |

## Visual issues

| Problem | Location | Severity | Suggested fix | Status |
|---|---|---|---|---|
| Readable interface text fell below 14px on representative routes, including task due dates. | [src/index.css](./src/index.css#L1182), [src/index.css](./src/index.css#L4981) | Major | Raise meaningful text to at least 14px and body copy to 16px while preserving heading hierarchy. | Fixed; no sub-14px text observed in viewport checks |
| Interactive targets fell below 44×44px on mobile and tablet. | [src/index.css](./src/index.css#L5043) | Major | Give interactive controls minimum 44px targets and allow responsive wrapping. | Fixed; checked at 375/768/1280px |
| Action icons and controls lacked consistent minimum sizing, hover/pressed states, or accessible names in some views. | [src/pages/Resources.jsx](./src/pages/Resources.jsx#L208), [src/pages/Timetable.jsx](./src/pages/Timetable.jsx#L202) | Minor | Standardize interactive icon size, hover/pressed behavior, and tooltip/title labels. | Fixed |
| No loading skeleton is shown; the current app reads localStorage synchronously and has no network-backed loading phase. | [src/App.jsx](./src/App.jsx#L59) | Minor | Add skeletons only if an asynchronous loading state is introduced. | Not applicable |
| The requested viewport checks passed without horizontal overflow, and the checked theme token pairs met AA contrast. | [src/index.css](./src/index.css#L3241) | — | No change required based on the tested surfaces. | Verified |

## Post-fix verification

- `npm run build`, `npm run lint`, and `git diff --check` pass.
- English and French locale files have matching 350-key sets.
- All eight routes were checked at 375px, 768px, and 1280px: no horizontal overflow, visible text below 14px, or interactive targets below 44×44px; no browser console warnings or page errors were observed.
- Modal first-field focus, Tab wrapping, Escape dismissal, and focus restoration to the trigger were keyboard-tested.
- Task creation persisted successfully and displayed confirmation feedback. Invalid collection, profile, and notification values remained unchanged until an explicit edit.
- Image fallback and loading skeleton behavior remain inapplicable because this synchronous localStorage app currently loads no content images and has no asynchronous data-fetching state.

## Follow-up shared UI audit

| Problem | Location | Severity | Resolution |
|---|---|---|---|
| At mobile widths a later media-query override hid both the slide-out sidebar and its hamburger trigger, leaving only the bottom tab bar. | [src/index.css](./src/index.css), [src/components/Header.jsx](./src/components/Header.jsx) | Major | Restored the responsive drawer and trigger; added dialog semantics, focus handling, Escape dismissal, and focus restoration. |
| A global `a:hover` rule underlined navigation and card links on hover even where underlining was not intentional. | [src/index.css](./src/index.css) | Minor | Restricted hover/focus underlines to contextual text links. |
| The notification count used a pale danger tint and did not read as a high-visibility counter across themes. | [src/index.css](./src/index.css), [src/components/StatusBadges.jsx](./src/components/StatusBadges.jsx) | Minor | Switched the count to the semantic danger-solid token with the accessible inverse foreground. |
| Existing data-backed module workflows, tokenized colors, and bilingual coverage were already present; no schema or feature rewrite was needed for this pass. | [src/pages/](./src/pages), [src/i18n/locales/](./src/i18n/locales) | — | Preserved existing behavior and persisted data formats. |

## Profile mobile layout correction

| Problem | Location | Severity | Resolution |
|---|---|---|---|
| A legacy global `.profile-hero-card { display: flex }` rule overrode the profile page's responsive grid, collapsing the profile copy to a few pixels and overlapping its completion meter, status pills, and statistics. | [src/index.css](./src/index.css), [src/pages/ProfileSettings.css](./src/pages/ProfileSettings.css) | Major | Increased selector specificity for the profile card and its mobile layout so the intended grid wins without changing other pages. |

## Task list mobile layout correction

| Problem | Location | Severity | Resolution |
|---|---|---|---|
| At phone widths, the task table retained five desktop columns in a horizontally scrolling 700px layout, truncating task names and hiding priority, status, and actions. | [src/pages/Tasks.jsx](./src/pages/Tasks.jsx), [src/index.css](./src/index.css) | Major | Reflowed each task to a compact mobile card with readable title/description, labeled due date, visible priority/status, and an action row; filters now use a two-column layout. |

## Task filter menu positioning correction

| Problem | Location | Severity | Resolution |
|---|---|---|---|
| The browser-native category select menu was rendered far from its trigger in the shared mobile preview. | [src/pages/Tasks.jsx](./src/pages/Tasks.jsx), [src/index.css](./src/index.css) | Major | Replaced the three task filters with token-styled, keyboard-operable listboxes positioned relative to their triggers; the listing panel now allows the menu to overflow instead of clipping it. |

## Task priority and status alignment

| Problem | Location | Severity | Resolution |
|---|---|---|---|
| On mobile, priority and status labels shared a flex row with badges; longer status text wrapped inconsistently and caused each task card to have misaligned metadata. | [src/index.css](./src/index.css) | Minor | Each field now uses a compact one-column grid with its label above the badge, keeping priority and status consistently aligned. |

## Cross-route responsive corrections

| Problem | Location | Severity | Resolution |
|---|---|---|---|
| The task-entry modal was rendered inside an animated page (`transform`), making its fixed backdrop and panel use the page as their positioning container; this placed the dialog offscreen or clipped on narrow layouts. | [src/components/Modal.jsx](./src/components/Modal.jsx) | Major | Rendered the shared modal through a `document.body` portal so it is centered and sized against the viewport on every route. |
| Task filters and the Announcements/Resources toolbars overflowed their content at tablet widths; announcement action buttons also exceeded narrow cards. | [src/index.css](./src/index.css) | Major | Made toolbars wrap at tablet widths, put task search on its own row, and allowed announcement card actions to wrap within the card. |
| The Resources heading and “Add resource” action competed for one row on mobile, pushing the action outside its header. | [src/index.css](./src/index.css) | Minor | Allowed the page title row to wrap so the action moves below the heading on narrow screens. |
| Hidden icon-button tooltip text expanded task rows’ scroll width even when the tooltip was not visible. | [src/index.css](./src/index.css) | Minor | Anchored tooltips to the button’s right edge (left edge in the sidebar), preventing invisible horizontal overflow. |

The final route sweep confirmed no document-level horizontal overflow at 375px, 768px, or 1280px. The Profile tabs and weekly timetable retain their intended contained horizontal scrolling on narrow screens.

## Form controls and positioning

| Problem | Location | Severity | Resolution |
|---|---|---|---|
| Native select popups in the task form could render detached from their field in the narrow browser preview shown in the user screenshot. Other CRUD forms and Profile used the same native picker. | [src/pages/Tasks.jsx](./src/pages/Tasks.jsx), [src/pages/Timetable.jsx](./src/pages/Timetable.jsx), [src/pages/Announcements.jsx](./src/pages/Announcements.jsx), [src/pages/Resources.jsx](./src/pages/Resources.jsx), [src/pages/ProfileSettings.jsx](./src/pages/ProfileSettings.jsx) | Major | Replaced form pickers with a shared, keyboard-operable listbox anchored to the field, positioned above/below according to available space. Escape closes the picker without dismissing its modal. |
| CRUD form labels, values, and validation copy were smaller than the requested readable minimum. | [src/index.css](./src/index.css) | Major | Set form labels and helper/error copy to 14px and input values to 16px while retaining 44px minimum control targets. |
| Profile reset/save actions wrapped into separate rows because the helper text competed for the same horizontal space at tablet and desktop card widths. | [src/pages/ProfileSettings.css](./src/pages/ProfileSettings.css) | Minor | Stacked the helper text above a right-aligned action row; mobile retains a full-width two-column action layout. |

Task, timetable, announcement, and resource dialogs were opened at 375×812, 768×1024, and 1280×900. The modal, every field, the action row, and each open listbox stayed within their intended viewport/panel bounds. Arrow-key selection and Escape behavior were exercised. Profile form fields and menus were checked at the same widths; no document-level horizontal overflow was observed.

## Spacing and typography sweep

| Problem | Location | Severity | Resolution |
|---|---|---|---|
| Dashboard stat-card text used an intrinsic grid track wider than its available column, allowing long labels and hints to spill beyond the card. | [src/index.css](./src/index.css) | Major | Constrained the stat-copy track to `minmax(0, 1fr)` and allowed hint text to wrap. |
| Task rows retained a dense multi-column table at widths where the sidebar left too little room; the action column could not contain its 44px controls. | [src/index.css](./src/index.css) | Major | Switched to the existing labeled task-card layout below 1200px and sized the desktop action track for both controls. |
| Announcements/Resources toolbars and the Profile hero still overflowed near the tablet/desktop transition because the application sidebar reduces the usable content width. | [src/index.css](./src/index.css), [src/pages/ProfileSettings.css](./src/pages/ProfileSettings.css) | Major | Extended wrapping and Profile layout breakpoints to match the actual content width available beside the sidebar. |

Final browser sweep: 63 route/viewport combinations across all nine routes (`/`, `/tasks`, `/timetable`, `/announcements`, `/resources`, `/notifications`, `/profile`, `/search`, `/styleguide`) at 375, 768, 1121, 1200, 1201, 1280, and 1920px. Visible text stayed at or above 14px (body text 16px), page titles remained in their responsive 26–38px range, and no document-level horizontal overflow or unintended card overflow remained. Horizontal scrolling in the weekly timetable is intentional.

## Timetable mobile layout and CRUD verification

| Problem | Location | Severity | Resolution |
|---|---|---|---|
| At phone and tablet widths, the weekly timetable forced five narrow columns and absolutely positioned edit/delete controls over course times and titles. | [src/index.css](./src/index.css), [src/pages/Timetable.jsx](./src/pages/Timetable.jsx) | Major | Reflowed the weekly view into full-width day sections below 1100px, placed 44px edit/delete targets in a separate action row, and allowed course details to wrap. |

Verified at 375px, 768px, and 1024px: the timetable no longer scrolls horizontally, course details remain readable, and action buttons do not cover course content. CRUD browser check with a temporary course confirmed overlap rejection, successful creation, persistence after reload, successful edit, delete cancellation, and confirmed deletion persisted after reload. Existing course records were left unchanged.

## Date field audit

| Surface | Finding | Resolution |
|---|---|---|
| Task form | The due date is the only editable calendar-date field; the browser-native calendar popup could detach from its input in the narrow embedded browser, and required state was not exposed semantically. | Replaced the native popup with an in-page, anchored calendar and exposed required/invalid state accessibly. Past dates remain allowed for overdue tasks. |
| Timetable form | Class start/end controls are times rather than dates; both are required by the existing validation but were not marked required in the form. | Added required semantics to both time inputs; interval and overlap validation are unchanged. |
| Date display in Tasks, Dashboard, Announcements, and Notifications | Shared formatting accepted impossible ISO-looking dates because JavaScript normalizes values such as February 31 into March. The announcement “recent” calculation could also treat invalid dates inconsistently. | Added strict calendar-date parsing, stable UTC-based localized formatting, and safe day-difference checks; invalid dates display as an em dash and are not marked recent. |
| Announcements and Resources forms | Announcements are dated automatically on publication; resources have no date input. | No form changes needed. |

Verified FR/EN date formatting, leap-day validity, impossible dates, malformed input, and calendar-day differences. The task calendar stays inside the modal and viewport, opens above the field when there is insufficient room below, supports keyboard navigation and selection, and does not close the parent dialog on Escape. `npm run build`, `npm run lint`, and `git diff --check` pass.

## Date picker and announcement/resource filter positioning

| Problem | Location | Resolution |
|---|---|---|
| The task due-date picker used the browser-native calendar, whose popup was detached from the field in the embedded mobile browser. | [src/pages/Tasks.jsx](./src/pages/Tasks.jsx), [src/components/DatePicker.jsx](./src/components/DatePicker.jsx) | Added a localized calendar positioned relative to the field, opening upward when needed and constrained to the modal/viewport. It supports month navigation, keyboard date movement, Today, Clear, and FR/EN labels. |
| Announcement and resource category/sort filters used native select popups that could be positioned by the browser outside their controls. | [src/pages/Announcements.jsx](./src/pages/Announcements.jsx), [src/pages/Resources.jsx](./src/pages/Resources.jsx), [src/components/FormSelect.jsx](./src/components/FormSelect.jsx) | Reused the accessible custom listbox selector already used by the CRUD forms, with each menu anchored to its trigger and responsive toolbar sizing. |

Verified selecting dates with the keyboard, preserving the task form on Escape, and category/sort selection on both Announcements and Resources. Their menus open adjacent to the corresponding filter control and retain the existing filtering/sorting behavior. No date or native-select popup remains in the targeted forms/toolbars.
