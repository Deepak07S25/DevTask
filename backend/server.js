require("dotenv").config(); // MUST BE LINE 1
const express = require("express");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes"); // This MUST come after dotenv
const projectRoutes = require("./src/routes/projectRoutes");
const taskRoutes = require("./src/routes/taskRoutes");
const sprintRoutes = require("./src/routes/sprintRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use("/api/projects", projectRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/sprints", sprintRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
