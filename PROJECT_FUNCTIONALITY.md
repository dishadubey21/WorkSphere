# 🛠️ WorkSphere Project Functionality & Codebase Inventory

This document provides a comprehensive inventory and high-level architectural documentation of the **WorkSphere** workspace platform. It outlines all currently implemented features, database schemas, API scopes, user role permissions, frontend page mappings, reusable components, system limitations, and recommended future enhancements.

---

## 1. 📋 Complete Feature List

WorkSphere is an enterprise-grade digital workplace collaboration platform. The following features are fully implemented:

*   **Secure Authentication & Session Management**: Cookie-based JWT sessions, password hashing via `bcryptjs`, and password reset workflows using reset tokens and expiration limits.
*   **Role-Based Access Control (RBAC)**: Fine-grained user role guards on routing and backend endpoints. Roles supported: `Admin`, `Manager`, `Team Lead`, and `Employee`.
*   **Comprehensive Employee Directory**: Onboarding, profile details modification, system role management, temp password generation, and status controls (`Active`, `Inactive`, `Suspended`, `Resigned`, `On Notice`, `Archived`).
*   **Department Structures**: Organization mapping including department heads (managers) and operational budgets.
*   **Team Configurations**: Agile project teams defined under company departments and assigned to a manager or team lead.
*   **Project Lifecycles**: Multi-member projects featuring target dates, priorities, states (`Planning`, `Active`, `On Hold`, `Completed`, `Archived`), and a checklist of deliverables (Milestones) that drives project progress percentage auto-calculation.
*   **Deliverable Task Tracking**: Assignment details, tag/label arrays, attachment metadata, and comments/discussions linked to parent projects.
*   **Interactive Kanban Board**: Visual workflow drag-and-drop state changes (`Todo` → `In Progress` → `Review` → `Done`) and detailed drill-down drawers for active task audits.
*   **Vacation & Leave Allocation**: Overlap validation, leave summary balance meters (Annual, Sick, Maternity/Paternity, Unpaid), and multi-level manager approval scopes.
*   **Internal Bulletin Board (Announcements)**: HR and general company broadcast announcements, pinning critical announcements, and automatic notifications.
*   **Shared Document Vault**: Shared HR policies, standard templates, financial materials, and project files with type/size validation and size formatting.
*   **Today's Meetings Calendar**: Internal calendar tool to schedule, edit, and cancel meetings, integrated with Google Meet defaults.
*   **Consolidated Company Calendar**: Combined view mapping monthly task deadlines and employee leave durations.
*   **Global Auto-Complete Search**: Navigational autocomplete querying employees, departments, teams, projects, tasks, documents, and announcements simultaneously.
*   **Context-Sensitive Notification Center**: Multi-category user notification feed, unread count badge, and contextual redirect when clicked.
*   **Compliance Audit logs**: In-app tracking of all database modifications (`Created`, `Updated`, `Deleted`) on primary collections.
*   **Quick Notepad**: Text-editor notepad stored in browser `localStorage` for private user jotting.

---

## 2. 🧩 Module-wise Functionality

The codebase separates concern layers between controllers, services, and models. Here is the operational breakdown for each module:

### 🔑 Authentication
*   **Purpose**: Manages secure login, account registration, logout session clear, and credentials reset.
*   **Current Functionality**:
    *   `POST /api/auth/register` creates an Employee account.
    *   `POST /api/auth/login` checks credentials and issues a JWT token in an `HttpOnly` cookie.
    *   `GET /api/auth/me` returns the authenticated user's details.
    *   `POST /api/auth/forgot-password` / `POST /api/auth/reset-password/:token` coordinates reset links.
*   **User Roles Access**: Public access for login, registration, and reset. Logged-in access for logout and account info.
*   **Backend APIs**: Bound in [auth.routes.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/routes/auth.routes.js), handled by [auth.controller.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/controllers/auth.controller.js).
*   **Database Collections**: `employees` via [Employee.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Employee.js).

