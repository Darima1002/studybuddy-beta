# StudyBuddy

StudyBuddy is a student course, assignment and deadline manager. This is the
**Beta 1 (v0.1.0-beta.1)** release prepared for the capstone code walkthrough.

## Beta scope

- Register, sign in and sign out with email and password.
- Courses: list, add, rename, delete (deleting a course deletes its assignments).
- Assignments: list, add, edit, delete. Each has a title, course, due date and
  status (Not Started, In Progress, Completed).
- Dashboard: unfinished assignments due today or later, earliest first.
- Every account only sees its own data (database Row Level Security).

Out of scope: study groups, chat, reminders, AI features, integrations.

## Technology stack

| Part | What we use |
|------|-------------|
| Language | TypeScript |
| UI | React 19, Tailwind CSS v4 |
| Framework / routing | TanStack Start v1 + TanStack Router (file-based routes in `src/routes`) |
| Data fetching / cache | TanStack Query |
| Build tool | Vite 7 |
| Auth + database | Supabase (Auth + Postgres with Row Level Security), provided through Lovable Cloud |
| Tests | Vitest + jsdom |
| Package manager | Bun (npm also works) |

## Setup

Requirements: Node 20+ and [Bun](https://bun.sh) (or npm).

```bash
git clone <your-github-repo-url>
cd <repo-folder>
bun install          # or: npm install
```

### Environment variables

Create a `.env` file in the project root (Lovable creates this automatically).
These are **public** values; never put a service-role key here.

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_your_key"
VITE_SUPABASE_PROJECT_ID="your-project-id"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_your_key"
SUPABASE_PROJECT_ID="your-project-id"
```

### Database setup

The schema and security policies live in
`drizzle/migrations/0000_create_courses_assignments.sql`.

- **In Lovable:** already applied to the project's Lovable Cloud database.
- **On your own Supabase project:** open the SQL editor and run the contents of
  that file once, or run it with `psql "$DATABASE_URL" -f drizzle/migrations/0000_create_courses_assignments.sql`.
  Email/password sign-in must be enabled in Supabase Auth.

## Running

```bash
bun run dev      # start the app at http://localhost:8080 (port may differ)
bun run test     # run the automated tests (Vitest)
bun run build    # production build
bun run lint     # ESLint + Prettier checks
```

## Creating a test account

Click **Register** on the sign-in page, enter an email you can read and a
password of at least 6 characters, then click the confirmation link in the
email before signing in. In Lovable you can also add a user from the Cloud →
Users panel.

## Completed features

See `RELEASE_NOTES.md` and `testing.md` for the verified list.

## Known limitations

- Registering requires email confirmation, so a new account can't sign in until the link is clicked.
- No password reset ("forgot password") page yet.
- Deletes use the browser's built-in confirm box (simple, but plain-looking).
- Dates have no time of day; "today" uses the student's computer time zone.
- When a signed-out user opens a protected page, the browser console logs a
  harmless router warning while redirecting to sign in.
- Linting reports formatting-only (Prettier) issues in generated/template files
  that we did not write (`src/components/ui/*`, `src/integrations/supabase/*`).

More detail: `docs/architecture.md`, `docs/code-walkthrough.md`.
