# StudyBuddy Beta 1

**Version:** v0.1.0-beta.1 (pre-release)

## Implemented

- Register, sign in, sign out with email and password (Supabase Auth), with
  clear validation and sign-in error messages.
- Signed-in-only pages: Dashboard, Courses, Assignments.
- Courses: add, rename, delete (with confirmation explaining that the course's
  assignments are deleted too).
- Assignments: add, edit, delete with title, course, due date and status
  (Not Started / In Progress / Completed); required fields validated; overdue
  unfinished items stay in the full list, marked "Overdue".
- Dashboard: unfinished assignments due today or later, earliest first.
- Data saved in the database, protected by Row Level Security so each
  account only accesses its own records.
- Loading messages, empty states, save confirmations and delete confirmations.
- Removed the earlier "My Study Tasks" checklist, which saved only in the
  browser and was outside the agreed scope.

## Setup / access

See `README.md` → Setup. Open the app, click **Sign in or register**, create an
account and confirm it via email.

## Verification

- Automated tests: 13/13 passed.
- Type check: passed. Lint: only formatting issues in generated/template files.
- Browser workflow (sign in → create course → create assignments → dashboard →
  change status → edit/delete → sign out): passed.
- Database blocks signed-out reads and writes for other users: passed.
- Not run: new-account registration end to end, second-account isolation in the
  browser, sign-out/sign-in persistence, phone layout. See `testing.md`.

## Known bugs and unfinished work

- New accounts need email confirmation before sign-in.
- No password reset page.
- Harmless router warning in the browser console when signed-out users are redirected.
- Plain browser confirm dialogs for deletes.
