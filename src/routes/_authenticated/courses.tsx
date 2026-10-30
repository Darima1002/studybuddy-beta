import { useState } from "react";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AppShell,
  dangerButton,
  inputClass,
  primaryButton,
  secondaryButton,
} from "@/components/AppShell";
import {
  addCourse,
  deleteCourse,
  fetchCourses,
  friendlyError,
  renameCourse,
  validateCourseName,
  type Course,
} from "@/lib/studybuddy";

export const Route = createFileRoute("/_authenticated/courses")({
  component: CoursesPage,
  head: () => ({
    meta: [
      { title: "Courses — StudyBuddy" },
      { name: "description", content: "Add, rename and delete your StudyBuddy courses." },
    ],
  }),
});

const parentRoute = getRouteApi("/_authenticated");

function CoursesPage() {
  const { user } = parentRoute.useRouteContext();
  const queryClient = useQueryClient();
  const {
    data: courses,
    isLoading,
    error,
  } = useQuery({ queryKey: ["courses"], queryFn: fetchCourses });

  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Reload courses and assignments from the database after any change.
  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["courses"] });
    await queryClient.invalidateQueries({ queryKey: ["assignments"] });
  }

  // Small wrapper: runs a database action, then shows success or error.
  async function run(action: () => Promise<void>, success: string) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      await refresh();
      setMessage({ kind: "ok", text: success });
    } catch (err) {
      setMessage({ kind: "error", text: friendlyError(err) });
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const problem = validateCourseName(newName);
    if (problem) return setMessage({ kind: "error", text: problem });
    await run(() => addCourse(newName), `Course "${newName.trim()}" added.`);
    setNewName("");
  }

  async function handleDelete(course: Course) {
    const ok = window.confirm(
      `Delete "${course.name}"?\n\nThis also permanently deletes every assignment in this course.`,
    );
    if (ok)
      await run(
        () => deleteCourse(course.id),
        `Course "${course.name}" and its assignments were deleted.`,
      );
  }

  return (
    <AppShell email={user.email} title="Courses">
      <form
        onSubmit={handleAdd}
        className="mb-6 flex flex-wrap gap-2 rounded-xl border bg-card p-4"
      >
        <label htmlFor="new-course" className="sr-only">
          New course name
        </label>
        <input
          id="new-course"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New course name, e.g. Biology 101"
          className={`${inputClass} flex-1`}
        />
        <button type="submit" disabled={busy} className={primaryButton}>
          Add course
        </button>
      </form>

      {message && (
        <p
          role="status"
          className={`mb-4 rounded-md px-3 py-2 text-sm ${message.kind === "ok" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}
        >
          {message.text}
        </p>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading courses…</p>}
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {friendlyError(error)}
        </p>
      )}
      {courses && courses.length === 0 && (
        <p className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
          No courses yet. Add your first course above.
        </p>
      )}

      <ul className="space-y-2">
        {courses?.map((c) => (
          <CourseRow
            key={c.id}
            course={c}
            busy={busy}
            onRename={(name) => {
              const problem = validateCourseName(name);
              if (problem) {
                setMessage({ kind: "error", text: problem });
                return Promise.resolve(false);
              }
              return run(() => renameCourse(c.id, name), "Course renamed.").then(() => true);
            }}
            onDelete={() => handleDelete(c)}
          />
        ))}
      </ul>
    </AppShell>
  );
}

function CourseRow({
  course,
  busy,
  onRename,
  onDelete,
}: {
  course: Course;
  busy: boolean;
  onRename: (name: string) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(course.name);

  if (editing) {
    return (
      <li className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <label htmlFor={`rename-${course.id}`} className="sr-only">
          Course name
        </label>
        <input
          id={`rename-${course.id}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${inputClass} flex-1`}
          autoFocus
        />
        <button
          disabled={busy}
          className={primaryButton}
          onClick={async () => {
            if (await onRename(name)) setEditing(false);
          }}
        >
          Save
        </button>
        <button
          className={secondaryButton}
          onClick={() => {
            setName(course.name);
            setEditing(false);
          }}
        >
          Cancel
        </button>
      </li>
    );
  }
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
      <span className="flex-1 font-medium text-card-foreground">{course.name}</span>
      <button className={secondaryButton} onClick={() => setEditing(true)}>
        Rename
      </button>
      <button disabled={busy} className={dangerButton} onClick={onDelete}>
        Delete
      </button>
    </li>
  );
}
