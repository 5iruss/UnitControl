# UnitControl — Curriculum Data Model

**Version:** 1.0  
**Status:** Core Data Specification

---

## 1. Purpose

This document defines the logical structure of academic curriculum data used by UnitControl.

It explains **what academic entities exist and how they relate to each other**.

It does not define:

- Actual course data → `06_Curriculum_Dataset.md`
- Database tables → `07_Database_Schema.md`
- Academic decision rules → `04_Academic_Rules_Engine.md`
- Technical implementation → `09_Technical_Requirements.md`

---

# 2. Data Model Overview

The academic structure is based on:

```text
Curriculum
    ↓
Curriculum Groups
    ↓
Courses
    ↓
Course Relationships
    ↓
Academic Requirements
````

A student is assigned to one curriculum based on their academic profile.

```text
Student Profile
      ↓
Curriculum
      ↓
Courses + Requirements + Relationships
```

---

# 3. Curriculum

A **Curriculum** represents a specific academic program/version.

A curriculum must be distinguishable by the information that determines its academic structure.

Core attributes:

```text
curriculum_id
name
entry_year_from
entry_year_to
major
orientation
total_required_units
status
```

Examples:

```text
Software Engineering — Entry <= 1402
Information Technology — Entry <= 1402
Computer Engineering — Entry >= 1403
```

The actual curriculum definitions belong to:

`06_Curriculum_Dataset.md`

---

# 4. Curriculum Versioning

Different entry years may have different curricula.

Therefore, curriculum data must be versioned rather than assuming that one curriculum applies to every student.

Current supported structure:

```text
Entry Year <= 1402
├── Software Engineering
└── Information Technology

Entry Year >= 1403
└── Computer Engineering
```

A student must be linked to the correct curriculum version.

Curriculum versions must remain isolated unless an explicit relationship is defined.

---

# 5. Course

A **Course** represents an academic subject.

Core attributes:

```text
course_id
course_code
name
credits
course_type
is_practical
```

The course code is the primary academic identifier supplied by the curriculum dataset.

Example:

```text
Course:
Data Structures

Code:
4628132653
```

Actual courses and codes belong exclusively to:

`06_Curriculum_Dataset.md`

---

# 6. Curriculum Course

A course can belong to a specific curriculum with a specific academic role.

Therefore, the relationship between a curriculum and a course should be represented separately from the global course definition.

Conceptually:

```text
Curriculum
    │
    └── Curriculum Course
            │
            └── Course
```

A Curriculum Course may contain:

```text
curriculum_id
course_id
category
required
```

This allows the same course to have different roles in different curricula.

Unit totals are not stored on the curriculum-course link. Course-level units belong to the course (see §5), and requirement totals belong to requirements and course groups (see §8, §16).

Membership of a course in an elective/course group is represented by the course-group membership relation (see §8), not by a field on the curriculum-course link. This keeps a single, unambiguous source for group membership, consistent with `07_Database_Schema.md` §10.

---

# 7. Course Categories

The model must support curriculum categories such as:

```text
GENERAL
BASIC
SPECIALIZED_REQUIRED
SPECIALIZED_ELECTIVE
ELECTIVE
PREPARATORY
SKILLS_EMPLOYABILITY
ORIENTATION_SPECIALIZED
```

The exact category names used by the university dataset should be preserved in:

`06_Curriculum_Dataset.md`

Categories should not be inferred from course names.

---

# 8. Course Groups

Some curriculum requirements are satisfied by selecting courses from a group rather than taking one specific course.

Examples:

```text
Specialized Electives
Electives
Concentration / Focus Courses
```

A course group should contain:

```text
group_id
curriculum_id
name
group_type
required_units
minimum_courses
maximum_courses
```

A group may contain multiple eligible courses. The set of eligible courses is stored as a separate membership relation between the group and its courses (persisted as `course_group_courses` in `07_Database_Schema.md` §10).

---

# 9. Elective Requirements

Elective requirements must be represented separately from individual courses.

For example:

```text
Elective Group
    ↓
Required: 10 units
    ↓
Choose from eligible courses
```

The system must be able to determine:

* How many units are required.
* Which courses belong to the group.
* Whether practical-course requirements exist.
* How many units have already been completed.

For the 1403+ Computer Engineering curriculum, the supplied dataset specifies:

```text
Elective requirement:
10 units

Additional requirement:
At least 1 practical unit
(workshop or laboratory)
```

The exact dataset remains the source of truth.

---

# 10. Course Relationships

Courses may have academic relationships with other courses.

The model must support at least:

```text
PREREQUISITE
COREQUISITE
```

Conceptually:

```text
Course A
   │
   └── Relationship ──→ Course B
