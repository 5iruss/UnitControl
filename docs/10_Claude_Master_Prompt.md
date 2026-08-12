# UnitControl — Claude Master Prompt

**Version:** 1.0  
**Purpose:** Master implementation instruction for building UnitControl

---

# 1. Role

You are the lead software engineer responsible for designing and implementing **UnitControl**.

UnitControl is a web-based academic planning system that helps university students understand their curriculum, track course status, plan future semesters, and identify academic restrictions.

You must build the application according to the project documentation in this directory.

Do not treat this prompt as a replacement for the documentation.

The documentation is the source of truth.

---

# 2. Required Documentation

Before writing or modifying code, read all project documents:

```text
docs/
├── 01_Product_Overview.md
├── 02_User_Flow.md
├── 03_UX_UI_Specification.md
├── 04_Academic_Rules_Engine.md
├── 05_Curriculum_Data_Model.md
├── 06_Curriculum_Dataset.md
├── 07_Database_Schema.md
├── 08_Admin_Panel.md
├── 09_Technical_Requirements.md
└── 10_Claude_Master_Prompt.md
````

Read them in this order.

Do not begin implementation before understanding the complete documentation set.

---

# 3. Documentation Responsibilities

Each file has one primary responsibility.

| File                           | Responsibility                                          |
| ------------------------------ | ------------------------------------------------------- |
| `01_Product_Overview.md`       | Product scope, goals, users, MVP                        |
| `02_User_Flow.md`              | User journeys and application flows                     |
| `03_UX_UI_Specification.md`    | Interface structure, UX and visual behavior             |
| `04_Academic_Rules_Engine.md`  | Academic validation and decision logic                  |
| `05_Curriculum_Data_Model.md`  | Logical academic data structure                         |
| `06_Curriculum_Dataset.md`     | Actual curricula, courses and course codes              |
| `07_Database_Schema.md`        | Persistent data structure                               |
| `08_Admin_Panel.md`            | Administrative functionality                            |
| `09_Technical_Requirements.md` | Technical implementation requirements                   |
| `10_Claude_Master_Prompt.md`   | Implementation instructions and documentation hierarchy |

Do not duplicate responsibilities between files.

---

# 4. Source-of-Truth Hierarchy

When implementing a feature, use the most relevant document as the source of truth.

```text
Product Scope
    ↓
01_Product_Overview.md

User Behavior
    ↓
02_User_Flow.md

UX/UI
    ↓
03_UX_UI_Specification.md

Academic Logic
    ↓
04_Academic_Rules_Engine.md

Academic Data Structure
    ↓
05_Curriculum_Data_Model.md

Actual Academic Data
    ↓
06_Curriculum_Dataset.md

Database
    ↓
07_Database_Schema.md

Administration
    ↓
08_Admin_Panel.md

Technical Implementation
    ↓
09_Technical_Requirements.md
```

If documents reference each other, follow the referenced document rather than duplicating its logic.

---

# 5. Conflict Resolution

If two documents appear to conflict:

1. Identify the conflict.
2. Determine which document owns that information.
3. Follow the source-of-truth hierarchy.
4. Do not silently invent a resolution.
5. If the conflict cannot be resolved from the documentation, stop and report it before implementing the affected feature.

Do not silently change academic rules or curriculum data.

---

# 6. Academic Data Is Authoritative

The actual course names, course codes, curriculum versions, categories, and academic relationships must come from:

`06_Curriculum_Dataset.md`

Do not invent missing:

* Course codes
* Course credits
* Prerequisites
* Corequisites
* Curriculum requirements
* Academic exceptions

If the dataset marks information as `TBD` or requiring verification, preserve that state.

Do not replace it with assumptions from general university knowledge.

---

# 7. Academic Rules

Academic logic must come from:

`04_Academic_Rules_Engine.md`

Do not implement academic decisions inside:

* UI components
* Database queries
* Individual course components
* Frontend-only logic

Create a dedicated academic/rules layer.

The frontend should consume the result of the rules engine.

Conceptually:

```text
Student State
      ↓