### 📊 Dashboard
*   **Purpose**: Renders the central workspace operational panel tailored to the active user's permissions.
*   **Current Functionality**:
    *   *Admins / Managers / Team Leads* view global staffing counts, department budget staffing charts, project progress meters, weekly operational activity trends, pending vacation approvals, today's meetings, and notepad.
    *   *Employees* view their personal checklist of assigned tasks, project memberships, leaf request states, upcoming target deadlines, notepad, and notification dropdown.
*   **User Roles Access**: All roles (displays dynamic layouts depending on role permissions).
*   **Backend APIs**: Consumes `/api/analytics/stats`, `/api/analytics/dashboard`, `/api/meetings`, `/api/tasks`, `/api/projects`, `/api/leaves`, and `/api/notifications`. Bound in [analytics.routes.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/routes/analytics.routes.js), handled by [analytics.controller.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/controllers/analytics.controller.js) and [analytics.service.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/services/analytics.service.js).
*   **Database Collections**: Integrates all schemas: `employees`, `projects`, `tasks`, `leaves`, `departments`, `meetings`, `activitylogs`.

### 👥 Employees
*   **Purpose**: Handles user onboarding, profile updates, credential resets, and account access states.
*   **Current Functionality**:
    *   Admins add, update, delete employee cards, assign manager nodes, change system roles, and trigger temporary credentials generation (`WS-[6 random characters]`).
    *   Admins suspend or archive accounts. Suspended accounts are immediately denied server access in the `protect` middleware.
*   **User Roles Access**:
    *   *Admin*: Create, update, delete, role updates, reset password.
    *   *Manager / Team Lead*: View employees directory list.
    *   *Employee*: View details, update profile fields, change password.
*   **Backend APIs**: Bound in [employee.routes.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/routes/employee.routes.js), handled by [employee.controller.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/controllers/employee.controller.js) and [employee.service.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/services/employee.service.js).
*   **Database Collections**: `employees` via [Employee.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Employee.js).

### 🏢 Departments
*   **Purpose**: Establishes company departments, head reporting structure, and budgets.
*   **Current Functionality**:
    *   Maintains basic name, department code (e.g. `ENG`, `HR`), manager head, and budgets.
    *   Provides public list endpoint for registration dropdown inputs.
*   **User Roles Access**:
    *   *Admin*: Create, update, delete.
    *   *All Roles*: View list (GET `/` public, GET `/:id` protected).
*   **Backend APIs**: Bound in [department.routes.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/routes/department.routes.js), handled by [department.controller.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/controllers/department.controller.js) and [department.service.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/services/department.service.js).
*   **Database Collections**: `departments` via [Department.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Department.js).

### 👥 Teams
*   **Purpose**: Manages department sub-teams and direct memberships.
*   **Current Functionality**: Maps teams under departments, designates a team lead, and maintains a membership list. Allows Admin to add and remove members.
*   **User Roles Access**:
    *   *Admin*: Create, update, delete, add/remove members.
    *   *Manager / Team Lead / Employee*: View team list.
*   **Backend APIs**: Bound in [team.routes.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/routes/team.routes.js), handled by [team.controller.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/controllers/team.controller.js) and [team.service.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/services/team.service.js).
*   **Database Collections**: `teams` via [Team.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Team.js).

### 📁 Projects
*   **Purpose**: Launches corporate initiatives, tracks dates, and maps progress metrics.
*   **Current Functionality**:
    *   Tracks manager, linked team, member lists, dates, and milestones.
    *   Progress percentage auto-calculates as a mathematical ratio of completed milestones over total milestones.
    *   Triggers assignment alerts to employees upon additions or removals.
*   **User Roles Access**:
    *   *Admin*: Create, update, delete.
    *   *All Roles*: View project list (employees only see projects they are assigned to, manage, or belong to via their team).
