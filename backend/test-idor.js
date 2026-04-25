// test-idor.js
// Run this script against your running backend to verify IDOR protection on Tasks!
// Usage: node test-idor.js

const API_URL = "http://localhost:5000/api";

const randomId = Math.floor(Math.random() * 1000000);
const adminUser = { name: "Alice Admin", email: `alice.admin.${randomId}@test.com`, password: "password123" };
const attackerUser = { name: "Eve Attacker", email: `eve.attacker.${randomId}@test.com`, password: "password123" };

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
  console.log("🚀 Starting Task IDOR End-to-End Test...");

  // 1. Register Users
  console.log("\n[1] Registering Alice (Admin) and Eve (The Attacker)...");
  await makeRequest("/auth/register", "POST", adminUser);
  await makeRequest("/auth/register", "POST", attackerUser);

  // 2. Login
  console.log("\n[2] Logging in users to extract HttpOnly Cookies...");
  const adminLogin = await makeRequest("/auth/login", "POST", { email: adminUser.email, password: adminUser.password });
  const adminCookie = adminLogin.cookie;
  const attackerLogin = await makeRequest("/auth/login", "POST", { email: attackerUser.email, password: attackerUser.password });
  const attackerCookie = attackerLogin.cookie;
  
  if (!adminCookie || !attackerCookie) {
      console.error("❌ Failed to extract session cookies. Ensure backend passes Set-Cookie correctly.");
      return;
  }

  // 3. Admin creates a project
  console.log("\n[3] Alice creating a protected project...");
  const createProj = await makeRequest("/projects", "POST", { key: `IDOR${randomId.toString().substring(0,4)}`, name: "Secure Project", description: "Testing IDOR!" }, adminCookie);
  if (createProj.status !== 201) return console.error("❌ Failed to create project", createProj.data);
  const projectId = createProj.data.id;
  console.log(`✅ Project created with ID: ${projectId}`);

  // 4. Admin creates a task
  console.log("\n[4] Alice creating a task inside her project...");
  const createTask = await makeRequest("/tasks", "POST", { 
      title: "Super Secret Task", 
      projectId, 
      status: "TODO" 
  }, adminCookie);
  
  if (createTask.status !== 201) return console.error("❌ Failed to create task", createTask.data);
  const taskId = createTask.data.id;
  console.log(`✅ Task created successfully with ID: ${taskId}`);

  // 5. TEST: Eve attempts to delete Alice's task
  // Eve is absolutely NOT a member of Alice's project.
  console.log(`\n[5] 🛡️  TEST: Eve (The Attacker) attempts to send a raw DELETE request to /tasks/${taskId}...`);
  const attackerDelete = await makeRequest(`/tasks/${taskId}`, "DELETE", null, attackerCookie);

  if (attackerDelete.status === 403) {
      console.log(`✅ SECURITY PASSED! Eve's IDOR attack failed with 403 Forbidden. Message: "${attackerDelete.data.error}"`);
  } else if (attackerDelete.status === 200) {
      console.error(`❌ SECURITY FAILED! Eve successfully deleted Alice's task without permission! IDOR is present!`);
  } else {
      console.log(`⚠️ Unexpected status ${attackerDelete.status} from Eve's request. Data:`, attackerDelete.data);
  }

  console.log("\n[6] 🛡️  TEST: Alice (Admin) attempts to delete her own task...");
  const adminDelete = await makeRequest(`/tasks/${taskId}`, "DELETE", null, adminCookie);
  if (adminDelete.status === 200) {
      console.log(`✅ SUCCESS! Alice was allowed to properly delete her task.`);
  } else if (adminDelete.status === 404) {
      console.error(`❌ FAILED! Task not found. (If Eve deleted it in Step 5, this proves the vulnerability).`);
  } else {
      console.error(`❌ FAILED! Alice got status ${adminDelete.status}`, adminDelete.data);
  }

  console.log("\n[7] 🛡️  TEST: Eve attempts cross-project parent linking...");
  // Eve creates her own project and task
  const eveProj = await makeRequest("/projects", "POST", { key: `EVE${randomId.toString().substring(0,4)}`, name: "Eve Project", description: "Evil Project" }, attackerCookie);
  if (eveProj.status === 201) {
      const eveProjectId = eveProj.data.id;
      const eveTask = await makeRequest("/tasks", "POST", { title: "Eve Task", projectId: eveProjectId }, attackerCookie);
      
      if (eveTask.status === 201) {
          const eveTaskId = eveTask.data.id;
          // Eve attempts to parent her task to Alice's task!
          const crossParent = await makeRequest(`/tasks/${eveTaskId}`, "PATCH", { parentId: taskId }, attackerCookie);
          if (crossParent.status === 400 || crossParent.status === 403) {
              console.log(`✅ DOMAIN SECURITY PASSED! Eve's cross-project parenting was blocked with: "${crossParent.data.error || 'Forbidden'}"`);
          } else {
              console.error(`❌ DOMAIN SECURITY FAILED! Eve successfully linked tasks across projects!`, crossParent.data);
          }
      }
  } else {
      console.log(`⚠️ Skipped Eve cross-project test due to DB sync blocking project creation.`);
  }

  console.log("\n🎉 Task IDOR tests complete!");
}

runTests().catch(console.error);
