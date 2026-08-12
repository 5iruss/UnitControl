````md
# UnitControl — User Flow

**Version:** 1.0

---

## 1. Purpose

This document defines the main user flows of UnitControl.

It describes what users do and how the system responds.

Detailed interface design is defined in:

`03_UX_UI_Specification.md`

Academic decision logic is defined in:

`04_Academic_Rules_Engine.md`

Product scope is defined in:

`01_Product_Overview.md`

---

# 2. Student Flow

```text
Registration
    ↓
Academic Profile
    ↓
Academic Setup
    ↓
Dashboard
    ↓
Course Status / Planning
    ↓
Recommendations + Warnings
    ↓
Semester Planning
````

---

# 3. Registration

The student starts registration using their **student number**.

```text
Enter Student Number
        ↓
Create Password
        ↓
Enter First Name + Last Name
        ↓
Enter Phone Number
        ↓
Continue
```

The system creates the student account.

OTP is not required in the initial version.

---

# 4. Academic Profile Setup

The student provides the information required to identify their curriculum:

* Entry year
* Major
* Orientation
* Study type

The system uses this information to determine the appropriate curriculum.

Curriculum selection and data are defined in:

`05_Curriculum_Data_Model.md`

and

`06_Curriculum_Dataset.md`

---

# 5. Academic Setup

After creating the profile, the student chooses how they want to configure their academic history.

## Simple Mode

```text
Choose Simple Mode
        ↓
View Empty Curriculum
        ↓
Mark Current Course Statuses
        ↓
Enter Dashboard
```

The student does not need to enter semester history or individual course grades.

---

## Advanced Mode

```text
Choose Advanced Mode
        ↓
Select Academic Term
        ↓
Mark Courses Taken in That Term
        ↓
Set Final Course Statuses
        ↓
Enter Semester GPA
        ↓
Continue to Next Term
        ↓
Finish Setup
        ↓
Enter Dashboard
```

Individual course grades are not required.

Only the semester GPA is entered.

---

# 6. Dashboard Flow

After setup, the student enters the main dashboard.

The dashboard provides:

* Student information
* Academic statistics
* Course filters
* Course status toolbar
* Interactive curriculum map
* Recommended courses
* Academic warnings

The student can start interacting with the curriculum immediately.

---

# 7. Course Status Flow

The student selects a status from the Course Status Toolbar.

```text
Select Course Status
        ↓
Status Indicator Changes
        ↓
Select Course on Map
        ↓
Course Status Updated
        ↓
System Recalculates Academic State
```

Supported statuses include:

* Passed
* Failed
* Currently Studying
* Planned
* Not Completed

The system updates recommendations and warnings after relevant changes.

---

# 8. Course Planning Flow

The student selects a course they want to plan.

```text
Select Course
      ↓
Review Course Information
      ↓
Select Academic Term
      ↓
System Validates Course
      ↓
┌───────────────┴───────────────┐
│                               │
Valid                         Invalid
│                               │
↓                               ↓
Add to Plan              Show Reason / Warning
```

A course cannot be added when an academic rule prevents it.

The exact validation rules are defined in:

`04_Academic_Rules_Engine.md`

---

# 9. Recommendations Flow

The system continuously evaluates the student's academic state.

```text
Student Status
      ↓
Academic Rules
      ↓
Remaining Requirements
      ↓
Available Courses
      ↓
Recommended Courses
```

Each recommendation should provide a clear reason.

Example:

```text
Database
3 Units

Prerequisites satisfied.
```

---

# 10. Warning Flow

When the system detects an academic problem:

```text
Academic State Changes
        ↓
Rules Engine
        ↓
Problem Detected
        ↓
Warning Displayed
        ↓
Explain Problem
        ↓
Suggest Possible Action
```

Warnings should explain the reason instead of simply blocking the student.

---

# 11. Semester Planning Flow

The student can assign planned courses to academic terms.

```text
Select Course
      ↓
Select Term
      ↓
Validate Academic Rules
      ↓
Validate Credit Limit
      ↓
Add Course to Semester Plan
```

Term codes follow the university format.

Example:

```text
4051 = Mehr 1405
4052 = Bahman 1405
4053 = Summer 1405
```

The student can modify their plan until they are satisfied with the final version.

UnitControl does not need to reproduce the university's temporary add/drop history.

---

# 12. Semester GPA Flow

For advanced academic history:

```text
Select Semester
      ↓
Enter Course Statuses
      ↓
Enter Semester GPA
      ↓
Save Semester
```

The system uses the semester GPA for applicable academic credit-limit rules.

The system does not calculate GPA from individual course grades.

---

# 13. Academic Profile Change

The student can edit their academic profile.

If the change affects the student's curriculum:

```text
Edit Academic Profile
        ↓
System Detects Curriculum Change
        ↓
Show Reset Warning
        ↓
Student Confirms
        ↓
Reset Academic Course Data
        ↓
Student Reconfigures Academic Status
```

The reset must require explicit confirmation.

---

# 14. Login Flow

Returning students can log in using:

```text
Student Number + Password
```

or:

```text
Phone Number + Password
```

After successful authentication:

```text
Login
  ↓
Dashboard
```

---

# 15. Password Support Flow

If the student cannot access their account:

```text
Request Support
      ↓
Support Reviews Request
      ↓
Account Verification
      ↓
Password Reset / Change
      ↓
Student Logs In
```

OTP is not part of the initial authentication flow.

---

# 16. Admin / Support Flow

Administrators and support staff use a separate management interface.

High-level flow:

```text
Admin / Support Login
        ↓
Admin Panel
        ↓
Select Management Area
        ↓
View / Edit Data
        ↓
Save Changes
        ↓
System Validates Changes
```

Detailed administrative functionality is defined in:

`08_Admin_Panel.md`

---

# 17. Overall Student Journey

```text
                    ┌──────────────┐
                    │ Registration │
                    └──────┬───────┘
                           ↓
                  ┌──────────────────┐
                  │ Academic Profile │
                  └────────┬─────────┘
                           ↓
                 ┌────────────────────┐
                 │ Simple / Advanced  │
                 │       Setup        │
                 └─────────┬──────────┘
                           ↓
                    ┌────────────┐
                    │ Dashboard  │
                    └─────┬──────┘
                          ↓
              ┌───────────────────────┐
              │ Interactive Curriculum│
              │          Map          │
              └───────────┬───────────┘
                          ↓
          ┌───────────────┼───────────────┐
          ↓               ↓               ↓
      Course Status    Semester Plan   Course Details
          │               │               │
          └───────────────┼───────────────┘
                          ↓
                ┌───────────────────┐
                │ Academic Rules    │
                │    Validation     │
                └─────────┬─────────┘
                          ↓
             ┌────────────┴────────────┐
             ↓                         ↓
       Recommendations             Warnings
```

---

# 18. Flow Principles

* Keep the student journey simple.
* Ask for information only when needed.
* Do not require individual course grades.
* Allow students to correct their academic data.
* Explain academic problems clearly.
* Do not silently reset student data.
* Do not duplicate academic rules inside the user flow.
* Keep detailed UI behavior in `03_UX_UI_Specification.md`.
* Keep academic logic in `04_Academic_Rules_Engine.md`.

```
```
