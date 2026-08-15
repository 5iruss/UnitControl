# UnitControl — Technical Requirements

**Version:** 1.1  
**Status:** Technology Stack Finalized (§24)

---

## 1. Purpose

This document defines the technical requirements for implementing UnitControl.

It translates the product, UX, academic rules, data model, dataset, database, and admin requirements into implementation requirements.

References:

- `01_Product_Overview.md`
- `02_User_Flow.md`
- `03_UX_UI_Specification.md`
- `04_Academic_Rules_Engine.md`
- `05_Curriculum_Data_Model.md`
- `06_Curriculum_Dataset.md`
- `07_Database_Schema.md`
- `08_Admin_Panel.md`

---

# 2. Architecture

UnitControl should use a modular web application architecture with clear separation between:

```text
Frontend
    ↓
Backend / API
    ↓
Academic Rules Engine
    ↓
Database
````

The implementation should keep academic logic separate from UI components.

The technology stack is finalized in §24. UnitControl is implemented as a single Next.js full-stack application (no separate NestJS/Express backend), but the Academic Rules Engine is isolated in a framework-independent domain layer (`domain/academic/`) that does not import UI, database, or framework code — see §24 for the full rationale and boundary rules.

---

# 3. Frontend Requirements

The frontend must support:

* Student authentication
* Onboarding
* Simple and Advanced setup
* Interactive curriculum map
* Course status management
* Course filtering
* Semester planning
* Recommendations
* Academic warnings
* Academic statistics
* Student profile management
* Admin Panel

The frontend must support a **Persian (Farsi) right-to-left (RTL)** interface, since all curriculum data is Persian and academic terms use the university (Iranian) calendar format. Course names and codes must be rendered exactly as stored in `06_Curriculum_Dataset.md` and must not be translated or altered. Additional UI languages are out of scope for the initial version.

The interface must follow:

`03_UX_UI_Specification.md`

---

# 4. Interactive Curriculum Map

The curriculum map is a core application component.

It must support:

* Course nodes/cards
* Course status visualization
* Course selection
* Status assignment
* Prerequisite connections
* Corequisite connections
* Available/blocked states
* Course details
* Semester assignment

The map must respond to changes in the student's academic state.

The frontend must not independently calculate academic eligibility.

It should consume results from the Academic Rules Engine.

---

# 5. Academic Rules Engine

Academic validation must be implemented as a separate logical layer.

It should evaluate:

* Curriculum membership
* Course status
* Prerequisites
* Corequisites
* Previous course attempts
* Semester planning
* Credit limits
* Failed-course risks
* Curriculum requirements
* Applicable academic exceptions

The rules defined in:

`04_Academic_Rules_Engine.md`

are the source of truth for academic behavior.

---

# 6. Course Validation

The backend/rules layer should provide a clear validation result.

Conceptually:

```text
allowed
status
reasons[]
warnings[]
```

Possible statuses:

```text
AVAILABLE
BLOCKED
AVAILABLE_WITH_WARNING
```

The frontend uses these results to display the appropriate UI state.

---

# 7. Data Layer

The implementation must follow:

`07_Database_Schema.md`

and

`05_Curriculum_Data_Model.md`

Curriculum data must remain separate from student academic state.

The system must support:

* Multiple curricula
* Multiple entry-year versions
* Course relationships
* Course groups
* Curriculum requirements
* Student course states (current)
* Course attempt history
* Academic terms
* Semester GPA

---

# 8. Curriculum Dataset

The actual academic dataset must come from:

`06_Curriculum_Dataset.md`

The system must not invent:

* Course codes
* Course relationships
* Credit values
* Academic requirements
* Academic exceptions

Unverified values must remain clearly identified as incomplete/TBD.

---

# 9. Authentication

The initial authentication system must support:

### Registration

```text
Student Number
    ↓
Password
    ↓
