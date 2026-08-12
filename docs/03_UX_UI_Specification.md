You are working on the UnitControl project.

Your task is to create:

03_UX_UI_Specification.md

Before writing anything, read these project documents:

1. 01_Product_Overview.md
2. 02_User_Flow.md

These files are the source of truth for the product scope and user flows.

Your job is to define the UX/UI specification for UnitControl based ONLY on the decisions already established in those documents and the project context.

IMPORTANT:
- Do not invent new product features.
- Do not change previously established product decisions.
- Do not define academic rules here. Those belong to 04_Academic_Rules_Engine.md.
- Do not define database structures. Those belong to 07_Database_Schema.md.
- Do not define technical implementation details. Those belong to 09_Technical_Requirements.md.
- Do not duplicate large amounts of information from Files 01 and 02.
- Keep this document short, clear, and implementation-oriented.
- If something is not yet decided, mark it as TBD instead of inventing a solution.

The document should define:

1. UX/UI goals
2. Overall application layout
3. Main dashboard structure
4. Student information section
5. Academic statistics section
6. Course-status filter toolbar
7. Course-status interaction and cursor behavior
8. Interactive curriculum map
9. Course node/card structure
10. Visual states for:
   - Passed
   - Failed
   - Currently Studying
   - Planned
   - Not Completed
   - Available
   - Blocked
11. Visual representation of prerequisite relationships
12. Visual representation of corequisite relationships
13. Course interaction behavior
14. Course details view
15. Semester selection for planned courses

IMPORTANT:
Do NOT create a separate "Term 1 / Term 2 / Term 3" structure around the curriculum map.

The curriculum map remains the central academic visualization.

When planning a course, the student should be able to select the academic term associated with that course.

The academic term format is:

4051 = Mehr 1405
4052 = Bahman 1405
4053 = Summer 1405

Also define:

16. Recommended Courses panel
17. Academic Problems / Warnings panel
18. Simple Setup UI
19. Advanced Setup UI
20. Profile-change/reset warning UI
21. Login and onboarding UI at a high level
22. Responsive behavior
23. Accessibility/basic usability requirements
24. UX principles

For the main dashboard, use this conceptual structure:

---------------------------------------------------------
Student Info | Course Filters | Status Toolbar
---------------------------------------------------------
Academic Statistics
---------------------------------------------------------
              Interactive Curriculum Map
---------------------------------------------------------
Recommended Courses | Academic Problems / Warnings
---------------------------------------------------------

The Course Status Toolbar should support an interaction where selecting a status changes the visual cursor/indicator.

Example:

Passed → green check indicator
Failed → red X indicator

The exact visual style can be chosen by the designer, but the interaction concept must remain.

The curriculum map should visually communicate academic progression and dependencies.

When a course becomes available based on the Academic Rules Engine, the UI should be able to visually distinguish it from blocked/unavailable courses.

Do not define the academic conditions for "available" or "blocked" in this document. Reference:

04_Academic_Rules_Engine.md

The document must also include a clear reference section explaining which information comes from which project file.

Use this reference hierarchy:

01_Product_Overview.md
→ Product scope and goals

02_User_Flow.md
→ User journeys and interaction flows

03_UX_UI_Specification.md
→ Interface, visual behavior, and UX rules

04_Academic_Rules_Engine.md
→ Academic validation and decision logic

05_Curriculum_Data_Model.md
→ Academic data structure

06_Curriculum_Dataset.md
→ Actual courses, codes, curricula, and verified relationships

07_Database_Schema.md
→ Data persistence

08_Admin_Panel.md
→ Administrative interface

09_Technical_Requirements.md
→ Technical implementation

10_Claude_Master_Prompt.md
→ Final implementation instructions

Output ONLY the complete Markdown content of:

03_UX_UI_Specification.md

Do not wrap the document in commentary or explain what you did.
