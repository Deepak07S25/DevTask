// test-primitives.js
// End-to-end integration test verifying the new Phase 2/3 primitives.
// Note: Due to known DB schema drift (ai_* tables missing from schema.prisma), 
// this script will fail gracefully with Prisma errors until a safe `db push` is executed.

const API_URL = "http://localhost:5000/api";
const randomId = Math.floor(Math.random() * 10000);
const user = { name: "Test User", email: `test.user.${randomId}@test.com`, password: "password123" };

async function makeRequest(endpoint, method = "GET", body = null, cookie = null) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers["Cookie"] = cookie;

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const setCookie = response.headers.get("set-cookie");
  const extractedCookie = setCookie ? setCookie.split(";")[0] : null;

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = await response.text();
  }

  return { status: response.status, data, cookie: extractedCookie || cookie };
}

async function runTests() {
  console.log("🚀 Starting Primitives E2E Test...");
  console.log("⚠️  Note: If the DB has not been fully migrated via Prisma, expect 400/500 errors regarding missing columns (e.g. 'key', 'parentId').\n");

  console.log("[1] Registering User...");
  await makeRequest("/auth/register", "POST", user);
  const login = await makeRequest("/auth/login", "POST", { email: user.email, password: user.password });
  const cookie = login.cookie;
  if (!cookie) return console.error("❌ Auth failed.");

  console.log("\n[2] Creating Project (tests unique project key validation)...");
  const createProj = await makeRequest("/projects", "POST", { 
      key: `PRJ${randomId}`, 
      name: "Primitive Test Project", 
      description: "Testing constraints" 
  }, cookie);
  
  if (createProj.status !== 201) {
      console.log(`⚠️ Project creation failed (Status ${createProj.status}). DB might be out of sync. Error:`, createProj.data);
      return;
  }
  const projectId = createProj.data.id;
  console.log(`✅ Project created: ${createProj.data.key}`);

  console.log("\n[3] Creating Parent Task with Labels & Rank...");
  const createParent = await makeRequest("/tasks", "POST", {
      title: "Parent Task",
      projectId,
      labels: ["backend", "core"],
      rank: 100.0
  }, cookie);
  if (createParent.status !== 201) return console.error("❌ Failed to create parent task", createParent.data);
  const parentId = createParent.data.id;
  console.log(`✅ Parent task created. Task Number: ${createParent.data.taskNumber}, Labels count: ${createParent.data.labels?.length}`);

  console.log("\n[4] Creating Subtask...");
  const createChild = await makeRequest("/tasks", "POST", {
      title: "Child Task",
      projectId,
      parentId, // Establishing relationship
      rank: 150.0
  }, cookie);
  if (createChild.status !== 201) return console.error("❌ Failed to create child task", createChild.data);
  console.log(`✅ Child task created. Attached to parent: ${createChild.data.parentId}`);

  console.log("\n[5] Invalid Behavior: Self-Parenting Test...");
  const updateSelf = await makeRequest(`/tasks/${parentId}`, "PATCH", { parentId }, cookie);
  if (updateSelf.status === 400 && updateSelf.data.error.includes("cannot be its own parent")) {
      console.log("✅ Correctly rejected self-parenting.");
  } else {
      console.error("❌ Self-parenting check failed.", updateSelf.data);
  }

  console.log("\n[6] Testing List Query Shapes & Pagination defaults...");
  const list = await makeRequest(`/tasks?projectId=${projectId}`, "GET", null, cookie);
  if (list.status === 200) {
      console.log(`✅ List successfully retrieved. Count: ${list.data.length}`);
      const parentTask = list.data.find(t => t.id === parentId);
      if (parentTask && parentTask.project && parentTask.project.key) {
          console.log(`✅ List response includes project key: ${parentTask.project.key}-${parentTask.taskNumber}`);
      } else {
          console.error("❌ Project key missing from response.");
      }
  }

  console.log("\n🎉 Primitives tests complete.");
}

runTests().catch(console.error);