```

A relationship should contain:

```text
relationship_id
source_course_id
target_course_id
relationship_type
```

The meaning of each relationship is defined by:

`04_Academic_Rules_Engine.md`

The actual relationships belong to:

`06_Curriculum_Dataset.md`

---

# 11. Prerequisite Relationship

A prerequisite relationship represents:

```text
Course A → prerequisite → Course B
```

The model only stores the relationship.

The Rules Engine determines whether the student satisfies it.

The data model must not contain duplicated validation logic.

---

# 12. Corequisite Relationship

A corequisite relationship represents:

```text
Course A ↔ corequisite ↔ Course B
```

The model stores the relationship.

The Rules Engine determines how the relationship affects course eligibility.

---

# 13. Academic Term

An academic term represents the semester in which a student takes or plans a course.

UnitControl uses the university term format:

```text
4051 = Mehr 1405
4052 = Bahman 1405
4053 = Summer 1405
```

Conceptually:

```text
Academic Term
├── academic_year
└── term_type
```

The term identifier should preserve the original university format.

---

# 14. Student Course State

The curriculum defines courses. The student's interaction with those courses is represented separately, in three distinct concepts.

### 14.1 Current Course State

The student's current status for a course. Exactly one current state per student + course:

```text
student
course
status        (NOT_COMPLETED | PASSED | FAILED | CURRENTLY_STUDYING | PLANNED)
academic_term (optional)
```

For `PLANNED`, `academic_term` is the intended term. `PLANNED` is **temporary planning** and is distinct from persistent history (§14.2).

### 14.2 Course Attempt History

The record of actual past/current attempts of a course. A student may attempt a course more than once (e.g. fail, then retake), so this allows **multiple records** per student + course:

```text
student
course
academic_term
result        (PASSED | FAILED | CURRENTLY_STUDYING)
```

Attempt history is the basis for distinguishing *never / previously / currently attempted* (see `04_Academic_Rules_Engine.md` §18) and for evaluating the failed-course recovery window. In Simple Mode a student may have current state without detailed attempt history; in Advanced Mode, attempts are recorded per term.

### 14.3 Semester GPA

The semester GPA is recorded **per academic term** (a semester record), not on an individual course:

```text
student
academic_term
semester_gpa
```

Semester GPA is entered only in Advanced Setup. Individual course grades are never collected, and GPA is never calculated from them.

---

# 15. Simple and Advanced Academic History

The data model must support two levels of student information.

### Simple Mode

The student records course statuses without requiring historical semester information.

### Advanced Mode

The student can associate course activity with academic terms and provide the semester GPA.

The model should therefore allow academic-term information to be optional when the student uses Simple Mode.

---

# 16. Academic Requirements

A curriculum may contain requirements beyond individual courses.

Examples:

```text
Required total units
Category unit requirements
Elective unit requirements
Practical-unit requirements
Skill/employability requirements
```

Requirements should be represented independently so the Rules Engine can evaluate them.

Conceptually:

```text
Curriculum
    ↓
Requirement
    ↓
Course / Course Group / Category
```

A requirement that targets a course category (for example, "complete N units of BASIC") must identify **which** category it applies to. The category names are the ones defined in §7 and preserved in `06_Curriculum_Dataset.md`.

---

# 17. Practical Course Classification

Some requirements depend on whether a course is practical.

The course model should therefore support a practical classification.

Examples:

```text
THEORETICAL
PRACTICAL
```

or an equivalent boolean/type representation.

The dataset must define which courses are practical.

---

# 18. Curriculum Requirement Progress

UnitControl should be able to derive progress from:

```text
Curriculum
+
Curriculum Requirements
+
Student Course States
```

Examples:

```text
Completed Units
Remaining Units
Completed General Units
Completed Basic Units
Completed Specialized Units
Remaining Elective Units
```

These values should be calculated rather than manually stored as independent facts.

---

# 19. Data Ownership

Each type of information has one primary source of truth.

| Information                    | Source                         |
| ------------------------------ | ------------------------------ |
| Product scope                  | `01_Product_Overview.md`       |
| User flows                     | `02_User_Flow.md`              |
| UI behavior                    | `03_UX_UI_Specification.md`    |
| Academic rules                 | `04_Academic_Rules_Engine.md`  |
| Academic data structure        | `05_Curriculum_Data_Model.md`  |
| Actual courses/codes/curricula | `06_Curriculum_Dataset.md`     |
| Database implementation        | `07_Database_Schema.md`        |
| Admin functionality            | `08_Admin_Panel.md`            |
| Technical implementation       | `09_Technical_Requirements.md` |

---

# 20. Data Model Principles

### Separate Structure From Data

This document defines the structure.

Actual academic values belong to `06_Curriculum_Dataset.md`.

### Separate Data From Rules

This document defines relationships.

The Rules Engine decides what those relationships mean for a student.

### Support Curriculum Versions

Different entry years and orientations must be independently represented.

### Avoid Duplication

Course information should not be duplicated unnecessarily inside curriculum records.

### Preserve Source Data

Course names, codes, categories, and requirements should follow the verified dataset.

### Keep Student State Separate

A student's status must not modify the underlying curriculum.

---

# 21. Reference Flow

The complete academic data relationship is:

```text
Student
   ↓
Student Academic Profile
   ↓
Curriculum
   ↓
Curriculum Requirements
   ↓
Curriculum Courses
   ↓
Courses
   ↓
Course Relationships
```

Student activity is represented separately:

```text
Student
   ↓
Student Course State
   ├── Status
   ├── Academic Term
   └── Semester GPA
```

The Rules Engine combines these structures to determine the student's academic state.

---

# 22. Implementation Boundary

This document defines the **logical academic model only**.

The physical database representation must be defined in:

`07_Database_Schema.md`

The actual curriculum data must be defined in:

`06_Curriculum_Dataset.md`

The academic validation behavior must be defined in:

`04_Academic_Rules_Engine.md`

The final technical implementation must follow:

`09_Technical_Requirements.md`