*   **Backend APIs**: Bound in [project.routes.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/routes/project.routes.js), handled by [project.controller.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/controllers/project.controller.js) and [project.service.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/services/project.service.js).
*   **Database Collections**: `projects` via [Project.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Project.js).

### 📝 Tasks
*   **Purpose**: Represents deliverables linked to projects with assignees.
*   **Current Functionality**:
    *   Maintains title, description, priority, due date, assignee, parent project, and tag arrays.
    *   Allows posting comments to task audits and holds attachment paths.
    *   Generates notifications for assignments, status changes, and task completions.
*   **User Roles Access**:
    *   *Admin / Manager / Team Lead*: Create, update, delete, view.
    *   *Employee*: View tasks assigned to them, post comments, update `status` (restricted to status updates only).
*   **Backend APIs**: Bound in [task.routes.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/routes/task.routes.js), handled by [task.controller.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/controllers/task.controller.js) and [task.service.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/services/task.service.js).
*   **Database Collections**: `tasks` via [Task.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Task.js).

### 📋 Kanban
*   **Purpose**: Renders the drag-and-drop workflow tracking board.
*   **Current Functionality**: Renders tasks across `Todo`, `In Progress`, `Review`, and `Done`. Click on cards slides open a details drawer with discussion logs and attachments.
*   **User Roles Access**: *Admin*, *Manager*, and *Team Lead* (Employees are routed to tabular task lists).
*   **Backend APIs**: Integrates GET `/api/tasks`, PUT `/api/tasks/:id`, and POST `/api/tasks/:id/comments`.
*   **Database Collections**: `tasks` via [Task.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Task.js).

### 🏖️ Leaves
*   **Purpose**: Manages leave requests and quota balances.
*   **Current Functionality**:
    *   Validates dates (start cannot exceed end) and overlaps against previous approved requests.
    *   Allocates hardcoded quotas (Annual: 25, Sick: 15, Maternity/Paternity: 90) and computes remaining balances.
    *   Submits pending requests to managers, writes audit logs, and triggers approval/rejection updates.
*   **User Roles Access**:
    *   *Admin*: View all, approve/reject, apply for others.
    *   *Manager*: View direct reports and self, approve/reject direct reports leaves.
    *   *Employee*: Submit requests for self, view self status, cancel/edit if still `Pending`.
*   **Backend APIs**: Bound in [leave.routes.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/routes/leave.routes.js), handled by [leave.controller.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/controllers/leave.controller.js) and [leave.service.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/services/leave.service.js).
*   **Database Collections**: `leaves` via [Leave.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Leave.js).

### 📢 Announcements
*   **Purpose**: Renders the global bulletin board.
*   **Current Functionality**: Publishes company board news. Pinning places items at the top. Publishing broadcasts notifications to all active employees.
*   **User Roles Access**:
    *   *Admin / Manager*: Create, edit, delete.
    *   *All Roles*: View.
*   **Backend APIs**: Bound in [announcement.routes.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/routes/announcement.routes.js), handled by [announcement.controller.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/controllers/announcement.controller.js) and [announcement.service.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/services/announcement.service.js).
*   **Database Collections**: `announcements` via [Announcement.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Announcement.js).

### 📂 Documents
*   **Purpose**: Shared policy vaults and file structures.
*   **Current Functionality**: Uploads documents under categories (`Policy`, `Project`, `Finance`, `Templates`), filters documents, and supports deletion of files.
*   **User Roles Access**:
    *   *All Roles*: View, download, upload.
    *   *Admin / Uploader*: Delete files.
*   **Backend APIs**: Bound in [document.routes.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/routes/document.routes.js), handled by [document.controller.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/controllers/document.controller.js) and [document.service.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/services/document.service.js).
*   **Database Collections**: `documents` via [Document.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Document.js).

### 🤝 Meetings
*   **Purpose**: Coordinates meeting events and calendars.
*   **Current Functionality**: Schedules meeting date, time, and locations (defaults to Google Meet). Owners can edit or cancel meetings.
*   **User Roles Access**:
    *   *Admin*: View all, reschedule, delete.
    *   *All Roles*: Schedule meetings. Users can view/edit/delete meetings they created.
