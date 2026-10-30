# StudyBuddy Architecture (Beta 1)

## Main screens

| Screen | URL | File | Signed-in only? |
|--------|-----|------|-----------------|
| Welcome | `/` | `src/routes/index.tsx` | No |
| Sign in / Register | `/auth` | `src/routes/auth.tsx` | No |
| Dashboard (upcoming deadlines) | `/dashboard` | `src/routes/_authenticated/dashboard.tsx` | Yes |
| Courses | `/courses` | `src/routes/_authenticated/courses.tsx` | Yes |
| Assignments (list + form) | `/assignments` | `src/routes/_authenticated/assignments.tsx` | Yes |

TanStack Router turns each file in `src/routes` into a page. Files inside the
`_authenticated` folder share one "gate" (`src/routes/_authenticated/route.tsx`).

## Authentication

- Supabase Auth stores accounts and passwords. Our code never stores passwords.
- `auth.tsx` calls `supabase.auth.signUp` (register) or
  `supabase.auth.signInWithPassword` (sign in). Errors from Supabase (e.g.
  "Invalid login credentials") are shown on the page.
- The session (a signed token) is kept in the browser by the Supabase client.
- `_authenticated/route.tsx` runs `supabase.auth.getUser()` before any protected
  page loads; with no user, it redirects to `/auth`.
- `src/components/AppShell.tsx` has the **Sign out** button: it clears cached
  data, calls `supabase.auth.signOut()` and goes to `/auth`.
- `src/routes/__root.tsx` listens for sign-in/sign-out and re-checks the gate.

## Database relationships

```text
auth.users (Supabase)  1 ──< courses  1 ──< assignments
                         user_id         (course_id, user_id)
```

- `courses`: `id`, `user_id`, `name` (required, 1–100 chars), `created_at`.
- `assignments`: `id`, `user_id`, `course_id`, `title` (required, 1–200 chars),
  `due_date` (date), `status` (`not_started` | `in_progress` | `completed`), `created_at`.
- `assignments (course_id, user_id)` references `courses (id, user_id)` with
  `ON DELETE CASCADE`: deleting a course deletes its assignments, and an
  assignment can never point at someone else's course.
- `user_id` defaults to `auth.uid()`, so the app never has to send it.

Defined in `drizzle/migrations/0000_create_courses_assignments.sql`.

## How ownership is enforced

Row Level Security (RLS) is enabled on both tables. Each has four policies
(select / insert / update / delete) that only allow rows where
`auth.uid() = user_id`. `auth.uid()` comes from the signed token, so it can't be
faked from the browser. Signed-out visitors (`anon`) have no access at all.
This is enforced by the database itself, even if someone bypasses our UI.

## Data flow

```text
Button click → page function (e.g. handleAdd)
  → validation helper in src/lib/studybuddy.ts (shows error if invalid)
  → database helper (e.g. addCourse) → Supabase client → Postgres (RLS checks owner)
  → queryClient.invalidateQueries(...) → TanStack Query re-fetches → list re-renders
  → success / error message shown
```

Courses and assignments are cached under the query keys `["courses"]` and
`["assignments"]`. The dashboard and assignments page share `["assignments"]`.

## Important files

| File | Responsibility |
|------|----------------|
| `src/lib/studybuddy.ts` | Types, status labels, validation, dashboard filter/sort, all database calls |
| `src/components/AppShell.tsx` | Top navigation, signed-in email, Sign out, shared button styles |
| `src/routes/auth.tsx` | Sign in and Register form |
| `src/routes/_authenticated/route.tsx` | Gate protecting signed-in pages |
| `src/routes/_authenticated/dashboard.tsx` | Upcoming deadlines |
| `src/routes/_authenticated/courses.tsx` | Course list, add, rename, delete |
| `src/routes/_authenticated/assignments.tsx` | Assignment form and full list |
| `src/routes/__root.tsx` | Page shell, error/404 pages, auth change listener |
| `src/integrations/supabase/*` | Generated Supabase client and types (do not edit) |
| `drizzle/migrations/*.sql` | Database tables and security policies |
| `src/test/*.test.ts(x)` | Automated tests |
