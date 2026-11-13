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
  const today = todayString();
const upcoming = upcomingAssignments(data ?? [], today);

const upcomingCount = upcoming.length;
const dueTodayCount = upcoming.filter(
  (assignment) => assignment.due_date === today
).length;
const overdueCount = (data ?? []).filter(
  (assignment) =>
    assignment.due_date < today &&
    assignment.status !== "completed"
).length;
  const totalAssignments = (data ?? []).length;

const completedAssignments = (data ?? []).filter(
  (assignment) => assignment.status === "completed"
).length;

const completionPercentage =
  totalAssignments > 0
    ? Math.round((completedAssignments / totalAssignments) * 100)
    : 0;
  return (
    <AppShell email={user.email} title="Upcoming deadlines">
      <p className="mb-4 text-sm text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{user.email}</span>. Unfinished
        assignments due today or later, earliest first.
      </p>

{!isLoading && !error && (
  <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">
        Upcoming assignments
      </p>
      <p className="mt-2 text-3xl font-bold text-card-foreground">
        {upcomingCount}
      </p>
    </div>

    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">
        Due today
      </p>
      <p className="mt-2 text-3xl font-bold text-card-foreground">
        {dueTodayCount}
      </p>
    </div>
    <div className="rounded-xl border bg-card p-5">
  <p className="text-sm text-muted-foreground">
    Overdue assignments
  </p>
  <p className="mt-2 text-3xl font-bold text-red-600">
    {overdueCount}
  </p>
</div>
  </div>
)}
{!isLoading && !error && (
  <div className="mb-6 rounded-xl border bg-card p-5">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-card-foreground">
        Assignment Progress
      </h2>
      <span className="font-bold text-green-600">
        {completionPercentage}%
      </span>
    </div>

    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-green-600 transition-all duration-300"
        style={{ width: `${completionPercentage}%` }}
      />
    </div>

    <p className="mt-3 text-sm text-muted-foreground">
      {completedAssignments} of {totalAssignments} assignments completed
    </p>
  </div>
)}
      {!isLoading && !error && (
  <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">

    {/* Overdue Assignments */}
    <div className="rounded-xl border bg-card p-5">
      <h2 className="mb-4 text-lg font-semibold text-red-600">
        Overdue Assignments
      </h2>

      {(data ?? [])
        .filter(
          (a) =>
            a.due_date < today &&
            a.status !== "completed"
        )
        .map((a) => (
          <div key={a.id} className="mb-3 border-b pb-3">
            <p className="font-medium">{a.title}</p>
            <p className="text-sm text-muted-foreground">
              {a.courses?.name} — {formatDate(a.due_date)}
            </p>
          </div>
        ))}

      {overdueCount === 0 && (
        <p className="text-sm text-muted-foreground">
          No overdue assignments!
        </p>
      )}
    </div>

    {/* Completed Assignments */}
    <div className="rounded-xl border bg-card p-5">
      <h2 className="mb-4 text-lg font-semibold text-green-600">
        Completed Assignments
      </h2>

      {(data ?? [])
        .filter((a) => a.status === "completed")
        .map((a) => (
          <div key={a.id} className="mb-3 border-b pb-3">
            <p className="font-medium">{a.title}</p>
            <p className="text-sm text-muted-foreground">
              {a.courses?.name} — {formatDate(a.due_date)}
            </p>
          </div>
        ))}

      {completedAssignments === 0 && (
        <p className="text-sm text-muted-foreground">
          No completed assignments yet.
        </p>
      )}
    </div>

  </div>
)}
      
<div className="mb-6 flex flex-wrap gap-3">
  <Link
    to="/courses"
    className="rounded-lg border bg-card px-5 py-3 text-sm font-semibold hover:bg-muted"
  >
    Manage Courses
  </Link>

  <Link
    to="/assignments"
    className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
  >
    + Add / Manage Assignments
  </Link>
</div>

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

    </AppShell>
  );
}
