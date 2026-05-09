/**
 * DevTask — Maximum Density Seed Script
 * ──────────────────────────────────────
 * Uses bulk createMany everywhere for performance.
 * Generates:
 *   - 10 Users
 *   - 4 Projects w/ Custom Columns, Labels
 *   - 28 Sprints (Past/Active/Planned)
 *   - ~500+ Tasks (Epics, Stories, Bugs, Tasks, Subtasks)
 *   - ~600+ Comments
 *   - ~800+ Activity logs
 *   - ~100+ Notifications
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/* ── Helpers ─────────────────────────────────────────────────── */
const hash = (pw) => bcrypt.hashSync(pw, 10);
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randEl = (arr) => arr[rand(0, arr.length - 1)];
const days = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
const past = (n) => days(-n);

/* ── Vocabulary for realistic content ───────────────────────── */
const TASK_PREFIXES = ['Implement', 'Refactor', 'Design', 'Migrate', 'Optimize', 'Debug', 'Test', 'Document', 'Deploy', 'Audit', 'Review', 'Integrate'];
const TASK_SUBJECTS = ['Auth Service', 'Payment Gateway', 'Dashboard UI', 'Notification System', 'Search Index', 'Cache Layer', 'API Gateway', 'WebSocket Handler', 'Database Schema', 'CI/CD Pipeline', 'Log Aggregation', 'Rate Limiter', 'User Profiles', 'File Upload', 'Email Templates', 'Analytics Engine', 'GraphQL Layer', 'Error Monitoring', 'Feature Flags', 'A/B Testing'];
const BUG_TEMPLATES = [
  '[BUG] Memory leak in WebSocket connection pool after 48h uptime',
  '[BUG] Race condition in task status update under high concurrency',
  '[BUG] JWT token not refreshed on 401 — user logged out unexpectedly',
  '[BUG] Drag-and-drop loses state on rapid successive moves',
  '[BUG] Notification badge count mismatch after mark-all-read',
  '[BUG] File upload silently fails for PDFs > 10MB',
  '[BUG] Search returns stale results after task delete',
  '[BUG] Date picker renders incorrectly in Safari 17',
  '[BUG] Sprint velocity chart missing data for weeks with no completed tasks',
  '[BUG] CORS preflight fails on OPTIONS request for /api/auth/refresh',
  '[BUG] User avatar not loading from S3 — signed URL expiry too short',
  '[BUG] Project creation fails when name contains special characters',
  '[BUG] Sidebar collapses on resize below 1024px width',
  '[BUG] Activity log duplicates entries on optimistic update rollback',
  '[BUG] Email notifications sent twice for the same task assignment',
];
const EPIC_TITLES = [
  '[EPIC] Authentication & Security Hardening',
  '[EPIC] Real-Time Collaboration Engine',
  '[EPIC] Reporting & Analytics Suite',
  '[EPIC] Mobile Application v2.0',
  '[EPIC] DevOps & Observability',
  '[EPIC] Payment & Billing System',
  '[EPIC] Search & Filtering Infrastructure',
  '[EPIC] User Onboarding Flow',
  '[EPIC] Performance Optimisation',
  '[EPIC] API v2 Migration',
  '[EPIC] Accessibility & i18n',
  '[EPIC] Data Export & Import',
];
const STORY_TITLES = [
  'As a user, I can reset my password via email link',
  'As an admin, I can manage project members and roles',
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
];
const COMMENT_BODIES = [
  'Started working on this. Will have a draft PR up by tomorrow.',
  'This is blocked by the backend migration. Tracking in ALPHA-42.',
  'Reviewed and approved. Minor nit: add error boundary around the chart.',
  'Found an edge case — what happens when the sprint has no tasks?',
  'CI is failing. Looks like a flaky test in the notification suite.',
  "Merged to `main`. Please verify on staging before closing.",
  'Updated the Figma designs. Link in the description.',
  "Can we bump this to HIGH priority? It's blocking the demo.",
  'This is actually much simpler than we thought. Using the existing service.',
  'Done. Tested on Chrome, Firefox, and Safari. All good.',
  'Waiting on design sign-off before I proceed.',
  "Deployed to staging. Let me know if you spot anything odd.",
  'The root cause was an unhandled promise rejection in the worker thread.',
  'Reduced query time from 2400ms to 180ms by adding a compound index.',
  'Pair-programmed this with @carol. The tricky part was the transaction rollback.',
];
const ACTIVITY_ACTIONS = [
  { action: 'created this task' },
  { action: 'changed status', details: 'from To Do to In Progress' },
  { action: 'changed status', details: 'from In Progress to In Review' },
  { action: 'changed status', details: 'from In Review to Done' },
  { action: 'changed priority', details: 'from MEDIUM to HIGH' },
  { action: 'assigned task', details: 'to a team member' },
  { action: 'unassigned task' },
  { action: 'set due date', details: 'to next Friday' },
  { action: 'updated description' },
  { action: 'updated labels' },
];

