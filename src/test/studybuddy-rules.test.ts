import { describe, expect, it } from "vitest";
import {
  upcomingAssignments,
  isOverdue,
  validateCourseName,
  validateAssignment,
  validateCredentials,
  type Status,
} from "@/lib/studybuddy";

const a = (id: string, due_date: string, status: Status) => ({ id, due_date, status });

describe("dashboard upcoming list", () => {
  const today = "2026-10-30";
  const list = [
    a("late", "2026-11-05", "in_progress"),
    a("done", "2026-11-01", "completed"),
    a("past", "2026-10-29", "not_started"),
    a("today", "2026-10-30", "not_started"),
    a("soon", "2026-11-01", "not_started"),
  ];
  it("keeps only unfinished assignments due today or later, earliest first", () => {
    expect(upcomingAssignments(list, today).map((x) => x.id)).toEqual(["today", "soon", "late"]);
  });
  it("hides completed assignments", () => {
    expect(upcomingAssignments(list, today).some((x) => x.id === "done")).toBe(false);
  });
  it("marks unfinished past-due assignments overdue", () => {
    expect(isOverdue(list[2]!, today)).toBe(true);
    expect(isOverdue(a("x", "2026-10-01", "completed"), today)).toBe(false);
  });
});

describe("validation", () => {
  it("requires a course name", () => {
    expect(validateCourseName("   ")).toBe("Course name is required.");
    expect(validateCourseName("Biology")).toBeNull();
  });
  it("requires assignment title, course and due date", () => {
    const ok = {
      title: "Essay",
      course_id: "c1",
      due_date: "2026-11-01",
      status: "not_started" as Status,
    };
    expect(validateAssignment(ok)).toBeNull();
    expect(validateAssignment({ ...ok, title: "" })).toBe("Title is required.");
    expect(validateAssignment({ ...ok, course_id: "" })).toBe("Please choose a course.");
    expect(validateAssignment({ ...ok, due_date: "" })).toBe("Due date is required.");
  });
  it("checks sign-in and registration fields", () => {
    expect(validateCredentials("", "x", "signin")).toBe("Email is required.");
    expect(validateCredentials("bad", "x", "signin")).toBe("Please enter a valid email address.");
    expect(validateCredentials("a@b.co", "", "signin")).toBe("Password is required.");
    expect(validateCredentials("a@b.co", "123", "register")).toBe(
      "Password must be at least 6 characters.",
    );
    expect(validateCredentials("a@b.co", "123456", "register")).toBeNull();
  });
});
