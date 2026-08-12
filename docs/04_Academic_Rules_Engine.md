# UnitControl — Academic Rules Engine

**Version:** 1.0  
**Status:** Core Rules Specification

---

## 1. Purpose

This document defines the academic decision and validation rules used by UnitControl.

The Rules Engine determines:

- Whether a course can be taken.
- Whether a prerequisite has been satisfied.
- Whether a corequisite condition is satisfied.
- Whether a semester plan exceeds the allowed credit limit.
- Whether a failed course creates an academic risk.
- Which courses can be recommended.
- Which academic warnings should be shown.

The UI must display the result of these rules but must not redefine them.

References:

- Product scope → `01_Product_Overview.md`
- User flows → `02_User_Flow.md`
- UI behavior → `03_UX_UI_Specification.md`
- Academic structure → `05_Curriculum_Data_Model.md`
- Actual academic data → `06_Curriculum_Dataset.md`

---

# 2. Course Statuses

UnitControl supports the following student course statuses:

```text
NOT_COMPLETED
PASSED
FAILED
CURRENTLY_STUDYING
PLANNED
````

## NOT_COMPLETED

The student has not taken the course.

## PASSED

The student has successfully completed the course.

## FAILED

The student has previously taken the course but has not passed it.

## CURRENTLY_STUDYING

The student is currently taking the course.

## PLANNED

The student intends to take the course in a future semester.

---

# 3. Prerequisite Rule

If Course A is a prerequisite for Course B:

```text
Course A
   ↓
Course B
```

Course B may only be taken if Course A has been **previously attempted**.

Therefore:

| Course A status                       | Course B                                |
| ------------------------------------- | --------------------------------------- |
| PASSED                                | Allowed                                 |
| FAILED                                | Allowed, subject to failed-course rules |
| CURRENTLY_STUDYING for the first time | Not allowed                             |
| PLANNED only                          | Not allowed                             |
| NOT_COMPLETED                         | Not allowed                             |

A prerequisite cannot be satisfied merely by planning or taking the prerequisite for the first time in the same semester.

---

# 4. Failed Prerequisite Rule

A failed prerequisite is considered **attempted**.

Therefore, failing Course A does not automatically prevent the student from taking Course B.

Example:

```text
Course A → prerequisite → Course B
```

If:

```text
Course A = FAILED
```

then:

```text
Course B = potentially available
```

However, the failed course creates an academic risk that must be shown to the student.

---

# 5. Failed Course Recovery Window

When a student fails a course, they have a limited period to pass it.

The project rule currently defined is:

> The student has two semesters from the semester in which the course was failed to successfully pass that course.

After the allowed period expires, the system must flag the failed course as an academic risk and evaluate its effect on subsequent courses.

The exact university interpretation of the counting period should be verified before production deployment.

Until verified, the implementation must treat the exact counting mechanism as:

```text
TBD — Requires official academic verification
```

Whether an **expired** failed course only warns, or actually **blocks** subsequent (dependent) courses, is also unresolved:

```text
TBD — Requires official academic verification
```

---

# 6. Corequisite Rule

If Course A and Course B are corequisites:

```text
Course A
   - - - -
Course B
```

the courses may be taken together when the curriculum defines them as corequisites.

The exact corequisite relationships must come from:

`06_Curriculum_Dataset.md`

The Rules Engine must not invent corequisite relationships.

The precise enforcement semantics — whether a corequisite must be taken **in the same semester**, or **at the same time or earlier** — is not yet decided:

```text
TBD — Requires official academic verification
```

---

# 7. Same-Semester Prerequisite Rule

A student cannot satisfy a prerequisite by taking both courses for the first time during the same semester.

Example:

```text
A → prerequisite → B
```

Invalid:

```text
4051:
A + B
```

when A has never previously been attempted.

Valid:

```text
4051:
A