*   **Backend APIs**: Bound in [meeting.routes.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/routes/meeting.routes.js), handled by [meeting.controller.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/controllers/meeting.controller.js) and [meeting.service.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/services/meeting.service.js).
*   **Database Collections**: `meetings` via [Meeting.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Meeting.js).

### 🔔 Notifications
*   **Purpose**: Delivers in-app contextual user updates.
*   **Current Functionality**: Stores unread alerts (global null recipient or user-targeted), counts unread notifications, marks items as read, and supports navigation mapping on click.
*   **User Roles Access**: All roles (can view self notifications, mark read, or dismiss).
*   **Backend APIs**: Bound in [notification.routes.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/routes/notification.routes.js), handled by [notification.controller.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/controllers/notification.controller.js) and [notification.service.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/services/notification.service.js).
*   **Database Collections**: `notifications` via [Notification.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Notification.js).

### 📅 Calendar
*   **Purpose**: Renders the monthly targets overview.
*   **Current Functionality**: Renders monthly grids mapping task deadlines and leave durations.
*   **User Roles Access**: All roles.
*   **Backend APIs**: Combines GET `/api/tasks` (deadlines) and GET `/api/leaves` (leaves blocks).
*   **Database Collections**: `tasks` and `leaves`.

### 📊 Reports
*   **Purpose**: Provides executive dashboard visualization.
*   **Current Functionality**: Renders system trend analytics charts (weekly operations, task distribution priorities, project completion lists).
*   **User Roles Access**: *Admin* only.
*   **Backend APIs**: GET `/api/analytics/dashboard`. Bound in [analytics.routes.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/routes/analytics.routes.js).
*   **Database Collections**: `projects`, `tasks`, `activitylogs`.

### ⚙️ Settings
*   **Purpose**: Manages system configurations and profile information.
*   **Current Functionality**:
    *   *Personal settings*: Updates contact biography, password, notifications switches (email, push, SMS), and UI theme.
    *   *System settings*: Allows Admins to configure organization name, system email, office hours, and toggle leave/bulletin options.
    *   *Role settings*: Allows Admins to change employees system roles.
*   **User Roles Access**:
    *   *All Roles*: Profile information, Password change, theme, notification checkboxes.
    *   *Admin*: System settings, Role Management.
*   **Backend APIs**: Bound in [settings.routes.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/routes/settings.routes.js), handled by [settings.controller.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/controllers/settings.controller.js).
*   **Database Collections**: `employees` via [Employee.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Employee.js).

### 📜 Activity Logs
*   **Purpose**: Compliance audit tracking.
*   **Current Functionality**: Fetches system logs showing created/updated/deleted operations, the user, the changed document, and description.
*   **User Roles Access**: *Admin* only.
*   **Backend APIs**: Bound in [activity.routes.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/routes/activity.routes.js), handled by [activity.controller.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/controllers/activity.controller.js) and [activity.service.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/services/activity.service.js).
*   **Database Collections**: `activitylogs` via [ActivityLog.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/ActivityLog.js).

---

## 3. 🔐 Role Matrix

WorkSphere implements role-based access control. The table below outlines what each role can do:

