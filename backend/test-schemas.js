// test-schemas.js
// Unit tests for Zod validation schemas. These run entirely in memory and do not require DB access.
// Usage: node test-schemas.js

const { z } = require('zod');
const { createProjectSchema, createTaskSchema } = require('./src/validations/schemas');

let passed = 0;
let failed = 0;

function assertValid(schema, payload, name) {
    const result = schema.safeParse(payload);
    if (result.success) {
        console.log(`✅ [PASS] ${name}`);
        passed++;
    } else {
        console.error(`❌ [FAIL] ${name} - Expected valid but failed:`, result.error.issues);
        failed++;
    }
}

function assertInvalid(schema, payload, name) {
    const result = schema.safeParse(payload);
    if (!result.success) {
        console.log(`✅ [PASS] ${name}`);
        passed++;
    } else {
        console.error(`❌ [FAIL] ${name} - Expected invalid but succeeded.`);
        failed++;
    }
}

console.log("🚀 Starting Schema Unit Tests...\n");

// --- PROJECT SCHEMA TESTS ---
console.log("--- Project Key Validations ---");
assertValid(createProjectSchema, { key: "ENG", name: "Engineering" }, "Valid Project Key");
assertValid(createProjectSchema, { key: "MKTG123", name: "Marketing" }, "Valid Alphanumeric Project Key");
assertInvalid(createProjectSchema, { key: "e", name: "Short" }, "Invalid Key: Too short");
assertInvalid(createProjectSchema, { key: "VERYLONGKEYNAME", name: "Long" }, "Invalid Key: Too long");
assertInvalid(createProjectSchema, { key: "eng", name: "Lowercase" }, "Invalid Key: Lowercase not allowed");
assertInvalid(createProjectSchema, { key: "ENG-1", name: "Special Chars" }, "Invalid Key: Hyphens not allowed");

// --- TASK SCHEMA TESTS ---
console.log("\n--- Task Primitive Validations ---");
const validUUID = "123e4567-e89b-12d3-a456-426614174000";

assertValid(createTaskSchema, { title: "Basic task", projectId: validUUID }, "Valid Minimal Task");
assertValid(createTaskSchema, { 
    title: "Full task", 
    projectId: validUUID,
    parentId: validUUID,
    rank: 1.5,
    labels: ["frontend", "bug"]
}, "Valid Full Task with Subtask and Labels");

assertInvalid(createTaskSchema, { title: "Task", projectId: "not-a-uuid" }, "Invalid: Bad projectId UUID");
assertInvalid(createTaskSchema, { title: "Task", projectId: validUUID, parentId: "not-a-uuid" }, "Invalid: Bad parentId UUID");
assertInvalid(createTaskSchema, { title: "Task", projectId: validUUID, rank: "1.5" }, "Invalid: Rank must be a number");
assertInvalid(createTaskSchema, { title: "Task", projectId: validUUID, labels: [123] }, "Invalid: Labels must be strings");
assertInvalid(createTaskSchema, { title: "Task", projectId: validUUID, labels: [""] }, "Invalid: Labels cannot be empty strings");

console.log(`\n🎉 Schema Tests Complete: ${passed} Passed, ${failed} Failed.`);
if (failed > 0) process.exit(1);
