// Shared StudyBuddy data helpers.
// Every database call goes through the browser Supabase client, which sends the
// signed-in user's session. Row Level Security in the database then makes sure
// each student can only see and change their own rows.
import { supabase } from "@/integrations/supabase/client";

export type Status = "not_started" | "in_progress" | "completed";

export const STATUS_LABELS: Record<Status, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

export type Course = { id: string; name: string };

export type Assignment = {
  id: string;
  title: string;
  course_id: string;
  due_date: string; // "YYYY-MM-DD"
  status: Status;
  courses: { name: string } | null;
};

// ---------- Pure helpers (no database, easy to unit test) ----------

// Today's date as "YYYY-MM-DD" in the student's local time zone.
export function todayString(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Dashboard rule: unfinished assignments due today or later, earliest first.
export function upcomingAssignments<T extends { due_date: string; status: Status }>(
  list: T[],
  today: string,
): T[] {
  return list
    .filter((a) => a.status !== "completed" && a.due_date >= today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
}

export function isOverdue(a: { due_date: string; status: Status }, today: string): boolean {
  return a.status !== "completed" && a.due_date < today;
}

// Returns an error message, or null when the course name is OK.
export function validateCourseName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Course name is required.";
  if (trimmed.length > 100) return "Course name must be 100 characters or less.";
  return null;
}

export type AssignmentForm = { title: string; course_id: string; due_date: string; status: Status };

export function validateAssignment(form: AssignmentForm): string | null {
  if (!form.title.trim()) return "Title is required.";
  if (form.title.trim().length > 200) return "Title must be 200 characters or less.";
  if (!form.course_id) return "Please choose a course.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.due_date)) return "Due date is required.";
  if (!(form.status in STATUS_LABELS)) return "Please choose a status.";
  return null;
}

export function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------- Database calls ----------

export async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await supabase.from("courses").select("id, name").order("name");
  if (error) throw error;
  return data;
}

export async function addCourse(name: string) {
  // user_id is filled in by the database (default auth.uid()).
  const { error } = await supabase.from("courses").insert({ name: name.trim() });
  if (error) throw error;
}

export async function renameCourse(id: string, name: string) {
  const { error } = await supabase.from("courses").update({ name: name.trim() }).eq("id", id);
  if (error) throw error;
}

// Deleting a course also deletes its assignments (ON DELETE CASCADE in the database).
export async function deleteCourse(id: string) {
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchAssignments(): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from("assignments")
    .select("id, title, course_id, due_date, status, courses(name)")
    .order("due_date");
  if (error) throw error;
  return data as Assignment[];
}

export async function saveAssignment(form: AssignmentForm, id?: string) {
  const row = { ...form, title: form.title.trim() };
  const { error } = id
    ? await supabase.from("assignments").update(row).eq("id", id)
    : await supabase.from("assignments").insert(row);
  if (error) throw error;
}

export async function deleteAssignment(id: string) {
  const { error } = await supabase.from("assignments").delete().eq("id", id);
  if (error) throw error;
}

// Turns a database error into a message a student can understand.
export function friendlyError(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return `Something went wrong: ${String((err as { message: string }).message)}`;
  }
  return "Something went wrong. Please try again.";
}