| Feature/Module | Admin | Manager | Team Lead | Employee |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | Full metrics & all charts | Full metrics & all charts | Scoped metrics & charts | Personalized tasks/leaves |
| **Employees** | Create, Update, Delete, Password Reset | View Directory | View Directory | View Directory (Self Update) |
| **Departments**| Create, Update, Delete | View Directory | View Directory | View Directory |
| **Teams** | Create, Update, Delete, Manage members | View list | View list | View list |
| **Projects** | Create, Update, Delete | View assigned | View assigned | View assigned |
| **Tasks** | Create, Update, Delete | Create, Update, Delete | Create, Update | View assigned, Update status |
| **Kanban** | Access | Access | Access | Denied (Tabular task list only) |
| **Leaves** | View all, Approve/Reject all | View direct reports, Approve direct reports | View self, Apply | View self, Apply |
| **Announcements**| Publish, Edit, Delete | Publish, Edit, Delete | View | View |
| **Documents** | View, Upload, Delete | View, Upload, Delete (Own) | View, Upload, Delete (Own) | View, Upload, Delete (Own) |
| **Meetings** | View, Edit, Delete all | Manage own, schedule | Manage own, schedule | Manage own, schedule |
| **Reports** | Access | Denied | Denied | Denied |
| **Activity Logs**| Access | Denied | Denied | Denied |
| **Settings** | Personal, System, Role Management | Personal | Personal | Personal |

---

## 4. 🗄️ Database Models

WorkSphere stores data in 11 Mongoose database models defined under the [models](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models) directory:

1.  **[Employee.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Employee.js)**: Stores user account documents including hashed passwords, contact details, organization designations, reports-to manager, and personal preferences (theme, notification toggles).
2.  **[Department.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Department.js)**: Stores department structures, department codes, budgeting, and the manager head.
3.  **[Team.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Team.js)**: Grouping collection connecting department tags, team leads, and member arrays.
4.  **[Project.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Project.js)**: Stores project lifecycles, team/manager hooks, member arrays, project status, progress metrics, and inline milestone sub-schemas.
5.  **[Task.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Task.js)**: Models task deliverables including assignees, projects, sub-schemas for discussion comments, and attachment definitions.
6.  **[Leave.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Leave.js)**: Captures vacation/time-off requests including category types, date ranges, and approval gates.
7.  **[Announcement.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Announcement.js)**: Models broadcast announcements with pinning overrides and publisher details.
8.  **[Document.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Document.js)**: Stores uploaded folders, size fields, category markers, and project bindings.
9.  **[Meeting.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Meeting.js)**: Maps scheduled calendar meetings including start/end times and locations.
10. **[Notification.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Notification.js)**: Stores real-time in-app alerts (global alerts or user-specific alerts).
11. **[ActivityLog.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/ActivityLog.js)**: Stores system logs of CRUD database mutations for auditing.

---

## 5. 🌐 API Summary

The backend exposes a structured JSON REST API grouped by resources:

### Authentication (`/api/auth`)
*   `POST /api/auth/register` - Registers a new employee profile.
*   `POST /api/auth/login` - Authenticates user credentials and sets a JWT cookie.
*   `POST /api/auth/logout` - Clears the JWT cookie session (requires authentication).
*   `GET /api/auth/me` - Returns active profile details (requires authentication).
*   `POST /api/auth/forgot-password` - Requests a password reset token.
*   `POST /api/auth/reset-password/:token` - Resets password using a verification token.

### Employees (`/api/employees`)
*   `GET /api/employees/` - Lists employees with search, department filters, and paging (requires Admin, Manager, or Team Lead).
*   `POST /api/employees/` - Onboards a new employee (requires Admin).
*   `GET /api/employees/:id` - Returns a specific employee record (requires Admin, Manager, or Self).
*   `PUT /api/employees/:id` - Updates an employee profile (requires Admin or Self).
*   `DELETE /api/employees/:id` - Deletes an employee record (requires Admin).
*   `POST /api/employees/:id/reset-password` - Performs administrative password resets (requires Admin).

### Departments (`/api/departments`)
*   `GET /api/departments/` - Returns all departments (Public read).
*   `POST /api/departments/` - Creates a department (requires Admin).
*   `GET /api/departments/:id` - Returns a department details (requires authenticated session).
*   `PUT /api/departments/:id` - Modifies department properties (requires Admin).
*   `DELETE /api/departments/:id` - Deletes a department (requires Admin).