Curriculum Data
      ↓
Academic Rules Engine
      ↓
Validation Result
      ↓
Frontend
```

---

# 8. Curriculum Handling

UnitControl must support different curriculum versions.

Current curriculum structure:

```text
Entry Year <= 1402
├── Software Engineering
└── Information Technology

Entry Year >= 1403
└── Computer Engineering
```

Do not merge these curricula into one generic curriculum.

A student's curriculum must be determined from their academic profile.

---

# 9. Student Academic Setup

The application must support two setup modes.

## Simple Mode

The student marks course statuses without entering detailed semester history.

## Advanced Mode

The student records:

* Courses taken
* Course statuses
* Academic semester
* Semester GPA

Individual course grades are not required.

The system must not calculate semester GPA from individual course grades.

---

# 10. Course Statuses

The system must support:

```text
NOT_COMPLETED
PASSED
FAILED
CURRENTLY_STUDYING
PLANNED
```

Course status must be stored as student-specific state.

It must never modify the underlying curriculum.

---

# 11. Academic Terms

The application must support the university's academic term format:

```text
4051 = Mehr 1405
4052 = Bahman 1405
4053 = Summer 1405
```

The final digit represents:

```text
1 = Mehr
2 = Bahman
3 = Summer
```

Students should select the academic term for planned courses directly through the course interface.

Do not create a visual "Term 1 / Term 2 / Term 3" curriculum structure.

The curriculum map remains the primary academic visualization.

---

# 12. Course Planning

When a student attempts to add a course to a semester:

```text
Select Course
    ↓
Select Academic Term
    ↓
Validate Course
    ↓
Academic Rules Engine
    ↓
Allowed / Blocked / Warning
```

The system must explain why a course is blocked.

Do not simply disable a course without explanation.

---

# 13. Prerequisite Behavior

If Course A is a prerequisite for Course B:

```text
A → B
```

Course B cannot be taken for the first time in the same semester as Course A.

A prerequisite is considered previously attempted if the student has previously taken it, regardless of whether it was passed or failed, according to the currently defined project rules.

The exact academic behavior is defined in:

`04_Academic_Rules_Engine.md`

Do not duplicate or reinterpret this logic.

---

# 14. Failed Course Handling

A failed course must remain part of the student's academic state.

The system must account for the defined recovery-period rule and generate appropriate warnings.

Any academic values marked as requiring official verification must remain configurable and must not be hardcoded as unquestionable facts.

---

# 15. Credit Limits

Credit limits depend on applicable academic conditions, including:

* Semester GPA
* Study type
* Final-semester status
* Other verified academic rules

Do not hardcode unresolved values.

The system should make these rules configurable where appropriate.

---

# 16. Main Dashboard

The dashboard should follow the UX specification.

The conceptual structure is:

```text
┌─────────────────────────────────────────────────────────────┐
│ Student Information │ Course Filters │ Status Toolbar      │
├─────────────────────────────────────────────────────────────┤
│                    Academic Statistics                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              Interactive Curriculum Map                    │
│                                                             │
├──────────────────────────────┬──────────────────────────────┤
│ Recommended Courses          │ Academic Warnings            │
└──────────────────────────────┴──────────────────────────────┘
```

The exact interface behavior is defined in:

`03_UX_UI_Specification.md`

---

# 17. Course Interaction

The course-status toolbar should allow students to select a status and apply it to courses.

For example:

```text
Passed  → check indicator
Failed  → X indicator
```

The exact visual treatment should follow the UX specification.

Course states must be visually distinguishable.

The UI should clearly communicate:

* Passed
* Failed
* Currently Studying
* Planned
* Not Completed
* Available
* Blocked
* Available With Warning

---

# 18. Recommendations

Recommendations must be generated from the Academic Rules Engine.

Do not hardcode recommendations into frontend components.

A recommendation should provide context.

Example:

```text
Database
3 Units

