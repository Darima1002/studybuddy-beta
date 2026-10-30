<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Auth: Lovable Cloud email/password via `@/integrations/supabase/client`. Protected pages live under `src/routes/_authenticated/`; the pathless `route.tsx` gate (`ssr: false`, `supabase.auth.getUser()`, redirect to `/auth`) is the only auth guard — child routes add no auth code.
- Data: all course/assignment database calls, validation and the dashboard filter live in `src/lib/studybuddy.ts` (browser Supabase client, RLS-enforced) — keeps pages thin and rules unit-testable in `src/test/studybuddy-rules.test.ts`.
- Ownership: `courses` and `assignments` carry `user_id default auth.uid()` with owner-only RLS; assignments reference `courses(id, user_id)` with cascade — so an assignment can never belong to another user's course.
