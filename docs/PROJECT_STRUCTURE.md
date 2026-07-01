# WorkSphere Project Structure Map

This document outlines the folder layout of the **WorkSphere** monorepo. It details folder roles, directories structure, strict placement boundaries, and dependency patterns to avoid folder clutter and maintain architecture clean-cut.

```
WorkSphere/
├── client/                 # React Frontend Application (Vite-based)
│   └── src/
│       ├── api/            # API call service modules (Axios client)
│       ├── assets/         # Static images, styles, and web resources
│       ├── components/     # Specialized UI templates (Search inputs, filters, forms)
│       ├── constants/      # Shared constant variables and permissions mappings
│       ├── context/        # React context wrappers (Authentication & Toast alerts UI)
│       ├── design-system/  # Core visual components (Buttons, Inputs, Cards, Badges)
│       ├── hooks/          # Reusable React custom state hooks
│       ├── layouts/        # View layout wrappers (Sidebars & page frameworks)
│       ├── pages/          # Full view screens (Dashboard, Kanban, Tasks, Settings)
│       ├── services/       # UI data helper and conversion utils
│       └── styles/         # Shared theme rules and stylesheet variables
│
├── server/                 # Node.js/Express Backend API Server
│   ├── config/             # DB connectivity and env parameter validation scripts
│   ├── controllers/        # HTTP handler hooks parsing payloads
│   ├── middleware/         # Security guards and JWT validation pipelines
│   ├── models/             # Mongoose database schemas and indexing triggers
│   ├── routes/             # REST endpoint path handlers mapping controllers
│   ├── seed/               # Initial DB state seeder parameters script
│   ├── services/           # Decoupled business rules implementation services
│   └── utils/              # Helper utilities (Token creation, custom error types)
│
└── docs/                   # Comprehensive markdown workspace documentation
```

---

## 💻 Frontend Application (`/client`)

### `client/src/api`
*   **Purpose**: Houses HTTP request functions interacting with backend endpoints via Axios.
*   **What belongs here**: Endpoint definitions, parameter parsing logic, and axios call definitions (e.g. `task.api.js`, `settings.api.js`).
*   **What should NEVER be placed here**: Component markup, UI visual styles, or state declarations.
*   **Relationships**: Called by **pages** and **components** (frequently wrapped in React Query hooks) to fetch and mutate database collections.

### `client/src/components`
*   **Purpose**: Holds specialized, feature-specific React interface elements.
*   **What belongs here**: Items like `TaskForm.jsx`, `ProjectForm.jsx`, search bars, and complex popovers.
*   **What should NEVER be placed here**: Global routing definitions, full page views, or database controller actions.
*   **Relationships**: Imports elements from **design-system** for branding consistency; consumed by **pages**.

### `client/src/constants`
*   **Purpose**: Acts as the centralized dictionary for configurations and permissions.
*   **What belongs here**: Route definitions, enterprise permission matrices (e.g. `permissions.js`), and lookup enums.
*   **What should NEVER be placed here**: JSX, styled components, or stateful hooks.
*   **Relationships**: Read by **App.jsx** for route authentication and **layouts/pages** to conditionally block/show elements.

### `client/src/context`
*   **Purpose**: Manages application-wide React state variables.
*   **What belongs here**: `AuthContext.jsx` (handles JWT tokens, login operations, active user state) and `UIContext.jsx` (handles toast overlays, active edit modal views).
*   **What should NEVER be placed here**: Page forms, local input state variables, or business logic unrelated to global scopes.
*   **Relationships**: Injects state values down into **pages**, **components**, and **layouts**; utilized by Axios request headers.

### `client/src/design-system`
*   **Purpose**: The system's foundational design library.
*   **What belongs here**: Reusable structural blocks like `Button.jsx`, `Input.jsx`, `Card.jsx`, `Badge.jsx`, and `Avatar.jsx` conforming to styling specs.
*   **What should NEVER be placed here**: Scoped business validations, data mutations, or direct Axios endpoints references.
*   **Relationships**: Imported universally across the entire frontend (**layouts**, **components**, and **pages**).

### `client/src/layouts`
*   **Purpose**: Provides grid structures and menu scaffolds wrapper templates.
*   **What belongs here**: `DashboardLayout.jsx` (holds the Sidebar panel, title greetings, floating action button, and sub-page render area).
*   **What should NEVER be placed here**: Form inputs, standalone tables, or database model definitions.
*   **Relationships**: Consumed by **App.jsx** router routes; houses the root wrapper layouts for **pages**.

### `client/src/pages`
*   **Purpose**: Complete window screens matching a route path.
*   **What belongs here**: `Dashboard.jsx`, `Announcements.jsx`, `Leaves.jsx`, and `Settings.jsx`.
*   **What should NEVER be placed here**: Shared UI buttons, design system files, or custom state helpers.
*   **Relationships**: Rendered inside **layouts** via React Router; contains **components** to build full views.

---

## ⚙️ Backend API Server (`/server`)

### `server/config`
*   **Purpose**: Bootstraps external service connections.
*   **What belongs here**: MongoDB client connection initialization (`db.js`).
*   **What should NEVER be placed here**: Route definitions, schemas, or security validation checks.
*   **Relationships**: Loaded by **app.js** on runtime startup to secure DB sockets before receiving requests.

### `server/controllers`
*   **Purpose**: Entry handler pipeline parsing incoming HTTP requests.
*   **What belongs here**: Logic that extracts `req.body`, `req.params`, or query strings, performs controller mapping, and replies with JSON structures (e.g. `task.controller.js`).
*   **What should NEVER be placed here**: Heavy DB transaction algorithms or raw MongoDB queries.
*   **Relationships**: Mapped by **routes**; calls **services** to complete operations; handles HTTP status responses.

### `server/middleware`
*   **Purpose**: Filters and validation intercepts before controller entry.
*   **What belongs here**: `auth.middleware.js` (decodes JWT credentials, checks active database status, blocks suspended accounts, validates role privileges).
*   **What should NEVER be placed here**: Model logic or HTML render elements.
*   **Relationships**: Placed inside **routes** before controller mappings.

### `server/models`
*   **Purpose**: Models the database document structure.
*   **What belongs here**: Mongoose schema files (`Employee.js`, `Task.js`, `Meeting.js`) specifying field validations and indexes.
*   **What should NEVER be placed here**: Express routes, req/res objects, or session cookies keys.
*   **Relationships**: Imported by **services** to query MongoDB; represents DB document constraints.

### `server/routes`
*   **Purpose**: Express router mapper cataloging API paths.
*   **What belongs here**: Path routing maps (e.g. `project.routes.js`) declaring HTTP verb verbs and middleware checks.
*   **What should NEVER be placed here**: Business logic or controller actions.
*   **Relationships**: Mounted in **app.js**; triggers **middleware** guards and routes control to **controllers**.

### `server/services`
*   **Purpose**: Encapsulates the core business rules and transactional logic.
*   **What belongs here**: CRUD handlers querying Mongoose models, data filters, and notifications (e.g. `notification.service.js`).
*   **What should NEVER be placed here**: Direct references to `req` or `res` Express blocks.
*   **Relationships**: Invoked by **controllers**; queries **models**; triggers **notification.service** routines.
