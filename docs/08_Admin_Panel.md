````md
# UnitControl — Admin Panel

**Version:** 1.0  
**Status:** Initial Specification

---

## 1. Purpose

The Admin Panel allows authorized staff to manage UnitControl's academic data and provide basic student support.

It should remain separate from the student-facing application.

The Admin Panel manages:

- Curricula
- Courses
- Course relationships
- Academic requirements
- Student support
- Administrative access

---

# 2. Admin Roles

The initial system should support these roles:

### Super Admin

Full system access.

Can manage:

- Administrators
- Permissions
- Curricula
- Courses
- Academic relationships
- Academic requirements
- System settings

### Academic Group Manager

Responsible for academic content.

Can manage:

- Curricula
- Courses
- Course categories
- Course relationships
- Curriculum requirements

### Support Staff

Responsible for student account support.

Can:

- Search students
- View basic account information
- Assist with password recovery/reset
- View relevant student academic information when required for support

Support staff should not modify academic curriculum data unless explicitly authorized.

---

# 3. Admin Authentication

Administrators must authenticate through a separate administrative login.

Access to the Admin Panel must be role-based.

Unauthorized users must not be able to access administrative functions.

Authentication implementation is defined in:

`09_Technical_Requirements.md`

---

# 4. Dashboard

The Admin Dashboard should provide a simple overview of the system.

Possible information:

- Total students
- Active students
- Curriculum count
- Course count
- Pending support requests
- Recent administrative activity

The dashboard should remain lightweight and focused on useful information.

---

# 5. Curriculum Management

Academic Group Managers can manage curriculum definitions.

A curriculum should contain information such as:

- Name
- Major
- Orientation
- Entry-year range
- Required units
- Status

Example:

```text
Computer Engineering
Entry Year: 1403+
````

Curriculum structure is defined in:

`05_Curriculum_Data_Model.md`

Actual curriculum data is defined in:

`06_Curriculum_Dataset.md`

---

# 6. Course Management

Authorized administrators can manage course records.

Course information may include:

* Course name
* Course code
* Credits
* Category
* Practical/theoretical classification
* Curriculum association

Administrators should be able to:

* Create a course
* Edit a course
* Disable/archive a course
* Associate a course with a curriculum

Course codes and academic information should be verified before being published as authoritative data.

---

# 7. Course Relationships

Administrators can manage relationships between courses.

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

The Admin Panel manages the relationship data.

The meaning and validation behavior are defined in:

`04_Academic_Rules_Engine.md`

Relationships must not be invented or added without a verified source.

---

# 8. Curriculum Requirements

Authorized academic administrators can manage curriculum requirements such as:

* Total required units
* Category requirements
* Elective requirements
* Practical-unit requirements
* Course-group requirements

The Admin Panel should provide validation before saving changes.

---

# 9. Course Groups and Electives

Administrators should be able to manage grouped course requirements.

Examples:

```text
Specialized Electives
Electives
```

A group can define:

* Group name
* Required units
* Eligible courses
* Minimum/maximum course count
* Practical-course requirements where applicable

---

# 10. Student Search

Support staff and authorized administrators should be able to search for students.

Search may use:

* Student number
* Phone number
* Name

The result should provide only the information required for the user's role.

---

# 11. Student Support

Support staff can assist students with account-related problems.

Typical support flow:

```text
Search Student
      ↓
Verify Student
      ↓
Review Account
      ↓
Perform Authorized Support Action
      ↓
Confirm Result
```

Possible actions include:

* Password reset/change
* Account access assistance
* Reviewing basic account information

The system should avoid exposing unnecessary personal information.

---

# 12. Academic Profile Support

Authorized staff may view a student's academic profile when necessary for support.

Academic profile information may include:

* Student number
* Entry year
* Major
* Orientation
* Study type
* Assigned curriculum

Changing the student's curriculum-related profile should follow the same reset rules defined in:

`04_Academic_Rules_Engine.md`

and

`02_User_Flow.md`

---

# 13. Data Changes

Academic data changes should be handled carefully.

Changes to:

* Course codes
* Course relationships
* Curriculum requirements
* Curriculum versions

can affect student academic calculations.

Before publishing significant changes, the system should validate the affected data.

---

# 14. Archive Instead of Delete

Academic records should generally not be permanently deleted when they may be referenced by existing students or historical data.

Where appropriate, use:

```text
ACTIVE
INACTIVE
ARCHIVED
```

instead of destructive deletion.

This helps preserve historical consistency.

---

# 15. Audit Log

Important administrative changes should be recorded.

Examples:

* Curriculum created/updated
* Course created/updated
* Prerequisite changed
* Corequisite changed
* Requirement changed
* Student account support action
* Administrative permission change

An audit record should contain at least:

```text
admin
action
target
timestamp
```

Additional details can be defined in:

`09_Technical_Requirements.md`

---

# 16. Permissions

Administrative permissions should follow the user's role.

Conceptually:

| Action               | Super Admin | Academic Manager | Support |
| -------------------- | ----------: | ---------------: | ------: |
| Manage admins        |           ✓ |                — |       — |
| Manage curricula     |           ✓ |                ✓ |       — |
| Manage courses       |           ✓ |                ✓ |       — |
| Manage relationships |           ✓ |                ✓ |       — |
| Manage requirements  |           ✓ |                ✓ |       — |
| Search students      |           ✓ |                ✓ |       ✓ |
| Account support      |           ✓ |                — |       ✓ |
| View system activity |           ✓ |          Limited | Limited |

The exact permission implementation belongs to:

`09_Technical_Requirements.md`

---

# 17. Academic Data Safety

The Admin Panel must prevent accidental corruption of academic data.

Before saving sensitive changes, the system should:

1. Validate the data.
2. Show the affected information.
3. Require confirmation where appropriate.
4. Record the change in the audit log.

The system should never silently modify student academic records because of an administrative data change.

---

# 18. Source of Truth

| Area                     | Source                         |
| ------------------------ | ------------------------------ |
| Product scope            | `01_Product_Overview.md`       |
| User flows               | `02_User_Flow.md`              |
| UI behavior              | `03_UX_UI_Specification.md`    |
| Academic rules           | `04_Academic_Rules_Engine.md`  |
| Academic data structure  | `05_Curriculum_Data_Model.md`  |
| Actual academic data     | `06_Curriculum_Dataset.md`     |
| Database structure       | `07_Database_Schema.md`        |
| Admin functionality      | `08_Admin_Panel.md`            |
| Technical implementation | `09_Technical_Requirements.md` |

---

# 19. Implementation Boundary

This document defines **what the Admin Panel should allow administrators to do**.

It does not define:

* Database implementation
* Authentication technology
* API implementation
* Frontend framework
* Hosting
* Deployment

Those decisions belong to:

`09_Technical_Requirements.md`

The Admin Panel must remain consistent with:

`04_Academic_Rules_Engine.md`

`05_Curriculum_Data_Model.md`

`06_Curriculum_Dataset.md`

`07_Database_Schema.md`

```
```