### Teams (`/api/teams`)
*   `GET /api/teams/` - Returns all teams (requires authenticated session).
*   `POST /api/teams/` - Creates a team (requires Admin).
*   `GET /api/teams/:id` - Returns team details (requires authenticated session).
*   `PUT /api/teams/:id` - Updates team properties (requires Admin).
*   `DELETE /api/teams/:id` - Deletes a team (requires Admin).
*   `POST /api/teams/:id/members` - Adds members to a team (requires Admin).
*   `DELETE /api/teams/:id/members/:employeeId` - Removes members from a team (requires Admin).

### Projects (`/api/projects`)
*   `GET /api/projects/` - Lists project targets and progress (requires authenticated session; returns scoped list for non-admins).
*   `POST /api/projects/` - Launches a new project (requires Admin).
*   `GET /api/projects/:id` - Returns project milestones and details (requires authenticated session).
*   `PUT /api/projects/:id` - Modifies project details or milestones (requires Admin).
*   `DELETE /api/projects/:id` - Deletes a project (requires Admin).

### Tasks (`/api/tasks`)
*   `GET /api/tasks/` - Lists task items with filter logic (requires authenticated session; scopes to assignee for Employees).
*   `POST /api/tasks/` - Creates a task (requires Admin, Manager, or Team Lead).
*   `GET /api/tasks/:id` - Returns task details (requires authenticated session).
*   `PUT /api/tasks/:id` - Updates a task (Employees can only change status; Admin, Manager, Team Lead can edit all).
*   `DELETE /api/tasks/:id` - Deletes a task (requires Admin or Manager).
*   `POST /api/tasks/:id/comments` - Adds a comment to a task (requires authenticated session).

### Leaves (`/api/leaves`)
*   `GET /api/leaves/` - Lists leaves (scopes lists to self or direct reports; Admin views all).
*   `POST /api/leaves/` - Submits a leave request (requires authenticated session).
*   `GET /api/leaves/summary` - Returns remaining leave allocations (requires authenticated session).
*   `GET /api/leaves/:id` - Returns specific leave details (requires authenticated session).
*   `PUT /api/leaves/:id` - Approves/rejects leaves (requires Admin/Manager) or updates pending leave details (Self).

### Announcements (`/api/announcements`)
*   `GET /api/announcements/` - Returns the announcement bulletin (requires authenticated session).
*   `POST /api/announcements/` - Publishes an announcement (requires Admin or Manager).
*   `GET /api/announcements/:id` - Returns specific announcement details (requires authenticated session).
*   `PUT /api/announcements/:id` - Modifies an announcement (requires Admin or Manager).
*   `DELETE /api/announcements/:id` - Deletes an announcement (requires Admin or Manager).

### Documents (`/api/documents`)
*   `GET /api/documents/` - Lists documents (requires authenticated session).
*   `POST /api/documents/` - Uploads document metadata (requires authenticated session).
*   `GET /api/documents/:id` - Returns document details (requires authenticated session).
*   `DELETE /api/documents/:id` - Deletes a document (requires Admin or uploader).

### Notifications (`/api/notifications`)
*   `GET /api/notifications/` - Returns notifications (requires authenticated session).
*   `POST /api/notifications/` - Creates a notification (requires authenticated session).
*   `PUT /api/notifications/read-all` - Marks all notifications as read (requires authenticated session).
*   `PUT /api/notifications/:id/read` - Marks a single notification as read (requires authenticated session).

### Meetings (`/api/meetings`)
*   `GET /api/meetings/` - Returns meetings list (scopes to creator; Admin views all).
*   `POST /api/meetings/` - Schedules a meeting (requires authenticated session).
*   `PUT /api/meetings/:id` - Updates meeting details (requires Admin or creator).
*   `DELETE /api/meetings/:id` - Cancels a scheduled meeting (requires Admin or creator).

### Settings (`/api/settings`)
*   `GET /api/settings/org` - Returns system settings (requires Admin).
*   `PUT /api/settings/org` - Updates system settings (requires Admin).
*   `GET /api/settings/personal` - Returns personal settings (requires authenticated session).
*   `PUT /api/settings/personal` - Updates personal settings (requires authenticated session).

