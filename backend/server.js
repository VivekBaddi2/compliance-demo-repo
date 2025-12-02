import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongooseConnection from "./mongo.js";
import appRoutes from "./routes/index.js";
import dotenv from "dotenv";
import { startTaskScheduler } from "./controllers/taskScheduler.js";

dotenv.config();

const port = process.env.PORT || 4000;
const app = express();

// Middleware
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

// DB Connection
mongooseConnection();

// CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Health Check
app.get("/health", (req, res) => {
  return res.status(200).json({
    msg: "Server is up and running",
  });
});

// Routes
app.use("/api", appRoutes);

// Task Scheduler
startTaskScheduler();

// Start Server — works for both local & Render
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});