4052:
B
```

---

# 8. Course Availability

A course is considered available when all required academic conditions are satisfied.

Conceptually:

```text
Course Available =
Curriculum Match
+
Prerequisites Satisfied
+
Corequisites Satisfied
+
Credit Limit Satisfied
+
Other Applicable Rules Satisfied
```

The system must evaluate all applicable rules before allowing a course to be added to a semester plan.

---

# 9. Course Blocking

A course should be considered blocked when one or more required academic conditions are not satisfied.

Possible reasons include:

* Missing prerequisite.
* Invalid same-semester prerequisite.
* Corequisite condition not satisfied.
* Credit limit exceeded.
* Curriculum requirement conflict.
* Other verified academic restrictions.

The system should always provide the reason for blocking a course.

---

# 10. Course Recommendations

The Rules Engine should identify courses that are suitable candidates for the student's next semester.

A course can be recommended when:

* It belongs to the student's curriculum.
* It has not already been passed.
* Its prerequisite requirements are satisfied.
* Its corequisite requirements are satisfied.
* Adding it does not violate the applicable credit limit.
* It contributes toward an unfinished curriculum requirement.

Recommendations should prioritize useful courses rather than simply displaying every technically available course.

The exact recommendation priority can be expanded later.

---

# 11. Credit Limit Rules

The maximum number of units a student may take depends on academic conditions.

Relevant factors include:

* Semester GPA.
* Study type.
* Final-semester status.
* Other verified university rules.

The system must not hardcode unverified values.

The exact credit-limit table must be verified before production deployment.

Current project requirement:

```text
Semester GPA
      +
Study Type
      +
Applicable Academic Exceptions
      ↓
Maximum Allowed Units
```

---

# 12. Semester GPA

UnitControl does not calculate GPA from individual course grades.

For the Advanced Setup, the student enters their semester GPA directly.

The GPA is used by the Rules Engine where required, primarily for determining applicable semester credit limits.

Individual course grades are outside the current scope.

---

# 13. Full-Time and Part-Time Students

The Rules Engine must support different study types:

```text
FULL_TIME
PART_TIME
```

The applicable credit limits may differ between them.

The exact official limits must be verified before implementation.

Until verified:

```text
Status: TBD
```

---

# 14. Final Semester Rules

Final-semester students may be subject to special academic rules.

The Rules Engine must support final-semester exceptions without hardcoding assumptions.

Potential final-semester rules may affect:

* Maximum units.
* Course selection.
* Graduation requirements.
* Prerequisite handling.

The exact rules must be verified from the applicable university regulations.

Until verified:

```text
Final Semester Rules = TBD
```

---

# 15. Curriculum Matching

The student's curriculum is determined from their academic profile.

Relevant information includes:

* Entry year.
* Major (Computer Engineering for all supported curricula).
* Orientation.

Software Engineering and Information Technology are **orientations** of the Computer Engineering major, not separate majors. Curriculum assignment is driven by entry year plus orientation.

The system must assign the correct curriculum version.

Current curriculum groups (major = Computer Engineering):

```text
Entry Year <= 1402
├── Orientation: Software Engineering
└── Orientation: Information Technology

Entry Year >= 1403
└── Orientation: Unified
```

The actual curriculum definitions are stored in:

`06_Curriculum_Dataset.md`

---

# 16. Curriculum Isolation

Academic rules and course relationships must be evaluated against the student's assigned curriculum.

A course or relationship from another curriculum must not automatically be applied.

For example:

```text
Software Engineering — Before 1403
```

must remain separate from:

```text
Computer Engineering — 1403+
```

unless an explicit relationship is defined in the dataset.

---

# 17. Semester Structure

Academic terms use the following format:

```text
4051 = Mehr 1405
4052 = Bahman 1405
4053 = Summer 1405
```

The system must treat the final digit as the semester type:

```text
1 = Mehr
2 = Bahman
3 = Summer
```

This structure is used when evaluating:

* Previous course attempts.
* Failed-course recovery periods.
* Semester planning.
* Semester GPA.
* Credit limits.

---

# 18. Course Attempt History

For prerequisite evaluation, the Rules Engine must distinguish between:

```text
Never Attempted
Previously Attempted
Currently Being Attempted
Previously Passed
Previously Failed
```

A prerequisite is satisfied by a **previous attempt**, not merely by being planned.

The database implementation is defined separately in:

`07_Database_Schema.md`

---

# 19. Academic Warnings

The Rules Engine should produce structured warnings rather than only returning true/false.

A warning should contain:

```text
type
severity
course
reason
suggested_action
```

Example:

```text
Type:
FAILED_COURSE_RISK

