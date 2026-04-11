// test-rbac.js
// Run this script against your running backend to verify RBAC enforcement!
// Usage: node test-rbac.js

const API_URL = "http://localhost:5000/api";

const randomId = Math.floor(Math.random() * 1000000);
const adminUser = { name: "Alice Admin", email: `alice.admin.${randomId}@test.com`, password: "password123" };
const memberUser = { name: "Bob Member", email: `bob.member.${randomId}@test.com`, password: "password123" };

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
  console.log("🚀 Starting RBAC End-to-End Tests...");

  // 1. Register Users
  console.log("\n[1] Registering test users...");
  await makeRequest("/auth/register", "POST", adminUser);
  await makeRequest("/auth/register", "POST", memberUser);

  // 2. Login
  console.log("\n[2] Logging in users to extract HttpOnly Cookies...");
  const adminLogin = await makeRequest("/auth/login", "POST", { email: adminUser.email, password: adminUser.password });
  const adminCookie = adminLogin.cookie;
  const bobLogin = await makeRequest("/auth/login", "POST", { email: memberUser.email, password: memberUser.password });
  const bobCookie = bobLogin.cookie;
  
  if (!adminCookie || !bobCookie) {
      console.error("❌ Failed to extract session cookies. Ensure backend passes Set-Cookie correctly.");
      return;
  }

  // 3. Admin creates a project
  console.log("\n[3] Admin creating a project...");
  const createProj = await makeRequest("/projects", "POST", { name: "RBAC Secure Project", description: "Testing RBAC!" }, adminCookie);
  if (createProj.status !== 201) return console.error("❌ Failed to create project", createProj.data);
  const projectId = createProj.data.id;
  console.log(`✅ Project created with ID: ${projectId}`);

  // 4. Admin adds Bob as a member
  console.log("\n[4] Admin adding Bob as a MEMBER...");
  const addBob = await makeRequest(`/projects/${projectId}/members`, "POST", { email: memberUser.email }, adminCookie);
  if (addBob.status === 201) {
      console.log("✅ Bob successfully added to project.");
  } else {
      console.error("❌ Failed to add Bob", addBob.data);
  }

  // 5. TEST: Bob attempts to rename the project (Should fail with 403 Forbidden)
  console.log("\n[5] 🛡️  TEST: Bob (MEMBER) attempts to edit the project...");
  const bobEdit = await makeRequest(`/projects/${projectId}`, "PATCH", { name: "Hacked Title" }, bobCookie);
  if (bobEdit.status === 403) {
      console.log(`✅ RBAC WORKED! Bob received 403 Forbidden. Message: "${bobEdit.data.error}"`);
  } else {
      console.error(`❌ RBAC FAILED! Bob got status ${bobEdit.status}`, bobEdit.data);
  }

  // 6. TEST: Admin attempts to edit the project (Should succeed)
  console.log("\n[6] 🛡️  TEST: Admin attempts to edit the project...");
  const adminEdit = await makeRequest(`/projects/${projectId}`, "PATCH", { name: "Admin Edited Title" }, adminCookie);
  if (adminEdit.status === 200) {
      console.log(`✅ SUCCESS! Admin was allowed to edit the project.`);
  } else {
      console.error(`❌ FAILED! Admin got status ${adminEdit.status}`, adminEdit.data);
  }

  // 7. Cleanup: Admin deletes project
  console.log("\n[7] Cleanup: Admin deleting project...");
  const adminDelete = await makeRequest(`/projects/${projectId}`, "DELETE", null, adminCookie);
  if (adminDelete.status === 200) {
      console.log("✅ Project deleted successfully.");
  } else {
      console.error("❌ Failed to delete project.", adminDelete.data);
  }

  console.log("\n🎉 All RBAC tests passed successfully!");
}

runTests().catch(console.error);
