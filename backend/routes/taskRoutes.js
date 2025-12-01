import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  sendTaskNow,
} from "../controllers/taskController.js";

const router = express.Router();

/**
 * Frontend API expects:
 * POST   /api/tasks
 * GET    /api/tasks?adminId=123
 * PUT    /api/tasks/:id
 * DELETE /api/tasks/:id
 * POST   /api/tasks/:id/send
 */

router.route("/")
  .post(createTask)   // create task
  .get(getTasks);     // get tasks (optionally filtered by adminId)

router.route("/:id")
  .get(getTaskById)   // get details
  .put(updateTask)    // update
  .delete(deleteTask); // delete

router.post("/:id/send", sendTaskNow); // manual send now

export default router;