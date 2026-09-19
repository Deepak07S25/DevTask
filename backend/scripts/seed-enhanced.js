/**
 * DevTask — Enhanced Seed Script
 * ────────────────────────────────────────────────────────────────
 * Generates a rich, realistic dataset that showcases every feature
 * of the DevTask frontend and is optimised for the Agentic AI demo.
 *
 * Highlights over the original seed:
 *   5th project: "AI Features Platform" — purpose-built for agent demos
 *   Markdown descriptions on every task (headers, lists, code blocks)
 *   AI fields pre-populated: riskLevel, riskScore, riskReasons
 *   Backlog tasks (no sprint) for realistic backlog view
 *   Richer, context-aware comments
 *   Specific overdue tasks for reports/risk demo
 *   Demo login: admin@devtask.com / password123
 *   All 10 team members + 1 dedicated demo user
 *   Sprint goals filled in
 *
 * Run:
 *   node scripts/seed-enhanced.js
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg }     = require('@prisma/adapter-pg');
const { Pool }         = require('pg');
const bcrypt           = require('bcryptjs');
require('dotenv').config();

const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });

/* ─── Helpers ────────────────────────────────────────────────────── */
const hashPw = (pw)       => bcrypt.hashSync(pw, 10);
const rand   = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randEl = (arr)      => arr[rand(0, arr.length - 1)];
const days   = (n)        => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
const past   = (n)        => days(-n);
const pick   = (arr, n)   => arr.slice().sort(() => Math.random() - 0.5).slice(0, n);

/* ─── Markdown description templates ────────────────────────────── */
const TASK_DESCS = [
  `## Overview\nImplement the core logic for this feature following the existing service pattern.\n\n## Acceptance Criteria\n- [ ] Unit tests pass with >80% coverage\n- [ ] Integration test added\n- [ ] PR reviewed by at least one senior engineer\n\n## Notes\nSee the Confluence design doc linked in the epic.`,
  `## Problem\nThe current implementation has O(n\xB2) complexity which causes timeouts on large datasets.\n\n## Proposed Solution\nReplace with a hash-map based approach:\n\`\`\`ts\nconst index = new Map(items.map(i => [i.id, i]));\n\`\`\`\n\n## Testing\nBenchmark against 10k, 50k, and 100k records.`,
  `## Background\nThis task is part of the **Auth Hardening** initiative.\n\n## Steps\n1. Review the existing implementation\n2. Identify edge cases\n3. Write the fix\n4. Add regression tests\n\n> **Note:** Coordinate with the infra team before deploying.`,
  `## Description\nAs agreed in sprint planning, this task covers:\n- Backend service changes\n- Frontend UI updates\n- Documentation update in the runbook\n\n## Definition of Done\n- Code reviewed\n- Staging tested\n- Monitoring alert added`,
  `## Context\nThis was identified during the **Q3 security audit**.\n\n## Risk\n**HIGH** — Exploitable if left unpatched beyond the next release.\n\n## Steps to Fix\n1. Rotate the affected credential\n2. Patch the vulnerable endpoint\n3. Add automated scanner to CI`,
  `## Summary\nSmall quality-of-life improvement requested by multiple team members.\n\n## Changes Required\n- Update the \`UserPreferences\` schema\n- Add migration\n- Update the settings UI component\n\n## Estimate\n~3 story points`,
  `## Goal\nReduce P95 API response time from **1200ms to under 200ms**.\n\n## Approach\n\`\`\`sql\nCREATE INDEX CONCURRENTLY idx_tasks_project_status\nON tasks (project_id, status)\nWHERE deleted_at IS NULL;\n\`\`\`\n\n## Monitoring\nTrack via Datadog APM dashboard.`,
  `## What\nMigrate all date handling to use UTC consistently across the stack.\n\n## Why\nCurrently, some endpoints return local time which causes confusion for distributed teams.\n\n## Impact\n- API response format changes (breaking)\n- Frontend date parsing must be updated\n- All existing timestamps to be re-labelled`,
];

