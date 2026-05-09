import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");
const docsDir = path.join(root, "docs");
const htmlPath = path.join(docsDir, "devtask-project-guide.html");
const pdfPath = path.join(docsDir, "devtask-project-guide.pdf");
const runtimeNodeModules =
  process.env.CODEX_NODE_MODULES ||
  "C:\\Users\\Deepak Singh\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";
const { chromium } = await import(
  pathToFileURL(path.join(runtimeNodeModules, "playwright", "index.mjs")).href
);

const fileRefs = [
  "backend/prisma/schema.prisma",
  "backend/server.js",
  "backend/src/middlewares/authMiddleware.js",
  "backend/src/middlewares/rbacMiddleware.js",
  "backend/src/middlewares/resourceAccessMiddleware.js",
  "backend/src/validations/schemas.js",
  "backend/src/controllers/authController.js",
  "backend/src/controllers/taskController.js",
  "backend/src/services/projectService.js",
  "backend/src/services/taskService.js",
  "backend/src/services/sprintService.js",
  "frontend/src/App.jsx",
  "frontend/src/api/axios.js",
  "frontend/src/context/AuthContext.jsx",
  "frontend/src/layouts/DashboardLayout.jsx",
  "frontend/src/pages/Board.jsx",
  "frontend/src/pages/Backlog.jsx",
  "frontend/src/pages/Reports.jsx",
];

