# CAMPUS LIFE design system

## Themes and color tokens

The four themes are selected in the top navigation and saved with the existing
`campus-life:profile` preference object:

| Theme | Primary | Secondary | App background |
|---|---|---|---|
| Light | `#4F46E5` | `#06B6D4` | `#F8FAFC` |
| Dark | `#A5B4FC` | `#67E8F9` | `#0B1120` |
| Campus Blue | `#1D4ED8` | `#0369A1` | `#EEF5FC` |
| Sunset | `#C2410C` | `#9D174D` | `#FFF6ED` |

`src/styles/tokens.css` is the single source of truth. It defines
theme-specific backgrounds, text, borders, brand/status/priority/course colors,
focus rings, and elevations. Components should consume semantic CSS properties,
never raw palette values. The Tailwind config maps these variables to utilities.
Compatibility aliases remain available for existing styles:
`--color-primary`, `--color-primary-hover`, `--color-primary-strong`,
`--color-secondary`, `--color-secondary-strong`,
`--color-accent`, `--color-success`, `--color-warning`, `--color-danger`,
`--color-info`, `--color-background`, `--color-surface`, `--color-border`,
`--color-text`, `--color-text-muted`, and `--color-gradient`. Tailwind 4 reads
the CSS theme aliases in `src/index.css`; `tailwind.config.js` maps equivalent
tokens for utility classes.

On a new installation, the initial theme follows the operating system's light or
dark preference. Explicit selections are persisted and take precedence on later
visits.

The hero and primary-action gradients use accessible darker variants of the
theme's primary and secondary colors so white text remains legible.

## Typography, shape, and motion

Display text prefers Plus Jakarta Sans, with Inter and system sans-serif
fallbacks. Cards use 16px corners, inputs use 12px corners, and status badges
are pill-shaped. The soft, card, and lift shadow levels are exposed as design
tokens. Theme colors transition over 300ms; list entrances, progress indicators,
and skeletons use CSS animations. Reduced-motion preferences disable
non-essential animation.

Tasks and courses share priority/status badges. Eight stable course-color tokens
are used for course indicators and chips across timetable, dashboard, tasks, and
resources. Use `PriorityBadge`, `TaskStatusBadge`, `UnreadBadge`, `CountBadge`,
and `CourseChip` from `src/components/StatusBadges.jsx` instead of styling
status labels locally.

Run `npm run check:contrast` to evaluate semantic color pairs against WCAG AA
thresholds and `npm run check:colors` to detect hardcoded colors or raw Tailwind
palette classes. The development-only `/styleguide` route previews all themes,
token swatches, badges, and representative interaction states.

## Icon usage

Use Lucide React with a consistent 1.75px stroke and `aria-hidden="true"` for
decorative icons. Icon-only controls must have an accessible name. Category and
statistic icons use tinted, rounded-square badges. Shared UI components live in
`src/components/`: Button, Card, Badge, Input, Modal, Toast, Header (navbar),
Sidebar, PageHeader, StatCard, SectionCard, IconButton, RowActions,
SegmentedControl, Kbd, Drawer, CommandPalette, Skeleton, ConfirmDialog,
EmptyState, ThemeSwitcher, and LanguageSwitcher. Empty states use the shared
inline SVG illustration and can include a contextual link action. Command
palette presentation is reusable; its Ctrl+K search/actions integration is part
of the later command-palette feature phase.

## Adding a theme

1. Add a theme name and translated label in both locale JSON files.
2. Add the theme's full semantic palette under
   `:root[data-theme="<name>"]` in `src/styles/tokens.css`.
3. Add the theme name to `themeNames` in `src/App.jsx` and to `themes` and
   `icons` in `src/components/ThemeSwitcher.jsx`.
4. Add preview tokens in `src/styles/tokens.css` and a matching preview style
   in `src/index.css`.
5. Add the theme to the contrast-check list in `scripts/check-contrast.mjs`.
6. Run `npm run check:contrast`, `npm run check:colors`, `npm run lint`, and
   `npm run build`.

The existing Announcements screen remains the campus news/events surface. This
visual redesign does not introduce new Clubs functionality or alter saved
collection schemas.
