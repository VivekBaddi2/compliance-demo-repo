import express from "express";
import {
  createSheet,
  findAll,
  update,
  deleteSheet,
} from "../controllers/sheetController.js";

const sheetRouter = express.Router();

sheetRouter.route("/createSheet").post(createSheet);
sheetRouter.route("/findAll").get(findAll);
sheetRouter.route("/update").post(update);
sheetRouter.route("/deleteSheet/:id").delete(deleteSheet);

export default sheetRouter;
