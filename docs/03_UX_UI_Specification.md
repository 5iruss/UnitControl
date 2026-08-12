# UnitControl — UX/UI Specification

**Version:** 1.0
**Status:** Interface Specification

---

## 1. Purpose

This document defines the interface structure, visual behavior, and UX rules for UnitControl.

It is the source of truth for **how the product looks and behaves**, based only on decisions established in:

- `01_Product_Overview.md` — product scope and goals
- `02_User_Flow.md` — user journeys and interaction flows

This document does **not** define:

- Academic rules → `04_Academic_Rules_Engine.md`
- Data structures → `07_Database_Schema.md`
- Technical implementation → `09_Technical_Requirements.md`

Where a decision is not yet established, it is marked `TBD` rather than invented.

---

## 2. UX/UI Goals

- Answer the three product questions clearly (`01_Product_Overview.md` §3): *Where am I? What can I take next? What problems should I know about?*
- Make academic progression and dependencies understandable **visually first**.
- **Explain, don't just block**: when a course is unavailable, show the reason.
- Keep the interface simple and focused on academic planning.
- Give the student clear control over course status and semester planning.

---

## 3. Overall Application Layout

Two separate interfaces:

- **Student application** — authentication, onboarding, setup, dashboard.
- **Admin panel** — separate interface defined in `08_Admin_Panel.md`.

The student application centers on a single **Dashboard** built around the interactive curriculum map. There is no separate "Term 1 / Term 2 / Term 3" layout around the map.

---

## 4. Main Dashboard Structure

Conceptual layout:

```text
┌─────────────────────────────────────────────────────────────┐
│ Student Information │ Course Filters │ Status Toolbar        │
├─────────────────────────────────────────────────────────────┤
│                    Academic Statistics                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│               Interactive Curriculum Map                     │
│                                                              │
├──────────────────────────────┬───────────────────────────────┤
│ Recommended Courses          │ Academic Problems / Warnings  │
└──────────────────────────────┴───────────────────────────────┘
```

The curriculum map is the central visualization. All other panels support it.

---

## 5. Student Information Section

Displays basic identity and academic profile (from `01_Product_Overview.md` §10):

- Name
- Student number
- Entry year
- Major and orientation
- Study type
- Assigned curriculum

Read-only on the dashboard. Editing happens through profile management (§20).

---

## 6. Academic Statistics Section

Displays derived progress values (calculated, never manually stored — see `07_Database_Schema.md` §20):

- Completed units
- Remaining units
- Progress by category (general, basic, specialized, elective, etc.)
- Passed / failed / in-progress / planned course counts

The exact statistics shown follow what the Academic Rules Engine can derive; unavailable values (e.g. those depending on unverified credits) are hidden or marked incomplete rather than guessed.

---

## 7. Course-Status Filter Toolbar

Lets the student filter which courses are emphasized on the map. Filters correspond to course states (§10):

- Passed
- Failed
- Currently Studying
- Planned
- Not Completed
- Available
- Blocked

Filters change visibility/emphasis only. They do not change academic state.

---

## 8. Course-Status Interaction and Cursor Behavior

The Course Status Toolbar lets the student pick a status, then apply it to courses on the map (per `02_User_Flow.md` §7).

Interaction concept:

1. The student selects a status in the toolbar.
2. The active status changes the cursor/indicator so the selected status is visible while the student clicks courses.
3. Clicking a course on the map applies the selected status to that course.
4. The system recalculates academic state (see `04_Academic_Rules_Engine.md` §22).

