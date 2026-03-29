/**
 * DevTask — Database Seed Script
 * ──────────────────────────────
 * Run with:  node seed.js
 *
 * This creates:
 *  - 3 demo users
 *  - 3 projects
 *  - sprint entries per project
 *  - realistic tasks (epics, stories, bugs, tasks)
 *  - comments
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/* ── Helpers ────────────────────────────────────────────────────── */
const hash = (pw) => bcrypt.hashSync(pw, 10);

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

/* ── Seed Data ──────────────────────────────────────────────────── */
async function main() {
  console.log('🌱 Starting seed…');

  // ── 1. Clear existing data (optional — comment out to keep existing) ──
  await prisma.taskActivity.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // ── 2. Users ──────────────────────────────────────────────────────────
  const alice = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice@devtask.io',
      password: hash('password123'),
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: 'Bob Martinez',
      email: 'bob@devtask.io',
      password: hash('password123'),
    },
  });

  const carol = await prisma.user.create({
    data: {
      name: 'Carol Chen',
      email: 'carol@devtask.io',
      password: hash('password123'),
    },
  });

  const dave = await prisma.user.create({
    data: {
      name: 'Dave Kumar',
      email: 'dave@devtask.io',
      password: hash('password123'),
    },
  });

  console.log('✅ Users created');

  // ── 3. Projects ───────────────────────────────────────────────────────
  const projectAlpha = await prisma.project.create({
    data: {
      name: 'Project Alpha',
      description: 'Customer-facing web portal redesign and performance overhaul.',
      members: {
        create: [
          { userId: alice.id, role: 'ADMIN' },
          { userId: bob.id,   role: 'MEMBER' },
          { userId: carol.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const projectBeta = await prisma.project.create({
    data: {
      name: 'Project Beta',
      description: 'Internal analytics dashboard with real-time data pipelines.',
      members: {
        create: [
          { userId: alice.id, role: 'ADMIN' },
          { userId: dave.id,  role: 'MEMBER' },
          { userId: bob.id,   role: 'MEMBER' },
        ],
      },
    },
  });

  const projectGamma = await prisma.project.create({
    data: {
      name: 'Mobile App v2',
      description: 'Cross-platform mobile rewrite in React Native.',
      members: {
        create: [
          { userId: carol.id, role: 'ADMIN' },
          { userId: dave.id,  role: 'MEMBER' },
          { userId: alice.id, role: 'MEMBER' },
        ],
      },
    },
  });

  console.log('✅ Projects created');

  // ── 4. Sprints ────────────────────────────────────────────────────────
  const sprintA1 = await prisma.sprint.create({
    data: {
      name: 'Sprint 1 — Foundation',
      goal: 'Set up core architecture and design system',
      status: 'COMPLETED',
      startDate: daysFromNow(-42),
      endDate: daysFromNow(-29),
      projectId: projectAlpha.id,
    },
  });

  const sprintA2 = await prisma.sprint.create({
    data: {
      name: 'Sprint 2 — Core Features',
      goal: 'Implement authentication, dashboard and board views',
      status: 'ACTIVE',
      startDate: daysFromNow(-14),
      endDate: daysFromNow(0),
      projectId: projectAlpha.id,
    },
  });

  const sprintA3 = await prisma.sprint.create({
    data: {
      name: 'Sprint 3 — Polish & Launch',
      goal: 'Bug fixes, performance, and production readiness',
      status: 'PLANNED',
      startDate: daysFromNow(1),
      endDate: daysFromNow(14),
      projectId: projectAlpha.id,
    },
  });

  const sprintB1 = await prisma.sprint.create({
    data: {
      name: 'Sprint 1 — Data Pipeline',
      goal: 'Build ETL pipeline and connect to data sources',
      status: 'ACTIVE',
      startDate: daysFromNow(-7),
      endDate: daysFromNow(7),
      projectId: projectBeta.id,
    },
  });

  const sprintG1 = await prisma.sprint.create({
    data: {
      name: 'Sprint 1 — Setup',
      goal: 'Monorepo setup, CI/CD pipeline, navigation skeleton',
      status: 'ACTIVE',
      startDate: daysFromNow(-5),
      endDate: daysFromNow(9),
      projectId: projectGamma.id,
    },
  });

  console.log('✅ Sprints created');

  // ── 5. Tasks — Project Alpha ──────────────────────────────────────────

  // EPICs
  const epicAuth = await prisma.task.create({
    data: {
      title: 'Authentication & Authorization',
      description: '## Overview\nEverything related to user auth: registration, login, JWT, password reset, roles.',
      type: 'EPIC',
      status: 'DONE',
      priority: 'HIGH',
      projectId: projectAlpha.id,
      sprintId: sprintA1.id,
    },
  });

  const epicDashboard = await prisma.task.create({
    data: {
      title: 'Dashboard & Analytics',
      description: '## Overview\nProject overview dashboard, stats widgets, and activity feed.',
      type: 'EPIC',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: projectAlpha.id,
      sprintId: sprintA2.id,
    },
  });

  const epicBoard = await prisma.task.create({
    data: {
      title: 'Kanban Board',
      description: '## Overview\nFull Kanban board with drag-and-drop, filters, and task cards.',
      type: 'EPIC',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: projectAlpha.id,
      sprintId: sprintA2.id,
    },
  });

  // Sprint 1 tasks (COMPLETED sprint)
  await prisma.task.createMany({
    data: [
      {
        title: 'Set up Vite + React project structure',
        description: 'Initialize the frontend monorepo with Vite, ESLint, and Prettier configuration.',
        type: 'TASK',
        status: 'DONE',
        priority: 'HIGH',
        projectId: projectAlpha.id,
        sprintId: sprintA1.id,
        assigneeId: alice.id,
        epicId: null,
        dueDate: daysFromNow(-35),
      },
      {
        title: 'Configure Prisma + PostgreSQL',
        description: 'Define the initial schema, run first migration, connect to local DB.',
        type: 'TASK',
        status: 'DONE',
        priority: 'HIGH',
        projectId: projectAlpha.id,
        sprintId: sprintA1.id,
        assigneeId: bob.id,
        dueDate: daysFromNow(-33),
      },
      {
        title: 'Implement JWT authentication',
        description: 'POST /auth/register, POST /auth/login with bcrypt + JWT signing. Middleware for protected routes.',
        type: 'STORY',
        status: 'DONE',
        priority: 'HIGH',
        projectId: projectAlpha.id,
        sprintId: sprintA1.id,
        assigneeId: bob.id,
        epicId: epicAuth.id,
        dueDate: daysFromNow(-30),
      },
      {
        title: 'Build CSS design system',
        description: 'Define all CSS variables, typography scale, button classes, badge, card, and modal styles.',
        type: 'TASK',
        status: 'DONE',
        priority: 'MEDIUM',
        projectId: projectAlpha.id,
        sprintId: sprintA1.id,
        assigneeId: carol.id,
        dueDate: daysFromNow(-31),
      },
    ],
  });

  // Sprint 2 tasks (ACTIVE)
  const taskDashboard = await prisma.task.create({
    data: {
      title: 'Redesign Dashboard stats panel',
      description: '## Requirements\n- 4 metric cards (Total, In Progress, Done, Overdue)\n- Animated count-up numbers\n- Color-coded icons per metric',
      type: 'STORY',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: projectAlpha.id,
      sprintId: sprintA2.id,
      assigneeId: carol.id,
      epicId: epicDashboard.id,
      dueDate: daysFromNow(2),
    },
  });

  const taskKanban = await prisma.task.create({
    data: {
      title: 'Implement drag-and-drop on Kanban board',
      description: '## Requirements\n- Native HTML5 drag API\n- Optimistic status update\n- Visual hover state on column drop zone\n- Rollback on API failure',
      type: 'STORY',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: projectAlpha.id,
      sprintId: sprintA2.id,
      assigneeId: bob.id,
      epicId: epicBoard.id,
      dueDate: daysFromNow(1),
    },
  });

  await prisma.task.create({
    data: {
      title: 'Sprint progress bar in Backlog page',
      description: 'Show completion percentage per sprint with an animated progress bar.',
      type: 'TASK',
      status: 'DONE',
      priority: 'MEDIUM',
      projectId: projectAlpha.id,
      sprintId: sprintA2.id,
      assigneeId: alice.id,
      dueDate: daysFromNow(-3),
    },
  });

  await prisma.task.create({
    data: {
      title: '[BUG] Task modal closes on background click in Firefox',
      description: '## Steps to reproduce\n1. Open Firefox 124\n2. Click any task card\n3. Click outside modal\n4. Modal does not close\n\n## Expected\nModal closes on outside click.\n\n## Environment\nFirefox 124 on Windows 11',
      type: 'BUG',
      status: 'TODO',
      priority: 'HIGH',
      projectId: projectAlpha.id,
      sprintId: sprintA2.id,
      assigneeId: carol.id,
      dueDate: daysFromNow(-1), // overdue
    },
  });

  await prisma.task.create({
    data: {
      title: '[BUG] Filter "Assignee" resets on page refresh',
      description: 'When a filter is applied and the page is refreshed, all filters are cleared. Filters should persist via URL query params.',
      type: 'BUG',
      status: 'TODO',
      priority: 'MEDIUM',
      projectId: projectAlpha.id,
      sprintId: sprintA2.id,
      assigneeId: bob.id,
      dueDate: daysFromNow(5),
    },
  });

  // Backlog tasks (no sprint)
  await prisma.task.createMany({
    data: [
      {
        title: 'Dark mode toggle',
        description: 'Add a light/dark mode switch in the user settings panel.',
        type: 'TASK',
        status: 'TODO',
        priority: 'LOW',
        projectId: projectAlpha.id,
        assigneeId: null,
      },
      {
        title: 'Email notification for task assignment',
        description: 'Send an email when a task is assigned to a team member.',
        type: 'STORY',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: projectAlpha.id,
        assigneeId: null,
      },
      {
        title: 'Keyboard shortcuts for board navigation',
        description: 'Allow users to navigate the Kanban board with keyboard shortcuts (J/K for next/prev card).',
        type: 'TASK',
        status: 'TODO',
        priority: 'LOW',
        projectId: projectAlpha.id,
        assigneeId: null,
      },
    ],
  });

  console.log('✅ Project Alpha tasks created');

  // ── 6. Tasks — Project Beta ───────────────────────────────────────────
  const epicPipeline = await prisma.task.create({
    data: {
      title: 'Real-time Data Pipeline',
      type: 'EPIC',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: projectBeta.id,
      sprintId: sprintB1.id,
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: 'Set up Apache Kafka consumer',
        description: 'Connect to Kafka cluster, consume events from topic `user-events`.',
        type: 'TASK',
        status: 'DONE',
        priority: 'HIGH',
        projectId: projectBeta.id,
        sprintId: sprintB1.id,
        assigneeId: dave.id,
        epicId: epicPipeline.id,
        dueDate: daysFromNow(-3),
      },
      {
        title: 'Design ClickHouse schema for analytics',
        description: 'Define column families, partitioning strategy, and TTL policies.',
        type: 'STORY',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: projectBeta.id,
        sprintId: sprintB1.id,
        assigneeId: alice.id,
        epicId: epicPipeline.id,
        dueDate: daysFromNow(5),
      },
      {
        title: 'Build Grafana dashboard for KPIs',
        description: 'Connect Grafana to ClickHouse. Create panels for: DAU, retention, conversion funnel.',
        type: 'STORY',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: projectBeta.id,
        sprintId: sprintB1.id,
        assigneeId: bob.id,
        dueDate: daysFromNow(7),
      },
      {
        title: '[BUG] Memory leak in event consumer after 24h uptime',
        description: 'Consumer heap grows by ~50MB/hour. Suspect unclosed DB connections in the transform step.',
        type: 'BUG',
        status: 'TODO',
        priority: 'HIGH',
        projectId: projectBeta.id,
        sprintId: sprintB1.id,
        assigneeId: dave.id,
        dueDate: daysFromNow(-2), // overdue
      },
      {
        title: 'Write integration tests for pipeline',
        description: 'Cover happy path + error cases: malformed events, DB failures, Kafka timeout.',
        type: 'TASK',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: projectBeta.id,
        assigneeId: null,
      },
    ],
  });

  console.log('✅ Project Beta tasks created');

  // ── 7. Tasks — Mobile App v2 ──────────────────────────────────────────
  await prisma.task.createMany({
    data: [
      {
        title: 'Set up React Native + Expo monorepo',
        description: 'Initialize with Expo SDK 51, configure EAS Build, set up yarn workspaces.',
        type: 'TASK',
        status: 'DONE',
        priority: 'HIGH',
        projectId: projectGamma.id,
        sprintId: sprintG1.id,
        assigneeId: carol.id,
        dueDate: daysFromNow(-3),
      },
      {
        title: 'Implement navigation stack (React Navigation v7)',
        description: 'Tab navigator + stack navigators for Auth, Home, Profile, and Settings flows.',
        type: 'STORY',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: projectGamma.id,
        sprintId: sprintG1.id,
        assigneeId: dave.id,
        dueDate: daysFromNow(4),
      },
      {
        title: 'Setup CI/CD with GitHub Actions + EAS',
        description: 'Automated builds on PR merge. Preview builds for iOS and Android.',
        type: 'TASK',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: projectGamma.id,
        sprintId: sprintG1.id,
        assigneeId: alice.id,
        dueDate: daysFromNow(8),
      },
      {
        title: '[BUG] Splash screen flickers on Android 14',
        description: 'The custom splash screen flashes twice before showing the app on Pixel 8.',
        type: 'BUG',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: projectGamma.id,
        sprintId: sprintG1.id,
        assigneeId: carol.id,
        dueDate: daysFromNow(3),
      },
      {
        title: 'Design token system for mobile',
        description: 'Define spacing, typography, color tokens using StyleSheet.create + ThemeContext.',
        type: 'TASK',
        status: 'TODO',
        priority: 'LOW',
        projectId: projectGamma.id,
        dueDate: daysFromNow(12),
      },
    ],
  });

  console.log('✅ Mobile App tasks created');

  // ── 8. Comments ───────────────────────────────────────────────────────
  await prisma.comment.createMany({
    data: [
      {
        body: 'Drag-and-drop feels smooth in Chrome and Edge. Still need to test Safari.',
        taskId: taskKanban.id,
        authorId: alice.id,
      },
      {
        body: 'I noticed a small flicker when dropping to the same column — might want to add a guard check.',
        taskId: taskKanban.id,
        authorId: carol.id,
      },
      {
        body: 'API patch is firing twice on fast drags. Added a debounce fix in the latest commit.',
        taskId: taskKanban.id,
        authorId: bob.id,
      },
      {
        body: 'Stat cards look great! Can we add a subtle count-up animation on mount?',
        taskId: taskDashboard.id,
        authorId: alice.id,
      },
      {
        body: 'Sure, I\'ll use requestAnimationFrame for a smooth 600ms count-up. Will push today.',
        taskId: taskDashboard.id,
        authorId: carol.id,
      },
    ],
  });

  console.log('✅ Comments created');

  // ── Done ──────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed complete!\n');
  console.log('──────────────────────────────────────────');
  console.log('Demo accounts (password: password123):');
  console.log('  alice@devtask.io  — Admin on Alpha & Beta');
  console.log('  bob@devtask.io    — Member on Alpha & Beta');
  console.log('  carol@devtask.io  — Admin on Mobile App');
  console.log('  dave@devtask.io   — Member on Beta & Mobile');
  console.log('──────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
