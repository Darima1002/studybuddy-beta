import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { validateCredentials } from "@/lib/studybuddy";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in or register — StudyBuddy" },
      {
        name: "description",
        content: "Sign in to StudyBuddy or create a new account with your email and password.",
      },
      { property: "og:title", content: "Sign in or register — StudyBuddy" },
      {
        property: "og:description",
        content: "Sign in to StudyBuddy or create a new account with your email and password.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setNotice(null);

    const problem = validateCredentials(email, password, mode);
    if (problem) return setError(problem);

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (loginError) return setError(loginError.message);
        await navigate({ to: "/dashboard" });
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (signUpError) return setError(signUpError.message);
        if (data.session) {
          await navigate({ to: "/dashboard" });
        } else {
          // Email confirmation is on: the user must click the link in their inbox first.
          setNotice(
            "Account created! Check your email and click the confirmation link, then sign in.",
          );
          setMode("signin");
          setPassword("");
        }
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isSignIn = mode === "signin";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-primary">StudyBuddy</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {isSignIn ? "Sign in to continue" : "Create your account"}
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-card-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-card-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isSignIn ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Please wait…" : isSignIn ? "Sign in" : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignIn ? "New to StudyBuddy?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="font-medium text-primary underline"
            onClick={() => {
              setMode(isSignIn ? "register" : "signin");
              setError(null);
              setNotice(null);
            }}
          >
            {isSignIn ? "Register" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
