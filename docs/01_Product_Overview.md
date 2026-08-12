# Academic Planner — Product Overview

**Version:** 1.0  
**Status:** Foundation Specification

---

## 1. Product

Academic Planner is a web-based academic planning system for Computer Engineering students.

It transforms a static university curriculum into an interactive academic map that helps students:

- Track their course status.
- Understand prerequisite and corequisite relationships.
- Identify courses they can take.
- Plan future semesters.
- Detect academic problems.
- See their academic progress.

Academic Planner is a **planning assistant**, not the university's official course-registration system.

---

## 2. Problem

Traditional curriculum charts are static and difficult for students to interpret.

Students often need to manually determine:

- Which courses they have completed.
- Which courses they have failed.
- Which courses they can take next.
- Whether prerequisites have been satisfied.
- Whether a failed course may affect future courses.
- How many units they can take.
- Which courses are appropriate for the next semester.

Academic Planner automates this reasoning and presents it visually.

---

## 3. Product Goal

The system should answer three questions clearly:

1. **Where am I in my academic path?**
2. **What can I take next?**
3. **What academic problems should I know about?**

---

## 4. Target Users

### Students

Primary users who use the system to:

- Configure their academic profile.
- Record course statuses.
- View their curriculum.
- Plan semesters.
- Receive recommendations.
- See academic warnings.

### Academic Group Managers

Administrators responsible for maintaining:

- Curricula
- Courses
- Course relationships
- Academic rules
- Curriculum requirements

### Support Staff

Responsible for basic student account support, such as password recovery.

---

## 5. Academic Scope

The initial system supports Computer Engineering curricula:

- Software Engineering — entry year 1402 and before
- Information Technology — entry year 1402 and before
- Computer Engineering — entry year 1403 and after

The actual academic data is defined in:

`06_Curriculum_Dataset.md`

The academic data structure is defined in:

`05_Curriculum_Data_Model.md`

---

## 6. Core Experience

The main interface is an interactive curriculum map.

Students can assign statuses to courses:

- Passed
- Failed
- Currently Studying
- Planned
- Not Completed

The map visually represents course relationships and highlights courses that are currently available or blocked.

The detailed academic behavior is defined in:

`04_Academic_Rules_Engine.md`

---

## 7. Main Dashboard

The dashboard contains:

### Student Information

Basic academic and identity information.

### Course Filters

Filters for viewing different course states.

### Course Status Toolbar

Allows students to select a status and apply it directly to courses on the map.

### Academic Statistics

Shows useful progress information such as completed and remaining units.

### Curriculum Map

The central interactive academic chart.

### Recommendations

Courses the student may currently be able to take.

### Warnings

Academic problems detected by the rules engine.

Detailed interface behavior is defined in:

`03_UX_UI_Specification.md`

---

## 8. Academic Planning

Students can assign courses to academic terms.

Term codes use the university format:

- `4051` — Mehr 1405
- `4052` — Bahman 1405
- `4053` — Summer 1405

The system validates planned courses against the academic rules.

---

## 9. Academic Setup

Students can configure their academic history in two ways.

### Simple Mode

Students quickly mark their current course statuses without entering detailed semester history.

### Advanced Mode

Students enter their academic history semester by semester.

Only the **semester GPA** is required.

Individual course grades are not required.

---

## 10. Student Data

The system intentionally collects limited information.

Required information includes:

- Student number
- First name
- Last name
- Phone number
- Entry year
- Major
- Orientation
- Study type
- Password

The system should not collect unnecessary personal information.

---

## 11. Authentication

Registration is based on the student's student number.

The student creates a password during registration.

Login supports:

- Student number + password
- Phone number + password

OTP is not part of the initial MVP.

Password recovery is handled through the support process.

---

## 12. Profile Changes

Students can modify their academic profile.

If a change affects their curriculum, such as entry year, major, or orientation, the system must clearly warn them that their existing academic course-status data will be reset.

The reset requires explicit confirmation.

---

## 13. MVP Scope

The MVP includes:

- Student registration and login
- Student academic profile
- Simple and advanced academic setup
- Curriculum selection
- Interactive curriculum map
- Course statuses
- Course filters
- Prerequisite/corequisite validation
- Semester planning
- Credit-limit validation
- Course recommendations
- Academic warnings
- Academic statistics
- Admin/support panel

---

## 14. Out of Scope

The MVP does not include:

- Official university course registration
- Payment systems
- Attendance management
- Individual course-grade management
- Class scheduling
- Financial/student account management
- Unnecessary student information
- Full university ERP functionality

---

## 15. Product Principles

### Simplicity

Do not add features that do not directly improve academic planning.

### Minimum Data

Collect only information required for the product to work.

### Visual First

Academic progress and relationships should be understandable visually.

### Explain, Don't Just Block

When a course is unavailable, explain why.

### Student Control

Students control their academic status and semester planning.

### No Invented Academic Rules

Academic rules and course relationships must come from verified project data.

---

## 16. Documentation References

This document defines the product foundation.

- `02_User_Flow.md` — user journeys and system flows
- `03_UX_UI_Specification.md` — interface and interaction behavior
- `04_Academic_Rules_Engine.md` — academic validation and rules
- `05_Curriculum_Data_Model.md` — academic data structure
- `06_Curriculum_Dataset.md` — actual curriculum and course data
- `07_Database_Schema.md` — database structure
- `08_Admin_Panel.md` — administration and support
- `09_Technical_Requirements.md` — implementation requirements
- `10_Claude_Master_Prompt.md` — final implementation instructions

Later documents must reference this document rather than redefining the product scope.
