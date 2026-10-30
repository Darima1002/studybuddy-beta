import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "StudyBuddy" },
      { name: "description", content: "StudyBuddy — manage your courses, assignments and deadlines." },
      { property: "og:title", content: "StudyBuddy" },
      { property: "og:description", content: "StudyBuddy — manage your courses, assignments and deadlines." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-card-foreground">StudyBuddy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
  Welcome to StudyBuddy! Organize your studies,
  manage assignments, and stay focused on your goals.
</p>
<p className="mt-3 text-sm text-muted-foreground">
  Your personal study companion for better productivity.
</p>
        <Link
          to="/auth"
          className="mt-6 inline-block w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Sign in or register
        </Link>
      </div>
    </div>
  );
}
