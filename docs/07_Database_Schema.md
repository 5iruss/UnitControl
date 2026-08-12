````md
# UnitControl — Database Schema

**Version:** 1.0  
**Status:** Initial Schema Specification

---

## 1. Purpose

This document defines how UnitControl data should be persisted.

It translates the logical structures defined in:

- `05_Curriculum_Data_Model.md`
- `06_Curriculum_Dataset.md`
- `04_Academic_Rules_Engine.md`

into a database structure.

This document defines data storage and relationships.

It does not define:

- Product behavior → `01_Product_Overview.md`
- User flows → `02_User_Flow.md`
- UI behavior → `03_UX_UI_Specification.md`
- Technical stack → `09_Technical_Requirements.md`

---

# 2. Database Principles

The database should:

- Keep curriculum data separate from student data.
- Support multiple curriculum versions.
- Keep course definitions independent from curricula.
- Store prerequisite/corequisite relationships separately.
- Keep student course status separate from the curriculum.
- Avoid storing values that can be calculated from existing data.
- Preserve academic term information when required.
- Support future curriculum updates without changing historical student data.

---

# 3. Entity Overview

```text
User
 │
 └── Student Profile
        │
        └── Curriculum
               │
               ├── Curriculum Courses
               │       │
               │       └── Courses
               │
               ├── Curriculum Groups
               │
               └── Requirements

Course
 │
 └── Course Relationships
       ├── Prerequisite
       └── Corequisite

Student
 │
 ├── Student Course States
 │
 └── Semester Records
````

---

# 4. Users

Stores authentication and basic account information.

### Fields

```text
users
- id
- student_number
- phone_number
- password_hash
- first_name
- last_name
- role
- created_at
- updated_at
```

### Notes

* `student_number` must be unique.
* `phone_number` should be unique where applicable.
* Passwords must never be stored as plain text.
* Roles should support at least student and administrative/support users.

---

# 5. Student Profiles

Stores academic information associated with a student.

### Fields

```text
student_profiles
- id
- user_id
- entry_year
- major
- orientation
- study_type
- curriculum_id
- created_at
- updated_at
```

### Relationships

```text
users 1 ─── 1 student_profiles

student_profiles N ─── 1 curricula
```

The assigned curriculum should be determined from the student's academic profile.

---

# 6. Curricula

Represents a specific curriculum/version.

### Fields

```text
curricula
- id
- name
- major
- orientation
- entry_year_from
- entry_year_to
- total_required_units
- status
- created_at
- updated_at
```

### Examples

```text
Software Engineering — Entry <= 1402
Information Technology — Entry <= 1402
Computer Engineering — Entry >= 1403
```

Curriculum definitions originate from:

`06_Curriculum_Dataset.md`

---

# 7. Courses

Stores the global definition of a course.

### Fields

```text
courses
- id
- course_code
- name
- credits
- course_type
- is_practical
- created_at
- updated_at
```

### Notes

A course should exist only once in the global course table when the same course is shared across curricula.

Curriculum-specific roles should be stored through the curriculum relationship.

Course codes and names come from:

`06_Curriculum_Dataset.md`

---

# 8. Curriculum Courses

Connects courses to curricula and defines their role within that curriculum.

### Fields

```text
curriculum_courses
- id
- curriculum_id
- course_id
- category
- required
- elective_group_id
- created_at
- updated_at
```

### Relationships

```text
curricula 1 ─── N curriculum_courses
courses    1 ─── N curriculum_courses
```

This allows the same course to have different roles in different curricula.

---

# 9. Course Groups

Used for elective or grouped curriculum requirements.

### Fields

```text
course_groups
- id
- curriculum_id
- name
- group_type
- required_units
- minimum_courses
- maximum_courses
- created_at
- updated_at
```

Examples:

```text
Specialized Electives
Electives
Other curriculum-specific groups
```

---

# 10. Course Group Membership

Defines which courses can satisfy a course group.

### Fields

```text
course_group_courses
- id
- course_group_id
- course_id
```

### Relationships

```text
course_groups N ─── N courses
```

This prevents elective eligibility from being duplicated inside individual course records.

---

# 11. Curriculum Requirements

Stores requirements that must be satisfied for a curriculum.

### Fields

```text
curriculum_requirements
- id
- curriculum_id
- requirement_type
- name
- required_units
- minimum_practical_units
- course_group_id
- created_at
- updated_at
```

Possible requirement types include:

```text
TOTAL_UNITS
CATEGORY_UNITS
ELECTIVE_UNITS
PRACTICAL_UNITS
COURSE_GROUP
```

The exact requirements come from the curriculum dataset.

---

# 12. Course Relationships

Stores relationships between courses.

### Fields

```text
course_relationships
- id
- source_course_id
- target_course_id
- relationship_type
- created_at
- updated_at
```

Supported relationship types:

```text
PREREQUISITE
COREQUISITE
```

Example:

```text
Course A
   ↓
