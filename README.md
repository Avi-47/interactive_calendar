# Wall Calendar Mood Planner

An interactive wall-calendar inspired component built with Next.js (App Router) and React, featuring weather-driven mood themes.

## What This Includes

- Physical wall-calendar aesthetic with hanging rings and artwork panel.
- Monthly calendar grid with clear start date, end date, and in-range visual states.
- Dynamic weather to mood theming:
  - Today uses live weather conditions.
  - Future dates use forecasted weather cache.
  - Past dates use cached weather data, with deterministic mock fallback.
  - Time of day (morning/afternoon/evening/night) influences mood resolution.
- Integrated notes panel:
  - Month memo (keyed by month).
  - Day memo (keyed by date).
  - Selected range memo (keyed by selected start and end).
- Dynamic hero and wall styling based on resolved mood theme.
- Subtle weather effects (rain, sun glow, cloud drift, snow).
- Responsive behavior:
  - Desktop: three-panel layout (hero, calendar, notes).
  - Tablet: hero across top, calendar and notes side by side.
  - Mobile: fully stacked layout with touch-friendly cells.
- localStorage persistence for all notes.

## Architecture

- Calendar logic hook: `src/hooks/useCalendar.ts`
- Weather logic hook: `src/hooks/useWeather.ts`
- Theme mapping: `src/lib/weatherTheme.ts`
- Date utilities: `src/lib/date.ts`
- UI components:
  - `src/components/HeroImage.tsx`
  - `src/components/CalendarGrid.tsx`
  - `src/components/CalendarDay.tsx`
  - `src/components/NotesPanel.tsx`

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind v4 (base setup) + custom CSS for the visual design

## Run Locally

1. Install dependencies:

   ```bash
   npm install
    ```
    

2. Start development server:

   ```bash
   npm run dev
   ```

3. Open in browser:

   ```
   http://localhost:3000
   ```

## Available Scripts

* `npm run dev`: start local dev server
* `npm run lint`: run ESLint
* `npm run build`: production build
* `npm run start`: run production server

## UX Notes

* Clicking a day when no range exists sets the start day.
* Clicking a second day sets the end day.
* Clicking again after a completed range starts a new range.
* If the second click is earlier than the start, dates are auto-swapped.
* Day note editor is enabled when a day has been selected.
* Range note editor is enabled when both start and end are selected.
* Month/day/range notes persist via localStorage.

## Submission Checklist

Replace these placeholders before submitting:

* Repository URL: ADD_YOUR_GITHUB_OR_GITLAB_LINK
* Demo Video URL (Required): ADD_LOOM_OR_YOUTUBE_LINK
* Live Demo URL (Optional): ADD_VERCEL_OR_NETLIFY_LINK

## Suggested Demo Flow

1. Show desktop layout and month navigation.
2. Select a start and end date.
3. Enter and reload notes to prove localStorage persistence.
4. Resize to mobile and demonstrate touch-friendly interactions.

---

## 📦 Submission Guidelines

To evaluate your work efficiently, please provide the following:

* **Source Code:** A link to your public GitHub/GitLab repository containing the project. Include a brief README explaining your choices and how to run the project locally.
* **Video Demonstration (Required):** Attach a short screen recording (or a link to a Loom/YouTube video) walking through the functioning component. Be sure to demonstrate the day range selection, the notes feature, and how the component responds to mobile and desktop screen sizes.
* **Live Demo (Optional but Recommended):** A link to a deployed version of your component (Vercel, Netlify, GitHub Pages, etc.).

## Live Demo

[https://interactivecalendar-kohl.vercel.app](https://interactivecalendar-kohl.vercel.app)
