import { useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { validateCredentials } from "@/lib/studybuddy";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in or register — StudyBuddy" },
      {
        name: "description",
        content:
          "Sign in to StudyBuddy or create a new account with your email, Google, Microsoft, or Apple.",
      },
      { property: "og:title", content: "Sign in or register — StudyBuddy" },
      {
        property: "og:description",
        content:
          "Sign in to StudyBuddy or create a new account with your email, Google, Microsoft, or Apple.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Mode = "signin" | "register";
type Provider = "google" | "azure" | "apple";

const YEAR_OPTIONS = [
  "High school",
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "Graduate student",
  "Other",
];

const inputClass =
  "mt-1 w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring";

function passwordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Too weak", "Weak", "Okay", "Good", "Strong"];
  return { score, label: password ? (labels[score] ?? "") : "" };
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.88-3c-1.07.72-2.45 1.15-4.05 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.29A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.57.39-2.29v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l4.01-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.61l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
      <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
      <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
      <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
    </svg>
  );
}

function Field({
  id,
  label,
  optional,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-card-foreground">
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<Provider | null>(null);

  const isSignIn = mode === "signin";
  const strength = passwordStrength(password);
  const busy = loading || oauthLoading !== null;

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
    setPassword("");
    setConfirmPassword("");
  }

  function validateRegistration(): string | null {
    if (!firstName.trim()) return "First name is required.";
    if (!lastName.trim()) return "Last name is required.";
    if (!school.trim()) return "Please tell us where you study.";
    if (!yearLevel) return "Please choose your year or level.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords don't match.";
    if (!agreed) return "Please agree to the terms to create an account.";
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setNotice(null);

    const problem =
      validateCredentials(email, password, mode) ?? (isSignIn ? null : validateRegistration());
    if (problem) return setError(problem);

    setLoading(true);
    try {
      if (isSignIn) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (loginError) return setError(loginError.message);
        await navigate({ to: "/dashboard" });
      } else {
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            // Saved on the user's auth record as user_metadata.
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              full_name: fullName,
              school: school.trim(),
              major: major.trim() || null,
              year_level: yearLevel,
            },
          },
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
          setConfirmPassword("");
        }
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: Provider) {
    if (busy) return;
    setError(null);
    setNotice(null);
    setOauthLoading(provider);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      // On success the browser leaves for the provider, so there is nothing else to do.
      if (oauthError) {
        setError(oauthError.message);
        setOauthLoading(null);
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
      setOauthLoading(null);
    }
  }

  const providers: { id: Provider; label: string; icon: ReactNode }[] = [
    { id: "google", label: "Google", icon: <GoogleIcon /> },
    { id: "azure", label: "Microsoft", icon: <MicrosoftIcon /> },
    { id: "apple", label: "Apple", icon: <AppleIcon /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Form panel */}
      <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-primary">StudyBuddy</h1>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold text-card-foreground">
              {isSignIn ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignIn
                ? "Sign in to pick up where you left off."
                : "Tell us a little about yourself to get started."}
            </p>

            {/* Mode tabs */}
            <div
              role="tablist"
              aria-label="Sign in or register"
              className="mt-6 grid grid-cols-2 rounded-lg bg-muted p-1"
            >
              {(["signin", "register"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    mode === m
                      ? "bg-card text-card-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "signin" ? "Sign in" : "Register"}
                </button>
              ))}
            </div>

            {/* SSO */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {providers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleOAuth(p.id)}
                  disabled={busy}
                  aria-label={`${isSignIn ? "Sign in" : "Sign up"} with ${p.label}`}
                  className="flex items-center justify-center gap-2 rounded-md border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
                >
                  {oauthLoading === p.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : (
                    p.icon
                  )}
                  <span className="hidden sm:inline">{p.label}</span>
                </button>
              ))}
            </div>

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or continue with email
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {!isSignIn && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field id="firstName" label="First name">
                      <input
                        id="firstName"
                        type="text"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={inputClass}
                        placeholder="Alex"
                      />
                    </Field>
                    <Field id="lastName" label="Last name">
                      <input
                        id="lastName"
                        type="text"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={inputClass}
                        placeholder="Rivera"
                      />
                    </Field>
                  </div>
                </>
              )}

              <Field id="email" label="Email">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </Field>

              {!isSignIn && (
                <>
                  <Field id="school" label="School or university">
                    <input
                      id="school"
                      type="text"
                      autoComplete="organization"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      className={inputClass}
                      placeholder="Northwestern University"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field id="yearLevel" label="Year or level">
                      <select
                        id="yearLevel"
                        value={yearLevel}
                        onChange={(e) => setYearLevel(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select…</option>
                        {YEAR_OPTIONS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field id="major" label="Major" optional>
                      <input
                        id="major"
                        type="text"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        className={inputClass}
                        placeholder="Biology"
                      />
                    </Field>
                  </div>
                </>
              )}

              <Field id="password" label="Password">
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignIn ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-11`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 mt-1 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {!isSignIn && password && (
                  <div className="mt-2" aria-live="polite">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <span
                          key={i}
                          className={`h-1.5 flex-1 rounded-full ${
                            i <= strength.score
                              ? strength.score <= 1
                                ? "bg-destructive"
                                : "bg-primary"
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {strength.label}. Use 8+ characters with upper and lower case letters,
                      numbers, and symbols.
                    </p>
                  </div>
                )}
              </Field>

              {!isSignIn && (
                <>
                  <Field id="confirmPassword" label="Confirm password">
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputClass}
                      placeholder="••••••••"
                    />
                  </Field>

                  <label className="flex items-start gap-3 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border accent-[var(--primary)]"
                    />
                    <span>I agree to StudyBuddy's terms of service and privacy policy.</span>
                  </label>
                </>
              )}

              {error && (
                <p
                  role="alert"
                  className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
              {notice && (
                <p
                  role="status"
                  className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary"
                >
                  {notice}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {loading ? "Please wait…" : isSignIn ? "Sign in" : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isSignIn ? "New to StudyBuddy?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="font-medium text-primary underline"
                onClick={() => switchMode(isSignIn ? "register" : "signin")}
              >
                {isSignIn ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
