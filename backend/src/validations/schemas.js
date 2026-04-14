const { z } = require("zod");

// --- Auth Schemas ---
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name is required"),
}).strict();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
}).strict();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
}).strict();

// --- Project Schemas ---
const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional().nullable(),
}).strict();

const editProjectSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional().nullable(),
}).strict();

const addMemberSchema = z.object({
  email: z.string().email(),
}).strict();

// --- Task Schemas ---
const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional().nullable(),
  projectId: z.string().uuid(),
  assigneeId: z.string().uuid().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.string().datetime().optional().nullable().or(z.date().optional()),
  sprintId: z.string().uuid().optional().nullable(),
  type: z.enum(["EPIC", "STORY", "BUG", "TASK"]).optional(),
  epicId: z.string().uuid().optional().nullable(),
}).strict();

const updateTaskSchema = createTaskSchema.partial();

// --- Sprint Schemas ---
const createSprintSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1, "Sprint name is required"),
  goal: z.string().optional().nullable(),
  startDate: z.string().datetime().optional().nullable().or(z.date().optional()),
  endDate: z.string().datetime().optional().nullable().or(z.date().optional()),
}).strict();

const updateSprintSchema = createSprintSchema.partial();

// --- Comment Schemas ---
const createCommentSchema = z.object({
  body: z.string().min(1, "Comment body cannot be empty"),
}).strict();

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  createProjectSchema,
  editProjectSchema,
  addMemberSchema,
  createTaskSchema,
  updateTaskSchema,
  createSprintSchema,
  updateSprintSchema,
  createCommentSchema,
};
