# WorkSphere System Architecture

This document describes the high-level architecture of the **WorkSphere** platform, explaining how frontend and backend components cooperate, how requests flow through the application layers, and the architectural principles behind our design decisions.

---

## 🏛️ Technology Stack Overview

WorkSphere is structured as a decoupled web application using a Node.js/Express REST API on the backend and a Single Page Application (SPA) React front end.

```
┌──────────────────────────────────────┐        HTTP (JSON)        ┌──────────────────────────────────────┐
│          React Frontend Client       │ ────────────────────────> │           Express API Server         │
│  (Vite, React Router, Context, Query)│ <──────────────────────── │     (Node.js, Mongoose, MongoDB)     │
└──────────────────────────────────────┘    JWT Cookies + CORS     └──────────────────────────────────────┘
```

### Frontend Technology
*   **React & Vite**: Serves as the UI rendering core. Vite handles hot-module reloading and optimized bundling.
*   **React Router v6**: Manages client-side routing, query parameter bindings, and path matching guards.
*   **Context API**: Stores global user profiles and UI drawer triggers.
*   **Axios**: Custom configured client (`api/client.js`) injecting base URLs and intercepting cookie storage.
*   **Bootstrap CSS & Vanilla Custom styles**: Generates standard cards, responsive layouts, grids, forms, and alerts.

### Backend Technology
*   **Node.js & Express**: Drives endpoint router loops, handling JSON payloads and errors.
*   **MongoDB & Mongoose**: Mongoose enforces schema definitions, index specifications, and relationship references.
*   **JWT Cookie-based Session Auth**: Stores session keys in HTTP-Only, Secure, and SameSite cookies (`jwt` key) to prevent script extraction vulnerabilities.
*   **Role-Based Access Control (RBAC)**: Custom middlewares enforce access scoping before controller invocation.

---

## 🔄 End-to-End Request-Response Flow

This diagram traces how a request flows through the systems, from a user action in the React client to a database transaction in MongoDB, and back.

```mermaid
sequenceDiagram
    autonumber
    actor User as User Interface
    participant Axios as Axios Client
    participant Middleware as Express Middleware
    participant Route as Express Router
    participant Controller as Controller Handler
    participant Service as Business Service
    participant Model as Mongoose Model
    database DB as MongoDB
    
    User->>Axios: Triggers Action (e.g. click "Save Task")
    Axios->>Middleware: POST /api/tasks (injects jwt cookie)
    activate Middleware
    Note over Middleware: Checks protect (JWT) & authorize('Admin')
    Middleware->>Route: Verified request context
    deactivate Middleware
    Route->>Controller: Invokes createTask(req, res)
    activate Controller
    Note over Controller: Parses payload, extracts req.user
    Controller->>Service: calls taskService.create(data)
    activate Service
    Note over Service: Applies business validations
    Service->>Model: task.save()
    activate Model
    Model->>DB: MongoDB insert transaction
    DB-->>Model: Returns document payload
    Model-->>Service: Injects schema references
    deactivate Model
    Service-->>Controller: Returns task object
    deactivate Service
    Controller-->>Axios: Sends 201 JSON Response
    deactivate Controller
    Axios-->>User: Refreshes state via React Query cache (Re-renders UI)
```

---

## 📂 Design Separation: Controllers vs. Services

WorkSphere explicitly separates its controllers from its services to keep the codebase maintainable and testable:

### 1. Controllers (`/server/controllers`)
Controllers are responsible only for handling HTTP protocol details. They:
*   Extract fields from the Express request (`req.body`, `req.params`, `req.query`, `req.user`).
*   Translate error messages into appropriate HTTP status codes (e.g., `400 Bad Request`, `403 Forbidden`, `404 Not Found`).
*   Send JSON responses back to the client.
*   **Contain no database queries or business calculations.**

### 2. Services (`/server/services`)
Services contain the core business rules of the application. They:
*   Are completely decoupled from Express (`req` or `res` objects are never passed here).
*   Interact with Mongoose models to perform database queries.
*   Trigger notifications (`notification.service.js`) or write activity logs.
*   Can be reused in different contexts (like CLI scripts, seeds, or cron jobs) without changes.

---

## 🔒 Security Architectures

Security is enforced at multiple layers in the request-response lifecycle:

```
[ Incoming Request ]
         │
         ▼
[ 1. AUTHENTICATION MIDDLEWARE ]  ── (Decodes JWT Cookie, sets req.user)
         │
         ▼
[ 2. AUTHORIZATION MIDDLEWARE ]   ── (Verifies Role permissions)
         │
         ▼
[ 3. CONTROLLER LAYOUT SCOPING ]  ── (Checks Ownership constraints: 403)
         │
         ▼
[ 4. SCHEMA VALIDATION LAYER ]    ── (Validates Mongoose schema constraints)
```

### 1. Authentication Layer
*   **Mechanism**: Handled by the `protect` middleware in [auth.middleware.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/middleware/auth.middleware.js).
*   **Verification**: Reads the `jwt` HTTP-Only cookie, decodes the user's ID, and fetches their employee record.
*   **Status Check**: Verifies that the employee's status is `Active`. If the user is suspended, inactive, or not found, it rejects the request immediately with a `401 Unauthorized` status.

### 2. Authorization Layer
*   **Mechanism**: Handled by the `authorize(...roles)` middleware in [auth.middleware.js](file:///c:/Users/disha.a.dubey/Desktop/WorkSphere/server/middleware/auth.middleware.js).
*   **Role Check**: Checks if `req.user.role` matches the allowed roles for the endpoint.
*   **Enforcement**: If the role is unauthorized, it immediately returns a `403 Forbidden` response.

### 3. Ownership / Resource Scoping
*   **Mechanism**: Enforced inside controller methods.
*   **Scoping**: Even if a role has general endpoint access, controllers restrict their search queries based on ownership. For example:
    *   **Employees** can only view tasks where `assignee: req.user._id`.
    *   **Managers** can only modify projects they manage or belong to.
    *   **Announcements** edit/delete requests are blocked (403) for non-admins unless they created the notice.

### 4. Input & Data Validation
*   **Mechanism**: Enforced via Mongoose Schema validation constraints.
*   **Rules**: Field types, regex formats, required flags, and unique constraints are defined at the schema layer (e.g. email must match regular expression, passwords are encrypted via pre-save hooks).
