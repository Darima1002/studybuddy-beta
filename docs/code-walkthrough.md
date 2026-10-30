# Code Walkthrough Guide (Beta 1)

Suggested order: one presenter per screen. Open the files listed, explain the
functions, then trace one action end to end.

## 1. Sign In and Registration

Open: `src/routes/auth.tsx`, `src/lib/studybuddy.ts` (`validateCredentials`),
`src/routes/_authenticated/route.tsx`, `src/components/AppShell.tsx` (`handleLogout`).

- `mode` state switches between "signin" and "register".
- `handleSubmit` → `validateCredentials` (empty email, bad email, empty password,
  short password) → `supabase.auth.signInWithPassword` or `supabase.auth.signUp`.
- Supabase errors are put into `error` state and shown in the red box.
- On success, `navigate({ to: "/dashboard" })`. The `_authenticated` gate runs
  `supabase.auth.getUser()` and lets the user in.

**Trace:** click Sign in → `handleSubmit` → Supabase Auth checks password →
session saved in browser → navigate → gate → dashboard shows email.

## 2. Courses List

Open: `src/routes/_authenticated/courses.tsx`; in `studybuddy.ts`:
`fetchCourses`, `addCourse`, `renameCourse`, `deleteCourse`, `validateCourseName`.

- `useQuery({ queryKey: ["courses"], queryFn: fetchCourses })` loads the list
  (shows "Loading courses…", errors, or the empty message).
- `run(action, success)` is a small wrapper: run the database action, refresh
  queries, show a success or error message.
- `handleDelete` uses `window.confirm` and explains that assignments are deleted
  too. The database cascade does the actual assignment deletion.
- `CourseRow` switches between view mode and rename mode.

**Trace:** type a name → Add course → `handleAdd` → `validateCourseName` →
`addCourse` → `supabase.from("courses").insert(...)` → RLS checks
`auth.uid() = user_id` → `invalidateQueries(["courses"])` → list re-renders.

## 3. Assignment List and Form

Open: `src/routes/_authenticated/assignments.tsx`; in `studybuddy.ts`:
`fetchAssignments`, `saveAssignment`, `deleteAssignment`, `validateAssignment`, `isOverdue`.

- One form is used for both adding and editing: `editingId` is `null` when adding.
- `startEdit` copies an assignment into the form.
- `saveAssignment` does `insert` or `update` depending on `id`.
- The full list includes completed and overdue items; overdue unfinished items
  show a red "Overdue" label.
- `fetchAssignments` uses `courses(name)` to get the course name in the same query.

**Trace:** change status to Completed → Save changes → `handleSubmit` →
`validateAssignment` → `saveAssignment(form, id)` → database update (RLS) →
`invalidateQueries(["assignments"])` → this list and the dashboard refresh.

## 4. Dashboard with Upcoming Deadlines

Open: `src/routes/_authenticated/dashboard.tsx`; in `studybuddy.ts`:
`upcomingAssignments`, `todayString`, `formatDate`.

- Loads the same `["assignments"]` query as the Assignments page.
- `upcomingAssignments(list, today)` keeps items that are not completed and due
  today or later, then sorts by due date (earliest first).
- Shows title, course, due date, status, plus links to Courses and Assignments.
- Tested in `src/test/studybuddy-rules.test.ts`.

## Security recap

Open `drizzle/migrations/0000_create_courses_assignments.sql` and point out:
`ENABLE ROW LEVEL SECURITY`, the four `auth.uid() = user_id` policies per table,
and the composite foreign key with `ON DELETE CASCADE`.

## Git and GitHub recap

- **Git** records snapshots of the code called **commits**.
- **GitHub** hosts the repository online so the team can share it.
- A **branch** is a separate line of work; `main` is the main branch.
- A **pull request** asks to merge a branch into `main` and lets teammates review.
- A **release tag** (e.g. `v0.1.0-beta.1`) marks a specific commit as a release.

### Our actual history

At the time of writing, the repository has a single `main` line of commits
(e.g. "Add project README", "Improve login error handling and loading
recovery", "Create manual testing log for StudyBuddy", "Add interactive study
checklist", "Fixed duplicate JSX error"). Many commits were made through the
Lovable editor ("Changes", "Work in progress"). We found no pull requests or
release tags in the history available to us. Use `git log` and the GitHub
"Insights → Contributors" page to show who made each commit — do not rely on
this document for attribution.