Severity:
WARNING

Course:
Course A

Reason:
The course was previously failed and is approaching the allowed recovery period.

Suggested Action:
Retake the course within the permitted period.
```

---

# 20. Validation Result

A course validation should conceptually return:

```text
allowed
status
reasons[]
warnings[]
```

Example:

```json
{
  "allowed": false,
  "status": "BLOCKED",
  "reasons": [
    "Prerequisite has not been previously attempted."
  ],
  "warnings": []
}
```

Another example:

```json
{
  "allowed": true,
  "status": "AVAILABLE",
  "reasons": [],
  "warnings": [
    "A prerequisite was previously failed."
  ]
}
```

The exact API structure is defined later in:

`09_Technical_Requirements.md`

---

# 21. Planning Validation

When a student adds a course to a semester plan, the Rules Engine should evaluate:

```text
1. Is the course part of the student's curriculum?
2. Has the course already been passed?
3. Are prerequisites satisfied?
4. Are corequisites satisfied?
5. Is the course being taken in an invalid same-semester relationship?
6. Is the semester credit limit exceeded?
7. Is there another verified academic restriction?
```

If any blocking condition exists, the course must not be added.

Warnings that do not prevent enrollment may still be displayed.

---

# 22. Recalculation

The academic state should be recalculated when relevant student data changes.

Examples:

* Course status changes.
* A course is added to a semester.
* A course is removed from a semester.
* Semester GPA changes.
* Academic profile changes.
* Curriculum changes.

After recalculation, the system may update:

* Available courses.
* Blocked courses.
* Recommendations.
* Warnings.
* Statistics.

---

# 23. Academic Profile Reset

If the student changes an academic profile value that changes their curriculum:

```text
Entry Year
Major
Orientation
```

the system must:

1. Warn the student.
2. Require explicit confirmation.
3. Reset the existing academic course-status data.
4. Assign the new curriculum.
5. Require the student to configure their academic status again.

This behavior is described from the user perspective in:

`02_User_Flow.md`

and visually in:

`03_UX_UI_Specification.md`

---

# 24. Rules Source of Truth

Academic rules must come from verified project requirements or official academic sources.

The Rules Engine must not invent:

* Prerequisites.
* Corequisites.
* Credit limits.
* Final-semester exceptions.
* Failed-course deadlines.
* Graduation requirements.

Actual course relationships and curriculum data belong to:

`06_Curriculum_Dataset.md`

---

# 25. Current Verification Status

The following rules are defined conceptually but require official verification before being treated as final production rules:

```text
- Exact full-time credit limits
- Exact part-time credit limits
- Exact final-semester exceptions
- Exact failed-course two-semester counting method
- Any additional university-specific exceptions
```

These values must be finalized before production deployment.

---

# 26. References

This document depends on:

`01_Product_Overview.md`
Product scope and goals.

`02_User_Flow.md`
User interaction flows.

`03_UX_UI_Specification.md`
How rule results are represented in the interface.

`05_Curriculum_Data_Model.md`
Structure of academic entities and relationships.

`06_Curriculum_Dataset.md`
Actual courses, curricula, codes, and verified academic relationships.

The Rules Engine is implemented through:

`07_Database_Schema.md`
Data persistence.

`09_Technical_Requirements.md`
Technical implementation.

`10_Claude_Master_Prompt.md`
Final implementation instructions.

---

# 27. Rule Priority

When evaluating a course, the system should follow this order:

```text
Student Curriculum
        ↓
Course Exists in Curriculum
        ↓
Course Status
        ↓
Prerequisites
        ↓
Corequisites
        ↓
Semester Constraints
        ↓
Credit Limit
        ↓
Other Verified Academic Rules
        ↓
Final Result
```

The result must clearly distinguish between:

```text
AVAILABLE
BLOCKED
AVAILABLE_WITH_WARNING
```

The Rules Engine is responsible for determining the result.

The UI is responsible only for presenting that result.
