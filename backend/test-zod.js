// test-zod.js
// Run this script to verify your Zod Safe Mode validation logs warnings!
// Usage: node test-zod.js

const API_URL = "http://localhost:5000/api";
const randomId = Math.floor(Math.random() * 1000000);

async function runTests() {
  console.log("🚀 Starting Zod Safe Mode Test...");

  const badPayload = {
    email: "not-an-email", // INVALID: Should trigger Zod warning
    password: "123", // INVALID: Too short (Minimum 6 characters)
    // missing name entirely!
  };

  console.log("\n[1] Sending a heavily malformed registration request...");
  console.log("Payload:", badPayload);
  
  // Notice that we expect the server to log the error in its terminal, 
  // but *our* fetch request will still get a response from the controller itself 
  // instead of a 400 Bad Request instantly from Zod.
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(badPayload),
  });

  const data = await response.json();
  
  console.log("\nBackend Response Status:", response.status);
  console.log("Backend Response Data:", data);
  
  console.log("\n✅ CHECK YOUR BACKEND TERMINAL.");
  console.log("You should see a yellow ⚠️ [Zod Validation Warning] detailing that the email is invalid and password is too short.");
}

runTests().catch(console.error);
