require("dotenv").config();
const prisma = require("./src/db/client");
const taskService = require("./src/services/taskService");
const sprintService = require("./src/services/sprintService");

async function test() {
    try {
        console.log("Testing getProjectSprints...");
        const sprints = await sprintService.getProjectSprints('some-id');
        console.log("Sprints OK", sprints.length);
    } catch(e) {
        console.error("Sprint Error:", e.message);
    }
    
    try {
        console.log("Testing getProjectTasks...");
        const tasks = await taskService.getProjectTasks('some-id');
        console.log("Tasks OK", tasks.length);
    } catch(e) {
        console.error("Task Error:", e.message);
    }
}
test().then(() => process.exit(0));