const BUG_DESCS = [
  `## Steps to Reproduce\n1. Log in as any user\n2. Open a project with >50 tasks\n3. Rapidly drag 3 tasks between columns within 2 seconds\n\n## Expected\nAll tasks move to the correct column.\n\n## Actual\nOne task reverts to its original column after ~500ms.\n\n## Environment\n- Browser: Chrome 126\n- OS: macOS 14.5`,
  `## Steps to Reproduce\n1. Create a task with a due date 3 days ago\n2. Mark it as Done\n3. Reload the reports page\n\n## Expected\nTask appears as completed, not overdue.\n\n## Actual\nTask still shows in the overdue widget.\n\n## Root Cause (suspected)\nReport filter uses \`updatedAt\` instead of status to determine completion.`,
  `## Summary\nNotification badge shows N+1 after marking all as read.\n\n## Reproduce\n1. Have 5 unread notifications\n2. Click "Mark all as read"\n3. Badge shows 1 instead of 0\n\n## Fix\nThe \`markAllAsRead\` handler does not reset the unread count to 0.`,
  `## Description\nSafari 17 renders the date picker 40px below its trigger button.\n\n## Steps\n1. Open any task detail modal in Safari 17\n2. Click the Due Date field\n\n## Expected\nDropdown appears directly below the input.\n\n## Actual\nDropdown is offset by ~40px.`,
];

const EPIC_DESCS = [
  `## Strategic Initiative\nThis epic covers all work related to hardening authentication and security posture.\n\n## Goals\n- Achieve SOC2 Type II compliance\n- Reduce attack surface by 60%\n- Zero critical vulnerabilities in next audit\n\n## Milestones\n| Sprint | Milestone |\n|--------|----------|\n| Sprint 5 | MFA implementation |\n| Sprint 6 | API key rotation |\n| Sprint 7 | Audit logging |`,
  `## Strategic Initiative\nBuild a real-time collaboration layer that allows multiple users to work simultaneously.\n\n## Goals\n- Presence indicators on tasks\n- Live cursor tracking on boards\n- Conflict-free task editing\n\n## Dependencies\n- WebSocket infrastructure upgrade\n- Redis Pub/Sub cluster`,
  `## Strategic Initiative\nDeliver a comprehensive reporting suite for project managers and executives.\n\n## KPIs to Track\n- Sprint velocity\n- Burndown/burnup\n- Team workload\n- Overdue rate\n- Cycle time\n\n## Stakeholders\n- Engineering Managers\n- Product Leads`,
];

const STORY_DESCS = [
  `## User Story\nAs a **team member**, I want to receive notifications when tasks are assigned to me so that I can plan my day without checking the board manually.\n\n## Acceptance Criteria\n- [ ] Real-time notification appears within 2s of assignment\n- [ ] Email digest sent if user is offline\n- [ ] Notification links directly to the task`,
  `## User Story\nAs a **project admin**, I want to customise the Kanban board columns so that our workflow matches our team process.\n\n## Acceptance Criteria\n- [ ] Can add, rename, reorder, and delete columns\n- [ ] Column changes reflected immediately for all members\n- [ ] Cannot delete a column with tasks`,
  `## User Story\nAs a **developer**, I want to filter tasks by multiple criteria simultaneously so that I can focus on what is relevant to me.\n\n## Acceptance Criteria\n- [ ] Filters for: assignee, priority, type, label, sprint\n- [ ] Filters are combinable (AND logic)\n- [ ] Active filter count shown in filter bar`,
];

/* ─── Comments ───────────────────────────────────────────────────── */
const COMMENTS = [
  'Started on this. Initial investigation done — the issue is in the processQueue function. PR coming today.',
  'This is blocked by the DB migration ticket. Added a dependency note.',
  'Code reviewed. Left two minor nits in the PR. LGTM otherwise — go ahead and merge.',
  'Found a related edge case: what happens when the user is offline during the WebSocket reconnect?',
  'CI is red. Seems to be a flaky test in NotificationService. Retrying now.',
  'Merged to main. Please verify on staging before closing the ticket.',
  'Updated the Figma designs — link in the task description. Please review the new colour tokens.',
  'Can we bump this to HIGH? It is blocking the Sprint 6 demo.',
  'Turned out to be simpler than expected. Reused the existing IndexService.',
  'Done and deployed to staging. Tested on Chrome 126, Firefox 128, Safari 17. All passing.',
  'Waiting on design sign-off before implementing the new modal.',
  'Deployed to production at 14:32 UTC. No rollback needed. Monitoring for 24h.',
  'Root cause confirmed: unhandled promise rejection in the worker thread. Fixed in PR.',
  'Query time: 2400ms to 180ms after adding the compound index. Massive improvement!',
  'Pair-programmed with Carol. The tricky part was the optimistic update rollback logic.',
  'This is now unblocked — the infra ticket was resolved yesterday. Picking it up now.',
  'Added unit tests for all edge cases. Coverage went from 61% to 87%.',
  'Marking as Done. The acceptance criteria are all met.',
  'Left a TODO for the i18n strings — creating a follow-up ticket.',
  'Security team reviewed and approved. No additional changes needed.',
];