First Name
Last Name
Phone Number
```

### Login

```text
Student Number + Password
```

or:

```text
Phone Number + Password
```

OTP is not required for the initial version.

Passwords must be securely hashed.

Plain-text passwords must never be stored.

---

# 10. Student Academic Setup

The system must support two setup modes.

### Simple Mode

Stores the student's current course statuses without requiring semester history.

### Advanced Mode

Supports:

* Course status
* Academic term
* Semester GPA

Individual course grades are not required.

The system must not calculate semester GPA from individual course grades.

---

# 11. Academic Terms

The system must preserve the university term format.

Examples:

```text
4051 = Mehr 1405
4052 = Bahman 1405
4053 = Summer 1405
```

The term code should remain available as the original academic identifier.

---

# 12. Student Profile Changes

If a student changes information that changes their curriculum:

```text
Entry Year
Major
Orientation
```

the system must:

1. Detect the curriculum change.
2. Warn the student.
3. Require explicit confirmation.
4. Reset the student's existing academic course-state data.
5. Assign the new curriculum.
6. Require academic setup again.

This behavior must follow:

`02_User_Flow.md`

---

# 13. Recommendations and Warnings

Recommendations and warnings must be generated from the Academic Rules Engine.

The frontend should not duplicate academic decision logic.

Recommendations should include a useful explanation.

Warnings should include:

* Problem
* Affected course where applicable
* Reason
* Suggested action where applicable

---

# 14. Admin Panel

The implementation must provide role-based administrative access.

Required roles:

```text
SUPER_ADMIN
ACADEMIC_GROUP_MANAGER
SUPPORT
```

Admin functionality must follow:

`08_Admin_Panel.md`

Administrative actions affecting academic data should be validated and logged.

---

# 15. Security

The application must implement standard security practices, including:

* Secure password hashing
* Authentication protection
* Role-based authorization
* Input validation
* Server-side validation
* Protection against unauthorized data access
* Secure session/token handling
* Protection of sensitive student information
* Audit logging for important administrative actions

Academic validation must never rely only on client-side checks.

---

# 16. API Requirements

The backend should expose clear application services/API endpoints for:

* Authentication
* Student profile
* Curriculum retrieval
* Course retrieval
* Course status updates
* Semester planning
* Academic validation
* Recommendations
* Warnings
* Statistics
* Admin operations

The exact API structure is TBD during implementation.

---

# 17. State Management

Student academic state must remain consistent across:

* Course statuses
* Semester plans
* Recommendations
* Warnings
* Statistics

When relevant student data changes, dependent information must be recalculated.

The system should avoid storing redundant calculated values unless there is a clear performance reason.

---

# 18. Validation

Validation must occur on the server.

Client-side validation may be used for user experience but must never be considered authoritative.

Academic operations should be validated before persistence.

Examples:

```text
Adding a course
Changing course status
Assigning a semester
Changing academic profile
Editing academic data through Admin Panel
```

---

# 19. Data Integrity

The implementation must enforce:

* Unique student numbers
* Valid curriculum assignments
* Valid course references
* Valid course relationships
* Valid academic terms
* Valid course statuses
* Valid administrative permissions
* No invalid prerequisite/corequisite references
* No duplicate relationship records

Database constraints should be used where appropriate.

---

# 20. Performance

The application should remain responsive when displaying a complete curriculum map.

The implementation should avoid unnecessary recalculation and database requests.

Academic validation should be efficient enough to update the dashboard after relevant course changes without noticeable delay for normal curriculum sizes.

---

# 21. Error Handling

Errors should be handled at both technical and user levels.

Technical errors should provide useful logs for developers.

User-facing errors should:

* Be understandable.
* Explain what happened.
* Avoid exposing technical details.
* Suggest the next action where possible.

Academic validation errors should explain the academic reason rather than displaying generic errors.

---

# 22. Auditability

Important administrative changes should be recorded.

At minimum:

```text
Administrator
Action
Target
Timestamp
```

Where useful, the previous and new values should also be recorded.

---

# 23. Deployment

The final deployment architecture is **TBD**.

The implementation should support separate environments for:

```text
Development
Testing
Production
```

Environment-specific configuration must not be hardcoded into the application.

Secrets and credentials must be stored using environment configuration/secrets management.

The hosting provider itself remains TBD, but the deployment sequence to any standard Node.js/PostgreSQL host is:

```text
1. pnpm install                 (runs `prisma generate` via postinstall)
2. Configure environment variables (see .env.example)
3. Connect to the production PostgreSQL database
4. pnpm db:migrate:deploy       (prisma migrate deploy — non-interactive,
                                  applies committed migrations only; never
                                  run `pnpm db:migrate`, which is dev-only
                                  and can prompt to reset the database)
5. pnpm db:seed                 (only if the deployment explicitly requires
                                  seeding the curriculum/course catalog;
                                  idempotent, safe to skip on subsequent
                                  deploys)
6. pnpm build
7. pnpm start
8. Smoke test via GET /api/health (200 {"status":"ok"} once the app can
                                  reach the database)
