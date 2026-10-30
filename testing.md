# StudyBuddy Testing Log (Beta 1)

Run date: 2026-10-30. "Pass" means the test was actually executed and passed.
Browser tests were run with an automated Chromium browser against the dev
server, signed in as the team's existing confirmed account.

## Automated tests (`bun run test`)

13 tests in `src/test/` — **all passed**. They cover: route matching, every
account page behind the sign-in gate, dashboard filter/sort, overdue rule,
course/assignment/credential validation.

## Manual / browser tests

| ID | Area | Steps | Expected | Actual | Status |
|----|------|-------|----------|--------|--------|
| A1 | Auth | Open `/dashboard`, `/courses`, `/assignments` signed out | Sent to `/auth` | Sent to `/auth` for all three | Pass |
| A2 | Validation | Click Sign in with empty fields | "Email is required." | Shown | Pass |
| A3 | Auth | Correct email, wrong password | Error, stay on page | "Invalid login credentials" | Pass |
| A4 | Validation | Register with 3-character password | "Password must be at least 6 characters." | Shown | Pass |
| A5 | Auth | Register a new real email, confirm, sign in | Account created, can sign in | Placeholder test emails are rejected and confirmation emails can't be read in our test setup | Not run |
| A6 | Auth | Sign in with correct details | Dashboard with email | Shown | Pass |
| A7 | Auth | Sign out, then open `/dashboard` | Sent to `/auth` | Sent to `/auth` | Pass |
| C1 | Validation | Add course with empty name | "Course name is required." | Shown | Pass |
| C2 | Courses | Add a course | Appears, success message | Appeared | Pass |
| C3 | Courses | Rename a course | New name, "Course renamed." | Shown | Pass |
| C4 | Courses | Delete course with assignments | Confirm explains cascade; course and its assignments removed | Confirm text shown; 0 assignments left | Pass |
| S1 | Validation | Submit empty assignment form | "Title is required." | Shown | Pass |
| S2 | Assignments | Add 3 assignments (future, far future, past) | All in full list | All shown | Pass |
| S3 | Assignments | Edit status to Completed | "Assignment updated." | Shown | Pass |
| S4 | Assignments | Delete with confirmation | Confirm, then removed | Removed | Pass |
| S5 | Assignments | Overdue unfinished item | Stays in full list, marked Overdue | Stays in list | Pass |
| D1 | Dashboard | Upcoming order | Earliest first, no overdue | "Beta Soon" (2098) before "Beta Essay" (2099); overdue hidden | Pass |
| D2 | Dashboard | Mark one Completed | Disappears from dashboard | Only "Beta Essay" left | Pass |
| P1 | Persistence | Reload the assignments page | Data still there | Still there | Pass |
| P2 | Persistence | Sign out and back in, data still there | Data still there | Not tried in the browser run (data lives in the database, not the browser) | Not run |
| I1 | Isolation | Signed-out request reads courses | Nothing returned | Empty list | Pass |
| I2 | Isolation | Signed-in user inserts a course for another user id | Blocked | Blocked by row-level security | Pass |
| I3 | Isolation | Second real account signs in and tries to see first account's data | Sees nothing | Needs a second confirmed account | Not run |
| R1 | Layout | Check pages on a phone-size screen | Readable, usable | Not checked | Not run |

## How to run the "Not run" tests

1. A5 / I3: register two accounts with real emails you can read, confirm both,
   add a course in account 1, sign in as account 2 and confirm the list is empty.
2. P2: add a course, sign out, sign back in, check it is still there.
3. R1: open the site on a phone or narrow the browser window.
