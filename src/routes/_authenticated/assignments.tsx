import { useState } from "react";
import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, StatusBadge, dangerButton, inputClass, primaryButton, secondaryButton } from "@/components/AppShell";
import {
  deleteAssignment, fetchAssignments, fetchCourses, formatDate, friendlyError, isOverdue,
  saveAssignment, STATUS_LABELS, todayString, validateAssignment,
  type Assignment, type AssignmentForm, type Status,
} from "@/lib/studybuddy";

export const Route = createFileRoute("/_authenticated/assignments")({
  component: AssignmentsPage,
  head: () => ({
    meta: [
      { title: "Assignments — StudyBuddy" },
      { name: "description", content: "Add, edit and delete your StudyBuddy assignments." },
    ],
  }),
});

const parentRoute = getRouteApi("/_authenticated");
const emptyForm: AssignmentForm = { title: "", course_id: "", due_date: "", status: "not_started" };

function AssignmentsPage() {
  const { user } = parentRoute.useRouteContext();
  const queryClient = useQueryClient();
  const assignmentsQuery = useQuery({ queryKey: ["assignments"], queryFn: fetchAssignments });
  const coursesQuery = useQuery({ queryKey: ["courses"], queryFn: fetchCourses });

  const [form, setForm] = useState<AssignmentForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null); // null = adding new
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const today = todayString();

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      await queryClient.invalidateQueries({ queryKey: ["assignments"] });
      setMessage({ kind: "ok", text: success });
      return true;
    } catch (err) {
      setMessage({ kind: "error", text: friendlyError(err) });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validateAssignment(form);
    if (problem) return setMessage({ kind: "error", text: problem });
    const ok = await run(() => saveAssignment(form, editingId ?? undefined), editingId ? "Assignment updated." : "Assignment added.");
    if (ok) { setForm(emptyForm); setEditingId(null); }
  }

  function startEdit(a: Assignment) {
    setEditingId(a.id);
    setForm({ title: a.title, course_id: a.course_id, due_date: a.due_date, status: a.status });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(a: Assignment) {
    if (window.confirm(`Delete the assignment "${a.title}"? This cannot be undone.`)) {
      await run(() => deleteAssignment(a.id), `Assignment "${a.title}" deleted.`);
      if (editingId === a.id) { setEditingId(null); setForm(emptyForm); }
    }
  }

  const courses = coursesQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];
  const noCourses = coursesQuery.isSuccess && courses.length === 0;

  return (
    <AppShell email={user.email} title="Assignments">
      {noCourses ? (
        <p className="mb-6 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          You need a course before adding assignments. <Link to="/courses" className="text-primary underline">Add a course</Link>.
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mb-6 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2">
          <h2 className="font-semibold text-card-foreground sm:col-span-2">{editingId ? "Edit assignment" : "Add assignment"}</h2>
          <div className="sm:col-span-2">
            <label htmlFor="title" className="text-sm font-medium">Title *</label>
            <input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`${inputClass} mt-1`} />
          </div>
          <div>
            <label htmlFor="course" className="text-sm font-medium">Course *</label>
            <select id="course" value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} className={`${inputClass} mt-1`}>
              <option value="">Choose a course…</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="due" className="text-sm font-medium">Due date *</label>
            <input id="due" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={`${inputClass} mt-1`} />
          </div>
          <div>
            <label htmlFor="status" className="text-sm font-medium">Status *</label>
            <select id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })} className={`${inputClass} mt-1`}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" disabled={busy} className={primaryButton}>{editingId ? "Save changes" : "Add assignment"}</button>
            {editingId && <button type="button" className={secondaryButton} onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}
          </div>
        </form>
      )}

      {message && (
        <p role="status" className={`mb-4 rounded-md px-3 py-2 text-sm ${message.kind === "ok" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
          {message.text}
        </p>
      )}

      {assignmentsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading assignments…</p>}
      {assignmentsQuery.error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{friendlyError(assignmentsQuery.error)}</p>}
      {assignmentsQuery.isSuccess && assignments.length === 0 && (
        <p className="rounded-xl border bg-card p-6 text-center text-muted-foreground">No assignments yet.</p>
      )}

      {/* Full list: includes completed and overdue assignments. */}
      <ul className="space-y-2">
        {assignments.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-card-foreground">{a.title}</p>
              <p className="text-sm text-muted-foreground">{a.courses?.name}</p>
            </div>
            <span className="text-sm">
              {formatDate(a.due_date)}
              {isOverdue(a, today) && <span className="ml-2 font-medium text-destructive">Overdue</span>}
            </span>
            <StatusBadge status={a.status} label={STATUS_LABELS[a.status]} />
            <button className={secondaryButton} onClick={() => startEdit(a)}>Edit</button>
            <button disabled={busy} className={dangerButton} onClick={() => handleDelete(a)}>Delete</button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
