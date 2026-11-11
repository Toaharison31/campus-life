# Project Context

## Product and stack

CAMPUS LIFE is a student life management workspace built with React, Vite,
JavaScript, Tailwind CSS, React Router, Lucide React, and i18next. It has no
backend or authentication. Existing browser data is kept in `localStorage`.

## Application structure

- `src/App.jsx` owns shared application state, routing, profile preferences,
  notification read state, and the minute-level clock used by live alerts.
- `src/context/CampusContext.jsx` exposes that state to module pages.
- `src/hooks/useLocalStorage.js` and `src/services/storage.js` load and persist
  the tasks, courses, announcements, and resources collections.
- `src/services/studentData.js` derives task statistics, weekly activity,
  upcoming classes, notifications, and cross-module search results.
- `src/pages/` contains the dashboard, task manager, timetable, news center,
  resource library, notifications, global search, and profile/settings screens.
- `src/components/` contains the shared navigation, header, modal, confirmation,
  empty-state, and statistic components.
- `src/i18n/locales/` contains the English and French UI translations.
- `DESIGN_SYSTEM.md` documents the four visual themes, semantic design tokens,
  icon conventions, and theme extension process.

## Features

- Dashboard metrics and weekly activity are derived from task data; the next
  class is calculated from the current weekday and time.
- Tasks support create, edit, delete, completion state, due dates, priorities,
  categories, search, filters, and overdue tracking.
- Timetable entries support weekly and daily views; invalid or overlapping
  intervals on the same day are rejected.
- Announcements have categories, priorities, persisted read/unread state, search,
  and a detail view. Resources support categories, safe HTTP(S) links, search,
  and persistent favorites.
- The notification center derives alerts from current tasks, announcements, and
  class schedules. The header search groups results by module.
- Profile information and appearance are stored locally. Language changes are
  persisted by the i18next setup.
- Appearance includes Light, Dark, Campus Blue, and Sunset themes. On a fresh
  install, Light/Dark follows the operating-system preference until changed.

## Local data conventions

Collection keys are `campus-life:tasks`, `campus-life:courses`,
`campus-life:announcements`, and `campus-life:resources`. Profile preferences
and notification read IDs use `campus-life:profile` and
`campus-life:notifications-read`. Existing collection records remain in place;
new metadata is optional when reading legacy records.

When adding UI text, update both `en.json` and `fr.json`. Keep derived business
logic in services and use the shared context for persisted application data.