/* ── Main ─────────────────────────────────────────────────────── */
async function main() {
  console.log('🌱 Starting maximum-density seed…');
  console.time('⏱  Total time');

  // 1. Clear
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
  console.log('✅ Cleared existing data');

  // 2. Users
  const userSeeds = [
    { name: 'Alice Johnson', email: 'alice@devtask.io' },
    { name: 'Bob Martinez', email: 'bob@devtask.io' },
    { name: 'Carol Chen', email: 'carol@devtask.io' },
    { name: 'Dave Kumar', email: 'dave@devtask.io' },
    { name: 'Eve Smith', email: 'eve@devtask.io' },
    { name: 'Frank Wright', email: 'frank@devtask.io' },
    { name: 'Grace Lee', email: 'grace@devtask.io' },
    { name: 'Heidi Patel', email: 'heidi@devtask.io' },
    { name: 'Ivan Novak', email: 'ivan@devtask.io' },
    { name: 'Julia Torres', email: 'julia@devtask.io' },
  ];
  const pw = hash('password123');
  const users = await Promise.all(
    userSeeds.map(u => prisma.user.create({ data: { ...u, password: pw } }))
  );
  console.log(`✅ Created ${users.length} users`);

  // 3. Projects
  const projectDefs = [
    {
      key: 'ALPHA', name: 'Web Portal Redesign',
      description: 'Full redesign of the customer-facing web portal for 2026.',
      cols: ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'],
      colColors: ['#9ca3af', '#6b7280', '#3b82f6', '#eab308', '#22c55e'],
      labelDefs: [{ name: 'frontend', color: '#3b82f6' }, { name: 'backend', color: '#22c55e' }, { name: 'design', color: '#a855f7' }, { name: 'critical', color: '#ef4444' }, { name: 'dx', color: '#f97316' }],
      memberIds: [0, 1, 2, 3, 4],  // Alice (admin), Bob, Carol, Dave, Eve
    },
    {
      key: 'BETA', name: 'Data Pipeline V2',
      description: 'Rebuilding the analytics ingestion pipeline on Kafka + ClickHouse.',
      cols: ['To Do', 'Doing', 'Testing', 'Deployed'],
      colColors: ['#6b7280', '#3b82f6', '#eab308', '#22c55e'],
      labelDefs: [{ name: 'data', color: '#8b5cf6' }, { name: 'infra', color: '#f97316' }, { name: 'kafka', color: '#06b6d4' }, { name: 'bug', color: '#ef4444' }],
      memberIds: [2, 3, 4, 5, 6],  // Carol (admin), Dave, Eve, Frank, Grace
    },
    {
      key: 'GAMMA', name: 'Mobile App v2',
      description: 'Cross-platform React Native rewrite with EAS Build & OTA updates.',
      cols: ['Icebox', 'Ready', 'In Progress', 'QA', 'Released'],
      colColors: ['#4b5563', '#9ca3af', '#3b82f6', '#eab308', '#22c55e'],
      labelDefs: [{ name: 'ios', color: '#0ea5e9' }, { name: 'android', color: '#22c55e' }, { name: 'ux', color: '#a855f7' }, { name: 'perf', color: '#f97316' }],
      memberIds: [6, 7, 8, 9, 0],  // Grace (admin), Heidi, Ivan, Julia, Alice
    },
    {
      key: 'DELTA', name: 'DevOps Platform',
      description: 'Internal developer platform: feature flags, secrets mgmt, and observability.',
      cols: ['Todo', 'In Progress', 'Staging', 'Production'],
      colColors: ['#6b7280', '#3b82f6', '#eab308', '#22c55e'],
      labelDefs: [{ name: 'k8s', color: '#06b6d4' }, { name: 'terraform', color: '#8b5cf6' }, { name: 'security', color: '#ef4444' }, { name: 'automation', color: '#f97316' }],
      memberIds: [0, 5, 6, 7, 8, 9],  // Alice (admin), Frank, Grace, Heidi, Ivan, Julia
    },
  ];

  const projects = [];
  for (const def of projectDefs) {
    const members = def.memberIds.map((idx, i) => ({
      userId: users[idx].id,
      role: i === 0 ? 'ADMIN' : 'MEMBER',
    }));
    const project = await prisma.project.create({
      data: {
        key: def.key, name: def.name, description: def.description,
        members: { create: members },
        boardColumns: { create: def.cols.map((name, i) => ({ name, order: i, color: def.colColors[i] })) },
        labels: { create: def.labelDefs },
      },
      include: { boardColumns: true, labels: true, members: true },
    });
    projects.push(project);
  }
  console.log(`✅ Created ${projects.length} projects with columns and labels`);

  // 4. Sprints (7 per project: 4 completed, 1 active, 2 planned)
  const allSprints = [];
  for (const project of projects) {
    const sprintData = [];
    for (let i = -4; i <= 2; i++) {
      sprintData.push({
        name: `Sprint ${i + 5}`,
        status: i < 0 ? 'COMPLETED' : i === 0 ? 'ACTIVE' : 'PLANNED',
        startDate: days(i * 14),
        endDate: days(i * 14 + 13),
        projectId: project.id,
      });
    }
    // Create sequentially to get IDs back (createMany doesn't return records)
    for (const data of sprintData) {
      const sprint = await prisma.sprint.create({ data });
      allSprints.push(sprint);
    }
  }
  console.log(`✅ Created ${allSprints.length} sprints`);

  // 5. Tasks — bulk generation per project
  let taskCounter = { ALPHA: 0, BETA: 0, GAMMA: 0, DELTA: 0 };
  let allCreatedTasks = []; // collect tasks that need comments/activities

  for (const project of projects) {
    const pSprints = allSprints.filter(s => s.projectId === project.id);
    const pCompletedSprints = pSprints.filter(s => s.status === 'COMPLETED');
    const pActiveSprint = pSprints.find(s => s.status === 'ACTIVE');
    const pPlannedSprints = pSprints.filter(s => s.status === 'PLANNED');
    const pCols = project.boardColumns.map(c => c.name);
    const pLabels = project.labels;
    const pMemberUserIds = project.members.map(m => m.userId);

    // Helper to get next task number for this project
    const nextNum = () => ++taskCounter[project.key];

    // Create 10-12 EPICs per project
    const epicTitles = EPIC_TITLES.slice().sort(() => Math.random() - 0.5).slice(0, rand(10, 12));
    const epics = [];
    for (const title of epicTitles) {
      const epic = await prisma.task.create({
        data: {
          taskNumber: nextNum(), title, type: 'EPIC',
          description: `Strategic initiative: ${title.replace('[EPIC] ', '')}. Spans multiple sprints and requires cross-functional effort.`,
          status: randEl(pCols), priority: 'HIGH',
          projectId: project.id,
          sprintId: randEl([...pCompletedSprints, pActiveSprint]).id,
          assigneeId: randEl(pMemberUserIds),
          rank: rand(1000, 99999),
        }
      });
      epics.push(epic);
      allCreatedTasks.push({ id: epic.id, projectId: project.id, memberIds: pMemberUserIds });
    }

    // Create ~35-45 Stories per project
    const storyTasks = [];
    for (let s = 0; s < rand(35, 45); s++) {
      const epic = randEl(epics);
      const sprint = randEl([...pCompletedSprints, pActiveSprint, ...pPlannedSprints]);
      const status = sprint.status === 'COMPLETED' ? 'Done' : randEl(pCols);
      const story = await prisma.task.create({
        data: {
          taskNumber: nextNum(),
          title: STORY_TITLES[s % STORY_TITLES.length] + (s >= STORY_TITLES.length ? ` (${Math.floor(s / STORY_TITLES.length) + 1})` : ''),
          type: 'STORY', priority: randEl(['LOW', 'MEDIUM', 'HIGH', 'HIGH']),
          description: 'User story with acceptance criteria defined in Confluence.',
          status, projectId: project.id, sprintId: sprint.id, epicId: epic.id,
          assigneeId: rand(0, 9) > 1 ? randEl(pMemberUserIds) : null,
          dueDate: rand(0, 9) > 4 ? days(rand(-20, 30)) : null,
          rank: rand(1000, 99999),
        }
      });
      storyTasks.push(story);
      allCreatedTasks.push({ id: story.id, projectId: project.id, memberIds: pMemberUserIds });
    }

    // Create ~60-80 regular Tasks per project
    const regularTasks = [];
    for (let t = 0; t < rand(60, 80); t++) {
      const epic = rand(0, 9) > 3 ? randEl(epics) : null;
      const sprint = randEl([...pCompletedSprints, pActiveSprint, ...pPlannedSprints]);
      const status = sprint.status === 'COMPLETED' ? 'Done' : randEl(pCols);
      const assignee = rand(0, 9) > 2 ? randEl(pMemberUserIds) : null;
      const task = await prisma.task.create({
        data: {
          taskNumber: nextNum(),
          title: `${randEl(TASK_PREFIXES)} ${randEl(TASK_SUBJECTS)}`,
          type: 'TASK', priority: randEl(['LOW', 'LOW', 'MEDIUM', 'MEDIUM', 'HIGH']),
          description: 'Implementation details to be added during sprint planning.',
          status, projectId: project.id, sprintId: sprint.id,
          epicId: epic?.id ?? null, assigneeId: assignee,
          dueDate: rand(0, 9) > 5 ? days(rand(-15, 25)) : null,
          rank: rand(1000, 99999),
        }
      });
      regularTasks.push(task);
      allCreatedTasks.push({ id: task.id, projectId: project.id, memberIds: pMemberUserIds });
    }

    // Create ~20-28 Bugs per project
    for (let b = 0; b < rand(20, 28); b++) {
      const sprint = randEl([...pCompletedSprints, pActiveSprint]);
      const status = sprint.status === 'COMPLETED' ? 'Done' : randEl(pCols);
      const bug = await prisma.task.create({
        data: {
          taskNumber: nextNum(),
          title: BUG_TEMPLATES[b % BUG_TEMPLATES.length],
          type: 'BUG', priority: randEl(['MEDIUM', 'HIGH', 'HIGH', 'HIGH']),
          description: '## Steps to Reproduce\n1. Trigger the condition\n2. Observe the error\n\n## Expected\nSystem behaves normally.\n\n## Actual\nSee title.',
          status, projectId: project.id, sprintId: sprint.id,
          assigneeId: randEl(pMemberUserIds),
          dueDate: days(rand(-5, 10)),
          rank: rand(1000, 99999),
        }
      });
      allCreatedTasks.push({ id: bug.id, projectId: project.id, memberIds: pMemberUserIds });
    }

    // Bulk-assign labels (1-3 per task) to all regular tasks
    const labelJoins = [];
    for (const task of [...regularTasks, ...storyTasks]) {
      const numLabels = rand(1, Math.min(3, pLabels.length));
      const picked = pLabels.sort(() => Math.random() - 0.5).slice(0, numLabels);
      for (const label of picked) {
        labelJoins.push({ taskId: task.id, labelId: label.id });
      }
    }
    if (labelJoins.length) await prisma.taskLabel.createMany({ data: labelJoins, skipDuplicates: true });

    console.log(`   ↳ ${project.key}: ${taskCounter[project.key]} tasks, ${labelJoins.length} label assignments`);
  }

  const totalTasks = Object.values(taskCounter).reduce((a, b) => a + b, 0);
  console.log(`✅ Created ${totalTasks} tasks across all projects`);

  // 6. Comments — bulk insert ~3-7 per task (sampled)
  const commentRows = [];
  for (const t of allCreatedTasks) {
    const count = rand(2, 8);
    for (let i = 0; i < count; i++) {
      commentRows.push({
        body: COMMENT_BODIES[rand(0, COMMENT_BODIES.length - 1)],
        taskId: t.id,
        authorId: randEl(t.memberIds),
        createdAt: past(rand(1, 30)),
      });
    }
  }
  // Insert in chunks of 500 to avoid oversized payloads
  for (let i = 0; i < commentRows.length; i += 500) {
    await prisma.comment.createMany({ data: commentRows.slice(i, i + 500) });
  }
  console.log(`✅ Created ${commentRows.length} comments`);

  // 7. Task Activities — bulk insert
  const activityRows = [];
  for (const t of allCreatedTasks) {
    const count = rand(3, 8);
    for (let i = 0; i < count; i++) {
      const act = randEl(ACTIVITY_ACTIONS);
      activityRows.push({
        taskId: t.id,
        userId: randEl(t.memberIds),
        action: act.action,
        details: act.details ?? null,
        createdAt: past(rand(1, 25)),
      });
    }
  }
  for (let i = 0; i < activityRows.length; i += 500) {
    await prisma.taskActivity.createMany({ data: activityRows.slice(i, i + 500) });
  }
  console.log(`✅ Created ${activityRows.length} activity log entries`);

  // 8. Notifications — realistic set for all users
  const notifRows = [];
  const notifTypes = ['TASK_ASSIGNED', 'TASK_UPDATED', 'COMMENT_ADDED', 'PROJECT_ASSIGNED'];
  for (const user of users) {
    const count = rand(5, 15);
    for (let i = 0; i < count; i++) {
      notifRows.push({
        userId: user.id,
        title: randEl(['Task Assigned', 'Task Updated', 'New Comment', 'Added to Project']),
        message: randEl([
          'You have been assigned a new task.',
          'A task you follow was updated.',
          'Someone commented on your task.',
          'You have been added to a new project.',
        ]),
        type: randEl(notifTypes),
        read: rand(0, 9) > 4,
        link: '/dashboard',
        createdAt: past(rand(1, 14)),
      });
    }
  }
  await prisma.notification.createMany({ data: notifRows });
  console.log(`✅ Created ${notifRows.length} notifications`);

  console.log('\n🎉 Dense Seed Complete!\n');
  console.log('─────────────────────────────────────────────────');
  console.log('SUMMARY');
  console.log(`  Users:         ${users.length}`);
  console.log(`  Projects:      ${projects.length}`);
  console.log(`  Sprints:       ${allSprints.length}`);
  console.log(`  Tasks:         ${totalTasks}+`);
  console.log(`  Comments:      ${commentRows.length}`);
  console.log(`  Activities:    ${activityRows.length}`);
  console.log(`  Notifications: ${notifRows.length}`);
  console.log('─────────────────────────────────────────────────');
  console.log('\nLogin with any user (password: password123):');
  userSeeds.forEach(u => console.log(`  ${u.email}`));
  console.log('\n');
  console.timeEnd('⏱  Total time');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