PREREQUISITE
   ↓
Course B
```

The database stores the relationship.

The academic meaning is defined by:

`04_Academic_Rules_Engine.md`

---

# 13. Academic Terms

Stores academic semesters used by student history and planning.

### Fields

```text
academic_terms
- id
- term_code
- academic_year
- term_type
```

Example:

```text
4051 → Mehr 1405
4052 → Bahman 1405
4053 → Summer 1405
```

The original university term code should be preserved.

---

# 14. Student Course States

Stores the student's current or historical relationship with a course.

### Fields

```text
student_courses
- id
- student_id
- course_id
- status
- academic_term_id
- created_at
- updated_at
```

Supported statuses:

```text
NOT_COMPLETED
PASSED
FAILED
CURRENTLY_STUDYING
PLANNED
```

### Notes

The curriculum itself must never be modified when a student changes a course status.

Student state is separate from curriculum data.

---

# 15. Semester Records

Used by Advanced Setup to store semester-level academic information.

### Fields

```text
student_semesters
- id
- student_id
- academic_term_id
- semester_gpa
- created_at
- updated_at
```

The semester GPA is entered by the student.

UnitControl does not calculate it from individual course grades.

---

# 16. Student Course Planning

The `student_courses` structure can represent planned courses through:

```text
status = PLANNED
```

and:

```text
academic_term_id
```

This allows the system to know which semester the student plans to take a course.

Temporary university add/drop history is outside the current scope.

---

# 17. Simple vs Advanced Setup

The database should support both modes without requiring separate academic data structures.

### Simple Mode

A student may have:

```text
student_courses
- status
- no historical academic term
```

where term information is not required.

### Advanced Mode

A student may have:

```text
student_courses
- status
- academic_term_id

student_semesters
- semester_gpa
```

The same underlying structures support both modes.

---

# 18. Data Relationships

The main relationships are:

```text
users
  │
  └── student_profiles
          │
          └── curricula
                  │
                  ├── curriculum_courses ── courses
                  │
                  ├── course_groups
                  │       │
                  │       └── course_group_courses ── courses
                  │
                  └── curriculum_requirements

courses
  │
  └── course_relationships

student_profiles
  │
  ├── student_courses ── courses
  │        │
  │        └── academic_terms
  │
  └── student_semesters ── academic_terms
```

---

# 19. Curriculum Isolation

Student academic data must always be evaluated against the student's assigned curriculum.

A course belonging to another curriculum must not automatically become available to the student.

Curriculum selection is based on the student's academic profile.

---

# 20. Calculated Data

The following values should generally be calculated rather than stored independently:

* Completed units
* Remaining units
* Number of passed courses
* Category progress
* Available courses
* Blocked courses
* Recommendations
* Academic warnings

These values are derived from:

```text
Student Profile
+
Curriculum
+
Student Course States
+
Curriculum Requirements
+
Course Relationships
```

---

# 21. Reset Behavior

If a student changes an academic profile value that changes their curriculum:

```text
entry_year
major
orientation
```

the existing student academic course-state data must be reset after explicit confirmation.

The curriculum itself must not be deleted or modified.

The new profile should receive the appropriate curriculum.

---

# 22. Data Integrity

The database should enforce:

* Unique student numbers.
* Valid user-to-profile relationships.
* Valid curriculum-to-course relationships.
* Valid course relationship references.
* Valid academic term references.
* Valid course status values.
* Valid curriculum assignments.
* No self-referencing course relationships unless explicitly required.
* No duplicate course relationship records.

---

# 23. Source of Truth

| Data                     | Source                         |
| ------------------------ | ------------------------------ |
| Product behavior         | `01_Product_Overview.md`       |
| User flow                | `02_User_Flow.md`              |
| UI behavior              | `03_UX_UI_Specification.md`    |
| Academic rules           | `04_Academic_Rules_Engine.md`  |
| Logical data model       | `05_Curriculum_Data_Model.md`  |
| Actual academic data     | `06_Curriculum_Dataset.md`     |
| Database structure       | `07_Database_Schema.md`        |
| Admin behavior           | `08_Admin_Panel.md`            |
| Technical implementation | `09_Technical_Requirements.md` |

---

# 24. Implementation Boundary

This document defines the **logical database schema**.

It does not prescribe:

* Database engine.
* ORM.
* Backend framework.
* API implementation.
* Authentication library.
* Hosting provider.

Those decisions belong to:

`09_Technical_Requirements.md`

The database implementation must remain consistent with:

`05_Curriculum_Data_Model.md`

and

`06_Curriculum_Dataset.md`.

```
```