/* ─── Activity log actions ───────────────────────────────────────── */
const ACTIVITIES = [
  { action: 'created this task',   details: null },
  { action: 'changed status',      details: 'To Do -> In Progress' },
  { action: 'changed status',      details: 'In Progress -> In Review' },
  { action: 'changed status',      details: 'In Review -> Done' },
  { action: 'changed priority',    details: 'MEDIUM -> HIGH' },
  { action: 'changed priority',    details: 'LOW -> MEDIUM' },
  { action: 'assigned task',       details: 'to a team member' },
  { action: 'unassigned task',     details: null },
  { action: 'set due date',        details: 'in 7 days' },
  { action: 'updated description', details: null },
  { action: 'added to sprint',     details: null },
  { action: 'updated estimate',    details: '3 -> 5 points' },
];

/* ─── Notifications ──────────────────────────────────────────────── */
const NOTIF_TEMPLATES = [
  { title: 'Task Assigned to You',     message: 'You have been assigned a new task. Check the board for details.',   type: 'TASK_ASSIGNED'    },
  { title: 'Task Updated',             message: 'A task you are following was updated.',                             type: 'TASK_UPDATED'     },
  { title: 'New Comment on Your Task', message: 'Someone left a comment on a task assigned to you.',                 type: 'COMMENT_ADDED'    },
  { title: 'Added to Project',         message: 'You have been added as a member of a new project.',                 type: 'PROJECT_ASSIGNED' },
  { title: 'Sprint Started',           message: 'A new sprint has begun. Your tasks are waiting.',                   type: 'SPRINT_STARTED'   },
  { title: 'Task Overdue',             message: 'A task assigned to you is past its due date.',                      type: 'TASK_OVERDUE'     },
  { title: 'Sprint Ending Soon',       message: 'Your active sprint ends in 2 days. Review remaining tasks.',        type: 'SPRINT_ENDING'    },
];

