import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, StatusBadge } from "@/components/AppShell";
import {
  fetchAssignments,
  formatDate,
  friendlyError,
  STATUS_LABELS,
  todayString,
  upcomingAssignments,
} from "@/lib/studybuddy";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — StudyBuddy" },
      { name: "description", content: "Your upcoming StudyBuddy deadlines." },
    ],
  }),
});

// Lets us read the "user" returned by the parent _authenticated gate.
const parentRoute = getRouteApi("/_authenticated");

function Dashboard() {
  const { user } = parentRoute.useRouteContext();
  // Same query key as the Assignments page, so both share one cached list.
  const { data, isLoading, error } = useQuery({
    queryKey: ["assignments"],
    queryFn: fetchAssignments,
  });
  const upcoming = upcomingAssignments(data ?? [], todayString());

  return (
    <AppShell email={user.email} title="Upcoming deadlines">
      <p className="mb-4 text-sm text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{user.email}</span>. Unfinished
        assignments due today or later, earliest first.
      </p>

      {isLoading && <p className="text-sm text-muted-foreground">Loading deadlines…</p>}
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {friendlyError(error)}
        </p>
      )}

      {!isLoading && !error && upcoming.length === 0 && (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-card-foreground">No upcoming deadlines. 🎉</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a{" "}
            <Link to="/courses" className="text-primary underline">
              course
            </Link>{" "}
            and then an{" "}
            <Link to="/assignments" className="text-primary underline">
              assignment
            </Link>{" "}
            to see it here.
          </p>
        </div>
      )}

      {upcoming.length > 0 && (
        <ul className="space-y-2">
          {upcoming.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-card-foreground">{a.title}</p>
                <p className="text-sm text-muted-foreground">{a.courses?.name}</p>
              </div>
              <span className="text-sm text-card-foreground">{formatDate(a.due_date)}</span>
              <StatusBadge status={a.status} label={STATUS_LABELS[a.status]} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex gap-3">
        <Link
          to="/courses"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Manage courses
        </Link>
        <Link
          to="/assignments"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Manage assignments
        </Link>
      </div>
    </AppShell>
  );
}