### Activity Logs (`/api/activity-logs`)
*   `GET /api/activity-logs/` - Lists system logs (requires Admin).

### Global Search (`/api/search`)
*   `GET /api/search/` - Query search results across all entities (requires authenticated session).

---

## 6. 🖥️ Frontend Pages

The React client implements the following page routes lazily loaded in [App.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/App.jsx):

*   **[Login.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Login.jsx)**: Login form with error messages and redirects.
*   **[Register.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Register.jsx)**: Account creation page with department selector.
*   **[ForgotPassword.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/ForgotPassword.jsx)**: Request form for password resets.
*   **[ResetPassword.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/ResetPassword.jsx)**: Captures new password input via token verification.
*   **[Dashboard.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Dashboard.jsx)**: The central dashboard page. Handles greeting logic, counters, and analytical widgets.
*   **[Employees.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Employees.jsx)**: Directory list page for Admins. Renders a side drawer to onboard/edit and password reset modals.
*   **[Departments.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Departments.jsx)**: Displays departments, heads, and budgets.
*   **[Teams.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Teams.jsx)**: Displays team layouts and members directory.
*   **[Projects.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Projects.jsx)**: Project overview grids with status, dates, progress bars, and milestone checklist drawers.
*   **[Tasks.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Tasks.jsx)**: Tabular layout listing tasks, priority tags, and due dates. Includes create drawers.
*   **[Kanban.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Kanban.jsx)**: Drag-and-drop task status board with slide-out audit cards.
*   **[Leaves.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Leaves.jsx)**: Vacation quota balance cards, time-off application forms, and approval dashboards.
*   **[Announcements.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Announcements.jsx)**: Displays pins, categorizations, and creator information.
*   **[Documents.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Documents.jsx)**: Vault listing file lists, sizes, and linked projects. Includes drag-and-drop upload modal.
*   **[Calendar.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Calendar.jsx)**: Consolidates task deadlines and leave durations in a monthly layout.
*   **[Reports.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Reports.jsx)**: Operational charts page rendering priorities, weekly activity, and milestones.
*   **[ActivityLogs.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/ActivityLogs.jsx)**: Real-time timelines of database operations, filterable by resource type.
*   **[Settings.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Settings.jsx)**: Modular tabs view containing personal details, password resets, visual theme settings, email/push/SMS toggles, organization parameters, and system-wide role assignments.
*   **[Errors.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Errors.jsx)**: Renders error messages (e.g. `404 Not Found`, `401 Unauthorized`, `403 Forbidden`, `500 Server Error`, `Network Error`).

---

## 7. 🔌 Reusable Components

WorkSphere implements a design system of reusable components under [design-system](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/design-system) and layout templates under [layouts](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/layouts):

### Design System Elements
*   **[Avatar.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/design-system/Avatar.jsx)**: Standardizes user avatar rendering with size overrides (`xs`, `sm`, `md`, `lg`) and placeholder fallback letters.
*   **[Badge.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/design-system/Badge.jsx)**: Displays state chips with colored context variations (e.g., `success` for completed, `danger` for urgent/rejected).
*   **[Button.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/design-system/Button.jsx)**: Standard button with loader shimmers and sizes.
*   **[Card.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/design-system/Card.jsx)**: Container card with shadow styles and hover options.
*   **[Drawer.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/design-system/Drawer.jsx)**: Overlay slider for details and form creation.
*   **[Icons.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/design-system/Icons.jsx)**: Consolidates Lucide-based theme icons used throughout the app.
*   **[Input.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/design-system/Input.jsx)**: Forms wrapper styled with error helpers.
*   **[Logo.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/design-system/Logo.jsx)**: Renders standard platform branding.
*   **[Modal.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/design-system/Modal.jsx)**: Center popover wrapper overlay.
*   **[Select.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/design-system/Select.jsx)**: Dropdown selector styled with errors mappings.
*   **[SearchableSelect.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/design-system/SearchableSelect.jsx)**: Multi-selection selector with search capability, avatar rendering, and status details.
*   **[Toast.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/design-system/Toast.jsx)**: Standardized alerts overlay with a timeout clear queue.
*   **[Typography.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/design-system/Typography.jsx)**: Enforces font spacing and formatting.