/* ─── Main ───────────────────────────────────────────────────────── */
async function main() {
  console.log('\nDevTask Enhanced Seed — starting...');
  console.time('Total time');

  /* 1. Clear */
  await prisma.notification.deleteMany();
  await prisma.taskActivity.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.taskLabel.deleteMany();
  await prisma.label.deleteMany();
  await prisma.boardColumn.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  console.log('Cleared existing data');

  /* 2. Users */
  const pw = hashPw('password123');
  const userDefs = [
    { name: 'Alice Johnson', email: 'alice@devtask.io'  },
    { name: 'Bob Martinez',  email: 'bob@devtask.io'    },
    { name: 'Carol Chen',    email: 'carol@devtask.io'  },
    { name: 'Dave Kumar',    email: 'dave@devtask.io'   },
    { name: 'Eve Smith',     email: 'eve@devtask.io'    },
    { name: 'Frank Wright',  email: 'frank@devtask.io'  },
    { name: 'Grace Lee',     email: 'grace@devtask.io'  },
    { name: 'Heidi Patel',   email: 'heidi@devtask.io'  },
    { name: 'Ivan Novak',    email: 'ivan@devtask.io'   },
    { name: 'Julia Torres',  email: 'julia@devtask.io'  },
    { name: 'Demo Admin',    email: 'admin@devtask.com' }, // index 10
  ];
  const users = await Promise.all(
    userDefs.map(u => prisma.user.create({ data: { ...u, password: pw } }))
  );
  console.log(`Created ${users.length} users`);

  /* 3. Project definitions */
  const projectDefs = [
    {
      key: 'ALPHA', name: 'Web Portal Redesign',
      description: 'Full redesign of the customer-facing web portal for 2026. Covers design system, new component library, and performance optimisation.',
      cols:      ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'],
      colColors: ['#9ca3af', '#6b7280', '#3b82f6', '#eab308', '#22c55e'],
      labelDefs: [{ name: 'frontend', color: '#3b82f6' }, { name: 'backend', color: '#22c55e' }, { name: 'design', color: '#a855f7' }, { name: 'critical', color: '#ef4444' }, { name: 'dx', color: '#f97316' }, { name: 'a11y', color: '#06b6d4' }],
      memberIdxs: [10, 0, 1, 2, 3, 4],
    },
    {
      key: 'BETA', name: 'Data Pipeline V2',
      description: 'Rebuilding the analytics ingestion pipeline on Kafka + ClickHouse for 10x throughput improvement.',
      cols:      ['To Do', 'Doing', 'Testing', 'Deployed'],
      colColors: ['#6b7280', '#3b82f6', '#eab308', '#22c55e'],
      labelDefs: [{ name: 'data', color: '#8b5cf6' }, { name: 'infra', color: '#f97316' }, { name: 'kafka', color: '#06b6d4' }, { name: 'bug', color: '#ef4444' }, { name: 'perf', color: '#f59e0b' }],
      memberIdxs: [10, 2, 3, 4, 5, 6],
    },
    {
      key: 'GAMMA', name: 'Mobile App v2',
      description: 'Cross-platform React Native rewrite with Expo EAS Build and OTA update support for iOS and Android.',
      cols:      ['Icebox', 'Ready', 'In Progress', 'QA', 'Released'],
      colColors: ['#4b5563', '#9ca3af', '#3b82f6', '#eab308', '#22c55e'],
      labelDefs: [{ name: 'ios', color: '#0ea5e9' }, { name: 'android', color: '#22c55e' }, { name: 'ux', color: '#a855f7' }, { name: 'perf', color: '#f97316' }, { name: 'offline', color: '#f59e0b' }],
      memberIdxs: [10, 6, 7, 8, 9, 0],
    },
    {
      key: 'DELTA', name: 'DevOps Platform',
      description: 'Internal developer platform: feature flags, secrets management, observability dashboards, and self-service infrastructure.',
      cols:      ['Todo', 'In Progress', 'Staging', 'Production'],
      colColors: ['#6b7280', '#3b82f6', '#eab308', '#22c55e'],
      labelDefs: [{ name: 'k8s', color: '#06b6d4' }, { name: 'terraform', color: '#8b5cf6' }, { name: 'security', color: '#ef4444' }, { name: 'automation', color: '#f97316' }, { name: 'monitoring', color: '#f59e0b' }],
      memberIdxs: [10, 0, 5, 6, 7, 8, 9],
    },
    {
      key: 'ECHO', name: 'AI Features Platform',
      description: 'Building the AI-powered features layer: project health scoring, task risk analysis, sprint velocity prediction, and the conversational agent interface.',
      cols:      ['Backlog', 'In Progress', 'In Review', 'Done'],
      colColors: ['#6b7280', '#8b5cf6', '#eab308', '#22c55e'],
      labelDefs: [{ name: 'ai', color: '#8b5cf6' }, { name: 'backend', color: '#22c55e' }, { name: 'frontend', color: '#3b82f6' }, { name: 'research', color: '#f97316' }, { name: 'infra', color: '#06b6d4' }, { name: 'critical', color: '#ef4444' }],
      memberIdxs: [10, 0, 1, 2, 5, 6, 7],
    },
  ];

  /* 4. Create projects */
  const projects = [];
  for (const def of projectDefs) {
    const project = await prisma.project.create({
      data: {
        key: def.key, name: def.name, description: def.description,
        members: {
          create: def.memberIdxs.map((idx, i) => ({
            userId: users[idx].id,
            role: i === 0 ? 'ADMIN' : 'MEMBER',
          })),
        },
        boardColumns: {
          create: def.cols.map((name, i) => ({ name, order: i, color: def.colColors[i] })),
        },
        labels: { create: def.labelDefs },
      },
      include: { boardColumns: true, labels: true, members: true },
    });
    projects.push({ ...project, def });
  }
  console.log(`Created ${projects.length} projects`);

  /* 5. Sprints */
  const SPRINT_GOALS = [
    'Complete authentication hardening and MFA rollout',
    'Ship the new dashboard design to production',
    'Migrate all legacy API endpoints to v2',
    'Reduce P95 response time below 200ms',
    'Zero critical bugs remaining in the backlog',
    'Complete mobile app offline mode',
    'Launch the AI health scoring feature',
  ];
  const allSprints = [];
  for (const project of projects) {
    for (let i = -4; i <= 2; i++) {
      const sprint = await prisma.sprint.create({
        data: {
          name: `Sprint ${i + 5}`,
          goal: randEl(SPRINT_GOALS),
          status: i < 0 ? 'COMPLETED' : i === 0 ? 'ACTIVE' : 'PLANNED',
          startDate: days(i * 14),
          endDate:   days(i * 14 + 13),
          projectId: project.id,
        },
      });
      allSprints.push(sprint);
    }
  }
  console.log(`Created ${allSprints.length} sprints`);

  /* 6. Tasks */
  const counters = {};
  for (const p of projects) counters[p.key] = 0;
  const allCreatedTasks = [];

  const RISK_LEVELS  = ['NONE', 'NONE', 'NONE', 'LOW', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const RISK_REASONS_LIST = [
    ['No due date set', 'Missing assignee'],
    ['Overdue by 3 days', 'High priority with no progress'],
    ['Blocked dependency', 'Assignee at capacity'],
    ['No acceptance criteria', 'Sprint ends in 2 days'],
    ['Critical priority with no progress', 'Zero comments'],
    ['No estimate provided', 'Description is empty'],
  ];

  const EPIC_TITLES = [
    '[EPIC] Authentication & Security Hardening',
    '[EPIC] Real-Time Collaboration Engine',
    '[EPIC] Reporting & Analytics Suite',
    '[EPIC] Mobile Application v2.0',
    '[EPIC] DevOps & Observability Stack',
    '[EPIC] Payment & Billing System',
    '[EPIC] Search & Filtering Infrastructure',
    '[EPIC] User Onboarding & Activation',
    '[EPIC] Performance Optimisation',
    '[EPIC] API v2 Migration',
    '[EPIC] Accessibility & Internationalisation',
    '[EPIC] Data Export & Import',
    '[EPIC] AI Agent Integration',
    '[EPIC] Self-Serve Admin Dashboard',
  ];
  const STORY_TITLES = [
    'As a user, I can reset my password via a secure email link',
    'As an admin, I can manage project members and their roles',
    'As a member, I can filter tasks by assignee, priority, and label',
    'As a user, I receive real-time notifications for task changes',
    'As an admin, I can configure custom board workflow columns',
    'As a user, I can export project reports to Excel and CSV',
    'As a member, I can comment on and attach files to tasks',
    'As a user, I can view my assigned tasks across all projects',
    'As an admin, I can set and track sprint goals and velocity',
    'As a user, I can link tasks to epics and parent issues',
    'As a manager, I can view team workload and burndown charts',
    'As a user, I can receive digest email summaries of my tasks',
    'As a developer, I can integrate via webhooks',
    'As a user, I can view the full activity history of any task',
    'As an admin, I can archive completed sprints',
  ];
  const PREFIXES = ['Implement', 'Refactor', 'Design', 'Migrate', 'Optimise', 'Debug', 'Test', 'Document', 'Deploy', 'Audit', 'Review', 'Integrate', 'Scaffold', 'Remove', 'Update'];
  const SUBJECTS = ['Auth Service', 'Payment Gateway', 'Dashboard UI', 'Notification System', 'Search Index', 'Cache Layer', 'API Gateway', 'WebSocket Handler', 'Database Schema', 'CI/CD Pipeline', 'Log Aggregation', 'Rate Limiter', 'User Profiles', 'File Upload', 'Email Templates', 'Analytics Engine', 'Error Monitoring', 'Feature Flags', 'A/B Testing', 'Dark Mode', 'Mobile Navigation', 'Onboarding Flow', 'Audit Logs'];
  const BUG_TITLES = [
    '[BUG] Memory leak in WebSocket connection pool after 48h uptime',
    '[BUG] Race condition in task status update under high concurrency',
    '[BUG] JWT token not refreshed on 401 — user logged out unexpectedly',
    '[BUG] Drag-and-drop loses state on rapid successive moves',
    '[BUG] Notification badge count mismatch after mark-all-read',
    '[BUG] File upload silently fails for PDFs over 10MB',
    '[BUG] Search returns stale results after task delete',
    '[BUG] Date picker renders incorrectly in Safari 17',
    '[BUG] Sprint velocity chart missing data for weeks with no completed tasks',
    '[BUG] CORS preflight fails on OPTIONS request for auth refresh',
    '[BUG] User avatar not loading — signed URL expiry too short',
    '[BUG] Project creation fails when name contains special characters',
    '[BUG] Sidebar collapses on resize below 1024px',
    '[BUG] Activity log duplicates entries on optimistic update rollback',
    '[BUG] Email notifications sent twice for the same assignment',
    '[BUG] Reports page shows NaN% completion when no tasks exist',
    '[BUG] Board column reorder not persisted on page refresh',
    '[BUG] Comment delete button invisible in light mode',
  ];

  for (const project of projects) {
    const pSprints     = allSprints.filter(s => s.projectId === project.id);
    const pCompleted   = pSprints.filter(s => s.status === 'COMPLETED');
    const pActive      = pSprints.find(s => s.status === 'ACTIVE');
    const pPlanned     = pSprints.filter(s => s.status === 'PLANNED');
    const pCols        = project.boardColumns.map(c => c.name);
    const pLabels      = project.labels;
    const pMemberUids  = project.members.map(m => m.userId);
    const nextNum      = () => ++counters[project.key];
    const doneStatus   = pCols[pCols.length - 1];

    // Epics
    const epics = [];
    for (const title of pick(EPIC_TITLES, rand(8, 12))) {
      const sprint = randEl([...pCompleted, pActive]);
      const rl = randEl(['NONE', 'LOW', 'MEDIUM']);
      const epic = await prisma.task.create({
        data: {
          taskNumber: nextNum(), title, type: 'EPIC',
          description: randEl(EPIC_DESCS),
          status: sprint.status === 'COMPLETED' ? doneStatus : randEl(pCols),
          priority: 'HIGH', projectId: project.id, sprintId: sprint.id,
          assigneeId: randEl(pMemberUids), rank: rand(1000, 99999),
          riskLevel: rl, riskScore: rl === 'NONE' ? 0 : rand(5, 45),
          riskReasons: rl !== 'NONE' ? randEl(RISK_REASONS_LIST) : [],
        },
      });
      epics.push(epic);
      allCreatedTasks.push({ id: epic.id, projectId: project.id, memberIds: pMemberUids });
    }

    // Stories
    const storyTasks = [];
    for (let s = 0; s < rand(30, 40); s++) {
      const epic   = randEl(epics);
      const sprint = randEl([...pCompleted, pActive, ...pPlanned]);
      const isDone = sprint.status === 'COMPLETED';
      const status = isDone ? doneStatus : randEl(pCols);
      const rl     = randEl(RISK_LEVELS);
      const story = await prisma.task.create({
        data: {
          taskNumber: nextNum(),
          title: STORY_TITLES[s % STORY_TITLES.length] + (s >= STORY_TITLES.length ? ` (v${Math.floor(s / STORY_TITLES.length) + 1})` : ''),
          type: 'STORY', priority: randEl(['LOW', 'MEDIUM', 'MEDIUM', 'HIGH']),
          description: randEl(STORY_DESCS), status, projectId: project.id,
          sprintId: sprint.id, epicId: epic.id,
          assigneeId: rand(0, 9) > 1 ? randEl(pMemberUids) : null,
          dueDate: rand(0, 9) > 4 ? days(rand(-20, 30)) : null,
          estimatePoints: randEl([1, 2, 3, 5, 8]),
          actualPoints: isDone ? randEl([1, 2, 3, 5, 8]) : null,
          rank: rand(1000, 99999),
          riskLevel: rl, riskScore: rl === 'NONE' ? 0 : rand(10, 85),
          riskReasons: rl !== 'NONE' ? randEl(RISK_REASONS_LIST) : [],
        },
      });
      storyTasks.push(story);
      allCreatedTasks.push({ id: story.id, projectId: project.id, memberIds: pMemberUids });
    }

    // Regular tasks
    const regularTasks = [];
    for (let t = 0; t < rand(50, 65); t++) {
      const epic   = rand(0, 9) > 3 ? randEl(epics) : null;
      const sprint = randEl([...pCompleted, pActive, ...pPlanned]);
      const isDone = sprint.status === 'COMPLETED';
      const status = isDone ? doneStatus : randEl(pCols);
      const rl     = randEl(RISK_LEVELS);
      const task = await prisma.task.create({
        data: {
          taskNumber: nextNum(),
          title: `${randEl(PREFIXES)} ${randEl(SUBJECTS)}`,
          type: 'TASK', priority: randEl(['LOW', 'LOW', 'MEDIUM', 'MEDIUM', 'HIGH']),
          description: randEl(TASK_DESCS), status, projectId: project.id,
          sprintId: sprint.id, epicId: epic?.id ?? null,
          assigneeId: rand(0, 9) > 2 ? randEl(pMemberUids) : null,
          dueDate: rand(0, 9) > 4 ? days(rand(-15, 25)) : null,
          estimatePoints: rand(0, 9) > 3 ? randEl([1, 2, 3, 5, 8]) : null,
          actualPoints: isDone && rand(0, 9) > 4 ? randEl([1, 2, 3, 5, 8]) : null,
          rank: rand(1000, 99999),
          riskLevel: rl, riskScore: rl === 'NONE' ? 0 : rand(5, 70),
          riskReasons: rl !== 'NONE' ? randEl(RISK_REASONS_LIST) : [],
        },
      });
      regularTasks.push(task);
      allCreatedTasks.push({ id: task.id, projectId: project.id, memberIds: pMemberUids });
    }

    // Bugs
    for (let b = 0; b < rand(18, 25); b++) {
      const sprint = randEl([...pCompleted, pActive]);
      const isDone = sprint.status === 'COMPLETED';
      const status = isDone ? doneStatus : randEl(pCols);
      const rl     = randEl(['NONE', 'MEDIUM', 'HIGH', 'HIGH', 'CRITICAL']);
      const bug = await prisma.task.create({
        data: {
          taskNumber: nextNum(),
          title: BUG_TITLES[b % BUG_TITLES.length],
          type: 'BUG', priority: randEl(['MEDIUM', 'HIGH', 'HIGH', 'HIGH']),
          description: randEl(BUG_DESCS), status, projectId: project.id,
          sprintId: sprint.id, assigneeId: randEl(pMemberUids),
          dueDate: days(rand(-7, 10)), estimatePoints: randEl([1, 2, 3]),
          rank: rand(1000, 99999),
          riskLevel: rl, riskScore: rl === 'NONE' ? 5 : rand(40, 95),
          riskReasons: rl !== 'NONE' ? randEl(RISK_REASONS_LIST) : [],
        },
      });
      allCreatedTasks.push({ id: bug.id, projectId: project.id, memberIds: pMemberUids });
    }

    // Backlog tasks (no sprint)
    for (let bl = 0; bl < rand(10, 20); bl++) {
      const task = await prisma.task.create({
        data: {
          taskNumber: nextNum(),
          title: `${randEl(PREFIXES)} ${randEl(SUBJECTS)}`,
          type: randEl(['TASK', 'TASK', 'STORY', 'BUG']),
          priority: randEl(['LOW', 'MEDIUM', 'HIGH']),
          description: randEl(TASK_DESCS),
          status: pCols[0], projectId: project.id,
          sprintId: null, assigneeId: rand(0, 9) > 5 ? randEl(pMemberUids) : null,
          dueDate: null, rank: rand(1000, 99999),
          riskLevel: 'NONE', riskScore: 0, riskReasons: [],
        },
      });
      allCreatedTasks.push({ id: task.id, projectId: project.id, memberIds: pMemberUids });
    }

    // Label assignments
    const labelJoins = [];
    for (const task of [...regularTasks, ...storyTasks]) {
      const numLabels = rand(1, Math.min(3, pLabels.length));
      for (const label of pick(pLabels, numLabels)) {
        labelJoins.push({ taskId: task.id, labelId: label.id });
      }
    }
    if (labelJoins.length) {
      await prisma.taskLabel.createMany({ data: labelJoins, skipDuplicates: true });
    }
    console.log(`  ${project.key}: ${counters[project.key]} tasks, ${labelJoins.length} label assignments`);
  }

  /* 7. Specific overdue tasks for the ECHO AI demo project */
  const echoProject = projects.find(p => p.key === 'ECHO');
  const echoSprints = allSprints.filter(s => s.projectId === echoProject.id);
  const echoActive  = echoSprints.find(s => s.status === 'ACTIVE');
  const echoUids    = echoProject.members.map(m => m.userId);
  const echoCols    = echoProject.boardColumns.map(c => c.name);

  const overdueItems = [
    '[CRITICAL] Agent API rate-limiting not enforced — production risk',
    '[BUG] AI health widget crashes when project has 0 tasks',
    'Implement streaming response support for agent endpoint',
    '[OVERDUE] Add cost-tracking for Gemini API calls per project',
    'Write runbook for AI agent failure modes',
  ];

  for (const title of overdueItems) {
    const task = await prisma.task.create({
      data: {
        taskNumber: ++counters['ECHO'], title, type: 'BUG', priority: 'HIGH',
        description: randEl(BUG_DESCS),
        status: randEl(echoCols.slice(0, 2)),
        projectId: echoProject.id, sprintId: echoActive.id,
        assigneeId: randEl(echoUids),
        dueDate: past(rand(3, 12)),
        rank: rand(1000, 99999),
        riskLevel: 'CRITICAL', riskScore: rand(75, 99), blocked: true,
        riskReasons: ['Overdue by multiple days', 'Critical priority with no progress', 'Blocking sprint completion'],
      },
    });
    allCreatedTasks.push({ id: task.id, projectId: echoProject.id, memberIds: echoUids });
  }
  console.log(`Added ${overdueItems.length} overdue tasks to ECHO project`);

  /* 8. Comments */
  const commentRows = [];
  for (const t of allCreatedTasks) {
    for (let i = 0; i < rand(1, 8); i++) {
      commentRows.push({
        body: randEl(COMMENTS), taskId: t.id,
        authorId: randEl(t.memberIds), createdAt: past(rand(1, 30)),
      });
    }
  }
  for (let i = 0; i < commentRows.length; i += 500) {
    await prisma.comment.createMany({ data: commentRows.slice(i, i + 500) });
  }
  console.log(`Created ${commentRows.length} comments`);

  /* 9. Task activities */
  const activityRows = [];
  for (const t of allCreatedTasks) {
    for (let i = 0; i < rand(2, 9); i++) {
      const act = randEl(ACTIVITIES);
      activityRows.push({
        taskId: t.id, userId: randEl(t.memberIds),
        action: act.action, details: act.details ?? null,
        createdAt: past(rand(1, 28)),
      });
    }
  }
  for (let i = 0; i < activityRows.length; i += 500) {
    await prisma.taskActivity.createMany({ data: activityRows.slice(i, i + 500) });
  }
  console.log(`Created ${activityRows.length} activity entries`);

  /* 10. Notifications */
  const notifRows = [];
  for (const user of users) {
    for (let i = 0; i < rand(6, 18); i++) {
      const tmpl = randEl(NOTIF_TEMPLATES);
      notifRows.push({
        userId: user.id, title: tmpl.title, message: tmpl.message,
        type: tmpl.type, read: rand(0, 9) > 4,
        link: '/dashboard', createdAt: past(rand(1, 14)),
      });
    }
  }
  await prisma.notification.createMany({ data: notifRows });
  console.log(`Created ${notifRows.length} notifications`);

  /* Summary */
  const totalTasks = Object.values(counters).reduce((a, b) => a + b, 0);
  console.log('\n=== Enhanced Seed Complete ===');
  console.log(`Users:          ${users.length}`);
  console.log(`Projects:       ${projects.length}`);
  console.log(`Sprints:        ${allSprints.length}`);
  console.log(`Tasks:          ${totalTasks}`);
  console.log(`Comments:       ${commentRows.length}`);
  console.log(`Activities:     ${activityRows.length}`);
  console.log(`Notifications:  ${notifRows.length}`);
  console.log('\nLogin (password: password123)');
  console.log('  DEMO: admin@devtask.com');
  userDefs.slice(0, 10).forEach(u => console.log(`  ${u.email}`));
  console.log('\nProjects:');
  for (const p of projects) {
    console.log(`  [${p.key}] ${p.name} — ${counters[p.key]} tasks`);
  }
  console.timeEnd('Total time');
}

main()
  .catch(e => { console.error('Seed failed:', e.message ?? e); process.exit(1); })
  .finally(() => prisma.$disconnect());
