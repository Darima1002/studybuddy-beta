// Shared page frame for signed-in pages: top bar with navigation,
// the signed-in email, and the Sign out button.
import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function AppShell({
  email,
  title,
  children,
}: {
  email?: string | undefined;
  title: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleLogout() {
    await queryClient.cancelQueries();
    queryClient.clear(); // forget this user's cached data
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const linkClass =
    "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground";
  const activeClass =
    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 py-3">
          <span className="mr-4 text-lg font-bold text-primary">StudyBuddy</span>
          <nav className="flex flex-wrap gap-1">
            <Link to="/dashboard" className={linkClass} activeProps={{ className: activeClass }}>
              Dashboard
            </Link>
            <Link to="/courses" className={linkClass} activeProps={{ className: activeClass }}>
              Courses
            </Link>
            <Link to="/assignments" className={linkClass} activeProps={{ className: activeClass }}>
              Assignments
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {email && (
              <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
            )}
            <button
              onClick={handleLogout}
              className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-foreground">{title}</h1>
        {children}
      </main>
    </div>
  );
}

export function StatusBadge({ status, label }: { status: string; label: string }) {
  const styles: Record<string, string> = {
    not_started: "bg-muted text-muted-foreground",
    in_progress: "bg-secondary text-secondary-foreground",
    completed: "bg-primary/15 text-primary",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}>
      {label}
    </span>
  );
}

export const inputClass =
  "w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
export const primaryButton =
  "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50";
export const secondaryButton =
  "rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-50";
export const dangerButton =
  "rounded-md border border-destructive/40 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50";