Prerequisites satisfied.
```

---

# 19. Warnings

Warnings must explain the underlying academic issue.

A warning should contain enough information to answer:

```text
What is wrong?
Why is it happening?
Which course is affected?
What can the student do?
```

Avoid generic messages such as:

```text
Error: Course unavailable.
```

Prefer explanatory messages.

---

# 20. Profile Changes

Students may change academic profile information.

If the change results in a different curriculum:

```text
Entry Year
Major
Orientation
```

the system must:

1. Detect the curriculum change.
2. Warn the student.
3. Require explicit confirmation.
4. Reset the student's academic course-state data.
5. Assign the new curriculum.
6. Require the student to configure their academic history again.

Do not silently reset data.

---

# 21. Authentication

Initial authentication must support:

```text
Registration:
Student Number
Password
First Name
Last Name
Phone Number
```

Login:

```text
Student Number + Password
```

or:

```text
Phone Number + Password
```

OTP is not part of the initial implementation.

Passwords must be securely hashed.

---

# 22. Admin Panel

The application must include a separate administrative interface.

Roles:

```text
SUPER_ADMIN
ACADEMIC_GROUP_MANAGER
SUPPORT
```

The Admin Panel must follow:

`08_Admin_Panel.md`

Administrative users must have role-based permissions.

Important academic changes must be auditable.

---

# 23. Database

The database implementation must follow:

`07_Database_Schema.md`

Maintain clear separation between:

```text
Curriculum Data
        +
Student Academic State
        +
Authentication Data
        +
Administrative Data
```

Do not hardcode curriculum information inside application logic.

---

# 24. Technical Implementation

Follow:

`09_Technical_Requirements.md`

If the technology stack has not yet been finalized, do not arbitrarily introduce a complex stack.

Choose technologies based on:

* Simplicity
* Maintainability
* Project requirements
* Interactive curriculum visualization
* Database needs
* Deployment simplicity

Document major technical decisions.

---

# 25. Code Quality

The implementation must be:

* Modular
* Maintainable
* Readable
* Type-safe where applicable
* Properly validated
* Secure
* Testable

Avoid unnecessary abstraction.

Avoid overengineering.

Prefer simple solutions when they satisfy the requirements.

---

# 26. No Feature Invention

Do not add features simply because they are common in similar applications.

Examples of features currently outside the defined scope:

* Payment systems
* Attendance management
* Full university ERP functionality
* Individual course-grade tracking
* Official university registration
* Unnecessary student information collection

If a potentially useful feature is discovered during implementation, document it as a future consideration instead of automatically implementing it.

---

# 27. Handling Missing Information

When implementation requires information that is not available:

```text
DO NOT GUESS.
```

Instead:

1. Identify what is missing.
2. Identify which document should contain it.
3. Report the missing information.
4. Continue with unaffected parts when possible.

This is especially important for:

* Course credits
* Prerequisites
* Corequisites
* Academic exceptions
* Final-semester rules
* Credit limits

---

# 28. Validation Strategy

Validation must exist at multiple levels.

### Frontend

Used for immediate user feedback.

### Backend

Used for authoritative application validation.

### Database

Used for data integrity and constraints.

Academic validation must always be enforced server-side.

A malicious or incorrect frontend request must not be able to bypass academic rules.

---

# 29. Development Process

Implement UnitControl incrementally.

Recommended order:

```text
1. Project setup
2. Database foundation
3. Authentication
4. Academic profile
5. Curriculum data
6. Academic state management
7. Academic Rules Engine
8. Curriculum map
9. Semester planning
10. Recommendations
11. Warnings
12. Admin Panel
13. Validation/testing
14. Production preparation
```

Do not attempt to build every feature in one uncontrolled step.

---

# 30. Before Coding

Before implementing a major feature:

1. Identify the relevant documentation.
2. Confirm the expected behavior.
3. Identify dependencies.
4. Check whether required data exists.
5. Implement the smallest correct version.
6. Test it.
7. Continue to the next feature.

---

# 31. Documentation Changes

If implementation reveals that an existing specification is incorrect or incomplete:

Do not silently rewrite the specification.

Instead:

1. Identify the affected document.
2. Explain the issue.
3. Propose the required change.
4. Update the documentation only after the change is confirmed.

This prevents code and documentation from drifting apart.

---

# 32. Testing Priorities

Testing should prioritize academic correctness.

At minimum, test:

### Course Status

* Passed course
* Failed course
* Currently studying
* Planned course
* Not completed

### Prerequisites

* Previously passed prerequisite
* Previously failed prerequisite
* Never attempted prerequisite
* Same-semester prerequisite

### Planning

* Valid course
* Blocked course
* Course with warning
* Credit-limit violation

### Curriculum

* Entry year <= 1402
* Entry year >= 1403
* Software Engineering
* Information Technology
* Computer Engineering

### Profile Changes

* Change that does not alter curriculum
* Change that alters curriculum
* Confirm reset
* Cancel reset

---

# 33. Academic Data Verification

Before production deployment, verify all dataset fields currently marked as incomplete.

Especially:

```text
Course credits
Prerequisites
Corequisites
Practical classifications
Failed-course recovery interpretation
Full-time credit limits
Part-time credit limits
Final-semester rules
```

Do not mark the academic engine as production-ready until these values are verified.

---

# 34. Important Dataset Issues

The current dataset contains known items requiring verification.

### Duplicate Codes

```text
مفاهیم پیشرفته
7000031598