const now = new Date().toLocaleDateString("en-IN", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>DevTask Project Guide</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #172033;
      background: #ffffff;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      line-height: 1.55;
      font-size: 10.5pt;
    }
    h1, h2, h3 { color: #0f172a; line-height: 1.2; margin: 0; }
    h1 { font-size: 30pt; letter-spacing: -0.02em; }
    h2 { font-size: 17pt; margin-top: 28px; padding-top: 12px; border-top: 1px solid #d7deea; }
    h3 { font-size: 12.5pt; margin-top: 18px; }
    p { margin: 7px 0; }
    ul, ol { margin: 7px 0 10px 20px; padding: 0; }
    li { margin: 3px 0; }
    code {
      font-family: "Cascadia Code", Consolas, monospace;
      background: #eef3fb;
      color: #0f3d66;
      padding: 1px 4px;
      border-radius: 4px;
      font-size: 9.5pt;
    }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { border: 1px solid #d7deea; padding: 7px 8px; text-align: left; vertical-align: top; }
    th { background: #f2f6fb; color: #0f172a; }
    .cover {
      min-height: 88vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      border: 1px solid #d7deea;
      padding: 42px;
      border-radius: 18px;
      background: linear-gradient(135deg, #f8fbff 0%, #eef5ff 100%);
    }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.16em; color: #2563eb; font-weight: 800; font-size: 9pt; }
    .subtitle { font-size: 14pt; max-width: 620px; color: #475569; margin-top: 16px; }
    .meta { margin-top: 28px; color: #64748b; }
    .page-break { break-before: page; }
    .callout {
      border-left: 4px solid #2563eb;
      background: #f5f9ff;
      padding: 10px 12px;
      margin: 12px 0;
    }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .card {
      border: 1px solid #d7deea;
      border-radius: 10px;
      padding: 12px;
      background: #ffffff;
      break-inside: avoid;
    }
    .small { color: #64748b; font-size: 9.5pt; }
    .flow {
      font-family: "Cascadia Code", Consolas, monospace;
      background: #0f172a;
      color: #e2e8f0;
      padding: 12px;
      border-radius: 10px;
      white-space: pre-wrap;
      font-size: 9.5pt;
    }
  </style>
</head>
<body>
  <section class="cover">
    <div class="eyebrow">Project Explanation Guide</div>
    <h1>DevTask</h1>
    <p class="subtitle">A complete walkthrough of the design, architecture, database, backend code, frontend code, and interview-ready explanations for the DevTask project.</p>
    <p class="meta">Generated on ${now}</p>
  </section>

  <section class="page-break">
    <h2>1. Project Summary</h2>
    <p><strong>DevTask</strong> is a full-stack Jira-like task management application. It helps teams create projects, manage tasks, plan sprints, collaborate through comments and notifications, and review progress through reports.</p>
    <div class="callout">
      <strong>One-line explanation:</strong> DevTask is a React, Express, PostgreSQL, and Prisma based project management app with authentication, RBAC, Kanban boards, sprint planning, comments, notifications, and analytics.
    </div>
    <table>
      <tr><th>Layer</th><th>Technology</th><th>Responsibility</th></tr>
      <tr><td>Frontend</td><td>React + Vite</td><td>UI, routing, state, API calls, protected pages, dashboards, board, backlog, reports.</td></tr>
      <tr><td>Backend</td><td>Node.js + Express</td><td>REST API, auth, authorization, validation, business logic, sockets, security middleware.</td></tr>
      <tr><td>Database</td><td>PostgreSQL + Prisma</td><td>Persistent storage, relations, indexes, transactions, query abstraction.</td></tr>
      <tr><td>Realtime</td><td>Socket.io</td><td>Foundation for live task and notification updates.</td></tr>
    </table>
  </section>

  <section>
    <h2>2. High-Level Architecture</h2>
    <p>The project follows a clear separation between frontend and backend. The frontend calls backend APIs through Axios. The backend validates and authorizes requests before calling service functions. Services use Prisma to read and write PostgreSQL data.</p>
    <div class="flow">React Page or Component
  -> Axios API Client
  -> Express Route
  -> Auth Middleware
  -> RBAC / Resource Access Middleware
  -> Zod Validation
  -> Controller
  -> Service
  -> Prisma ORM
  -> PostgreSQL</div>
    <p>This structure is useful because UI logic, request handling, security, and business logic stay in different places.</p>
  </section>

  <section>
    <h2>3. Database Design: backend/prisma/schema.prisma</h2>
    <p>This file defines the complete data model. Prisma uses it to generate a typed database client and manage migrations.</p>
    <table>
      <tr><th>Model</th><th>Purpose</th></tr>
      <tr><td><code>User</code></td><td>Stores user name, email, hashed password, comments, assigned tasks, activities, projects, and notifications.</td></tr>
      <tr><td><code>Project</code></td><td>Represents a team project. It owns tasks, sprints, labels, and members.</td></tr>
      <tr><td><code>ProjectMember</code></td><td>Join table between users and projects. Stores role such as <code>ADMIN</code> or <code>MEMBER</code>.</td></tr>
      <tr><td><code>Task</code></td><td>Main issue model. Stores title, description, type, status, priority, assignee, sprint, labels, hierarchy, rank, comments, and activities.</td></tr>
      <tr><td><code>Sprint</code></td><td>Groups tasks into planned cycles with status <code>PLANNED</code>, <code>ACTIVE</code>, or <code>COMPLETED</code>.</td></tr>
      <tr><td><code>Comment</code></td><td>Stores task discussions with author and task relation.</td></tr>
      <tr><td><code>Label</code> and <code>TaskLabel</code></td><td>Many-to-many label system scoped to each project.</td></tr>
      <tr><td><code>TaskActivity</code></td><td>Audit trail of task changes such as creation, status changes, and assignment.</td></tr>
      <tr><td><code>Notification</code></td><td>Stores user notifications with title, message, type, read state, and link.</td></tr>
    </table>
    <p><strong>Important design points:</strong> task numbers are unique per project using <code>@@unique([projectId, taskNumber])</code>; indexes are added for common filters like project, assignee, status, sprint, and priority-related workflows; cascading deletes remove dependent records when a project or task is deleted.</p>
  </section>

  <section>
    <h2>4. Backend Entry Point: backend/server.js</h2>
    <p>This is the main server file. It loads environment variables, creates the Express app, registers middleware, mounts API routes, starts the HTTP server, initializes Socket.io, and handles graceful shutdown.</p>
    <ul>
      <li><code>helmet()</code> adds security headers.</li>
      <li><code>express.json()</code> parses JSON request bodies.</li>
      <li><code>cookieParser()</code> reads cookies, including the auth token cookie.</li>
      <li><code>cors()</code> allows frontend requests from the configured frontend URL.</li>
      <li><code>express-rate-limit</code> protects general API routes and login/register endpoints.</li>
      <li>Routes are mounted under <code>/api/auth</code>, <code>/api/projects</code>, <code>/api/tasks</code>, <code>/api/sprints</code>, and <code>/api/notifications</code>.</li>
      <li>The global error handler is registered last.</li>
      <li>Shutdown logic closes the HTTP server and disconnects Prisma.</li>
    </ul>
    <div class="callout"><strong>How to explain it:</strong> <code>server.js</code> is the composition root of the backend. It wires security, parsing, CORS, rate limiting, routing, error handling, realtime setup, and process shutdown.</div>
  </section>

  <section>
    <h2>5. Authentication: authController.js and authMiddleware.js</h2>
    <h3>backend/src/controllers/authController.js</h3>
    <p>The auth controller handles register, login, logout, current user, and password change operations. It delegates user creation and login checks to the auth service. On login, it returns the user and token, and also sets an HTTP-only cookie.</p>
    <ul>
      <li><code>register</code>: creates a new user and returns the new user id.</li>
      <li><code>login</code>: verifies credentials, creates JWT, sets cookie, returns user and token.</li>
      <li><code>getMe</code>: fetches current user profile from <code>req.user</code>.</li>
      <li><code>changePassword</code>: checks current password with bcrypt, hashes the new password, and updates the user.</li>
      <li><code>logout</code>: clears the token cookie.</li>
    </ul>
    <h3>backend/src/middlewares/authMiddleware.js</h3>
    <p>The <code>protect</code> middleware protects private routes. It accepts tokens from either the <code>Authorization</code> header or the cookie. It verifies the JWT using <code>JWT_SECRET</code> and attaches the user id to <code>req.user</code>.</p>
    <div class="callout"><strong>Interview answer:</strong> Authentication is JWT-based. The backend verifies the token on protected routes and attaches the authenticated user id to the request, so later middleware and controllers know who is performing the action.</div>
  </section>

  <section>
    <h2>6. Authorization: rbacMiddleware.js and resourceAccessMiddleware.js</h2>
    <h3>backend/src/middlewares/rbacMiddleware.js</h3>
    <p>This file implements role-based access control. <code>resolveProjectRole</code> finds the user's membership for the project and stores the role in <code>req.userRole</code>. <code>authorize</code> checks whether that role is allowed for the route.</p>
    <h3>backend/src/middlewares/resourceAccessMiddleware.js</h3>
    <p>This file protects nested resources such as tasks and sprints. For example, updating a task only gives the route a <code>taskId</code>, so the middleware first finds that task, discovers its project, checks whether the user belongs to that project, then attaches the role to the request.</p>
    <div class="callout"><strong>Why this matters:</strong> users cannot update or delete tasks from projects they do not belong to. This turns the app from basic CRUD into a team-safe product.</div>
  </section>

  <section>
    <h2>7. Validation: backend/src/validations/schemas.js</h2>
    <p>This file defines Zod schemas for incoming API data. It validates auth, project, task, sprint, member, and comment payloads before business logic runs.</p>
    <ul>
      <li>Auth schemas validate email format, password length, and required fields.</li>
      <li>Project schemas enforce uppercase alphanumeric project keys.</li>
      <li>Task schemas enforce valid UUIDs, task status, priority, issue type, labels, dates, and title.</li>
      <li>Sprint schemas validate project id, name, dates, and optional goal.</li>
      <li><code>.strict()</code> rejects unexpected fields, which reduces accidental or malicious input.</li>
    </ul>
  </section>

  <section>
    <h2>8. Task API: taskRoutes, taskController.js, and taskService.js</h2>
    <p>The task feature is the best example of the backend architecture.</p>
    <div class="flow">POST /api/tasks
  -> protect
  -> resolveProjectRole
  -> authorize("ADMIN", "MEMBER")
  -> validateSafe(createTaskSchema)
  -> taskController.createTask
  -> taskService.createTask
  -> Prisma transaction</div>
    <h3>backend/src/controllers/taskController.js</h3>
    <p>The controller extracts request data and calls the service. It also sets pagination headers such as <code>X-Total-Count</code> and <code>X-Total-Pages</code> when returning task lists.</p>
    <h3>backend/src/services/taskService.js</h3>
    <p>The service contains the real task business logic:</p>
    <ul>
      <li>Checks that an assignee is a project member.</li>
      <li>Checks that sprint, epic, and parent task belong to the same project.</li>
      <li>Creates per-project task numbers inside a Prisma transaction.</li>
      <li>Creates task labels with <code>connectOrCreate</code>.</li>
      <li>Creates task activity records.</li>
      <li>Creates notifications when a task is assigned or updated.</li>
      <li>Supports filtering by sprint, backlog, type, search, assignee, and priority.</li>
      <li>Updates only changed fields and records meaningful activity history.</li>
    </ul>
    <div class="callout"><strong>Strong explanation:</strong> Task creation uses a Prisma transaction because task number generation, task insert, label creation, activity logging, and notifications are part of one logical operation.</div>
  </section>

  <section>
    <h2>9. Project and Sprint Services</h2>
    <h3>backend/src/services/projectService.js</h3>
    <p>This service manages project creation, lookup, update, deletion, members, and member notifications. When a project is created, the creator is automatically added as <code>ADMIN</code>.</p>
    <ul>
      <li><code>createProject</code>: creates project and creator membership together.</li>
      <li><code>getUserProjects</code>: returns only projects where the user is a member.</li>
      <li><code>getProjectById</code>: checks project membership before returning project data.</li>
      <li><code>addMemberByEmail</code>: finds user by email, prevents duplicates, creates membership, sends notification.</li>
      <li><code>removeMember</code>: removes a member but prevents an admin from removing themself.</li>
    </ul>
    <h3>backend/src/services/sprintService.js</h3>
    <p>This service manages sprint planning. A sprint belongs to one project and can contain many tasks.</p>
    <ul>
      <li>Creates planned sprints.</li>
      <li>Fetches sprints with their tasks and task metadata.</li>
      <li>Updates sprint status and dates.</li>
      <li>Moves tasks back to backlog before deleting a sprint.</li>
      <li>Checks task and sprint project match before adding a task to a sprint.</li>
    </ul>
  </section>

  <section class="page-break">
    <h2>10. Frontend Routing: frontend/src/App.jsx</h2>
    <p><code>App.jsx</code> defines all application routes using React Router. Public routes include home, login, and register. Private app routes are wrapped in <code>ProtectedRoute</code>.</p>
    <table>
      <tr><th>Route</th><th>Page</th><th>Purpose</th></tr>
      <tr><td><code>/</code></td><td>Home</td><td>Public landing/home page.</td></tr>
      <tr><td><code>/register</code></td><td>Register</td><td>User signup.</td></tr>
      <tr><td><code>/login</code></td><td>Login</td><td>User login.</td></tr>
      <tr><td><code>/dashboard</code></td><td>Dashboard</td><td>Protected project dashboard.</td></tr>
      <tr><td><code>/project/:id</code></td><td>Board</td><td>Protected Kanban board.</td></tr>
      <tr><td><code>/project/:id/backlog</code></td><td>Backlog</td><td>Protected backlog and sprint planning page.</td></tr>
      <tr><td><code>/reports</code></td><td>Reports</td><td>Protected analytics page.</td></tr>
      <tr><td><code>/profile</code></td><td>ProfilePage</td><td>Protected account settings.</td></tr>
    </table>
    <p>The app also wraps routes in toast and confirmation providers, making feedback and confirmation dialogs globally available.</p>
  </section>

  <section>
    <h2>11. API Client and Auth State</h2>
    <h3>frontend/src/api/axios.js</h3>
    <p>This file creates the shared Axios client. It sets the backend base URL and enables credentials for cookies. A request interceptor reads the JWT token from local storage and attaches it as a Bearer token.</p>
    <h3>frontend/src/context/AuthContext.jsx</h3>
    <p>This context stores the current logged-in user. It initializes from local storage, provides <code>login</code> and <code>logout</code>, and clears local auth state when the user logs out.</p>
    <div class="callout"><strong>How to explain it:</strong> the frontend keeps auth state globally through React Context, while Axios automatically attaches auth credentials to API requests.</div>
  </section>

  <section>
    <h2>12. Main App Layout: DashboardLayout.jsx</h2>
    <p>This component provides the authenticated app shell: sidebar navigation, mobile menu, notification entry point, profile block, logout button, and main content area.</p>
    <ul>
      <li>Reads current user through <code>/auth/me</code>.</li>
      <li>Uses <code>NotificationContext</code> to display unread notification count.</li>
      <li>Uses React Router links for dashboard, notifications, reports, and profile.</li>
      <li>Supports collapsible desktop sidebar.</li>
      <li>Supports mobile sidebar overlay.</li>
      <li>Calls logout and redirects to login.</li>
    </ul>
  </section>

  <section>
    <h2>13. Board Page: frontend/src/pages/Board.jsx</h2>
    <p>The board is the Kanban interface. It fetches the selected project, tasks, sprints, and members. It then renders columns for <code>TODO</code>, <code>IN_PROGRESS</code>, and <code>DONE</code>.</p>
    <ul>
      <li>Uses <code>useParams</code> to read project id from the URL.</li>
      <li>Fetches sprints and determines the active sprint.</li>
      <li>Fetches members for filters and assignment UI.</li>
      <li>Uses filters for search, assignee, priority, and issue type.</li>
      <li>Debounces search to avoid too many API calls.</li>
      <li>Shows skeleton loading state and an error state.</li>
      <li>Supports task creation, update, deletion, and detail modal.</li>
      <li>Implements drag-and-drop status updates.</li>
    </ul>
    <p><strong>Optimistic update:</strong> when a task is dragged to a new column, the UI updates immediately. If the API call fails, the task is moved back to its old status and a toast error is shown.</p>
  </section>

  <section>
    <h2>14. Backlog Page: frontend/src/pages/Backlog.jsx</h2>
    <p>The backlog page is for sprint planning. It separates unplanned tasks from sprint tasks. A task with no <code>sprintId</code> is treated as backlog work.</p>
    <ul>
      <li>Fetches project, sprints, backlog tasks, and project members together.</li>
      <li>Uses <code>sprintId=backlog</code> to request tasks without a sprint.</li>
      <li>Allows sprint creation and sprint status updates.</li>
      <li>Allows deleting a sprint and moving its tasks back to backlog.</li>
      <li>Allows moving tasks into and out of sprints.</li>
      <li>Keeps local UI state synchronized after task updates and deletions.</li>
    </ul>
    <div class="callout"><strong>Product explanation:</strong> the backlog page supports agile planning by letting the team decide what should remain unplanned and what should be committed to a sprint.</div>
  </section>

  <section>
    <h2>15. Reports Page: frontend/src/pages/Reports.jsx</h2>
    <p>The reports page pulls project and task data, then calculates useful product metrics on the frontend.</p>
    <ul>
      <li>Fetches all accessible projects.</li>
      <li>Fetches tasks for each project.</li>
      <li>Computes total, open, completed, overdue, due soon, and completion percentage.</li>
      <li>Builds status, priority, project workload, and throughput datasets.</li>
      <li>Uses Recharts for bar charts, pie charts, and area charts.</li>
      <li>Supports filters by project and date range.</li>
      <li>Supports CSV export.</li>
    </ul>
    <p><strong>Scalability note:</strong> calculating reports on the frontend is fine for an MVP. For larger teams, move report aggregation to backend endpoints or materialized database views.</p>
  </section>

  <section class="page-break">
    <h2>16. Complete Request Flow Example</h2>
    <p>Example: user drags a task from <code>TODO</code> to <code>DONE</code>.</p>
    <ol>
      <li><code>Board.jsx</code> captures the drop event.</li>
      <li>The task status updates immediately in local React state.</li>
      <li>Frontend sends <code>PATCH /api/tasks/:taskId</code> with the new status.</li>
      <li><code>protect</code> verifies the JWT.</li>
      <li><code>verifyTaskAccess</code> checks project membership for the task.</li>
      <li><code>authorize</code> checks that the user is <code>ADMIN</code> or <code>MEMBER</code>.</li>
      <li><code>validateSafe(updateTaskSchema)</code> validates the request body.</li>
      <li><code>taskController.updateTask</code> calls <code>taskService.updateTask</code>.</li>
      <li>The service updates the task through Prisma.</li>
      <li>The service creates an activity record such as status changed.</li>
      <li>If needed, the service creates a notification.</li>
      <li>The updated task returns to the frontend.</li>
      <li>If the API fails, the frontend rolls back the optimistic UI change.</li>
    </ol>
  </section>

  <section>
    <h2>17. Interview-Ready Answers</h2>
    <h3>What is the design pattern of the backend?</h3>
    <p>The backend uses a layered architecture: routes define endpoints, middleware handles auth and validation, controllers handle HTTP request and response, services contain business logic, and Prisma handles database access.</p>
    <h3>How do you prevent unauthorized access?</h3>
    <p>Every protected route uses JWT middleware. Project-level routes resolve the user's project role. Nested task and sprint routes first discover the parent project, then verify membership. Finally, role middleware checks whether the user's role is allowed.</p>
    <h3>Why did you use Prisma?</h3>
    <p>Prisma makes database queries safer and easier to maintain. It gives a clear schema, relation modeling, indexes, migrations, transactions, and a generated client for PostgreSQL access.</p>
    <h3>How does the Kanban board work?</h3>
    <p>The board fetches tasks for a project or active sprint and groups them by status. Drag-and-drop updates the task status through a PATCH API. The UI uses optimistic updates for speed and rolls back on failure.</p>
    <h3>How are sprints implemented?</h3>
    <p>Each sprint belongs to a project. Tasks can optionally reference a sprint. Tasks without a sprint are backlog tasks. Starting or completing a sprint changes the sprint status. Deleting a sprint moves tasks back to backlog instead of deleting them.</p>
    <h3>What makes this more than a CRUD app?</h3>
    <p>It includes project membership, RBAC, resource-level access checks, sprint planning, Kanban workflow, comments, task activity history, notifications, filtering, reports, CSV export, security middleware, and deployment-ready frontend/backend separation.</p>
  </section>

  <section>
    <h2>18. Files Covered</h2>
    <ul>
      ${fileRefs.map((file) => `<li><code>${file}</code></li>`).join("\n      ")}
    </ul>
  </section>
</body>
</html>`;

await fs.mkdir(docsDir, { recursive: true });
await fs.writeFile(htmlPath, html, "utf8");

const localBrowserCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const executablePath = localBrowserCandidates.find((candidate) => existsSync(candidate));
const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
});
const page = await browser.newPage();
await page.goto(`file://${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
});
await browser.close();

console.log(`Created ${htmlPath}`);
console.log(`Created ${pdfPath}`);