```

---

# 24. Technology Stack

The stack is finalized as follows.

### Application Framework

* **Next.js (App Router) + React + TypeScript** — single full-stack application.
* Route Handlers and Server Actions are used for backend logic instead of a separate NestJS/Express service.
* Rationale: the project's scope does not justify a separate backend service. A single Next.js codebase reduces operational and deployment complexity while still allowing a clean internal separation of concerns (see "Domain Layer Isolation" below).

### UI

* **Tailwind CSS** for styling.
* **shadcn/ui** for base UI components.
* **@xyflow/react** for the interactive curriculum map — the core UI requirement is a graph of course nodes connected by prerequisite/corequisite edges (`03_UX_UI_Specification.md` §9–§12), which is exactly what this library is built for.

### Database and Data Access

* **PostgreSQL** — the domain is highly relational (curricula, courses, course relationships, requirements, student state; see `07_Database_Schema.md`), which fits a relational database rather than a document store.
* **Prisma 7** (stable release channel, not Prisma Next/Early Access) as the ORM/schema layer.

### Validation

* **Zod** for input/schema validation at the application boundary (Server Actions, Route Handlers), per the server-side validation requirement in §18.

### Authentication

* Custom session-based authentication (no third-party auth provider). Matches `01_Product_Overview.md` §11 / `02_User_Flow.md` §3, §14: registration by student number, login by student number or phone number, password-based, no OTP.
* Passwords hashed with a modern adaptive hash (e.g. argon2/bcrypt) — never stored in plain text.

### Testing

* **Vitest** for unit tests — primarily the Academic Rules Engine (`domain/academic/`), which must be independently testable per §32 of `10_Claude_Master_Prompt.md`.
* **Playwright** for end-to-end tests of student and admin flows.

### Package Manager

* **pnpm**.

### Domain Layer Isolation

The Academic Rules Engine must remain framework-independent and independently unit-testable, per `04_Academic_Rules_Engine.md` and `10_Claude_Master_Prompt.md` §7, §36.

```text
domain/academic/
```

contains the academic decision-making logic:

* Prerequisite validation
* Corequisite validation
* Failed-course rules
* Credit limits
* Semester validation
* Course eligibility
* Recommendations
* Academic warnings

Rules for this layer:

* No imports from Next.js, React, Prisma, or any UI/framework/database package.
* Pure functions/modules operating on plain domain types (curriculum, course, student state) passed in by the caller.
* Route Handlers/Server Actions load data (via Prisma) and pass it into `domain/academic/`; the domain layer returns a validation result (`04_Academic_Rules_Engine.md` §20), which the caller then persists or returns to the frontend.
* The frontend never computes academic eligibility itself; it only renders results produced by this layer (`09_Technical_Requirements.md` §4, §6).

This decision was selected based on:

* Project complexity — moderate; a single full-stack app is sufficient.
* Interactive curriculum visualization — graph library requirement satisfied by @xyflow/react.
* Maintainability — the domain-layer isolation keeps academic logic testable and framework-agnostic even though it lives inside the Next.js codebase.
* Developer productivity — one codebase, one deployment unit.
* Database requirements — PostgreSQL fits the highly relational schema in `07_Database_Schema.md`.
* Deployment simplicity — a single Next.js application is simpler to deploy and operate than a split frontend/backend.
* Long-term scalability — the domain layer's framework independence means the Rules Engine could be extracted into a separate service later without a rewrite, if ever needed.

---

# 25. Source of Truth

| Area                              | Source                         |
| --------------------------------- | ------------------------------ |
| Product                           | `01_Product_Overview.md`       |
| User flows                        | `02_User_Flow.md`              |
| UX/UI                             | `03_UX_UI_Specification.md`    |
| Academic logic                    | `04_Academic_Rules_Engine.md`  |
| Data model                        | `05_Curriculum_Data_Model.md`  |
| Academic dataset                  | `06_Curriculum_Dataset.md`     |
| Database                          | `07_Database_Schema.md`        |
| Admin                             | `08_Admin_Panel.md`            |
| Technical implementation          | `09_Technical_Requirements.md` |
| Final implementation instructions | `10_Claude_Master_Prompt.md`   |

---

# 26. Implementation Principles

### Do Not Invent Academic Data

Use `06_Curriculum_Dataset.md` as the source of truth.

### Do Not Duplicate Academic Logic

Use `04_Academic_Rules_Engine.md`.

### Do Not Hardcode Curriculum Data in UI Components

Curriculum data must come from the data layer.

### Keep Student State Separate From Curriculum

A student's changes must never modify the underlying curriculum.

### Server Is Authoritative

Academic validation and permissions must be enforced server-side.

### Keep the MVP Simple

Do not introduce features that are outside the defined product scope.

### Prefer Maintainability

The codebase should be modular and understandable rather than unnecessarily complex.

---

# 27. Final Implementation Boundary

This document defines the technical requirements but does not prescribe a specific framework or library.

Technology decisions should be finalized before implementation and then documented here.

The final implementation must remain consistent with all previous project documents.

`10_Claude_Master_Prompt.md` will define how Claude should use this document together with the other project specifications.