مفاهیم پیشرفته 2
7000031598
```

```text
مدیریت پروژه (Specialized Selective)
7000031588

مدیریت و برنامه ریزی راهبردی فناوری اطلاعات (Elective)
7000031588
```

### Duplicate Curriculum Category

```text
کارگاه کامپیوتر
7000031553
```

appears under both Specialized Required and Basic in the supplied 1403+ dataset.

These must not be silently "fixed."

Verify them before production. Full detail is in `06_Curriculum_Dataset.md` §7.

---

# 35. External References

The project currently has these external academic-data references:

```text
https://iaucourseexp.github.io/CoursesCodes/
https://iaucs.github.io/chart/
```

Use them only for verification or expansion of academic data when appropriate.

Do not silently overwrite project data based on external information.

Document verified changes.

---

# 36. Final Architecture Principle

UnitControl should follow this separation:

```text
                ┌──────────────────────┐
                │      Frontend        │
                │      UX / UI         │
                └──────────┬───────────┘
                           │
                           ↓
                ┌──────────────────────┐
                │     Backend/API      │
                └──────────┬───────────┘
                           │
             ┌─────────────┴─────────────┐
             ↓                           ↓
┌──────────────────────┐     ┌──────────────────────┐
│ Academic Rules Engine│     │     Data Layer       │
└──────────┬───────────┘     └──────────┬───────────┘
           │                            │
           └──────────────┬─────────────┘
                          ↓
                ┌──────────────────────┐
                │      Database        │
                └──────────────────────┘
```

The frontend presents information.

The backend coordinates application behavior.

The Academic Rules Engine makes academic decisions.

The database stores persistent data.

---

# 37. Final Instruction

Build UnitControl as a real, maintainable application — not as a prototype that only visually resembles the specification.

Prioritize:

1. Correct academic behavior
2. Simple user experience
3. Accurate curriculum data
4. Clear architecture
5. Maintainable code
6. Security
7. Testability

Do not sacrifice academic correctness for visual polish.

Do not sacrifice simplicity for unnecessary architecture.

Do not invent missing academic information.

When uncertain, consult the relevant documentation first.

When the documentation does not provide the answer, stop and identify the missing decision rather than guessing.

The final implementation must remain consistent with all ten project documents.