Example indicators (exact visual style is the designer's choice; the interaction concept is required):

- Passed → green check indicator
- Failed → red X indicator

---

## 9. Interactive Curriculum Map

The map visually communicates academic progression and dependencies for the student's assigned curriculum.

Requirements:

- Show course nodes/cards for the courses in the student's curriculum.
- Visually distinguish every course state (§10).
- Show prerequisite relationships (§11) and corequisite relationships (§12).
- Distinguish **Available** from **Blocked** courses using the result of `04_Academic_Rules_Engine.md`.
- Respond to changes in academic state without a full reload.

The frontend must not compute academic eligibility itself; it renders the result supplied by the Academic Rules Engine (`09_Technical_Requirements.md` §4).

The map must render correctly in a right-to-left (RTL) layout with Persian course names (see §22, §23).

---

## 10. Course Node / Card Structure and Visual States

Each course node/card shows at least:

- Course name
- Course code
- Credits when available (credits are `TBD` in the dataset — see `06_Curriculum_Dataset.md` §7; show only when verified)
- Current status
- Availability state

The UI must give each of the following a distinct, non-color-only visual treatment (see accessibility, §23):

**Student-assigned statuses**

- Passed
- Failed
- Currently Studying
- Planned
- Not Completed

**Rules-engine availability states** (from `04_Academic_Rules_Engine.md` §27)

- Available
- Blocked
- Available With Warning

The exact palette and shapes are the designer's choice, but the states must be unambiguously distinguishable.

---

## 11. Prerequisite Relationships (Visual)

A prerequisite is shown as a **directed** connection:

```text
Course A ──▶ Course B   (A is a prerequisite for B)
```

The visual only represents the relationship stored in `06_Curriculum_Dataset.md`. Whether the student satisfies it is decided by `04_Academic_Rules_Engine.md`, and the map reflects that result through the target course's availability state.

Prerequisite relationships are currently **not populated** in the dataset (`06_Curriculum_Dataset.md` §5). Until they are verified, the map shows no prerequisite edges.

---

## 12. Corequisite Relationships (Visual)

A corequisite is shown as a **non-directed** connection:

```text
Course A ┈┈ Course B   (A and B are corequisites)
```

As with prerequisites, corequisite relationships are **not populated** yet (`06_Curriculum_Dataset.md` §5) and are not drawn until verified. The relationship's academic meaning belongs to `04_Academic_Rules_Engine.md`.

---

## 13. Course Interaction Behavior

Clicking a course on the map does one of:

- **Apply status** — when a status is selected in the toolbar (§8).
- **Open details** — when no status is selected, or through an explicit "details" affordance (§14).

Blocked courses remain visible and interactive enough to open their details and read the blocking reason. The UI never hides *why* a course is blocked.

---

## 14. Course Details View

Opened from a course node. Shows:

- Course name, code, category, credits (when verified)
- Current status
- Availability result and reasons (from `04_Academic_Rules_Engine.md` §20)
- Any warnings
- Prerequisite / corequisite relationships (when populated)
- Semester selection for planning (§15)

Reasons and warnings are presented as human-readable explanations, not raw codes (`09_Technical_Requirements.md` §21).

---

## 15. Semester Selection for Planned Courses

When planning a course, the student selects the academic term directly on that course (no separate term-based layout).

Academic term format (from `01_Product_Overview.md` §8 and `06_Curriculum_Dataset.md` §6):

```text
4051 = Mehr 1405
4052 = Bahman 1405
4053 = Summer 1405
```

Flow (from `02_User_Flow.md` §8, §11):

1. Select the course.
2. Select the academic term.
3. The system validates via the Academic Rules Engine.
4. Valid → the course is added to the plan. Invalid → the reason is shown; the course is not added.

Planned courses are **temporary** and distinct from persistent academic history (see `07_Database_Schema.md` §14–§16).

---

## 16. Recommended Courses Panel

Shows courses the Academic Rules Engine recommends for the next semester (`04_Academic_Rules_Engine.md` §10).

Each recommendation must include a short reason. Example:

```text
پایگاه داده (Database)
Credits: (shown when verified)

Prerequisites satisfied.
```

Recommendations are supplied by the rules engine; the frontend must not compute them (`09_Technical_Requirements.md` §13).

---

## 17. Academic Problems / Warnings Panel

Shows structured warnings from the Academic Rules Engine (`04_Academic_Rules_Engine.md` §19).

Each warning should communicate:

- What is wrong
- Why it is happening
- Which course is affected
- What the student can do

Warnings explain rather than block. Avoid generic messages such as "Error: Course unavailable."

---

## 18. Simple Setup UI

Supports Simple Mode (`02_User_Flow.md` §5).

- Show the empty curriculum map.
- Let the student mark current course statuses using the status toolbar.
- Do not require semester history, academic terms, or GPA.
- Continue to the dashboard.

---

## 19. Advanced Setup UI

Supports Advanced Mode (`02_User_Flow.md` §5, §12).

- The student adds academic terms one at a time.
- For each term: mark the courses taken and their final status.
- Enter the **semester GPA** for that term (individual course grades are never requested).
- Continue to the next term, then finish and enter the dashboard.

Advanced setup produces persistent academic history (`07_Database_Schema.md` §14–§15).

---

## 20. Profile-Change / Reset Warning UI

When the student edits a profile value that changes their curriculum (entry year, major, orientation — see `04_Academic_Rules_Engine.md` §23):

1. Detect the curriculum change.
2. Show an explicit reset warning describing that existing academic course-state data will be reset.
3. Require explicit confirmation (an accidental click must not trigger the reset).
4. On confirmation, reset course-state data and assign the new curriculum.
5. Prompt the student to reconfigure their academic status.

The system must never reset data silently, and must offer a clear cancel path.

---

## 21. Login and Onboarding UI (High Level)

- **Registration** (`02_User_Flow.md` §3): student number → password → first/last name → phone number. No OTP in the initial version.
- **Login** (`02_User_Flow.md` §14): student number + password, or phone number + password.
- **Onboarding**: after registration, collect academic profile (entry year, major, orientation, study type), then route to Simple or Advanced setup.
- **Password recovery**: handled through the support process (`08_Admin_Panel.md` §11); there is no self-service reset in the initial version.

---

## 22. Responsive Behavior

- The application must be usable on desktop and adapt to smaller screens.
- The curriculum map is the most layout-sensitive component; on small screens it may use panning/zooming or a condensed layout. Exact responsive treatment of the map is `TBD` and must not compromise the ability to read course state and blocking reasons.
- The interface must support a **right-to-left (RTL)** layout, since curriculum data is Persian (`06_Curriculum_Dataset.md`).

---

## 23. Accessibility / Basic Usability

- Do not rely on color alone to convey state; pair color with icons/labels/shapes (§10).
- Provide readable contrast and legible Persian typography.
- Support keyboard interaction for core actions where practical.
- Every blocked or warned course must expose a readable textual reason.
- Confirmations for destructive actions (profile reset) must be explicit (§20).

---

## 24. Internationalization / Language

- Primary content language is **Persian (Farsi)** with RTL layout.
- Course names and codes are rendered exactly as stored in `06_Curriculum_Dataset.md`; the UI must not translate or alter them.
- Academic term codes are shown in the university format (§15).
- Any additional UI languages are `TBD` and out of scope for the initial version.

---

## 25. UX Principles

- **Visual first** — progress and dependencies are understandable at a glance.
- **Explain, don't just block** — always show why a course is unavailable.
- **Student control** — the student owns their status and planning.
- **Minimum data** — never ask for information the product does not need.
- **Single source of truth** — the UI presents results from the rules engine and dataset; it does not redefine them.

---

## 26. Reference Hierarchy

| Information | Source |
| --- | --- |
| Product scope and goals | `01_Product_Overview.md` |
| User journeys and interaction flows | `02_User_Flow.md` |
| Interface, visual behavior, and UX rules | `03_UX_UI_Specification.md` |
| Academic validation and decision logic | `04_Academic_Rules_Engine.md` |
| Academic data structure | `05_Curriculum_Data_Model.md` |
| Actual courses, codes, curricula, relationships | `06_Curriculum_Dataset.md` |
| Data persistence | `07_Database_Schema.md` |
| Administrative interface | `08_Admin_Panel.md` |
| Technical implementation | `09_Technical_Requirements.md` |
| Final implementation instructions | `10_Claude_Master_Prompt.md` |

This document defines interface and UX behavior only. It does not define academic rules, data persistence, or technical implementation.
