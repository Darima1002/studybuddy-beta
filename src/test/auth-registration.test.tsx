import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, type ComponentType } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { signUp, navigate } = vi.hoisted(() => ({
  signUp: vi.fn(),
  navigate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { signUp } },
}));
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => navigate,
}));

import { Route } from "@/routes/auth";

function fillRegistration() {
  render(createElement(Route.options.component as ComponentType));
  fireEvent.click(screen.getByRole("tab", { name: "Register" }));
  for (const [label, value] of [
    ["First name", "Demo"],
    ["Last name", "Student"],
    ["Email", "student@example.com"],
    ["School or university", "Demo College"],
    ["Password", "Test-only-password-42"],
    ["Confirm password", "Test-only-password-42"],
  ]) {
    if (label && value) fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
  }
  fireEvent.change(screen.getByLabelText("Year or level"), { target: { value: "Freshman" } });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("email registration", () => {
  it("does not navigate before the email is confirmed and returns confirmation to the public auth page", async () => {
    signUp.mockResolvedValue({ data: { session: null, user: { identities: [{ id: "demo" }] } }, error: null });
    fillRegistration();
    await screen.findByRole("status");
    expect(navigate).not.toHaveBeenCalled();
    expect(signUp).toHaveBeenCalledWith(expect.objectContaining({
      email: "student@example.com",
      options: expect.objectContaining({ emailRedirectTo: `${window.location.origin}/auth` }),
    }));
    expect(screen.getByRole("tab", { name: "Register" }).getAttribute("aria-selected")).toBe("true");
  });

  it("never treats an existing account's empty identities as a signed-in session", async () => {
    signUp.mockResolvedValue({ data: { session: null, user: { identities: [] } }, error: null });
    fillRegistration();
    await screen.findByRole("status");
    expect(navigate).not.toHaveBeenCalled();
    expect((screen.getByLabelText("Password", { exact: true }) as HTMLInputElement).value).toBe("");
  });

  it("navigates to the dashboard only when registration actually returns a session", async () => {
    signUp.mockResolvedValue({ data: { session: { user: { id: "demo" } } }, error: null });
    fillRegistration();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/dashboard" }));
  });

  it("keeps the user signed out and permits retry after a rejected signup", async () => {
    signUp.mockResolvedValue({ data: { session: null }, error: { message: "Registration rejected" } });
    fillRegistration();
    await screen.findByRole("alert");
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Create account" })).not.toBeDisabled();
  });
});