### Layout Wrappers
*   **[DashboardLayout.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/layouts/DashboardLayout.jsx)**: The primary application layout. Binds sidebar lists, sticky nav, global search results, notifications dropdowns, footer structures, and the speed-dial floating action button.
*   **[PageLayout.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/layouts/PageLayout.jsx)**: Standardizes sub-page headers, details, layout shimmers, and empty states.
*   **[TableLayout.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/layouts/TableLayout.jsx)**: Responsive container wrapping directory grids, table headers, filtering panels, and loaders.

---

## 8. ⚠️ Current Limitations

The platform has several areas that are currently simulated or limited in scope:

1.  **Mocked Document Uploads**: File uploading on [Documents.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Documents.jsx) is simulated using a client-side timer. Files are not saved to a real storage bucket (such as AWS S3). The file URL is statically generated as a string pointer (`https://worksphere.com/files/...`) and stored in the database.
2.  **In-Memory Organization Settings**: Settings defined on [settings.controller.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/controllers/settings.controller.js#L1-L9) (companyName, systemEmail, workingHours) are held in-memory on the Node server. Restarting the server resets organization settings back to their default parameters.
3.  **Mocked Notification Gateways**: Settings choices for SMS text alerts, email notifications, and push alerts exist in [Settings.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Settings.jsx) and on the [Employee.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/models/Employee.js) model. However, no third-party integrations (Nodemailer, Twilio, Firebase Cloud Messaging) are implemented in [notification.service.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/services/notification.service.js) to deliver external notifications.
4.  **Hardcoded Analytics Targets**: The executive page [Reports.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Reports.jsx) contains hardcoded KPI cards (Task Resolution Rate of 84.2%, Project Schedule Variance of -2.4 Days, and Workforce Utilization of 91.8%) that are not driven by the database or project statistics.
5.  **Calendar Data Scoping**: The calendar page [Calendar.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Calendar.jsx) only maps Task Deadlines and Employee leaves. It does not display project start/end targets, milestones, or scheduled meetings.
6.  **Mocked Google Meet Links**: Meetings scheduled default to the string value "Google Meet", but there is no integration with the Google Calendar API to generate real meeting rooms or links.

---

## 9. 🚀 Future Scope

Based on the current architecture, the following features are recommended for future implementation:

1.  **Persistent System Settings Database**: Transition the organizational settings in [settings.controller.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/controllers/settings.controller.js) into a dedicated `SystemSetting` MongoDB collection.
2.  **Cloud Storage Integration**: Connect the upload form on [Documents.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Documents.jsx) to AWS S3, Google Cloud Storage, or Cloudinary using a secure, pre-signed upload URL workflow.
3.  **External Notification Services**:
    *   Integrate `nodemailer` in [notification.service.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/services/notification.service.js) to send email alerts.
    *   Integrate Twilio for SMS updates.
    *   Integrate WebSockets (Socket.io) or SSE (Server-Sent Events) for real-time, live notification counts in the client app.
4.  **Dynamic Analytics Reports**: Replace the hardcoded numbers in [Reports.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Reports.jsx) with database aggregations (e.g. average task duration, project variance offsets, actual employee load).
5.  **Calendar Aggregation**: Update [Calendar.jsx](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/client/src/pages/Calendar.jsx) to fetch and show scheduled meetings and project milestone targets alongside task deadlines and leaves.
6.  **Meeting Rooms API Integration**: Integrate Google Workspace calendar OAuth flows to dynamically create and join Google Meet rooms when scheduling meetings.
